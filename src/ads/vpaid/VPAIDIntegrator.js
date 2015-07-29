function VPAIDIntegrator(player, settings) {
  if (!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player);
  }

  this.VIEW_MODE = {
    NORMAL: 'normal',
    FULLSCREEN: "fullscreen",
    THUMBNAIL: "thumbnail"
  };
  this.player = player;
  this.containerEl = createVPAIDContainerEl(player);
  this.options = {
    responseTimeout: 2000,
    VPAID_VERSION: {
      full: '2.0',
      major: 2,
      minor: 0
    }
  };
  this.settings = settings;

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
  VPAIDFlashTech,
  VPAIDHTML5Tech
];

VPAIDIntegrator.prototype.playAd = function playVPaidAd(vastResponse, callback) {
  var that = this;
  var tech;
  var player = this.player;

  callback = callback || noop;
  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('on VASTIntegrator.playAd, missing required VASTResponse'));
  }

  player.one('adserror', function () {
    removeAdUnit();
  });

  tech = this._findSupportedTech(vastResponse, this.settings);
  dom.addClass(player.el(), 'vjs-vpaid-ad');

  if (tech) {
    async.waterfall([
      function (next) {
        next(null, tech, vastResponse);
      },
      this._loadAdUnit.bind(this),
      this._playAdUnit.bind(this),
      this._finishPlaying.bind(this)

    ], function (error, adUnit, vastResponse) {
      removeAdUnit(error);

      callback(error, vastResponse);
    });
  } else {
    callback(new VASTError('on VPAIDIntegrator.playAd, could not find a supported mediaFile'));
  }
  /*** Local functions ***/
  function removeAdUnit(error) {
    if (error) {
      that._trackError(vastResponse);
      player.trigger('vast.aderror');
    }

    tech.unloadAdUnit();
    dom.removeClass(player.el(), 'vjs-vpaid-ad');
    player.trigger('VPAID.adended');
  }
};

VPAIDIntegrator.prototype._findSupportedTech = function (vastResponse, settings) {
  if (!(vastResponse instanceof VASTResponse)) {
    return null;
  }

  var vpaidMediaFiles = vastResponse.mediaFiles.filter(vastUtil.isVPAID);
  var i, len, mediaFile, VPAIDTech;

  for (i = 0, len = vpaidMediaFiles.length; i < len; i += 1) {
    mediaFile = vpaidMediaFiles[i];
    VPAIDTech = findSupportedTech(mediaFile);
    if (VPAIDTech) {
      return new VPAIDTech(mediaFile, settings);
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

VPAIDIntegrator.prototype._loadAdUnit = function (tech, vastResponse, next) {
  var vjsTechEl = this.player.el().querySelector('.vjs-tech');
  tech.loadAdUnit(this.containerEl, vjsTechEl, function (error, adUnit) {
    try {
      next(error, new VPAIDAdUnitWrapper(adUnit, {src: tech.mediaFile.src}), vastResponse);
    } catch (e) {
      next(e, adUnit, vastResponse);
    }
  });
};

VPAIDIntegrator.prototype._playAdUnit = function (adUnit, vastResponse, callback) {
  async.waterfall([
    function (next) {
      next(null, adUnit, vastResponse);
    },
    this._handshake.bind(this),
    this._initAd.bind(this),
    this._setupEvents.bind(this),
    this._addSkipButton.bind(this),
    this._linkPlayerControls.bind(this),
    this._startAd.bind(this)
  ], callback);
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

  adUnit.on('AdClickThru', function (data) {
    var url= data.url;
    var playerHandles = data.playerHandles;
    var clickThruUrl = isNotEmptyString(url) ? url : generateClickThroughURL(vastResponse.clickThrough);

    tracker.trackClick();
    if (playerHandles && clickThruUrl) {
      window.open(clickThruUrl, '_blank');
    }

    function generateClickThroughURL(clickThroughMacro) {
      var variables = {
        ASSETURI: adUnit.options.src,
        CONTENTPLAYHEAD: 0 //In VPAID there is no method to know the current time from the adUnit
      };

      return clickThroughMacro ? vastUtil.parseURLMacro(clickThroughMacro, variables) : null;
    }
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
    adUnit.getAdVolume(function (error, currentVolume) {
      if (currentVolume === 0 && lastVolume > 0) {
        tracker.trackMute();
      }

      if (currentVolume > 0 && lastVolume === 0) {
        tracker.trackUnmute();
      }

      player.volume(currentVolume);
    });
  });

  var updateViewSize = resizeAd.bind(this, player, adUnit, this.VIEW_MODE);

  if (this.settings.autoResize) {
    var updateViewSizeThrottled = throttle(updateViewSize, 100);
    dom.addEventListener(window, 'resize', updateViewSizeThrottled);
    dom.addEventListener(window, 'orientationchange', updateViewSizeThrottled);
  }

  player.on('vast.resize', updateViewSize);

  next(null, adUnit, vastResponse);
};

VPAIDIntegrator.prototype._addSkipButton = function (adUnit, vastResponse, next) {
  var skipButton;
  var player = this.player;

  adUnit.on('AdSkippableStateChange', updateSkipButtonState);

  player.one('vast.adend', removeSkipButton);
  player.one('vast.aderror', removeSkipButton);

  next(null, adUnit, vastResponse);

  /*** Local function ***/
  function updateSkipButtonState() {
    adUnit.getAdSkippableState(function (error, isSkippable) {
      if (isSkippable) {
        addSkipButton(player);
      } else {
        removeSkipButton(player);
      }
    });
  }

  function addSkipButton(player) {
    skipButton = createSkipButton(player);
    player.el().appendChild(skipButton);
  }

  function removeSkipButton() {
    dom.remove(skipButton);
    skipButton = null;
  }

  function createSkipButton() {
    var skipButton = window.document.createElement("div");
    dom.addClass(skipButton, "vast-skip-button");
    dom.addClass(skipButton, "enabled");
    skipButton.innerHTML = "Skip ad";

    skipButton.onclick = function (e) {
      adUnit.skipAd(noop);//We skip the adUnit

      //We prevent event propagation to avoid problems with the clickThrough and so on
      if (window.Event.prototype.stopPropagation !== undefined) {
        e.stopPropagation();
      } else {
        return false;
      }
    };

    return skipButton;
  }
};

VPAIDIntegrator.prototype._linkPlayerControls = function (adUnit, vastResponse, next) {
  linkVolumeControl(this.player, adUnit);
  linkFullScreenControl(this.player, adUnit, this.VIEW_MODE);

  next(null, adUnit, vastResponse);

  /*** Local functions ***/
  function linkVolumeControl(player, adUnit) {
    player.on('advolumechange', updateAdUnitVolume);
    adUnit.on('AdVolumeChange', updatePlayerVolume);

    player.on('VPAID.adended', function () {
      player.off('advolumechange', updateAdUnitVolume);
    });


    /*** local functions ***/
    function updateAdUnitVolume() {
      var vol = player.muted() ? 0 : player.volume();
      adUnit.setAdVolume(vol, logError);
    }

    function updatePlayerVolume() {
      adUnit.getAdVolume(function (error, vol) {
        if (error) {
          logError(error);
        } else {
          player.volume(vol);
        }
      });
    }
  }

  function linkFullScreenControl(player, adUnit, VIEW_MODE) {
    var updateViewSize = resizeAd.bind(this, player, adUnit, VIEW_MODE);

    player.on('fullscreenchange', updateViewSize);

    player.on('VPAID.adended', function () {
      player.off('fullscreenchange', updateViewSize);
    });
  }
};

VPAIDIntegrator.prototype._startAd = function (adUnit, vastResponse, next) {
  var player = this.player;

  adUnit.startAd(function (error) {
    if (!error) {
      player.trigger('vast.adstart');
    }
    next(error, adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._finishPlaying = function (adUnit, vastResponse, next) {
  adUnit.on('AdStopped', function () {
    next(null, adUnit, vastResponse);
  });

  adUnit.on('AdError', function () {
    next(new VASTError('on VPAIDIntegrator, error while waiting for the adUnit to finish playing'), adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._trackError = function trackError(response) {
  vastUtil.track(response.errorURLMacros, {ERRORCODE: 901});
};

function resizeAd(player, adUnit, VIEW_MODE) {
  var dimension = dom.getDimension(player.el());
  var MODE = player.isFullscreen() ? VIEW_MODE.FULLSCREEN : VIEW_MODE.NORMAL;
  adUnit.resizeAd(dimension.width, dimension.height, MODE, logError);
}

function logError(error) {
  if (error && console && console.log) {
    console.log('ERROR: ' + error.message, error);
  }
}

