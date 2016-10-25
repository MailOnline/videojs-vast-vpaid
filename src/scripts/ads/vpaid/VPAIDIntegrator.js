const MimeTypes = require('../../utils/mimetypes');
const VASTError = require('../vast/VASTError');
const VASTResponse = require('../vast/VASTResponse');
const VASTTracker = require('../vast/VASTTracker');
const vastUtil = require('../vast/vastUtil');
const async = require('../../utils/async');
const dom = require('../../utils/dom');
const playerUtils = require('../../utils/playerUtils');
const utilities = require('../../utils/utilityFunctions');
const logger = require('../../utils/consoleLogger');
const VPAIDAdUnitWrapper = require('./VPAIDAdUnitWrapper');

function VPAIDIntegrator (player, settings) {
  if (!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player);
  }

  this.VIEW_MODE = {
    NORMAL: 'normal',
    FULLSCREEN: 'fullscreen',
    THUMBNAIL: 'thumbnail'
  };
  this.player = player;
  this.containerEl = createVPAIDContainerEl(player);
  this.options = {
    responseTimeout: 5000,
    VPAID_VERSION: '2.0'
  };
  this.settings = settings;

  /** * Local functions ***/

  function createVPAIDContainerEl () {
    const containerEl = document.createElement('div');

    dom.addClass(containerEl, 'VPAID-container');
    player.el().insertBefore(containerEl, player.controlBar.el());

    return containerEl;
  }
}

VPAIDIntegrator.prototype.playAd = function playVPaidAd (vastResponse, callback) {
  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('on VASTIntegrator.playAd, missing required VASTResponse'));
  }

  const that = this;
  const player = this.player;

  logger.debug('<VPAIDIntegrator.playAd> looking for supported tech...');
  const tech = this._findSupportedTech(vastResponse, this.settings);

  callback = callback || utilities.noop;

  this._adUnit = null;

  dom.addClass(player.el(), 'vjs-vpaid-ad');

  player.on('vast.adsCancel', triggerVpaidAdEnd);
  player.one('vpaid.adEnd', () => {
    player.off('vast.adsCancel', triggerVpaidAdEnd);
    removeAdUnit();
  });

  if (tech) {
    logger.info('<VPAIDIntegrator.playAd> found tech: ', tech);

    async.waterfall([
      function (next) {
        next(null, tech, vastResponse);
      },
      this._loadAdUnit.bind(this),
      this._playAdUnit.bind(this),
      this._finishPlaying.bind(this)

    ], adComplete);

    this._adUnit = {
      _paused: true,
      type: 'VPAID',
      pauseAd: function () {
        player.trigger('vpaid.pauseAd');
        player.pause(true);// we make sure that the video content gets stopped.
      },
      resumeAd: function () {
        player.trigger('vpaid.resumeAd');
      },
      isPaused: function () {
        return this._paused;
      },
      getSrc: function () {
        return tech.mediaFile;
      }
    };
  } else {
    logger.debug('<VPAIDIntegrator.playAd> could not find suitable tech');
    const error = new VASTError('on VPAIDIntegrator.playAd, could not find a supported mediaFile', 403);

    adComplete(error, this._adUnit, vastResponse);
  }

  return this._adUnit;

  /** * Local functions ***/
  function adComplete (error, adUnit, vastResponse) {
    if (error && vastResponse) {
      that._trackError(vastResponse, error.code);
    }
    player.trigger('vpaid.adEnd');
    callback(error, vastResponse);
  }

  function triggerVpaidAdEnd () {
    player.trigger('vpaid.adEnd');
  }

  function removeAdUnit () {
    if (tech) {
      tech.unloadAdUnit();
    }
    dom.removeClass(player.el(), 'vjs-vpaid-ad');
  }
};

VPAIDIntegrator.prototype._findSupportedTech = function (vastResponse, settings) {
  if (!(vastResponse instanceof VASTResponse)) {
    return null;
  }

  const vpaidMediaFiles = vastResponse.mediaFiles.filter(vastUtil.isVPAID);
  const preferredTech = settings && settings.preferredTech;
  const skippedSupportTechs = [];
  let i, len, mediaFile, VPAIDTech, isPreferedTech;

  for (i = 0, len = vpaidMediaFiles.length; i < len; i += 1) {
    mediaFile = vpaidMediaFiles[i];
    VPAIDTech = vastUtil.findSupportedVPAIDTech(mediaFile.type);

    // no supported VPAID tech found, skip mediafile
    //eslint-disable-next-line
    if (!VPAIDTech) { continue; }

    // do we have a prefered tech, does it play this media file ?
    isPreferedTech = preferredTech ?
      mediaFile.type === preferredTech || MimeTypes[preferredTech] && MimeTypes[preferredTech].indexOf(mediaFile.type) > -1 :
      false;

    // our prefered tech can read this mediafile, defaulting to it.
    if (isPreferedTech) {
      return new VPAIDTech(mediaFile, settings);
    }

    skippedSupportTechs.push({mediaFile: mediaFile, tech: VPAIDTech});
  }

  if (skippedSupportTechs.length) {
    const firstTech = skippedSupportTechs[0];

    return new firstTech.tech(firstTech.mediaFile, settings);
  }

  return null;
};

VPAIDIntegrator.prototype._createVPAIDAdUnitWrapper = function (adUnit, src, responseTimeout) {
  return new VPAIDAdUnitWrapper(adUnit, {src: src, responseTimeout: responseTimeout});
};

VPAIDIntegrator.prototype._loadAdUnit = function (tech, vastResponse, next) {
  const that = this;
  const player = this.player;
  const vjsTechEl = player.el().querySelector('.vjs-tech');
  const responseTimeout = this.settings.responseTimeout || this.options.responseTimeout;

  tech.loadAdUnit(this.containerEl, vjsTechEl, (error, adUnit) => {
    if (error) {
      return next(error, adUnit, vastResponse);
    }

    try {
      const WrappedAdUnit = that._createVPAIDAdUnitWrapper(adUnit, tech.mediaFile.src, responseTimeout);
      const techClass = 'vjs-' + tech.name + '-ad';

      dom.addClass(player.el(), techClass);
      player.one('vpaid.adEnd', () => {
        dom.removeClass(player.el(), techClass);
      });
      next(null, WrappedAdUnit, vastResponse);
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

VPAIDIntegrator.prototype._handshake = function handshake (adUnit, vastResponse, next) {
  adUnit.handshakeVersion(this.options.VPAID_VERSION, (error, version) => {
    if (error) {
      return next(error, adUnit, vastResponse);
    }

    if (version && isSupportedVersion(version)) {
      return next(null, adUnit, vastResponse);
    }

    return next(new VASTError('on VPAIDIntegrator._handshake, unsupported version "' + version + '"'), adUnit, vastResponse);
  });

  function isSupportedVersion (version) {
    const majorNum = major(version);

    return majorNum >= 1 && majorNum <= 2;
  }

  function major (version) {
    const parts = version.split('.');

    return parseInt(parts[0], 10);
  }
};

VPAIDIntegrator.prototype._initAd = function (adUnit, vastResponse, next) {
  const tech = this.player.el().querySelector('.vjs-tech');
  const dimension = dom.getDimension(tech);

  adUnit.initAd(dimension.width, dimension.height, this.VIEW_MODE.NORMAL, -1, {AdParameters: vastResponse.adParameters || ''}, (error) => {
    next(error, adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._createVASTTracker = function (adUnitSrc, vastResponse) {
  return new VASTTracker(adUnitSrc, vastResponse);
};

VPAIDIntegrator.prototype._setupEvents = function (adUnit, vastResponse, next) {
  const adUnitSrc = adUnit.options.src;
  const tracker = this._createVASTTracker(adUnitSrc, vastResponse);
  const player = this.player;
  const that = this;

  adUnit.on('AdSkipped', () => {
    player.trigger('vpaid.AdSkipped');
    tracker.trackSkip();
  });

  adUnit.on('AdImpression', () => {
    player.trigger('vpaid.AdImpression');
    tracker.trackImpressions();
  });

  adUnit.on('AdStarted', () => {
    player.trigger('vpaid.AdStarted');
    tracker.trackCreativeView();
    notifyPlayToPlayer();
  });

  adUnit.on('AdVideoStart', () => {
    player.trigger('vpaid.AdVideoStart');
    tracker.trackStart();
    notifyPlayToPlayer();
  });

  adUnit.on('AdPlaying', () => {
    player.trigger('vpaid.AdPlaying');
    tracker.trackResume();
    notifyPlayToPlayer();
  });

  adUnit.on('AdPaused', () => {
    player.trigger('vpaid.AdPaused');
    tracker.trackPause();
    notifyPauseToPlayer();
  });

  function notifyPlayToPlayer () {
    if (that._adUnit && that._adUnit.isPaused()) {
      that._adUnit._paused = false;
    }
    player.trigger('play');
  }

  function notifyPauseToPlayer () {
    if (that._adUnit) {
      that._adUnit._paused = true;
    }
    player.trigger('pause');
  }

  adUnit.on('AdVideoFirstQuartile', () => {
    player.trigger('vpaid.AdVideoFirstQuartile');
    tracker.trackFirstQuartile();
  });

  adUnit.on('AdVideoMidpoint', () => {
    player.trigger('vpaid.AdVideoMidpoint');
    tracker.trackMidpoint();
  });

  adUnit.on('AdVideoThirdQuartile', () => {
    player.trigger('vpaid.AdVideoThirdQuartile');
    tracker.trackThirdQuartile();
  });

  adUnit.on('AdVideoComplete', () => {
    player.trigger('vpaid.AdVideoComplete');
    tracker.trackComplete();
  });

  adUnit.on('AdClickThru', (data) => {
    player.trigger('vpaid.AdClickThru');
    const url = data.url;
    const playerHandles = data.playerHandles;
    const clickThruUrl = utilities.isNotEmptyString(url) ? url : generateClickThroughURL(vastResponse.clickThrough);

    tracker.trackClick();
    if (playerHandles && clickThruUrl) {
      window.open(clickThruUrl, '_blank');
    }

    function generateClickThroughURL (clickThroughMacro) {
      const variables = {
        ASSETURI: adUnit.options.src,
        CONTENTPLAYHEAD: 0 // In VPAID there is no method to know the current time from the adUnit
      };

      return clickThroughMacro ? vastUtil.parseURLMacro(clickThroughMacro, variables) : null;
    }
  });

  adUnit.on('AdUserAcceptInvitation', () => {
    player.trigger('vpaid.AdUserAcceptInvitation');
    tracker.trackAcceptInvitation();
    tracker.trackAcceptInvitationLinear();
  });

  adUnit.on('AdUserClose', () => {
    player.trigger('vpaid.AdUserClose');
    tracker.trackClose();
    tracker.trackCloseLinear();
  });

  adUnit.on('AdUserMinimize', () => {
    player.trigger('vpaid.AdUserMinimize');
    tracker.trackCollapse();
  });

  adUnit.on('AdError', () => {
    player.trigger('vpaid.AdError');

    // NOTE: we track errors code 901, as noted in VAST 3.0
    tracker.trackErrorWithCode(901);
  });

  adUnit.on('AdVolumeChange', () => {
    player.trigger('vpaid.AdVolumeChange');
    const lastVolume = player.volume();

    adUnit.getAdVolume((error, currentVolume) => {
      if (lastVolume !== currentVolume) {
        if (currentVolume === 0 && lastVolume > 0) {
          tracker.trackMute();
        }

        if (currentVolume > 0 && lastVolume === 0) {
          tracker.trackUnmute();
        }

        player.volume(currentVolume);
      }
    });
  });

  const updateViewSize = resizeAd.bind(this, player, adUnit, this.VIEW_MODE);
  const updateViewSizeThrottled = utilities.throttle(updateViewSize, 100);
  const autoResize = this.settings.autoResize;

  if (autoResize) {
    dom.addEventListener(window, 'resize', updateViewSizeThrottled);
    dom.addEventListener(window, 'orientationchange', updateViewSizeThrottled);
  }

  player.on('vast.resize', updateViewSize);
  player.on('vpaid.pauseAd', pauseAdUnit);
  player.on('vpaid.resumeAd', resumeAdUnit);

  player.one('vpaid.adEnd', () => {
    player.off('vast.resize', updateViewSize);
    player.off('vpaid.pauseAd', pauseAdUnit);
    player.off('vpaid.resumeAd', resumeAdUnit);

    if (autoResize) {
      dom.removeEventListener(window, 'resize', updateViewSizeThrottled);
      dom.removeEventListener(window, 'orientationchange', updateViewSizeThrottled);
    }
  });

  next(null, adUnit, vastResponse);

  /** * Local Functions ***/
  function pauseAdUnit () {
    adUnit.pauseAd(utilities.noop);
  }

  function resumeAdUnit () {
    adUnit.resumeAd(utilities.noop);
  }
};

VPAIDIntegrator.prototype._addSkipButton = function (adUnit, vastResponse, next) {
  let skipButton;
  const player = this.player;

  adUnit.on('AdSkippableStateChange', updateSkipButtonState);

  playerUtils.once(player, ['vast.adEnd', 'vast.adsCancel'], removeSkipButton);

  next(null, adUnit, vastResponse);

  /** * Local function ***/
  function updateSkipButtonState () {
    player.trigger('vpaid.AdSkippableStateChange');
    adUnit.getAdSkippableState((error, isSkippable) => {
      if (isSkippable) {
        if (!skipButton) {
          addSkipButton(player);
        }
      } else {
        removeSkipButton(player);
      }
    });
  }

  function addSkipButton (player) {
    skipButton = createSkipButton(player);
    player.el().appendChild(skipButton);
  }

  function removeSkipButton () {
    dom.remove(skipButton);
    skipButton = null;
  }

  function createSkipButton () {
    const skipButton = window.document.createElement('div');

    dom.addClass(skipButton, 'vast-skip-button');
    dom.addClass(skipButton, 'enabled');
    skipButton.innerHTML = 'Skip ad';

    skipButton.onclick = function (e) {
      adUnit.skipAd(utilities.noop);// We skip the adUnit

      // We prevent event propagation to avoid problems with the clickThrough and so on
      if (window.Event.prototype.stopPropagation === undefined) {
        return false;
      } else {
        e.stopPropagation();
      }
    };

    return skipButton;
  }
};

VPAIDIntegrator.prototype._linkPlayerControls = function (adUnit, vastResponse, next) {
  const that = this;

  linkVolumeControl(this.player, adUnit);
  linkFullScreenControl(this.player, adUnit, this.VIEW_MODE);

  next(null, adUnit, vastResponse);

  /** * Local functions ***/
  function linkVolumeControl (player, adUnit) {
    player.on('volumechange', updateAdUnitVolume);
    adUnit.on('AdVolumeChange', updatePlayerVolume);

    player.one('vpaid.adEnd', () => {
      player.off('volumechange', updateAdUnitVolume);
    });


    /** * local functions ***/
    function updateAdUnitVolume () {
      const vol = player.muted() ? 0 : player.volume();

      adUnit.setAdVolume(vol, logError);
    }

    function updatePlayerVolume () {
      player.trigger('vpaid.AdVolumeChange');
      const lastVolume = player.volume();

      adUnit.getAdVolume((error, vol) => {
        if (error) {
          logError(error);
        } else if (lastVolume !== vol) {
          player.volume(vol);
        }
      });
    }
  }

  function linkFullScreenControl (player, adUnit, VIEW_MODE) {
    const updateViewSize = resizeAd.bind(that, player, adUnit, VIEW_MODE);

    player.on('fullscreenchange', updateViewSize);

    player.one('vpaid.adEnd', () => {
      player.off('fullscreenchange', updateViewSize);
    });
  }
};

VPAIDIntegrator.prototype._startAd = function (adUnit, vastResponse, next) {
  const player = this.player;

  adUnit.startAd((error) => {
    if (!error) {
      player.trigger('vast.adStart');
    }
    next(error, adUnit, vastResponse);
  });
};

VPAIDIntegrator.prototype._finishPlaying = function (adUnit, vastResponse, next) {
  const player = this.player;

  adUnit.on('AdStopped', () => {
    player.trigger('vpaid.AdStopped');
    finishPlayingAd(null);
  });

  adUnit.on('AdError', (error) => {
    const errMsg = error ? error.message : 'on VPAIDIntegrator, error while waiting for the adUnit to finish playing';

    finishPlayingAd(new VASTError(errMsg));
  });

  /** * local functions ***/
  function finishPlayingAd (error) {
    next(error, adUnit, vastResponse);
  }
};

VPAIDIntegrator.prototype._trackError = function trackError (response, errorCode) {
  vastUtil.track(response.errorURLMacros, {ERRORCODE: errorCode || 901});
};

function resizeAd (player, adUnit, VIEW_MODE) {
  const tech = player.el().querySelector('.vjs-tech');
  const dimension = dom.getDimension(tech);
  const MODE = player.isFullscreen() ? VIEW_MODE.FULLSCREEN : VIEW_MODE.NORMAL;

  adUnit.resizeAd(dimension.width, dimension.height, MODE, logError);
}

function logError (error) {
  if (error) {
    logger.error('ERROR: ' + error.message, error);
  }
}

module.exports = VPAIDIntegrator;
