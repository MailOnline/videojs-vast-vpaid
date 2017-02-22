const async = require('../../utils/async');
const dom = require('../../utils/dom');
const playerUtils = require('../../utils/playerUtils');
const utilities = require('../../utils/utilityFunctions');
const logger = require('../../utils/consoleLogger');
const VASTResponse = require('./VASTResponse');
const VASTError = require('./VASTError');
const VASTTracker = require('./VASTTracker');
const vastUtil = require('./vastUtil');

function VASTIntegrator (player) {
  if (!(this instanceof VASTIntegrator)) {
    return new VASTIntegrator(player);
  }

  this.player = player;
}

VASTIntegrator.prototype.playAd = function playAd (vastResponse, callback) {
  const that = this;

  callback = callback || utilities.noop;

  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('On VASTIntegrator, missing required VASTResponse'));
  }

  async.waterfall([
    function (next) {
      next(null, vastResponse);
    },
    this._selectAdSource.bind(this),
    this._createVASTTracker.bind(this),
    this._addClickThrough.bind(this),
    this._addSkipButton.bind(this),
    this._setupEvents.bind(this),
    this._playSelectedAd.bind(this)
  ], (error, response) => {
    if (error && response) {
      that._trackError(error, response);
    }
    callback(error, response);
  });

  this._adUnit = {
    _src: null,
    type: 'VAST',
    pauseAd: function () {
      that.player.pause(true);
    },

    resumeAd: function () {
      that.player.play(true);
    },

    isPaused: function () {
      return that.player.paused(true);
    },

    getSrc: function () {
      return this._src;
    }
  };

  return this._adUnit;
};

VASTIntegrator.prototype._selectAdSource = function selectAdSource (response, callback) {
  let source;

  const playerWidth = dom.getDimension(this.player.el()).width;
  const mediaFiles = response.mediaFiles.filter((mediaFile) => mediaFile.isSupported());

  mediaFiles.sort((a, b) => {
    const deltaA = Math.abs(playerWidth - a.width);
    const deltaB = Math.abs(playerWidth - b.width);

    return deltaA - deltaB;
  });

  source = this.player.selectSource(mediaFiles).source;

  if (source) {
    logger.info('selected source: ', source);
    if (this._adUnit) {
      this._adUnit._src = source;
    }

    return callback(null, source, response);
  }

  // code 403 <== Couldn't find MediaFile that is supported by this video player
  callback(new VASTError('Could not find Ad mediafile supported by this player', 403), response);
};

VASTIntegrator.prototype._createVASTTracker = function createVASTTracker (adMediaFile, response, callback) {
  try {
    callback(null, adMediaFile, new VASTTracker(adMediaFile.src, response), response);
  } catch (e) {
    callback(e, response);
  }
};

VASTIntegrator.prototype._setupEvents = function setupEvents (adMediaFile, tracker, response, callback) {
  let previouslyMuted;
  const player = this.player;

  player.on('fullscreenchange', trackFullscreenChange);
  player.on('vast.adStart', trackImpressions);
  player.on('pause', trackPause);
  player.on('timeupdate', trackProgress);
  player.on('volumechange', trackVolumeChange);

  playerUtils.once(player, ['vast.adEnd', 'vast.adsCancel'], unbindEvents);
  playerUtils.once(player, ['vast.adEnd', 'vast.adsCancel', 'vast.adSkip'], (evt) => {
    if (evt.type === 'vast.adEnd') {
      tracker.trackComplete();
    }
  });

  return callback(null, adMediaFile, response);

  /** * Local Functions ***/
  function unbindEvents () {
    player.off('fullscreenchange', trackFullscreenChange);
    player.off('vast.adStart', trackImpressions);
    player.off('pause', trackPause);
    player.off('timeupdate', trackProgress);
    player.off('volumechange', trackVolumeChange);
  }

  function trackFullscreenChange () {
    if (player.isFullscreen()) {
      tracker.trackFullscreen();
    } else {
      tracker.trackExitFullscreen();
    }
  }

  function trackPause () {
    // NOTE: whenever a video ends the video Element triggers a 'pause' event before the 'ended' event.
    //      We should not track this pause event because it makes the VAST tracking confusing again we use a
    //      Threshold of 2 seconds to prevent false positives on IOS.
    if (Math.abs(player.duration() - player.currentTime()) < 2) {
      return;
    }

    tracker.trackPause();
    playerUtils.once(player, ['play', 'vast.adEnd', 'vast.adsCancel'], (evt) => {
      if (evt.type === 'play') {
        tracker.trackResume();
      }
    });
  }

  function trackProgress () {
    const currentTimeInMs = player.currentTime() * 1000;

    tracker.trackProgress(currentTimeInMs);
  }

  function trackImpressions () {
    tracker.trackImpressions();
    tracker.trackCreativeView();
  }

  function trackVolumeChange () {
    const muted = player.muted();

    if (muted) {
      tracker.trackMute();
    } else if (previouslyMuted) {
      tracker.trackUnmute();
    }
    previouslyMuted = muted;
  }
};

VASTIntegrator.prototype._addSkipButton = function addSkipButton (source, tracker, response, callback) {
  let skipOffsetInSec;
  const that = this;

  if (utilities.isNumber(response.skipoffset)) {
    skipOffsetInSec = response.skipoffset / 1000;
    addSkipButtonToPlayer(this.player, skipOffsetInSec);
  }
  callback(null, source, tracker, response);

  /** * Local function ***/
  function addSkipButtonToPlayer (player, skipOffset) {
    const skipButton = createSkipButton(player);
    const updateSkipButton = updateSkipButtonState.bind(that, skipButton, skipOffset, player);

    player.el().appendChild(skipButton);
    player.on('timeupdate', updateSkipButton);

    playerUtils.once(player, ['vast.adEnd', 'vast.adsCancel'], removeSkipButton);

    function removeSkipButton () {
      player.off('timeupdate', updateSkipButton);
      dom.remove(skipButton);
    }
  }

  function createSkipButton (player) {
    const skipButton = window.document.createElement('div');

    dom.addClass(skipButton, 'vast-skip-button');

    skipButton.onclick = function (e) {
      if (dom.hasClass(skipButton, 'enabled')) {
        tracker.trackSkip();
        player.trigger('vast.adSkip');
      }

      // We prevent event propagation to avoid problems with the clickThrough and so on
      if (window.Event.prototype.stopPropagation === undefined) {
        return false;
      } else {
        e.stopPropagation();
      }
    };

    return skipButton;
  }

  function updateSkipButtonState (skipButton, skipOffset, player) {
    const timeLeft = Math.ceil(skipOffset - player.currentTime());

    if (timeLeft > 0) {
      skipButton.innerHTML = 'Skip in ' + utilities.toFixedDigits(timeLeft, 2) + '...';
    // eslint-disable-next-line
    } else if (!dom.hasClass(skipButton, 'enabled')) {
      dom.addClass(skipButton, 'enabled');
      skipButton.innerHTML = 'Skip ad';
    }
  }
};

VASTIntegrator.prototype._addClickThrough = function addClickThrough (mediaFile, tracker, response, callback) {
  const player = this.player;
  const blocker = createClickThroughBlocker(player, tracker, response);
  const updateBlocker = updateBlockerURL.bind(this, blocker, response, player);

  player.el().insertBefore(blocker, player.controlBar.el());
  player.on('timeupdate', updateBlocker);
  playerUtils.once(player, ['vast.adEnd', 'vast.adsCancel'], removeBlocker);

  return callback(null, mediaFile, tracker, response);

  /** * Local Functions ***/

  function createClickThroughBlocker (player, tracker, response) {
    const blocker = window.document.createElement('a');
    const clickThroughMacro = response.clickThrough;

    dom.addClass(blocker, 'vast-blocker');
    blocker.href = generateClickThroughURL(clickThroughMacro, player);

    if (utilities.isString(clickThroughMacro)) {
      blocker.target = '_blank';
    }

    blocker.onclick = function (e) {
      if (player.paused()) {
        player.play();

        // We prevent event propagation to avoid problems with the player's normal pause mechanism
        if (window.Event.prototype.stopPropagation !== undefined) {
          e.stopPropagation();
        }

        return false;
      }

      player.pause();
      tracker.trackClick();
    };

    return blocker;
  }

  function updateBlockerURL (blocker, response, player) {
    blocker.href = generateClickThroughURL(response.clickThrough, player);
  }

  function generateClickThroughURL (clickThroughMacro, player) {
    const variables = {
      ASSETURI: mediaFile.src,
      CONTENTPLAYHEAD: vastUtil.formatProgress(player.currentTime() * 1000)
    };

    return clickThroughMacro ? vastUtil.parseURLMacro(clickThroughMacro, variables) : '#';
  }

  function removeBlocker () {
    player.off('timeupdate', updateBlocker);
    dom.remove(blocker);
  }
};

VASTIntegrator.prototype._playSelectedAd = function playSelectedAd (source, response, callback) {
  const player = this.player;

  player.preload('auto'); // without preload=auto the durationchange event is never fired
  player.src(source);

  logger.debug('<VASTIntegrator._playSelectedAd> waiting for durationchange to play the ad...');

  playerUtils.once(player, ['durationchange', 'error', 'vast.adsCancel'], (evt) => {
    if (evt.type === 'durationchange') {
      logger.debug('<VASTIntegrator._playSelectedAd> got durationchange; calling playAd()');
      playAd();
    } else if (evt.type === 'error') {
      callback(new VASTError('on VASTIntegrator, Player is unable to play the Ad', 400), response);
    }

    // NOTE: If the ads get canceled we do nothing/
  });

  /** ** local functions ******/
  function playAd () {
    playerUtils.once(player, ['playing', 'vast.adsCancel'], (evt) => {
      if (evt.type === 'vast.adsCancel') {
        return;
      }

      logger.debug('<VASTIntegrator._playSelectedAd/playAd> got playing event; triggering vast.adStart...');

      player.trigger('vast.adStart');

      player.on('ended', proceed);
      player.on('vast.adsCancel', proceed);
      player.on('vast.adSkip', proceed);

      function proceed (evt) {
        if (evt.type === 'ended' && player.duration() - player.currentTime() > 3) {
          // Ignore ended event if the Ad time was not 'near' the end
          // avoids issues where IOS controls could skip the Ad
          return;
        }

        player.off('ended', proceed);
        player.off('vast.adsCancel', proceed);
        player.off('vast.adSkip', proceed);

        // NOTE: if the ads get cancel we do nothing apart removing the listners
        if (evt.type === 'ended' || evt.type === 'vast.adSkip') {
          callback(null, response);
        }
      }
    });

    logger.debug('<VASTIntegrator._playSelectedAd/playAd> calling player.play()...');

    player.play();
  }
};

VASTIntegrator.prototype._trackError = function trackError (error, response) {
  vastUtil.track(response.errorURLMacros, {ERRORCODE: error.code || 900});
};

module.exports = VASTIntegrator;
