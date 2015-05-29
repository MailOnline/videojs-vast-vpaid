function VPAIDIntegrator(player, adStartTimeout) {
  if (!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player, adStartTimeout);
  }

  this.VIEW_MODE = {
    NORMAL: 'normal',
    FULLSCREEN: "fullscreen",
    THUMBNAIL: "thumbnail"
  };
  this.player = player;
  this.adStartTimeout = adStartTimeout || 5000;
  this.containerEl = createVPAIDContainerEl(player);
  this.options = {
    adStartTimeout: adStartTimeout || 5000,
    responseTimeout: 2000,
    VPAID_VERSION: {
      full: '2.0',
      major: 2,
      minor: 0
    }
  };

  /*** Local functions ***/

  function createVPAIDContainerEl() {
    var containerEl = document.createElement('div');
    dom.addClass(containerEl, 'VPAID-container');
    player.el().insertBefore(containerEl, player.controlBar.el());
    return containerEl;

  }
}

//List of supported VPAID technologies
VPAIDIntegrator.techs = [
  VPAIDFlashTech
];

VPAIDIntegrator.prototype.playAd = function playVPaidAd(vastResponse, callback) {
  var that = this;
  var tech, adStartTimeoutId;
  var player = this.player;

  callback = callback || noop;
  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('on VASTIntegrator.playAd, missing required VASTResponse'));
  }

  adStartTimeoutId = setTimeout(function () {
    callback(new VASTError('on VPAIDIntegrator, timeout while waiting for the ad to start'));
    callback = noop;
    removeAdUnit();
  }, this.adStartTimeout);

  tech = this._findSupportedTech(vastResponse);
  dom.addClass(player.el(), 'vjs-vpaid-ad');

  if(tech){
    async.waterfall([
      function(next) {
        next(null, tech, vastResponse);
      },
      this._loadAdUnit.bind(this),
      this._playAdUnit.bind(this),
      clearAdStartTimeout,
      this._finishPlaying.bind(this)

    ], function (error, adUnit, vastResponse) {
      if(error) {
        that._trackError(vastResponse);
      }

      removeAdUnit();

      callback(error, vastResponse);
    });
  } else {
    callback(new VASTError('on VPAIDIntegrator.playAd, could not find a supported mediaFile'));
  }
  /*** Local functions ***/

  function clearAdStartTimeout(adUnit, vastResponse, next) {
    clearTimeout(adStartTimeoutId);
    adStartTimeoutId = null;
    next(null, adUnit, vastResponse);
  }
  
  function removeAdUnit() {
    tech.unloadAdUnit();
    dom.removeClass(player.el(), 'vjs-vpaid-ad')
  }
};

VPAIDIntegrator.prototype._loadAdUnit = function(tech, vastResponse, next) {
  tech.loadAdUnit(this.containerEl, function(error, adUnit) {
    next(error, new VPAIDAdUnitWrapper(adUnit, { src: tech.mediaFile.src }), vastResponse);
  });
};

VPAIDIntegrator.prototype._playAdUnit = function(adUnit, vastResponse, callback) {
  async.waterfall([
    function (next) {
      next(null, adUnit, vastResponse);
    },
    this._handshake.bind(this),
    this._initAd.bind(this),
    this._setupEvents.bind(this),
    this._startAd.bind(this)
  ], callback);
};

VPAIDIntegrator.prototype._findSupportedTech = function(vastResponse) {
  if(!(vastResponse instanceof VASTResponse)){
    return null;
  }

  var vpaidMediaFiles = vastResponse.mediaFiles.filter(vastUtil.isVPAID);
  var i, len, mediaFile, VPAIDTech;

  for (i = 0, len = vpaidMediaFiles.length; i < len; i += 1) {
    mediaFile = vpaidMediaFiles[i];
    VPAIDTech = findSupportedTech(mediaFile);
    if (VPAIDTech) {
      return new VPAIDTech(mediaFile);
    }
  }

  return null;

  /*** Local functions ***/

  function findSupportedTech(mediafile) {
    var type = mediafile.type;
    var i, len, VPAIDTech;

    for (i = 0, len = VPAIDIntegrator.techs.length; i < len; i += 1) {
      VPAIDTech = VPAIDIntegrator.techs[i];
      if (VPAIDTech.supports(type)) {
        return VPAIDTech;
      }
    }
    return null;
  }
};

VPAIDIntegrator.prototype._handshake = function handshake(adUnit, vastResponse, next) {
  adUnit.handshakeVersion('2.0', function (error, version) {
    if (error) {
      return next(error, adUnit, vastResponse);
    }

    if (version && isSupportedVersion(version)) {
      return next(null, adUnit, vastResponse);
    }

    return next(new VASTError('on VPAIDIntegrator._handshake, unsupported version "' + version + '"'), adUnit, vastResponse);
  });

  function isSupportedVersion(version) {
    var majorNum = major(version);
    return majorNum >= 1 && majorNum <= 2;
  }

  function major(version) {
    var parts = version.split('.');
    return parseInt(parts[0], 10);
  }
};

VPAIDIntegrator.prototype._initAd = function (adUnit, vastResponse, next) {
  var dimension = dom.getDimension(this.player.el());
  adUnit.initAd(dimension.width, dimension.height, this.VIEW_MODE.NORMAL, -1, vastResponse.adParameters || '', function (error) {
    next(error, adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._startAd = function (adUnit, vastResponse, next) {
  adUnit.startAd(function (error) {
    next(error, adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._setupEvents = function (adUnit, vastResponse, next) {
  var adUnitSrc = adUnit.options.src;
  var tracker = new VASTTracker(adUnitSrc, vastResponse);
  var player = this.player;

  adUnit.on('AdSkipped', function () {
    tracker.trackSkip();
  });

  adUnit.on('AdImpression', function () {
    tracker.trackImpressions();
  });

  adUnit.on('AdVideoStart', function () {
    tracker.trackStart();
  });

  adUnit.on('AdVideoFirstQuartile', function () {
    tracker.trackFirstQuartile();
  });

  adUnit.on('AdVideoMidpoint', function () {
    tracker.trackMidpoint();
  });

  adUnit.on('AdVideoThirdQuartile', function () {
    tracker.trackThirdQuartile();
  });

  adUnit.on('AdVideoComplete', function () {
    tracker.trackComplete();
  });

  adUnit.on('AdClickThru', function () {
    tracker.trackClick();
  });

  adUnit.on('AdUserAcceptInvitation', function () {
    tracker.trackAcceptInvitation();
    tracker.trackAcceptInvitationLinear();
  });

  adUnit.on('AdUserClose', function () {
    tracker.trackClose();
    tracker.trackCloseLinear();
  });

  adUnit.on('AdPaused', function () {
    tracker.trackPause();
  });

  adUnit.on('AdUserMinimize', function () {
    tracker.trackCollapse();
  });

  adUnit.on('AdError', function () {
    //NOTE: we track errors code 901, as noted in VAST 3.0
    tracker.trackErrorWithCode(901);
  });

  adUnit.on('AdPlaying', function () {
    //NOTE: we track errors code 901, as noted in VAST 3.0
    tracker.trackResume();
  });

  adUnit.on('AdVolumeChange', function () {
    var lastVolume = player.volume();
    adUnit.getAdVolume(function (currentVolume) {
      if (currentVolume == 0 && lastVolume > 0) {
        tracker.trackMute();
      }

      if (currentVolume > 0 && lastVolume == 0) {
        tracker.trackUnmute();
      }

      player.volume(currentVolume);
    });
  });

  next(null, adUnit, vastResponse);
};

VPAIDIntegrator.prototype._finishPlaying = function (adUnit, vastResponse, next) {
  adUnit.on('AdVideoComplete', function () {
    next(null, adUnit, vastResponse);
  });

  adUnit.on('AdError', function () {
    next(new VASTError('on VPAIDIntegrator, error while waiting for the adUnit to finish playing'), adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._trackError = function trackError(response) {
  vastUtil.track(response.errorURLMacros, {ERRORCODE: 901});
};
