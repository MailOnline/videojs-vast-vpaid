function VPAIDAdUnitWrapper(vpaidCreative, opts) {
  if (!(this instanceof VPAIDAdUnitWrapper)) {
    return new VPAIDAdUnitWrapper(vpaidCreative);
  }
  sanityCheck(vpaidCreative, opts);
  var defaultOpts = {
    responseTimeout: 2000
  };

  this.options = extend({}, defaultOpts, opts || {});
  this._creative = vpaidCreative;

  /*** Local Functions ***/
  function sanityCheck(creative, opts) {
    if (!creative || !VPAIDAdUnitWrapper.checkVPAIDInterface(creative)) {
      throw new VASTError('on VPAIDAdUnitWrapper, the passed VPAID creative does not fully implement the VPAID interface');
    }

    if (opts && !isObject(opts)) {
      throw new VASTError("on VPAIDAdUnitWrapper, expected options hash  but got '" + opts + "'");
    }
  }
}

VPAIDAdUnitWrapper.checkVPAIDInterface = function checkVPAIDInterface(VPAIDCreative) {
  var VPAIDInterfaceMethods = [
    'handshakeVersion', 'initAd', 'startAd', 'stopAd', 'skipAd', 'resizeAd', 'pauseAd', 'expandAd', 'collapseAd',
    'subscribe', 'unsubscribe'
  ];

  for (var i = 0, len = VPAIDInterfaceMethods.length; i < len; i++) {
    if (!VPAIDCreative || !isFunction(VPAIDCreative[VPAIDInterfaceMethods[i]])) {
      return false;
    }
  }
  return true;
};

VPAIDAdUnitWrapper.prototype.creativeAsyncCall = function () {
  var args = arrayLikeObjToArray(arguments);
  var method = args.shift();
  var cb = args.pop();
  var that = this;
  var timeoutId;

  sanityCheck(method, cb, this._creative);
  args.push(wrapCallback());

  this._creative[method].apply(this, args);
  timeoutId = setTimeout(function () {
    timeoutId = null;
    cb(new VASTError("on VPAIDAdUnitWrapper, timeout while waiting for a response on call '" + method + "'"));
    cb = noop;
  }, this.options.responseTimeout);

  /*** Local functions ***/
  function sanityCheck(method, cb, creative) {
    if (!isString(method) || !isFunction(creative[method])) {
      throw new VASTError("on VPAIDAdUnitWrapper.creativeAsyncCall, invalid method name")
    }

    if (!isFunction(cb)) {
      throw new VASTError("on VPAIDAdUnitWrapper.creativeAsyncCall, missing callback")
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

VPAIDAdUnitWrapper.prototype.destroy = function () {
  this._creative.unloadAdUnit();
};

VPAIDAdUnitWrapper.prototype.on = function (evtName, handler) {
  var addEventListener = this._creative.addEventListener || this._creative.subscribe || this._creative.on;
  addEventListener.call(this._creative, evtName, handler);
};

VPAIDAdUnitWrapper.prototype.off = function (evtName, handler) {
  var removeEventListener = this._creative.removeEventListener || this._creative.unsubscribe || this._creative.off;
  removeEventListener.call(this._creative, evtName, handler);
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
      throw new VASTError("on VPAIDAdUnitWrapper.waitForEvent, missing evt name")
    }

    if (!isFunction(cb)) {
      throw new VASTError("on VPAIDAdUnitWrapper.waitForEvent, missing callback")
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
  this.creativeAsyncCall('handshakeVersion', version, cb)
};

VPAIDAdUnitWrapper.prototype.initAd = function (width, height, viewMode, desiredBitrate, creativeData, environmentVars, cb) {
  this._creative(width, height, viewMode, desiredBitrate, creativeData, environmentVars);
  this.waitForEvent('AdLoaded', cb);
};

VPAIDAdUnitWrapper.prototype.resizeAd = function (width, height, viewMode, cb) {
  this._creative.resizeAd(width, height, viewMode);
  this.waitForEvent('AdSizeChange', cb);
};

VPAIDAdUnitWrapper.prototype.startAd = function (cb) {
  this._creative.startAd();
  this.waitForEvent('AdStarted', cb);
};

VPAIDAdUnitWrapper.prototype.stopAd = function (cb) {
  this._creative.stopAd();
  this.waitForEvent('AdStopped', cb);
};

VPAIDAdUnitWrapper.prototype.pauseAd = function (cb) {
  this._creative.pauseAd();
  this.waitForEvent('AdPaused', cb);
};

VPAIDAdUnitWrapper.prototype.resumeAd = function (cb) {
  this._creative.resumeAd();
  this.waitForEvent('AdPlaying', cb);
};

VPAIDAdUnitWrapper.prototype.expandAd = function (cb) {
  this._creative.expandAd();
  this.waitForEvent('AdExpandedChange', cb);
};

VPAIDAdUnitWrapper.prototype.collapseAd = function (cb) {
  this._creative.collapseAd();
  this.waitForEvent('AdExpandedChange', cb);
};

VPAIDAdUnitWrapper.prototype.skipAd = function (cb) {
  this._creative.skipAd();
  this.waitForEvent('AdSkipped', cb);

  //TODO: what about: AdSkippableStateChange
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
    this.creativeAsyncCall(getterName, cb)
  };
});
