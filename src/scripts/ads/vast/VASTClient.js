const async = require('../../utils/async');
const http = require('../../utils/http').http;
const utilities = require('../../utils/utilityFunctions');
const xml = require('../../utils/xml');
const logger = require('../../utils/consoleLogger');
const Ad = require('./Ad');
const VASTError = require('./VASTError');
const VASTResponse = require('./VASTResponse');
const vastUtil = require('./vastUtil');

function VASTClient (options) {
  if (!(this instanceof VASTClient)) {
    return new VASTClient(options);
  }
  const defaultOptions = {
    WRAPPER_LIMIT: 5
  };

  options = options || {};
  this.settings = utilities.extend({}, options, defaultOptions);
  this.errorURLMacros = [];
}

VASTClient.prototype.getVASTResponse = function getVASTResponse (adTag, callback) {
  const that = this;

  const error = sanityCheck(adTag, callback);

  if (error) {
    if (utilities.isFunction(callback)) {
      return callback(error);
    }
    throw error;
  }

  async.waterfall([
    this._getVASTAd.bind(this, adTag),
    buildVASTResponse
  ],
    callback);

  /** * Local functions ***/
  function buildVASTResponse (adsChain, cb) {
    try {
      const response = that._buildVASTResponse(adsChain);

      cb(null, response);
    } catch (e) {
      cb(e);
    }
  }

  function sanityCheck (adTag, cb) {
    if (!adTag) {
      return new VASTError('on VASTClient.getVASTResponse, missing ad tag URL');
    }

    if (!utilities.isFunction(cb)) {
      return new VASTError('on VASTClient.getVASTResponse, missing callback function');
    }
  }
};

VASTClient.prototype._getVASTAd = function (adTag, callback) {
  const that = this;

  getAdWaterfall(adTag, (error, vastTree) => {
    const waterfallAds = vastTree && utilities.isArray(vastTree.ads) ? vastTree.ads : null;

    if (error) {
      that._trackError(error, waterfallAds);

      return callback(error, waterfallAds);
    }

    getAd(waterfallAds.shift(), [], waterfallHandler);

    /** * Local functions ***/
    function waterfallHandler (error, adChain) {
      if (error) {
        that._trackError(error, adChain);
        if (waterfallAds.length > 0) {
          getAd(waterfallAds.shift(), [], waterfallHandler);
        } else {
          callback(error, adChain);
        }
      } else {
        callback(null, adChain);
      }
    }
  });

  /** * Local functions ***/
  function getAdWaterfall (adTag, callback) {
    const requestVastXML = that._requestVASTXml.bind(that, adTag);

    async.waterfall([
      requestVastXML,
      buildVastWaterfall
    ], callback);
  }

  function buildVastWaterfall (xmlStr, callback) {
    let vastTree;

    try {
      vastTree = xml.toJXONTree(xmlStr);
      logger.debug('built JXONTree from VAST response:', vastTree);

      if (utilities.isArray(vastTree.ad)) {
        vastTree.ads = vastTree.ad;
      } else if (vastTree.ad) {
        vastTree.ads = [vastTree.ad];
      } else {
        vastTree.ads = [];
      }
      callback(validateVASTTree(vastTree), vastTree);
    } catch (e) {
      callback(new VASTError('on VASTClient.getVASTAd.buildVastWaterfall, error parsing xml', 100), null);
    }
  }

  function validateVASTTree (vastTree) {
    const vastVersion = xml.attr(vastTree, 'version');

    if (!vastTree.ad) {
      return new VASTError('on VASTClient.getVASTAd.validateVASTTree, no Ad in VAST tree', 303);
    }

    if (vastVersion && (vastVersion !== 3 && vastVersion !== 2)) {
      return new VASTError('on VASTClient.getVASTAd.validateVASTTree, not supported VAST version "' + vastVersion + '"', 102);
    }

    return null;
  }

  function getAd (adTag, adChain, callback) {
    if (adChain.length >= that.WRAPPER_LIMIT) {
      return callback(new VASTError('on VASTClient.getVASTAd.getAd, players wrapper limit reached (the limit is ' + that.WRAPPER_LIMIT + ')', 302), adChain);
    }

    async.waterfall([
      function (next) {
        if (utilities.isString(adTag)) {
          requestVASTAd(adTag, next);
        } else {
          next(null, adTag);
        }
      },
      buildAd
    ], (error, ad) => {
      if (ad) {
        adChain.push(ad);
      }

      if (error) {
        return callback(error, adChain);
      }

      if (ad.wrapper) {
        return getAd(ad.wrapper.VASTAdTagURI, adChain, callback);
      }

      return callback(null, adChain);
    });
  }

  function buildAd (adJxonTree, callback) {
    try {
      const ad = new Ad(adJxonTree);

      callback(validateAd(ad), ad);
    } catch (e) {
      callback(new VASTError('on VASTClient.getVASTAd.buildAd, error parsing xml', 100), null);
    }
  }

  function validateAd (ad) {
    const wrapper = ad.wrapper;
    const inLine = ad.inLine;
    const errMsgPrefix = 'on VASTClient.getVASTAd.validateAd, ';

    if (inLine && wrapper) {
      return new VASTError(errMsgPrefix + 'InLine and Wrapper both found on the same Ad', 101);
    }

    if (!inLine && !wrapper) {
      return new VASTError(errMsgPrefix + 'nor wrapper nor inline elements found on the Ad', 101);
    }

    if (inLine && !inLine.isSupported()) {
      return new VASTError(errMsgPrefix + 'could not find MediaFile that is supported by this video player', 403);
    }

    if (wrapper && !wrapper.VASTAdTagURI) {
      return new VASTError(errMsgPrefix + 'missing \'VASTAdTagURI\' in wrapper', 101);
    }

    return null;
  }

  function requestVASTAd (adTag, callback) {
    that._requestVASTXml(adTag, (error, xmlStr) => {
      if (error) {
        return callback(error);
      }
      try {
        const vastTree = xml.toJXONTree(xmlStr);

        callback(validateVASTTree(vastTree), vastTree.ad);
      } catch (e) {
        callback(new VASTError('on VASTClient.getVASTAd.requestVASTAd, error parsing xml', 100));
      }
    });
  }
};

VASTClient.prototype._requestVASTXml = function requestVASTXml (adTag, callback) {
  try {
    if (utilities.isFunction(adTag)) {
      adTag(requestHandler);
    } else {
      logger.info('requesting adTag: ' + adTag);
      http.get(adTag, requestHandler, {
        withCredentials: true
      });
    }
  } catch (e) {
    callback(e);
  }

  /** * Local functions ***/
  function requestHandler (error, response, status) {
    if (error) {
      const errMsg = utilities.isDefined(status) ?
      'on VASTClient.requestVastXML, HTTP request error with status \'' + status + '\'' :
        'on VASTClient.requestVastXML, Error getting the the VAST XML with he passed adTagXML fn';

      return callback(new VASTError(errMsg, 301), null);
    }

    callback(null, response);
  }
};

VASTClient.prototype._buildVASTResponse = function buildVASTResponse (adsChain) {
  const response = new VASTResponse();

  addAdsToResponse(response, adsChain);
  validateResponse(response);

  return response;

  //* ** Local function ****
  function addAdsToResponse (response, ads) {
    ads.forEach((ad) => {
      response.addAd(ad);
    });
  }

  function validateResponse (response) {
    const progressEvents = response.trackingEvents.progress;

    if (!response.hasLinear()) {
      throw new VASTError('on VASTClient._buildVASTResponse, Received an Ad type that is not supported', 200);
    }

    if (response.duration === undefined) {
      throw new VASTError('on VASTClient._buildVASTResponse, Missing duration field in VAST response', 101);
    }

    if (progressEvents) {
      progressEvents.forEach((progressEvent) => {
        if (!utilities.isNumber(progressEvent.offset)) {
          throw new VASTError('on VASTClient._buildVASTResponse, missing or wrong offset attribute on progress tracking event', 101);
        }
      });
    }
  }
};

VASTClient.prototype._trackError = function (error, adChain) {
  if (!utilities.isArray(adChain) || adChain.length === 0) { // There is nothing to track
    return;
  }

  const errorURLMacros = [];

  adChain.forEach(addErrorUrlMacros);
  vastUtil.track(errorURLMacros, {ERRORCODE: error.code || 900});  // 900 <== Undefined error

  /** * Local functions  ***/
  function addErrorUrlMacros (ad) {
    if (ad.wrapper && ad.wrapper.error) {
      errorURLMacros.push(ad.wrapper.error);
    }

    if (ad.inLine && ad.inLine.error) {
      errorURLMacros.push(ad.inLine.error);
    }
  }
};

module.exports = VASTClient;
