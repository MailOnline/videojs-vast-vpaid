// This class is meant to be part of the video player that interacts with the Ad.
// It takes the VPAID creative as a parameter in its contructor.
function VPAIDCreativeWrapper(vpaidCreative) {
  if (!(this instanceof VPAIDCreativeWrapper)) {
    return new VPAIDCreativeWrapper(vpaidCreative);
  }
  sanityCheck(vpaidCreative);

  this._creative = vpaidCreative;
  //this.setCallbacksForCreative();
  // This function registers the callbacks of each of the events

  /*** Local Functions ***/
  function sanityCheck(creative) {
    if (!creative || !VPAIDCreativeWrapper.checkVPAIDInterface(creative)) {
      throw new VASTError('on VPAIDCreativeWrapper, the passed VPAID creative does not fully implement the VPAID interface');
    }
  }
}

VPAIDCreativeWrapper.checkVPAIDInterface = function checkVPAIDInterface(VPAIDCreative) {
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

/*
 var events = [ 'AdStarted', 'AdStopped', 'AdSkipped', 'AdLoaded', 'AdLinearChange', 'AdSizeChange', 'AdExpandedChange', 'AdSkippableStateChange',
 'AdDurationChange', 'AdRemainingTimeChange', 'AdVolumeChange', 'AdImpression', 'AdClickThru', 'AdInteraction', 'AdVideoStart',
 'AdVideoFirstQuartile','AdVideoMidpoint', 'AdVideoThirdQuartile', 'AdVideoComplete', 'AdUserAcceptInvitation', 'AdUserMinimize',
 'AdUserClose', 'AdPaused', 'AdPlaying', 'AdError', 'AdLog'];
 */

VPAIDCreativeWrapper.prototype.on = function onEvent() {

};

VPAIDCreativeWrapper.prototype.initAd = function (width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
  this._creative.initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars);
};

VPAIDCreativeWrapper.prototype.startAd = function () {
  console.log("startAd");
  this._creative.startAd();
};

VPAIDCreativeWrapper.prototype.stopAd = function () {
  this._creative.stopAd();
};

VPAIDCreativeWrapper.prototype.resizeAd = function (width, height, viewMode) {
  this._creative.resizeAd(width, height, viewMode);
};

VPAIDCreativeWrapper.prototype.pauseAd = function () {
  this._creative.pauseAd();
};

VPAIDCreativeWrapper.prototype.resumeAd = function () {
  this._creative.resumeAd();
};

VPAIDCreativeWrapper.prototype.expandAd = function () {
  this._creative.expandAd();
};

VPAIDCreativeWrapper.prototype.collapseAd = function () {
  this._creative.collapseAd();
};

//GETTERS and SETTERS
VPAIDCreativeWrapper.prototype.getAdExpanded = function () {
  console.log("getAdExpanded");
  return this._creative.getAdExpanded();
};

VPAIDCreativeWrapper.prototype.getAdSkippableState = function () {
  console.log("getAdSkippableState");
  return this._creative.getAdSkippableState();
};

VPAIDCreativeWrapper.prototype.getAdRemainingTime = function () {
  console.log("getAdRemainingTime");
  return this._creative.getAdRemainingTime();
};

VPAIDCreativeWrapper.prototype.getAdLinear = function () {
  console.log("getAdLinear");
  return this._creative.getAdLinear();
};

VPAIDCreativeWrapper.prototype.setAdVolume = function (val) {
  this._creative.setAdVolume(val);
};

VPAIDCreativeWrapper.prototype.getAdVolume = function () {
  return this._creative.getAdVolume();
};