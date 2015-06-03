vjs.plugin('vastClient', function VASTPlugin(options) {
  var player = this;
  var vast = new VASTClient();

  var defaultOpts = {
    // maximum amount of time in ms to wait to receive `adsready` from the ad
    // implementation after play has been requested. Ad implementations are
    // expected to load any dynamic libraries and make any requests to determine
    // ad policies for a video during this time.
    timeout: 5000,

    // maximum amount of time in ms to wait for the ad implementation to start
    // linear ad mode after `readyforpreroll` has fired.
    // if this timeout triggers the player will start playing the video but it will
    // play the ad whenever is ready (i.e. the ads are not cancelled they are deferred).
    prerollTimeout: 500,

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

  if (isString(settings.url)) {
    settings.url = echoFn(settings.url);
  }

  if (!isDefined(settings.url)) {
    return trackAdError(new VASTError('on VideoJS VAST plugin, missing url on options object'));
  }

  player.ads(settings); // initialize the ad framework

  player.on('play', function () {
    if(player.ads.state === 'preroll?'){
      addSpinnerIcon();

      if (!player.paused()) {
        player.pause();
      }

      player.on('vast.adstart', removeSpinnerIcon);
      player.on('vast.aderror', removeSpinnerIcon);
    }

    /*** Local functions ***/
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
      }, 0);
    }
  });

  // request ads whenever there's new video content
  player.on('contentupdate', initAds);

  player.on('readyforpreroll', function () {
    async.waterfall([
      getVastResponse,
      playAd,
      finishPlayingAd
    ], function (error, response) {
      if (error) {
        trackAdError(error, response);
      }

      if (settings.playAdAlways) {
        // No matter what happens we play a new ad before the user sees the video again.
        player.one('ended', function () {
          player.trigger('contentupdate');
        });
      }
    });
  });

  // 'initAds' needs to be called after all the event listeners have been registered for the ads to play with 'autoplay'
  initAds();

  player.vast = {
    isEnabled: function () {
      return settings.adsEnabled;
    },

    enable: function () {
      settings.adsEnabled = true;
      initAds();
    },

    disable: function () {
      settings.adsEnabled = false;
      initAds();
    }
  };

  return player.vast;

  /**** Local functions ****/
  function initAds() {
    if (settings.adsEnabled) {
      player.trigger('adsready');
    } else {
      cancelAds();
    }
  }

  function cancelAds() {
    // We trigger 'adscanceled' to cancel the ads if they are in 'content-set' or 'ads-read?' state
    player.trigger('adscanceled');
    //We trigger 'adserror' to cancel the ads if they are in 'adsready' or 'preroll?' or 'ad-playback' state
    player.trigger('adserror');
  }

  function getVastResponse(callback) {
    vast.getVASTResponse(settings.url(), callback);
  }

  function playAd(vastResponse, callback) {
    var adIntegrator = isVPAID(vastResponse) ? new VPAIDIntegrator(player, options.adCancelTimeout) : new VASTIntegrator(player, options.adCancelTimeout);
    player.ads.startLinearAdMode();
    adIntegrator.playAd(vastResponse, callback);
    player.controlBar.addChild('AdsLabel');
  }

  function finishPlayingAd(vastResponse, callback) {
    player.ads.endLinearAdMode();
    player.controlBar.removeChild('AdsLabel');
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
