var iPhone = (function (userAgent) {
  return /(iPhone|iPod)/.test(userAgent);
})(navigator.userAgent);

vjs.plugin('vastClient', function VASTPlugin(options) {
  var player = this;
  var vast = new VASTClient();
  var adsCanceled = false;
  var volumeSnapshot;
  var defaultOpts = {
    // maximum amount of time in ms to wait to receive `adsready` from the ad
    // implementation after play has been requested. Ad implementations are
    // expected to load any dynamic libraries and make any requests to determine
    // ad policies for a video during this time.
    timeout: 500,

    // for the moment we don't support post roll ads
    postrollTimeout: 0,

    //TODO:finish this IOS FIX
    //Whenever you play an add on IOS, the native player kicks in and we loose control of it. On very heavy pages the 'play' event
    // May occur after the video content has already started. This is wrong if you want to play a preroll ad that needs to happen before the user
    // starts watching the content. To prevent this usec
    iosPrerollCancelTimeout: 2000,

    // maximun amount of time for the ad to actually start playing. If this timeout gets
    // triggered the ads will be cancelled
    adCancelTimeout: 3000,

    // Boolean flag that configures the player to play a new ad before the user sees the video again
    // the current video
    playAdAlways: false,

    // Flag to enable or disable the ads by default.
    adsEnabled: true
  };

  var settings = extend({}, defaultOpts, options || {});

  if(!settings.prerollTimeout) {
    settings.prerollTimeout = settings.adCancelTimeout;
  }

  if (isString(settings.url)) {
    settings.url = echoFn(settings.url);
  }

  if (!isDefined(settings.url)) {
    return trackAdError(new VASTError('on VideoJS VAST plugin, missing url on options object'));
  }

  /*
   What I am doing below is ugly and horrible and I should think twice before calling myself a good developer. With that said,
   it is the best solution I could find to mute the video until the 'play' event happens and the plugin can decide whether
   to play the ad or not.

   If you have a better solution please do tell me.
   */
  var origPlay = player.play;
  player.play = function () {
    if (isFirstPlay() && !iPhone) {
      volumeSnapshot = saveVolumeSnapshot();
      player.muted(true);
    }
    return origPlay.apply(this, arguments);
  };

  player.addChild('blackPoster');


  player.on('play', playAdHandler);
  player.on('readyforpreroll', playPrerollAd);

  if (settings.playAdAlways) {
    // No matter what happens we play a new ad before the user sees the video again.
    player.on('ended', function () {
      setTimeout(function () {
        player.trigger('contentupdate');
      }, 0);
    });
  }

  // initialize videojs contrib ads plugin
  player.ads(settings);

  player.vast = {
    isEnabled: function () {
      return settings.adsEnabled;
    },

    enable: function () {
      settings.adsEnabled = true;
    },

    disable: function () {
      settings.adsEnabled = false;
    }
  };

  return player.vast;

  /**** Local functions ****/
  function isFirstPlay(){
    return !dom.hasClass(player.el(), 'vjs-vast-finish') && (player.ads.state === 'content-set' || player.ads.state === 'ads-ready?');
  }

  function saveVolumeSnapshot(){
    return {
      muted: player.muted(),
      volume: player.volume()
    };
  }

  function restoreVolumeSnapshot(snapshot){
    if(isObject(snapshot)){
      player.volume(snapshot.volume);
      player.muted(snapshot.muted);
    }
  }

  function playAdHandler() {
    if(isFirstPlay()){
      if(!iPhone){
        player.currentTime(0);
        restoreVolumeSnapshot(volumeSnapshot);
      }

      player.on('vast.adstart', markVastAsFinished);
      player.on('vast.aderror', markVastAsFinished);
      player.on('adscanceled', markVastAsFinished);

      player.one('ended', function () {
        dom.removeClass(player.el(), 'vjs-vast-finish');
        volumeSnapshot = saveVolumeSnapshot();
      });
    }

    if(settings.adsEnabled){
      if (player.ads.state === 'content-set' || player.ads.state === 'ads-ready?') {
        if(canPlayPrerollAd()){
          initAds();
        }else{
          trackAdError(new VASTError('video content has been playing before preroll ad'));
        }
      }
    }else{
      cancelAds();
    }

    /*** Local functions ***/
    function markVastAsFinished(){
      dom.addClass(player.el(), 'vjs-vast-finish');

      player.off('vast.adstart', markVastAsFinished);
      player.off('vast.aderror', markVastAsFinished);
      player.off('adscanceled', markVastAsFinished);
    }

    function canPlayPrerollAd(){
      return !iPhone || player.currentTime() <= settings.iosPrerollCancelTimeout;
    }

    function initAds() {
      var adCancelTimeoutId;
      adsCanceled = false;

      if(!player.paused()){
        player.pause();
      }

      player.trigger('adsready');
      addSpinnerIcon();
      player.on('vast.adstart', removeSpinnerIcon);
      player.on('vast.aderror', removeSpinnerIcon);

      adCancelTimeoutId = setTimeout(function () {
        trackAdError(new VASTError('timeout while waiting for the video to start playing', 402));
      }, settings.adCancelTimeout);

      player.one('vast.adstart', clearAdCancelTimeout);
      player.one('vast.aderror', clearAdCancelTimeout);

      /*** local functions ***/
      function clearAdCancelTimeout(){
        if(adCancelTimeoutId) {
          clearTimeout(adCancelTimeoutId);
          adCancelTimeoutId = null;
          player.off('vast.adstart', clearAdCancelTimeout);
          player.off('vast.aderror', clearAdCancelTimeout);
        }
      }
    }

    function addSpinnerIcon() {
      dom.addClass(player.el(), 'vjs-vast-ad-loading');
    }

    function removeSpinnerIcon() {
      //IMPORTANT NOTE: We remove the spinnerIcon asynchronously to give time to the browser to start the video.
      // If we remove it synchronously we see a flash of the content video before the ad starts playing.
      setTimeout(function() {
        dom.removeClass(player.el(), 'vjs-vast-ad-loading');
        player.off('vast.adstart', removeSpinnerIcon);
        player.off('vast.aderror', removeSpinnerIcon);
      }, 100);
    }

  }

  function cancelAds() {
    // We trigger 'adscanceled' to cancel the ads if they are in 'content-set' or 'ads-read?' state
    player.trigger('adscanceled');
    //We trigger 'adserror' to cancel the ads if they are in 'adsready' or 'preroll?' or 'ad-playback' state
    player.trigger('adserror');
    adsCanceled = true;
  }

  function playPrerollAd() {
    async.waterfall([
      getVastResponse,
      playAd,
      finishPlayingAd
    ], function (error, response) {
      if (error) {
        trackAdError(error, response);
      }
    });
  }

  function getVastResponse(callback) {
    vast.getVASTResponse(settings.url(), callback);
  }

  function playAd(vastResponse, callback) {
    //TODO: Find a better way to stop the play. The 'playPrerollWaterfall' ends in an inconsistent situation
    //If the state is not 'preroll?' it means the ads were canceled therefore, we break the waterfall
    if(adsCanceled){
      return;
    }

    var adIntegrator = isVPAID(vastResponse) ? new VPAIDIntegrator(player) : new VASTIntegrator(player);
    var adFinished = false;

    player.ads.startLinearAdMode();
    adIntegrator.playAd(vastResponse, callback);
    player.one('vast.adstart', adAdsLabel);
    player.one('adend', removeAdsLabel);
    player.one('adserror', removeAdsLabel);
    player.one('vast.aderror', removeAdsLabel);

    if(isIDevice()) {
      preventManualProgress();
    }

    /*** Local functions ****/

    function adAdsLabel(){
      if(adFinished) {
        return;
      }
      player.controlBar.addChild('AdsLabel');
    }

    function removeAdsLabel() {
      if(adFinished) {
        return;
      }
      player.controlBar.removeChild('AdsLabel');
      adFinished = true;
    }

    function preventManualProgress(){
      var PROGRESS_THRESHOLD = 1;
      var previousTime = player.currentTime();
      var tech = player.el().querySelector('.vjs-tech');
      var skipad_attempts = 0;

      player.on('adtimeupdate', adTimeupdateHandler);
      player.one('adended', function () {
        player.off('adtimeupdate', adTimeupdateHandler);
      });

      /*** Local functions ***/
      function adTimeupdateHandler() {
        var currentTime = player.currentTime();
        var progressDelta = Math.abs(currentTime - previousTime);

        if (progressDelta > PROGRESS_THRESHOLD) {
          skipad_attempts+=1;
          if(skipad_attempts >= 2){
            player.pause();
          }
          player.currentTime(previousTime);
        } else {
          previousTime = currentTime;
        }
      }
    }
  }

  function finishPlayingAd(vastResponse, callback) {
    player.ads.endLinearAdMode();
    callback(null, vastResponse);
  }

  function trackAdError(error, vastResponse) {
    player.trigger({type: 'vast.aderror', error: error});
    cancelAds();
    if (console && console.log) {
      console.log('AD ERROR:', error.message, error, vastResponse);
    }
  }

  function isVPAID(vastResponse) {
    var i, len;
    var mediaFiles = vastResponse.mediaFiles;
    for (i = 0, len = mediaFiles.length; i < len; i++) {
      if (vastUtil.isVPAID(mediaFiles[i])) {
        return true;
      }
    }
    return false;
  }
});
