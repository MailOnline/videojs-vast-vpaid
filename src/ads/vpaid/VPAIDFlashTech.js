function VPAIDFlashTech() {
  if (!(this instanceof VPAIDFlashTech)) {
    return new VPAIDFlashTech();
  }
}

VPAIDFlashTech.supports = function (type) {
  return type === 'application/xshockwave-flash';
};

VPAIDFlashTech.prototype.loadAdUnit = function loadFlashCreative(containerEl, vpaidCreativeUrl, callback) {
  sanityCheck(containerEl, vpaidCreativeUrl, callback);

  async.waterfall([
    createVPAIDFlashToJs,
    loadVPAIDCreative
  ], callback);

  /*** Local Functions ***/
  function sanityCheck(container, creativeUrl, cb) {

    if(!dom.isDomElement(container)){
      throw new VASTError('on VPAIDFlashTech.loadAdUnit, invalid dom container element');
    }

    if (!isString(creativeUrl)) {
      throw new VASTError('on VPAIDFlashTech.loadAdUnit, invalid VPAIDCreativeUrl');
    }

    if(!isFunction(cb)){
      throw new VASTError('on VPAIDFlashTech.loadAdUnit, missing valid callback');
    }
  }

  function createVPAIDFlashToJs(callback) {
    var vpaidFlashToJs = new VPAIDFlashToJS(containerEl, function (error) {
      callback(error, vpaidFlashToJs);
    });
  }

  function loadVPAIDCreative(vpaidFlashToJs, callback){
    vpaidFlashToJs.loadAdUnit(vpaidCreativeUrl, callback)
  }
};
