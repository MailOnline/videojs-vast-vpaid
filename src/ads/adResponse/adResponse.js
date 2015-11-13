function AdResponse(adChain) {
  sanityCheck(adChain);

  this.adChain = adChain;
  this.ad = {};


  /*** local functions ***/

  function sanityCheck(adChain) {
    if(!isArray(adChain) || adChain.length === 0){
      throw new AdError("AdResponse Constructor, the passed ad chain is invalid or empty");
    }
  }

  function init(response){
    response._linearAdded = false;
    response.ads = [];
    response.errorURLMacros = [];
    response.impressions = [];
    response.clickTrackings = [];
    response.customClicks = [];
    response.trackingEvents = {};
    response.mediaFiles = [];
    response.clickThrough = undefined;
    response.adTitle = '';
    response.duration = undefined;
    response.skipoffset = undefined;
  }


  function validate(response) {
    var progressEvents = response.trackingEvents.progress;

    if (!response.hasLinear()) {
      throw new VASTError("on AdsLoader._buildVASTResponse, Received an Ad type that is not supported", 200);
    }

    if (response.duration === undefined) {
      throw new VASTError("on AdsLoader._buildVASTResponse, Missing duration field in VAST response", 101);
    }

    if (progressEvents) {
      progressEvents.forEach(function (progressEvent) {
        if (!isNumber(progressEvent.offset)) {
          throw new VASTError("on AdsLoader._buildVASTResponse, missing or wrong offset attribute on progress tracking event", 101);
        }
      });
    }
  }
}

AdResponse.prototype.addAd = function (ad) {
  var inLine, wrapper;

  if (ad instanceof Ad) {
    inLine = ad.inLine;
    wrapper = ad.wrapper;

    this.ads.push(ad);

    if (inLine) {
      this._addInLine(inLine);
    }

    if (wrapper) {
      this._addWrapper(wrapper);
    }
  }
};

AdResponse.prototype._addErrorTrackUrl = function (error) {
  var errorURL = error instanceof xml.JXONTree ? xml.keyValue(error) : error;
  if (errorURL) {
    this.errorURLMacros.push(errorURL);
  }
};

AdResponse.prototype._addImpressions = function (impressions) {
  isArray(impressions) && appendToArray(this.impressions, impressions);
};

AdResponse.prototype._addClickThrough = function (clickThrough) {
  if (isNotEmptyString(clickThrough)) {
    this.clickThrough = clickThrough;
  }
};

AdResponse.prototype._addClickTrackings = function (clickTrackings) {
  isArray(clickTrackings) && appendToArray(this.clickTrackings, clickTrackings);
};

AdResponse.prototype._addCustomClicks = function (customClicks) {
  isArray(customClicks) && appendToArray(this.customClicks, customClicks);
};

AdResponse.prototype._addTrackingEvents = function (trackingEvents) {
  var eventsMap = this.trackingEvents;

  if (trackingEvents) {
    trackingEvents = isArray(trackingEvents) ? trackingEvents : [trackingEvents];
    trackingEvents.forEach(function (trackingEvent) {
      if (!eventsMap[trackingEvent.name]) {
        eventsMap[trackingEvent.name] = [];
      }
      eventsMap[trackingEvent.name].push(trackingEvent);
    });
  }
};

AdResponse.prototype._addTitle = function (title) {
  if (isNotEmptyString(title)) {
    this.adTitle = title;
  }
};

AdResponse.prototype._addDuration = function (duration) {
  if (isNumber(duration)) {
    this.duration = duration;
  }
};

AdResponse.prototype._addVideoClicks = function (videoClicks) {
  if (videoClicks instanceof VideoClicks) {
    this._addClickThrough(videoClicks.clickThrough);
    this._addClickTrackings(videoClicks.clickTrackings);
    this._addCustomClicks(videoClicks.customClicks);
  }
};

AdResponse.prototype._addMediaFiles = function (mediaFiles) {
  isArray(mediaFiles) && appendToArray(this.mediaFiles, mediaFiles);
};

AdResponse.prototype._addSkipoffset = function (offset) {
  if (offset) {
    this.skipoffset = offset;
  }
};

AdResponse.prototype._addAdParameters = function (adParameters) {
  if (adParameters) {
    this.adParameters = adParameters;
  }
};

AdResponse.prototype._addLinear = function (linear) {
  if (linear instanceof Linear) {
    this._addDuration(linear.duration);
    this._addTrackingEvents(linear.trackingEvents);
    this._addVideoClicks(linear.videoClicks);
    this._addMediaFiles(linear.mediaFiles);
    this._addSkipoffset(linear.skipoffset);
    this._addAdParameters(linear.adParameters);
    this._linearAdded = true;
  }
};

AdResponse.prototype._addInLine = function (inLine) {
  var that = this;

  if (inLine instanceof InLine) {
    this._addTitle(inLine.adTitle);
    this._addErrorTrackUrl(inLine.error);
    this._addImpressions(inLine.impressions);

    inLine.creatives.forEach(function (creative) {
      if (creative.linear) {
        that._addLinear(creative.linear);
      }
    });
  }
};

AdResponse.prototype._addWrapper = function (wrapper) {
  var that = this;

  if (wrapper instanceof Wrapper) {
    this._addErrorTrackUrl(wrapper.error);
    this._addImpressions(wrapper.impressions);

    wrapper.creatives.forEach(function (creative) {
      var linear = creative.linear;
      if (linear) {
        that._addVideoClicks(linear.videoClicks);
        that.clickThrough = undefined;//We ensure that no clickThrough has been added
        that._addTrackingEvents(linear.trackingEvents);
      }
    });
  }
};

AdResponse.prototype.hasLinear = function () {
  return this._linearAdded;
};

function appendToArray(array, items) {
  items.forEach(function (item) {
    array.push(item);
  });
}
