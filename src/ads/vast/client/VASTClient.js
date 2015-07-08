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

VASTClient.prototype.getVASTResponse = function getVASTResponse(url, callback) {
  var that = this;

  //We reset the errorURLMacros before doing anything.
  this.errorURLMacros = [];

  async.waterfall([
      this._getAd.bind(this, url),
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

VASTClient.prototype._getAd = function getVASTAd(url, callback) {
  var error;
  var that = this;
  var options = isObject(url) && !isNull(url) ? url : {url: url};
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
    if (!isString(opts.url)) {
      return new VASTError('on VASTClient._getAd, missing video tag URL');
    }

    if (!isFunction(cb)) {
      return new VASTError('on VASTClient._getAd, missing callback function');
    }

    if (opts.ads.length >= that.WRAPPER_LIMIT) {
      return new VASTError("on VASTClient._getAd, players wrapper limit reached (the limit is " + that.WRAPPER_LIMIT + ")", 302);
    }
  }

  function requestVASTXml(callback) {
    that._requestVASTXml(options.url, callback);
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
        url: ad.wrapper.VASTAdTagURI,
        ads: previousAds.concat(ad)
      }, callback);
    }
  }
};

VASTClient.prototype._requestVASTXml = function requestVASTXml(url, callback) {
  try{
    http.get(url, function (error, response, status){
      if(error) {
        return callback(new VASTError("on VASTClient.requestVastXML, HTTP request error with status '" + status + "'", 301));
      }
      callback(null, response);
    });
  }catch(e){
    callback(e);
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

  if(vastVersion && (vastVersion != 3 && vastVersion != 2)){
    throw new VASTError('on VASTClient.buildVastTree, not supported VAST version "'+vastVersion+'"', 102);
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
    if(ad.wrapper && ad.wrapper.error) {
      that.errorURLMacros.push(ad.wrapper.error);
    }

    if(ad.inLine && ad.inLine.error){
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

    if(!response.hasLinear()){
      throw new VASTError("on VASTClient._buildVASTResponse, Received an Ad type that is not supported", 200);
    }

    if (!response.duration) {
      throw new VASTError("on VASTClient._buildVASTResponse, Missing duration field in VAST response", 101);
    }

    if (progressEvents) {
      if (progressEvents.length > 1) {
        throw new VASTError("on VASTClient._buildVASTResponse, found more than one progress tracking event in VAST response", 101);
      }

      if (!isNumber(progressEvents[0].offset)) {
        throw new VASTError("on VASTClient._buildVASTResponse, missing offset attribute on progress tracking event", 101);
      }
    }
  }
};
