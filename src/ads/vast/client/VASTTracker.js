function VASTTracker(assetURI, vastResponse) {
  if (!(this instanceof VASTTracker)) {
    return new VASTTracker(assetURI, vastResponse);
  }

  sanityCheck(assetURI, vastResponse);
  this.response = vastResponse;
  this.assetURI = assetURI;
  this.progress = 0;
  this.quartiles = {
    firstQuartile: Math.round(25 * vastResponse.duration) / 100,
    midpoint: Math.round(50 * vastResponse.duration) / 100,
    thirdQuartile: Math.round(75 * vastResponse.duration) / 100
  };

  /*** Local Functions ***/
  function sanityCheck(assetURI, vastResponse) {
    if (!isString(assetURI) || isEmptyString(assetURI)) {
      throw new VASTError('on VASTTracker constructor, missing required the URI of the ad asset being played');
    }

    if (!(vastResponse instanceof VASTResponse)) {
      throw new VASTError('on VASTTracker constructor, missing required VAST response');
    }
  }
}

VASTTracker.prototype.trackURLs = function trackURLs(urls, variables) {
  if (isArray(urls) && urls.length > 0) {
    variables = extend({
      ASSETURI: this.assetURI,
      CONTENTPLAYHEAD: vastUtil.formatProgress(this.progress)
    }, variables || {});

    vastUtil.track(urls, variables);
  }
};

VASTTracker.prototype.trackEvent = function trackEvent(eventName, trackOnce) {
  this.trackURLs(getEventUris(this.response.trackingEvents[eventName]));
  if (trackOnce) {
    this.response.trackingEvents[eventName] = undefined;
  }

  /*** Local function ***/
  function getEventUris(trackingEvents) {
    var uris;

    if (trackingEvents) {
      uris = [];
      trackingEvents.forEach(function (event) {
        uris.push(event.uri);
      });
    }
    return uris;
  }
};

VASTTracker.prototype.trackProgress = function trackProgress(newProgress) {
  var events = [];
  var ONCE = true;
  var ALWAYS = false;
  var trackingEvents = this.response.trackingEvents;

  if (isNumber(newProgress)) {
    addTrackEvent('start', ONCE, newProgress > 0);
    addTrackEvent('rewind', ALWAYS, this.progress > newProgress);
    addQuartileEvents.call(this, newProgress);
    addProgressEvent.call(this, newProgress);
    trackEvents.call(this);
    this.progress = newProgress;
  }

  /*** Local function ***/
  function addTrackEvent(eventName, trackOnce, canBeAdded) {
    if (trackingEvents[eventName] && canBeAdded) {
      events.push({
        name: eventName,
        trackOnce: !!trackOnce
      });
    }
  }

  function addQuartileEvents(progress) {
    forEach(this.quartiles, function (quartileTime, eventName) {
      //We only fire the quartile event if the progress is bigger than the quartile time by one second at most.
      addTrackEvent(eventName, ONCE, progress >= quartileTime && progress <= (quartileTime + 1000));
    });
  }

  function addProgressEvent(progress) {
    var progressEvent = trackingEvents.progress && trackingEvents.progress[0];
    if (progressEvent) {
      addTrackEvent('progress', ONCE, progressEvent.offset <= progress);
    }
  }

  function trackEvents() {
    events.forEach(function (event) {
      this.trackEvent(event.name, event.trackOnce);
    }, this);
  }
};

[
  'start',
  'rewind',
  'fullscreen',
  'exitFullscreen',
  'complete',
  'pause',
  'resume',
  'close',
  'closeLinear',
  'skip',
  'mute',
  'unmute',
  'firstQuartile',
  'midpoint',
  'thirdQuartile',
  'acceptInvitation',
  'acceptInvitationLinear',
  'collapse',
  'expand'
].forEach(function (eventName) {
    VASTTracker.prototype['track' + capitalize(eventName)] = function () {
      this.trackEvent(eventName);
    };
  });

VASTTracker.prototype.trackErrorWithCode = function trackErrorWithCode(errorcode) {
  if (isNumber(errorcode)) {
    this.trackURLs(this.response.errorURLMacros, {ERRORCODE: errorcode});
  }
};

VASTTracker.prototype.trackImpressions = function trackImpressions() {
  this.trackURLs(this.response.impressions);
};

VASTTracker.prototype.trackClick = function trackClick() {
  this.trackURLs(this.response.clickTrackings);
};
