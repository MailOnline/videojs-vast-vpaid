function VPAIDAdUnitWrapper(vpaidAdUnit, opts) {
  if (!(this instanceof VPAIDAdUnitWrapper)) {
    return new VPAIDAdUnitWrapper(vpaidAdUnit);
  }
  sanityCheck(vpaidAdUnit, opts);
  var defaultOpts = {
    responseTimeout: 2000
  };

  this.options = extend({}, defaultOpts, opts || {});
  this._adUnit = vpaidAdUnit;

  /*** Local Functions ***/
  function sanityCheck(adUnit, opts) {
    if (!adUnit || !VPAIDAdUnitWrapper.checkVPAIDInterface(adUnit)) {
      throw new VASTError('on VPAIDAdUnitWrapper, the passed VPAID adUnit does not fully implement the VPAID interface');
    }

    if (opts && !isObject(opts)) {
      throw new VASTError("on VPAIDAdUnitWrapper, expected options hash  but got '" + opts + "'");
    }
  }
}

VPAIDAdUnitWrapper.checkVPAIDInterface = function checkVPAIDInterface(VPAIDAdUnit) {
  //NOTE: skipAd is not part of the method list because it only appears in VPAID 2.0 and we support VPAID 1.0
  var VPAIDInterfaceMethods = [
    'handshakeVersion', 'initAd', 'startAd', 'stopAd', 'resizeAd', 'pauseAd', 'expandAd', 'collapseAd'
  ];

  for (var i = 0, len = VPAIDInterfaceMethods.length; i < len; i++) {
    if (!VPAIDAdUnit || !isFunction(VPAIDAdUnit[VPAIDInterfaceMethods[i]])) {
      return false;
    }
  }


  return canSubscribeToEvents(VPAIDAdUnit) && canUnsubscribeFromEvents(VPAIDAdUnit);

  /*** Local Functions ***/

  function canSubscribeToEvents(adUnit) {
    return isFunction(adUnit.subscribe) || isFunction(adUnit.addEventListener) || isFunction(adUnit.on);
  }

  function canUnsubscribeFromEvents(adUnit) {
    return isFunction(adUnit.unsubscribe) || isFunction(adUnit.removeEventListener) || isFunction(adUnit.off);

  }
};

VPAIDAdUnitWrapper.prototype.adUnitAsyncCall = function () {
  var args = arrayLikeObjToArray(arguments);
  var method = args.shift();
  var cb = args.pop();
  var timeoutId;

  sanityCheck(method, cb, this._adUnit);
  args.push(wrapCallback());

  this._adUnit[method].apply(this._adUnit, args);
  timeoutId = setTimeout(function () {
    timeoutId = null;
    cb(new VASTError("on VPAIDAdUnitWrapper, timeout while waiting for a response on call '" + method + "'"));
    cb = noop;
  }, this.options.responseTimeout);

  /*** Local functions ***/
  function sanityCheck(method, cb, adUnit) {
    if (!isString(method) || !isFunction(adUnit[method])) {
      throw new VASTError("on VPAIDAdUnitWrapper.adUnitAsyncCall, invalid method name");
    }

    if (!isFunction(cb)) {
      throw new VASTError("on VPAIDAdUnitWrapper.adUnitAsyncCall, missing callback");
    }
  }

  function wrapCallback() {
    return function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cb.apply(this, arguments);
    };
  }
};

VPAIDAdUnitWrapper.prototype.on = function (evtName, handler) {
  var addEventListener = this._adUnit.addEventListener || this._adUnit.subscribe || this._adUnit.on;
  addEventListener.call(this._adUnit, evtName, handler);
};

VPAIDAdUnitWrapper.prototype.off = function (evtName, handler) {
  var removeEventListener = this._adUnit.removeEventListener || this._adUnit.unsubscribe || this._adUnit.off;
  removeEventListener.call(this._adUnit, evtName, handler);
};

VPAIDAdUnitWrapper.prototype.waitForEvent = function (evtName, cb, context) {
  var timeoutId;
  sanityCheck(evtName, cb);
  context = context || null;

  this.on(evtName, responseListener);

  timeoutId = setTimeout(function () {
    cb(new VASTError("on VPAIDAdUnitWrapper.waitForEvent, timeout while waiting for event '" + evtName + "'"));
    timeoutId = null;
    cb = noop;
  }, this.options.responseTimeout);

  /*** Local functions ***/
  function sanityCheck(evtName, cb) {
    if (!isString(evtName)) {
      throw new VASTError("on VPAIDAdUnitWrapper.waitForEvent, missing evt name");
    }

    if (!isFunction(cb)) {
      throw new VASTError("on VPAIDAdUnitWrapper.waitForEvent, missing callback");
    }
  }

  function responseListener() {
    var args = arrayLikeObjToArray(arguments);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    args.unshift(null);
    cb.apply(context, args);
  }
};

// VPAID METHODS
VPAIDAdUnitWrapper.prototype.handshakeVersion = function (version, cb) {
  this.adUnitAsyncCall('handshakeVersion', version, cb);
};

/* jshint maxparams:6 */
VPAIDAdUnitWrapper.prototype.initAd = function (width, height, viewMode, desiredBitrate, adUnitData, cb) {
  this._adUnit.initAd(width, height, viewMode, desiredBitrate, adUnitData);
  this.waitForEvent('AdLoaded', cb);
};

VPAIDAdUnitWrapper.prototype.resizeAd = function (width, height, viewMode, cb) {
  // NOTE: AdSizeChange event is only supported on VPAID 2.0 so for the moment we are not going to use it
  // and will assume that everything is fine after the async call
  this.adUnitAsyncCall('resizeAd', width, height, viewMode, cb);
};

VPAIDAdUnitWrapper.prototype.startAd = function (cb) {
  this._adUnit.startAd();
  this.waitForEvent('AdStarted', cb);
};

VPAIDAdUnitWrapper.prototype.stopAd = function (cb) {
  this._adUnit.stopAd();
  this.waitForEvent('AdStopped', cb);
};

VPAIDAdUnitWrapper.prototype.pauseAd = function (cb) {
  this._adUnit.pauseAd();
  this.waitForEvent('AdPaused', cb);
};

VPAIDAdUnitWrapper.prototype.resumeAd = function (cb) {
  this._adUnit.resumeAd();
  this.waitForEvent('AdPlaying', cb);
};

VPAIDAdUnitWrapper.prototype.expandAd = function (cb) {
  this._adUnit.expandAd();
  this.waitForEvent('AdExpandedChange', cb);
};

VPAIDAdUnitWrapper.prototype.collapseAd = function (cb) {
  this._adUnit.collapseAd();
  this.waitForEvent('AdExpandedChange', cb);
};

VPAIDAdUnitWrapper.prototype.skipAd = function (cb) {
  this._adUnit.skipAd();
  this.waitForEvent('AdSkipped', cb);
};

//VPAID property getters
[
  'adLinear',
  'adWidth',
  'adHeight',
  'adExpanded',
  'adSkippableState',
  'adRemainingTime',
  'adDuration',
  'adVolume',
  'adCompanions',
  'adIcons'
].forEach(function (property) {
  var getterName = 'get' + capitalize(property);

  VPAIDAdUnitWrapper.prototype[getterName] = function (cb) {
    this.adUnitAsyncCall(getterName, cb);
  };
});

//VPAID property setters
VPAIDAdUnitWrapper.prototype.setAdVolume = function(volume, cb){
  this.adUnitAsyncCall('setAdVolume',volume, cb);
};