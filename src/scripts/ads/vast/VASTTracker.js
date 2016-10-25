const utilities = require('../../utils/utilityFunctions');
const VASTError = require('./VASTError');
const VASTResponse = require('./VASTResponse');
const vastUtil = require('./vastUtil');

function VASTTracker (assetURI, vastResponse) {
  if (!(this instanceof VASTTracker)) {
    return new VASTTracker(assetURI, vastResponse);
  }

  this.sanityCheck(assetURI, vastResponse);
  this.initialize(assetURI, vastResponse);
}

VASTTracker.prototype.initialize = function (assetURI, vastResponse) {
  this.response = vastResponse;
  this.assetURI = assetURI;
  this.progress = 0;
  this.quartiles = {
    firstQuartile: {tracked: false, time: Math.round(25 * vastResponse.duration) / 100},
    midpoint: {tracked: false, time: Math.round(50 * vastResponse.duration) / 100},
    thirdQuartile: {tracked: false, time: Math.round(75 * vastResponse.duration) / 100}
  };
};

VASTTracker.prototype.sanityCheck = function (assetURI, vastResponse) {
  if (!utilities.isString(assetURI) || utilities.isEmptyString(assetURI)) {
    throw new VASTError('on VASTTracker constructor, missing required the URI of the ad asset being played');
  }

  if (!(vastResponse instanceof VASTResponse)) {
    throw new VASTError('on VASTTracker constructor, missing required VAST response');
  }
};

VASTTracker.prototype.trackURLs = function trackURLs (urls, variables) {
  if (utilities.isArray(urls) && urls.length > 0) {
    variables = utilities.extend({
      ASSETURI: this.assetURI,
      CONTENTPLAYHEAD: vastUtil.formatProgress(this.progress)
    }, variables || {});

    vastUtil.track(urls, variables);
  }
};

VASTTracker.prototype.trackEvent = function trackEvent (eventName, trackOnce) {
  this.trackURLs(getEventUris(this.response.trackingEvents[eventName]));
  if (trackOnce) {
    this.response.trackingEvents[eventName] = undefined;
  }

  /** * Local function ***/
  function getEventUris (trackingEvents) {
    let uris;

    if (trackingEvents) {
      uris = [];
      trackingEvents.forEach((event) => {
        if (!event.uri) {
          return;
        }

        uris.push(event.uri);
      });
    }

    return uris;
  }
};

VASTTracker.prototype.trackProgress = function trackProgress (newProgressInMs) {
  const that = this;
  const events = [];
  const ONCE = true;
  const ALWAYS = false;
  const trackingEvents = this.response.trackingEvents;

  if (utilities.isNumber(newProgressInMs)) {
    addTrackEvent('start', ONCE, newProgressInMs > 0);
    addTrackEvent('rewind', ALWAYS, hasRewound(this.progress, newProgressInMs));
    addQuartileEvents(newProgressInMs);
    trackProgressEvents(newProgressInMs);
    trackEvents();
    this.progress = newProgressInMs;
  }

  /** * Local function ***/
  function hasRewound (currentProgress, newProgress) {
    const REWIND_THRESHOLD = 3000; // IOS video clock is very unreliable and we need a 3 seconds threshold to ensure that there was a rewind an that it was on purpose.

    return currentProgress > newProgressInMs && Math.abs(newProgress - currentProgress) > REWIND_THRESHOLD;
  }

  function addTrackEvent (eventName, trackOnce, canBeAdded) {
    if (trackingEvents[eventName] && canBeAdded) {
      events.push({
        name: eventName,
        trackOnce: Boolean(trackOnce)
      });
    }
  }

  function addQuartileEvents (progress) {
    const quartiles = that.quartiles;
    const firstQuartile = that.quartiles.firstQuartile;
    const midpoint = that.quartiles.midpoint;
    const thirdQuartile = that.quartiles.thirdQuartile;

    if (!firstQuartile.tracked) {
      trackQuartile('firstQuartile', progress);
    } else if (!midpoint.tracked) {
      trackQuartile('midpoint', progress);
    } else if (!thirdQuartile.tracked) {
      trackQuartile('thirdQuartile', progress);
    }

    /** * Local function ***/
    function trackQuartile (quartileName, progress) {
      const quartile = quartiles[quartileName];

      if (canBeTracked(quartile, progress)) {
        quartile.tracked = true;
        addTrackEvent(quartileName, ONCE, true);
      }
    }
  }

  function canBeTracked (quartile, progress) {
    const quartileTime = quartile.time;

    // We only fire the quartile event if the progress is bigger than the quartile time by 5 seconds at most.
    return progress >= quartileTime && progress <= quartileTime + 5000;
  }

  function trackProgressEvents (progress) {
    if (!utilities.isArray(trackingEvents.progress)) {
      return; // Nothing to track
    }

    const pendingProgressEvts = [];

    trackingEvents.progress.forEach((evt) => {
      if (evt.offset <= progress) {
        that.trackURLs([evt.uri]);
      } else {
        pendingProgressEvts.push(evt);
      }
    });
    trackingEvents.progress = pendingProgressEvts;
  }

  function trackEvents () {
    events.forEach((event) => {
      that.trackEvent(event.name, event.trackOnce);
    });
  }
};

[
  'rewind',
  'fullscreen',
  'exitFullscreen',
  'pause',
  'resume',
  'mute',
  'unmute',
  'acceptInvitation',
  'acceptInvitationLinear',
  'collapse',
  'expand'
].forEach((eventName) => {
  VASTTracker.prototype['track' + utilities.capitalize(eventName)] = function () {
    this.trackEvent(eventName);
  };
});

[
  'start',
  'skip',
  'close',
  'closeLinear'
].forEach((eventName) => {
  VASTTracker.prototype['track' + utilities.capitalize(eventName)] = function () {
    this.trackEvent(eventName, true);
  };
});

[
  'firstQuartile',
  'midpoint',
  'thirdQuartile'
].forEach((quartile) => {
  VASTTracker.prototype['track' + utilities.capitalize(quartile)] = function () {
    this.quartiles[quartile].tracked = true;
    this.trackEvent(quartile, true);
  };
});

VASTTracker.prototype.trackComplete = function () {
  if (this.quartiles.thirdQuartile.tracked) {
    this.trackEvent('complete', true);
  }
};

VASTTracker.prototype.trackErrorWithCode = function trackErrorWithCode (errorcode) {
  if (utilities.isNumber(errorcode)) {
    this.trackURLs(this.response.errorURLMacros, {ERRORCODE: errorcode});
  }
};

VASTTracker.prototype.trackImpressions = function trackImpressions () {
  this.trackURLs(this.response.impressions);
};

VASTTracker.prototype.trackCreativeView = function trackCreativeView () {
  this.trackEvent('creativeView');
};

VASTTracker.prototype.trackClick = function trackClick () {
  this.trackURLs(this.response.clickTrackings);
};

module.exports = VASTTracker;
