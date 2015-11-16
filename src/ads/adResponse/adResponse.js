function AdResponse(adChain) {
  sanityCheck(adChain);

  init(this, adChain);

  /*** local functions ***/
  function sanityCheck(adChain) {
    if(!isArray(adChain) || adChain.length === 0){
      throw new AdError("AdResponse Constructor, the passed ad chain is invalid or empty");
    }
  }

  function init(adResponse, adChain){
    adResponse.adChain = adChain;
    adResponse.adTitle = '';
    adResponse.errors = [];
    adResponse.impressions = [];

    adChain.forEach(function (ad) {
      mergeAd(adResponse, ad);
    });

    //validate(adResponse);
  }


  function mergeAd(adResponse, ad) {
    var adUnit = ad.wrapper || ad.inLine;
    addTitle(adResponse, adUnit.adTitle);
    addError(adResponse, adUnit.error);
    addImpressions(adResponse, adUnit.impressions);
    addCreatives(adResponse, adUnit.creatives);

  }

  function addTitle(response, title) {
    if (isNotEmptyString(title)) {
      response.adTitle = title;
    }
  }

  function addError(response, error) {
    var errorURL = error instanceof xml.JXONTree ? xml.keyValue(error) : error;
    if (errorURL) {
      response.errors.push(errorURL);
    }
  }

  function addImpressions(response, impressions) {
    isArray(impressions) && appendToArray(response.impressions, impressions);
  }

  function addCreatives(response, creatives) {
    creatives.forEach(function (creative) {
      addLinear(response, creative.linear);
    });
  }

  function addLinear(response, linear) {
    if (linear instanceof Linear) {
      if(!response.linear){
        response.linear = {};
        response.linear.duration = undefined;
        response.linear.trackingEvents = {};
        response.linear.clickThrough = undefined;
        response.linear.clickTrackings = [];
        response.linear.customClicks = [];
        response.linear.mediaFiles = [];
        response.linear.skipoffset = undefined;
      }

      addDuration(response.linear, linear.duration);
      addTrackingEvents(response.linear, linear.trackingEvents);
      addVideoClicks(response.linear, linear.videoClicks);
      addMediaFiles(response.linear, linear.mediaFiles);
      addSkipoffset(response.linear, linear.skipoffset);
      addAdParameters(response.linear, linear.adParameters);
    }
  }

  function addDuration(linear, duration) {
    if (isNumber(duration)) {
      linear.duration = duration;
    }
  }

  function addTrackingEvents(linear, trackingEvents) {
    var eventsMap = linear.trackingEvents;

    if (trackingEvents) {
      trackingEvents = isArray(trackingEvents) ? trackingEvents : [trackingEvents];
      trackingEvents.forEach(function (trackingEvent) {
        if (!eventsMap[trackingEvent.name]) {
          eventsMap[trackingEvent.name] = [];
        }
        eventsMap[trackingEvent.name].push(trackingEvent);
      });
    }
  }

  function addVideoClicks(linear, videoClicks) {
    if (videoClicks instanceof VideoClicks) {
      addClickThrough(linear, videoClicks.clickThrough);
      addClickTrackings(linear, videoClicks.clickTrackings);
      addCustomClicks(linear, videoClicks.customClicks);
    }
  }

  function addClickThrough(linear, clickThrough) {
    if (isNotEmptyString(clickThrough)) {
      linear.clickThrough = clickThrough;
    }
  }

  function addClickTrackings(linear, clickTrackings) {
    isArray(clickTrackings) && appendToArray(linear.clickTrackings, clickTrackings);
  }

  function addCustomClicks(linear, customClicks) {
    isArray(customClicks) && appendToArray(linear.customClicks, customClicks);
  }

  function addMediaFiles(linear, mediaFiles) {
    isArray(mediaFiles) && appendToArray(linear.mediaFiles, mediaFiles);
  }

  function addSkipoffset(linear, offset) {
    if (offset) {
      linear.skipoffset = offset;
    }
  }

  function addAdParameters(linear, adParameters) {
    if (adParameters) {
      linear.adParameters = adParameters;
    }
  }


  function validate(response) {
    var progressEvents;

    if (!response.linear) {
      throw new AdError("on AdsLoader._buildVASTResponse, Received an Ad type that is not supported", 200);
    }

    if (response.linear.duration === undefined) {
      throw new AdError("on AdsLoader._buildVASTResponse, Missing duration field in VAST response", 101);
    }

    progressEvents = response.linear.trackingEvents.progress;
    if (progressEvents) {
      progressEvents.forEach(function (progressEvent) {
        if (!isNumber(progressEvent.offset)) {
          throw new AdError("on AdsLoader._buildVASTResponse, missing or wrong offset attribute on progress tracking event", 101);
        }
      });
    }
  }
}

function appendToArray(array, items) {
  items.forEach(function (item) {
    array.push(item);
  });
}
