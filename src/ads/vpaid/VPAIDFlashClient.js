function VPAIDFlashClient() {
  if (!(this instanceof VPAIDFlashClient)) {
    return new VPAIDFlashClient();
  }
}

VPAIDFlashClient.prototype.supports = function (type) {
  return type === 'application/xshockwave-flash';
};

VPAIDFlashClient.prototype.load = function loadFlashCreative(vpaidCreativeUrl, containerEl, callback) {
  sanityCheck(vpaidCreativeUrl, containerEl, callback);

  //TODO: The meet of this method is yet to be implemented
  //Important Note: It needs to return an instance of VPAIDCreativeWrapper that wraps the external VPAIDCreative

  /*** Local Functions ***/
  function sanityCheck(creativeUrl, container, cb) {
    if (!isString(creativeUrl)) {
      throw new VASTError('on VPAIDFlashClient.load, invalid VPAIDCreativeUrl');
    }

    if(!dom.isDomElement(container)){
      throw new VASTError('on VPAIDFlashClient.load, invalid dom container element');
    }

    if(!isFunction(cb)){
      throw new VASTError('on VPAIDFlashClient.load, missing valid callback');
    }
  }
};
