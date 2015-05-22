function VPAIDFlashTech() {
  if (!(this instanceof VPAIDFlashTech)) {
    return new VPAIDFlashTech();
  }
}

VPAIDFlashTech.prototype.supports = function (type) {
  return type === 'application/xshockwave-flash';
};

VPAIDFlashTech.prototype.load = function loadFlashCreative(vpaidCreativeUrl, containerEl, callback) {
  sanityCheck(vpaidCreativeUrl, containerEl, callback);

  //TODO: The meet of this method is yet to be implemented
  //Important Note: It needs to return an instance of VPAIDCreativeWrapper that wraps the external VPAIDCreative

  /*** Local Functions ***/
  function sanityCheck(creativeUrl, container, cb) {
    if (!isString(creativeUrl)) {
      throw new VASTError('on VPAIDFlashTech.load, invalid VPAIDCreativeUrl');
    }

    if(!dom.isDomElement(container)){
      throw new VASTError('on VPAIDFlashTech.load, invalid dom container element');
    }

    if(!isFunction(cb)){
      throw new VASTError('on VPAIDFlashTech.load, missing valid callback');
    }
  }
};
