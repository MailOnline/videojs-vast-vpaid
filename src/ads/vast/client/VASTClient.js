function VASTClient(options) {
  if (!(this instanceof VASTClient)) {
    return new VASTClient(options);
  }
  var defaultOptions = {
    WRAPPER_LIMIT: 5
  };

  options = options || {};
  this.settings = extend({}, options, defaultOptions);
  this.errorURLMacros = [];
}

VASTClient.prototype.getVASTResponse = function getVASTResponse(adTagUrl, callback) {
  var that = this;

  //We reset the errorURLMacros before doing anything.
  this.errorURLMacros = [];

  async.waterfall([
      this._getAd.bind(this, adTagUrl),
      buildVASTResponse
    ],
    this._sendVASTResponse(callback));

  /*** Local functions ***/
  function buildVASTResponse(adsChain, cb) {
    try {
      var response = that._buildVASTResponse(adsChain);
      cb(null, response);
    } catch (e) {
      cb(e);
    }
  }
};

VASTClient.prototype._sendVASTResponse = function sendVASTResponse(callback) {
  var that = this;
  callback = callback || noop;

  return function (error, response) {
    if (error) {
      vastUtil.track(that.errorURLMacros, {ERRORCODE: error.code || 900});  //900 <== Undefined error
    }
    callback(error, response);
  };
};

VASTClient.prototype._getAd = function getVASTAd(adTagUrl, callback) {
  var error;
  var that = this;
  var options = isObject(adTagUrl) && !isNull(adTagUrl) ? adTagUrl : {adTagUrl: adTagUrl};
  options.ads = options.ads || [];
  error = sanityCheck(options, callback);
  if (error) {
    if (isFunction(callback)) {
      return callback(error, null);
    }
    throw error;
  }

  async.waterfall([
    requestVASTXml,
    buildAd
  ], callback);

  /*** local function ***/
  function sanityCheck(opts, cb) {
    if (!opts.adTagUrl) {
      return new VASTError('on VASTClient._getAd, missing ad tag URL');
    }

    if (!isFunction(cb)) {
      return new VASTError('on VASTClient._getAd, missing callback function');
    }

    if (opts.ads.length >= that.WRAPPER_LIMIT) {
      return new VASTError("on VASTClient._getAd, players wrapper limit reached (the limit is " + that.WRAPPER_LIMIT + ")", 302);
    }
  }

  function requestVASTXml(callback) {
    that._requestVASTXml(options.adTagUrl, callback);
  }

  function buildAd(adXML, callback) {
    var adTree;
    try {
      adTree = that._buildVastTree(adXML);
      getValidAd(adTree.ads, options.ads, callback);
    } catch (e) {
      callback(e);
    }

    /*** local Functions  ***/
    function getValidAd(possibleAds, previousAds, callback) {
      getAd(possibleAds.shift(), previousAds, function (error, adChain) {
        if (error) {
          if (possibleAds.length > 0) {
            return getValidAd(possibleAds, previousAds, callback);
          }
          return callback(error);
        }
        callback(null, adChain);
      });
    }

    function getAd(adTree, previousAds, callback) {
      try {
        var ad = that._buildAd(adTree);

        if (ad.wrapper) {
          return getNextAd(ad, previousAds, callback);
        }
        return callback(null, previousAds.concat(ad));
      } catch (e) {
        callback(e);
      }
    }

    function getNextAd(ad, previousAds, callback) {
      return that._getAd({
        adTagUrl: ad.wrapper.VASTAdTagURI,
        ads: previousAds.concat(ad)
      }, callback);
    }
  }
};

VASTClient.prototype._requestVASTXml = function requestVASTXml(adTagUrl, callback) {
  try {
    if (isFunction(adTagUrl)) {
      adTagUrl(requestHandler);
    } else {
      http.get(adTagUrl, requestHandler, {
        withCredentials: true
      });
    }
  } catch (e) {
    callback(e);
  }

  /*** Local functions ***/
  function requestHandler(error, response, status) {
    if (error) {
      var errMsg = isDefined(status)?
            "on VASTClient.requestVastXML, HTTP request error with status '" + status + "'" :
            "on VASTClient.requestVastXML, Error getting the the VAST XML with he passed adTagXML fn";
      return callback(new VASTError(errMsg, 301));
    }

    callback(null, response);
  }
};

VASTClient.prototype._buildVastTree = function buildVastTree(xmlStr) {
  var vastTree, vastVersion;

  try {
    vastTree = xml.toJXONTree(xmlStr);
    vastVersion = xml.attr(vastTree, 'version');
    vastTree.ads = isArray(vastTree.ad) ? vastTree.ad : [vastTree.ad];

  } catch (e) {
    throw new VASTError("on VASTClient.buildVastTree, error parsing xml", 100);
  }

  if (!vastTree.ad) {
    throw new VASTError('on VASTClient.buildVastTree, no Ad in VAST tree', 303);
  }

  if (vastVersion && (vastVersion != 3 && vastVersion != 2)) {
    throw new VASTError('on VASTClient.buildVastTree, not supported VAST version "' + vastVersion + '"', 102);
  }

  return vastTree;

};

VASTClient.prototype._buildAd = function buildAd(adJxonTree) {
  var ad;
  var that = this;

  try {
    ad = new Ad(adJxonTree);
  } catch (e) {
    throw new VASTError('on VASTClient._buildAd, ' + e.message, 900);
  }

  addErrorUrlMacros(ad);
  validateAd(ad);

  return ad;
  /*** Local Functions ***/

  function addErrorUrlMacros(ad) {
    if (ad.wrapper && ad.wrapper.error) {
      that.errorURLMacros.push(ad.wrapper.error);
    }

    if (ad.inLine && ad.inLine.error) {
      that.errorURLMacros.push(ad.inLine.error);
    }
  }

  function validateAd(ad) {
    var wrapper = ad.wrapper;
    var inLine = ad.inLine;

    if (inLine && wrapper) {
      throw new VASTError('on VASTClient._buildAd, InLine and Wrapper both found on the same Ad', 101);
    }

    if (!inLine && !wrapper) {
      throw new VASTError('on VASTClient._buildAd, nor wrapper nor inline elements found on the Ad', 101);
    }

    if (inLine) {
      if (inLine.creatives.length === 0) {
        throw new VASTError("on VASTClient._buildAd, missing creative in InLine element", 101);
      }
    }

    if (wrapper) {
      if (!wrapper.VASTAdTagURI) {
        throw new VASTError("on VASTClient._buildAd, missing 'VASTAdTagURI' in wrapper", 101);
      }
    }
  }
};

VASTClient.prototype._buildVASTResponse = function buildVASTResponse(adsChain) {
  var response = new VASTResponse();
  addAdsToResponse(response, adsChain);
  validateResponse(response);

  return response;

  //*** Local function ****
  function addAdsToResponse(response, ads) {
    ads.forEach(function (ad) {
      response.addAd(ad);
    });
  }

  function validateResponse(response) {
    var progressEvents = response.trackingEvents.progress;

    if (!response.hasLinear()) {
      throw new VASTError("on VASTClient._buildVASTResponse, Received an Ad type that is not supported", 200);
    }

    if (response.duration === undefined) {
      throw new VASTError("on VASTClient._buildVASTResponse, Missing duration field in VAST response", 101);
    }

    if (progressEvents) {
      progressEvents.forEach(function (progressEvent) {
        if (!isNumber(progressEvent.offset)) {
          throw new VASTError("on VASTClient._buildVASTResponse, missing or wrong offset attribute on progress tracking event", 101);
        }
      });
    }
  }
};
