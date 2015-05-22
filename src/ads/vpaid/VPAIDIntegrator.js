function VPAIDIntegrator(player, adStartTimeout) {
  if (!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player, adStartTimeout);
  }

  this.player = player;
  this.adStartTimeout = adStartTimeout || 5000;
}

//List of supported VPAID technologies
VPAIDIntegrator.techs = [
  VPAIDFlashTech
];

VPAIDIntegrator.prototype.playAd = function playVPaidAd(vastResponse, callback) {
  callback = callback || noop;

  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('On VASTIntegrator, missing required VASTResponse'));
  }
  //I am going to need a VASTTracker

  //handshake
  //initad
  //startAd
  //getADlinear
  //getDuration, setAdVolume, setup evetn like pauseAd, resumeAd, resizeAd
  //On AdStopped Resume playing

};


VPAIDIntegrator.prototype._findSupportedTech = function (type) {
  var i, len, VPAIDTech;
  for (i = 0, len = VPAIDIntegrator.techs.length; i < len; i+=1) {
    VPAIDTech = VPAIDIntegrator.techs[i];
    if(VPAIDTech.supports(type)){
      return new VPAIDTech();
    }
  }
  return null;
};