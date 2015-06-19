/**
 * Inner helper class that deals with the logic of the individual steps needed to setup an ad in the player.
 *
 * @param player {object} instance of the player that will play the ad. It assumes that the videojs-contrib-ads plugin
 *                        has been initialized when you use its utility functions.
 * @param adStartTimeout Indicates in ms. how much time to wait for the ad to start playing before canceling the ad.
 *
 * @constructor
 */
function VASTIntegrator(player, adStartTimeout) {
  if (!(this instanceof VASTIntegrator)) {
    return new VASTIntegrator(player, adStartTimeout);
  }

  this.player = player;
  this.adStartTimeout = adStartTimeout || 5000;
}

VASTIntegrator.prototype.playAd = function playAd(vastResponse, callback) {
  var that = this;
  callback = callback || noop;

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
  ], function (error, response) {
    if (error && response) {
      that._trackError(error, response);
    }
    callback(error, response);
  });
};

VASTIntegrator.prototype._selectAdSource = function selectAdSource(response, callback) {
  var source = this.player.selectSource(response.mediaFiles).source;
  if (source) {
    return callback(null, source, response);
  }

  // code 403 <== Couldn't find MediaFile that is supported by this video player
  callback(new VASTError("Could not find Ad mediafile supported by this player", 403), response);
};

VASTIntegrator.prototype._createVASTTracker = function createVASTTracker(adMediaFile, response, callback) {
  try {
    callback(null, adMediaFile, new VASTTracker(adMediaFile.src, response), response);
  } catch (e) {
    callback(e, response);
  }
};

VASTIntegrator.prototype._setupEvents = function setupEvents(adMediaFile, tracker, response, callback) {
  var previouslyMuted;
  var player = this.player;
  player.on('adfullscreenchange', trackFullscreenChange);
  player.on('vast.adstart', trackImpressions);
  player.on('adpause', trackPause);
  player.on('adtimeupdate', trackProgress);
  player.on('advolumechange', trackVolumeChange);

  player.one('vast.adend', function () {
    tracker.trackComplete();
    player.off('adfullscreenchange', trackFullscreenChange);
    player.off('vast.adstart', trackImpressions);
    player.off('adpause', trackPause);
    player.off('adtimeupdate', trackProgress);
    player.off('advolumechange', trackVolumeChange);
  });

  //NOTE: Pending tracking events skip, close, closeLinear, expand, collapse and creativeView. See VAST implementation

  return callback(null, adMediaFile, response);

  /*** Local Functions ***/

  function trackFullscreenChange() {
    if (player.isFullscreen()) {
      tracker.trackFullscreen();
    } else {
      tracker.trackExitFullscreen();
    }
  }

  function trackPause() {
    tracker.trackPause();
    player.one('play', function () {
      tracker.trackResume();
    });
  }

  function trackProgress() {
    var currentTimeInMs = player.currentTime() * 1000;
    tracker.trackProgress(currentTimeInMs);
  }

  function trackImpressions() {
    tracker.trackImpressions();
  }

  function trackVolumeChange() {
    var muted = player.muted();
    if (muted) {
      tracker.trackMute();
    } else if (previouslyMuted) {
      tracker.trackUnmute();
    }
    previouslyMuted = muted;
  }
};

VASTIntegrator.prototype._addSkipButton = function addSkipButton(source, tracker, response, callback) {
  var skipOffsetInSec;

  if (isNumber(response.skipoffset)) {
    skipOffsetInSec = response.skipoffset / 1000;
    addSkipButtonToPlayer(this.player, skipOffsetInSec);
  }
  callback(null, source, tracker, response);

  /*** Local function ***/
  function addSkipButtonToPlayer(player, skipOffset) {
    var skipButton = createSkipButton(player);
    var updateSkipButton = updateSkipButtonState.bind(this, skipButton, skipOffset, player);

    player.el().appendChild(skipButton);
    player.on('adtimeupdate', updateSkipButton);

    player.one('vast.adend', removeSkipButton);
    player.one('vast.aderror', removeSkipButton);

    function removeSkipButton() {
      player.off('adtimeupdate', updateSkipButton);
      dom.remove(skipButton);
    }
  }

  function createSkipButton(player) {
    var skipButton = window.document.createElement("div");
    dom.addClass(skipButton, "vast-skip-button");

    skipButton.onclick = function (e) {
      if (dom.hasClass(skipButton, 'enabled')) {
        tracker.trackSkip();
        player.trigger('adended');//We trigger the end of the ad playing
      }

      //We prevent event propagation to avoid problems with the clickThrough and so on
      if (window.Event.prototype.stopPropagation !== undefined) {
        e.stopPropagation();
      } else {
        return false;
      }
    };

    return skipButton;
  }

  function updateSkipButtonState(skipButton, skipOffset, player) {
    var timeLeft = Math.ceil(skipOffset - player.currentTime());
    if (timeLeft > 0) {
      skipButton.innerHTML = "Skip in " + toFixedDigits(timeLeft, 2) + "...";
    } else {
      if (!dom.hasClass(skipButton, 'enabled')) {
        dom.addClass(skipButton, 'enabled');
        skipButton.innerHTML = "Skip ad";
      }
    }
  }
};

VASTIntegrator.prototype._addClickThrough = function addClickThrough(mediaFile, tracker, response, callback) {
  var player = this.player;
  var blocker = createClickThroughBlocker(player, tracker, response);
  var updateBlocker = updateBlockerURL.bind(this, blocker, response, player);

  player.el().insertBefore(blocker, player.controlBar.el());
  player.on('adtimeupdate', updateBlocker);
  player.one('vast.adend', removeBlocker);
  player.one('vast.aderror', removeBlocker);

  return callback(null, mediaFile, tracker, response);

  /*** Local Functions ***/

  function createClickThroughBlocker(player, tracker, response) {
    var blocker = window.document.createElement("a");
    var clickThroughMacro = response.clickThrough;

    dom.addClass(blocker, 'vast-blocker');
    blocker.href = generateClickThroughURL(clickThroughMacro, player);

    if (isString(clickThroughMacro)) {
      blocker.target = "_blank";
    }

    blocker.onclick = function (e) {
      if (player.paused()) {
        player.play();

        //We prevent event propagation to avoid problems with the player's normal pause mechanism
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

  function updateBlockerURL(blocker, response, player) {
    blocker.href = generateClickThroughURL(response.clickThrough, player);
  }

  function generateClickThroughURL(clickThroughMacro, player) {
    var variables = {
      ASSETURI: mediaFile.src,
      CONTENTPLAYHEAD: vastUtil.formatProgress(player.currentTime() * 1000)
    };

    return clickThroughMacro ? vastUtil.parseURLMacro(clickThroughMacro, variables) : '#';
  }

   function removeBlocker(){
     player.off('adtimeupdate', updateBlocker);
     dom.remove(blocker);
   }
};

VASTIntegrator.prototype._playSelectedAd = function playSelectedAd(source, response, callback) {
  var player = this.player;
  var adStartTimeoutID;

  player.src(source);

  adStartTimeoutID = setTimeout(function () {
    player.off('addurationchange', playAd);
    player.off('adended', finishPlayingAd);
    player.off('error', handlePlayerError);
    callback(new VASTError("on VASTIntegrator, timeout while waiting for the video to start playing", 402), response);
  }, this.adStartTimeout);

  player.one('addurationchange', playAd);
  player.one('adended', finishPlayingAd);
  player.one('error', handlePlayerError);

  /**** local functions ******/
  function playAd() {
    if (isDefined(adStartTimeoutID)) {
      window.clearTimeout(adStartTimeoutID);
    }
    player.one('adplaying', function () {
      player.trigger('vast.adstart');
    });
  }

  function finishPlayingAd() {
    player.off('error', handlePlayerError);
    player.trigger('vast.adend');
    callback(null, response);
  }

  function handlePlayerError() {
    player.off('addurationchange', playAd);
    player.off('contentended', finishPlayingAd);
    callback(new VASTError("on VASTIntegrator, Player is unable to play the Ad ", 400), response);
  }
};

VASTIntegrator.prototype._trackError = function trackError(error, response) {
  vastUtil.track(response.errorURLMacros, {ERRORCODE: error.code || 900});
};
