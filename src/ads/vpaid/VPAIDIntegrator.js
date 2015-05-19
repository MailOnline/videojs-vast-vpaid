function VPAIDIntegrator(player, adStartTimeout) {
  if(!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player, adStartTimeout);
  }

  this.player = player;
  this.adStartTimeout = adStartTimeout || 5000;
}

VPAIDIntegrator.prototype.playAd = function playVPaidAd(vastResponse, callback) {
  var that = this;
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