vjs.plugin('vastClient', function VASTPlugin(options) {
  var player = this;
  var vast = new VASTClient();

  var defaultOpts = {
    // maximum amount of time in ms to wait to receive `adsready` from the ad
    // implementation after play has been requested. Ad implementations are
    // expected to load any dynamic libraries and make any requests to determine
    // ad policies for a video during this time.
    timeout: 500,

    // for the moment we don't support post roll ads
    postrollTimeout: 0,

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


  player.on('play', playAdHandler);
  player.on('readyforpreroll', playPrerollAd);

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
  function playAdHandler() {
    if(settings.adsEnabled){
      if(player.ads.state === 'content-set' && canPlayPrerollAd()){
        initAds();
      }
    }else{
      cancelAds()
    }

    /*** Local functions ***/
    function canPlayPrerollAd(){
      var allowedPrerollDelay = settings.adCancelTimeout - settings.prerollTimeout;
      return player.currentTime() <= allowedPrerollDelay;
    }

    function initAds() {
      player.trigger('adsready');
      addSpinnerIcon();
      player.on('vast.adstart', removeSpinnerIcon);
      player.on('vast.aderror', removeSpinnerIcon);
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

      if (settings.playAdAlways) {
        // No matter what happens we play a new ad before the user sees the video again.
        player.one('contentended', function () {

          setTimeout(function () {
            player.trigger('contentupdate');
          }, 0);
        });
      }
    });
  }

  function getVastResponse(callback) {
    vast.getVASTResponse(settings.url(), callback);
  }

  function playAd(vastResponse, callback) {
    var adIntegrator = isVPAID(vastResponse) ? new VPAIDIntegrator(player, options.adCancelTimeout) : new VASTIntegrator(player, options.adCancelTimeout);
    player.ads.startLinearAdMode();
    adIntegrator.playAd(vastResponse, callback);
    player.one('vast.adstart', function () {
      player.controlBar.addChild('AdsLabel');
    });
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
