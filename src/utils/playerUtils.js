var playerUtils = {};

/**
 * Returns an object that captures the portions of player state relevant to
 * video playback. The result of this function can be passed to
 * restorePlayerSnapshot with a player to return the player to the state it
 * was in when this function was invoked.
 * @param {object} player The videojs player object
 */
playerUtils.getPlayerSnapshot = function getPlayerSnapshot(player) {
  var tech = player.el().querySelector('.vjs-tech');
  var snapshot = {
    ended: player.ended(),
    src: player.currentSrc(),
    currentTime: player.currentTime(),
    type: player.currentType(),
    playing: !player.paused(),
    suppressedTracks: getSuppressedTracks(player)
  };

  if (tech) {
    snapshot.nativePoster = tech.poster;
    snapshot.style = tech.getAttribute('style');
  }

  return snapshot;

  /**** Local Functions ****/
  function getSuppressedTracks(player) {
    var tracks = player.remoteTextTracks ? player.remoteTextTracks() : [];

    if (tracks && isArray(tracks.tracks_)) {
      tracks = tracks.tracks_;
    }

    if (!isArray(tracks)) {
      tracks = [];
    }

    var suppressedTracks = [];
    tracks.forEach(function (track) {
      suppressedTracks.push({
        track: track,
        mode: track.mode
      });
      track.mode = 'disabled';
    });

    return suppressedTracks;
  }
};

/**
 * Attempts to modify the specified player so that its state is equivalent to
 * the state of the snapshot.
 * @param {object} snapshot - the player state to apply
 */
playerUtils.restorePlayerSnapshot = function restorePlayerSnapshot(player, snapshot) {
  var tech = player.el().querySelector('.vjs-tech');
  var attempts = 20; // the number of remaining attempts to restore the snapshot

  if (snapshot.nativePoster) {
    tech.poster = snapshot.nativePoster;
  }

  if ('style' in snapshot) {
    // overwrite all css style properties to restore state precisely
    tech.setAttribute('style', snapshot.style || '');
  }

  if (hasSrcChanged(player, snapshot)) {
    // on ios7, fiddling with textTracks too early will cause safari to crash
    player.one('contentloadedmetadata', restoreTracks);

    // if the src changed for ad playback, reset it
    player.src({src: snapshot.src, type: snapshot.type});

    // safari requires a call to `load` to pick up a changed source
    player.load();

    // and then resume from the snapshots time once the original src has loaded
    player.one('canplay', tryToResume);

  } else {
    restoreTracks();

    if (snapshot.playing) {
      player.play();
    }
  }

  /*** Local Functions ***/

  /**
   * Determine whether the player needs to be restored to its state
   * before ad playback began. With a custom ad display or burned-in
   * ads, the content player state hasn't been modified and so no
   * restoration is required
   */
  function hasSrcChanged(player, snapshot) {
    if (player.src()) {
      return player.src() !== snapshot.src;
    }
    // the player was configured through source element children
    return player.currentSrc() !== snapshot.src;
  }

  function restoreTracks() {
    var suppressedTracks = snapshot.suppressedTracks;
    suppressedTracks.forEach(function (trackSnapshot) {
      trackSnapshot.track.mode = trackSnapshot.mode;
    });
  }

  /**
   * Determine if the video element has loaded enough of the snapshot source
   * to be ready to apply the rest of the state
   */
  function tryToResume() {
    if (playerUtils.isReadyToResume(tech)) {
      // if some period of the video is seekable, resume playback
      return resume();
    }

    // delay a bit and then check again unless we're out of attempts
    if (attempts--) {
      setTimeout(tryToResume, 50);
    } else {
      (function () {
        try {
          resume();
        } catch (e) {
          videojs.log.warn('Failed to resume the content after an advertisement', e);
        }
      })();
    }


    /*** Local functions ***/
    function resume() {
      player.currentTime(snapshot.currentTime);

      if (snapshot.playing) {
        player.play();
      }
    }

  }
};

playerUtils.isReadyToResume = function (tech) {
  if (tech.readyState > 1) {
    // some browsers and media aren't "seekable".
    // readyState greater than 1 allows for seeking without exceptions
    return true;
  }

  if (tech.seekable === undefined) {
    // if the tech doesn't expose the seekable time ranges, try to
    // resume playback immediately
    return true;
  }

  if (tech.seekable.length > 0) {
    // if some period of the video is seekable, resume playback
    return true;
  }

  return false;
};

//TODO: SHOULDN'T WE USE isIDevice utility function??
/**
 * Returns true if the player is in an iphone
 */
playerUtils.isIPhone = (function () {
  var iPhone = /(iPhone|iPod)/.test(navigator.userAgent);
  return echoFn(iPhone);
})();

/**
 * This function prepares the player to display ads.
 * Adding convenience events like the 'vast.firsPlay' that gets fired when the video is first played
 * and ads the blackPoster to the player to prevent content from being displayed before the preroll ad.
 *
 * @param player
 */
playerUtils.prepareForAds = function (player) {
  var blackPoster = player.addChild('blackPoster');
  var firstPlay = true;
  var volumeSnapshot;

  /*
   What I am doing below is ugly and horrible and I should think twice before calling myself a good developer. With that said,
   it is the best solution I could find to mute the video until the 'play' event happens and the plugin can decide whether
   to play the ad or not.

   If you have a better solution please do tell me.
   */
  var origPlay = player.play;
  player.play = function () {
    if (isFirstPlay()) {
      if (!playerUtils.isIPhone()) {
        volumeSnapshot = saveVolumeSnapshot();
        player.muted(true);
      }
    }
    return origPlay.apply(this, arguments);
  };


  player.on('play', tryToTriggerFirstPlay);
  player.on('loadStart', resetFirstPlay);//Every time we change the sources we reset the first play.
  player.on('vast.reset', resetFirstPlay);//Every time we change the sources we reset the first play.
  player.on('vast.firstPlay', restorePlayerToFirstPlay);
  player.on('vast.adStart', hideBlackPoster);
  player.on('vast.adsCancel', hideBlackPoster);
  player.on('vast.adEnd', triggerContentEvents);
  player.on('vast.adsCancel', triggerContentEvents);
  player.on('vast.adStart', addStyles);
  player.on('vast.adEnd', removeStyles);
  player.on('vast.adsCancel', removeStyles);

  /*** Local Functions ***/
  function tryToTriggerFirstPlay() {
    if (isFirstPlay()) {
      firstPlay = false;
      player.trigger('vast.firstPlay');

    }
  }

  function resetFirstPlay() {
    firstPlay = true;
    blackPoster.show();
  }

  function isFirstPlay() {
    return firstPlay;
  }

  function saveVolumeSnapshot() {
    return {
      muted: player.muted(),
      volume: player.volume()
    };
  }

  function restorePlayerToFirstPlay(){
    if(!playerUtils.isIPhone()){
      player.currentTime(0);
      restoreVolumeSnapshot(volumeSnapshot);
    }
  }

  function restoreVolumeSnapshot(snapshot) {
    if (isObject(snapshot)) {
      player.volume(snapshot.volume);
      player.muted(snapshot.muted);
    }
  }

  function hideBlackPoster(){
    if(!dom.hasClass(blackPoster.el(), 'vjs-hidden')){
      blackPoster.hide();
    }
  }

  function triggerContentEvents(){
    player.one('play', function(){
      player.trigger('vast.contentStart');

      player.one('ended', function() {
        player.trigger('vast.contentEnd');
      });
    });
  }

  function addStyles(){
    dom.addClass(player.el(), 'vjs-ad-playing');
  }

  function removeStyles(){
    dom.removeClass(player.el(), 'vjs-ad-playing');
  }
};
