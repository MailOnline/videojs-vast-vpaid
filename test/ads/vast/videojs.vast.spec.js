describe("videojs.vast plugin", function () {
  var testDiv, videoEl, player;

  function assertError(callback, msg, code) {
    var error = firstArg(callback).error;
    assert.instanceOf(error, VASTError);
    assert.equal(error.message, "VAST Error: " + msg);
    if (code) {
      assert.equal(error.code, code);
    }
  }

  function createMediaFile(url, type) {
    var xmlStr = '<MediaFile delivery="progressive" type="' + type + '" codec="video/mpeg-generic" bitrate="457" width="300" height="225">' +
      '<![CDATA[' + url + ']]>' +
      '</MediaFile>';
    return new MediaFile(xml.toJXONTree(xmlStr));
  }

  beforeEach(function () {
    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);

    videoEl = document.createElement('video');
    videoEl.id = 'testVideoElm';
    testDiv.appendChild(videoEl);
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  it("must be instantiated as part of the player", function () {
    var player = videojs(videoEl, {});
    assert.isDefined(player.vast);
  });

  it("must initialize ads plugin", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');

    videojs(document.createElement('video'), {});
    sinon.assert.notCalled(adsPlugin);

    videojs(document.createElement('video'), {
      plugins: {
        'vast': {
          url: 'http://Fake.ads.url'
        }
      }
    });
    sinon.assert.calledOnce(adsPlugin);

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  describe("obj", function () {
    var player, vastAd;

    beforeEach(function () {
      player = videojs(document.createElement('video'), {});
      vastAd = player.vast({url: 'http://fake.ad.url'});
    });

    describe("isEnabled", function () {
      it("must return true when the vast plugin is first enabled", function () {
        assert.isTrue(vastAd.isEnabled());
      });
    });

    describe("enable", function () {
      it("must be a function", function () {
        assert.isFunction(vastAd.enable);
      });

      it("must enable the ads", function () {
        vastAd.disable();
        assert.isFalse(vastAd.isEnabled());
        vastAd.enable();
        assert.isTrue(vastAd.isEnabled());
      });

      it("must trigger 'adsready' event", function () {
        var adsreadySpy = sinon.spy();
        player.on('adsready', adsreadySpy);
        vastAd.enable();
        sinon.assert.calledOnce(adsreadySpy);
      });
    });

    describe("disable", function () {
      it("must be a function", function () {
        assert.isFunction(vastAd.enable);
      });

      it("must disable the ads", function () {
        vastAd.disable();
        assert.isFalse(vastAd.isEnabled());
      });

      it("must trigger 'adsCanceled' event and 'adsError' event to prevent the ad from being played", function () {
        var adsCanceledSpy = sinon.spy();
        var adsErrorSpy = sinon.spy();
        player.on('adscanceled', adsCanceledSpy);
        player.on('adserror', adsErrorSpy);
        vastAd.disable();
        sinon.assert.calledOnce(adsCanceledSpy);
        sinon.assert.calledOnce(adsErrorSpy);
      });
    });
  });

  it("must not initialize the ads if no url is passed", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');
    var player = videojs(document.createElement('video'), {});
    player.vast();

    sinon.assert.notCalled(adsPlugin);

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  it("must trigger 'vast.aderror' event with an explanatory error if there was a problem initializing the ads", function () {
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});

    player.on('vast.aderror', spy);
    player.vast();
    sinon.assert.calledOnce(spy);
    assertError(spy, 'on VideoJS VAST plugin, missing url on options object');
  });

  it("must not trigger 'vast.aderror' if the ads url is passed as part of the options", function () {
    var vastErrorSpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('vast.aderror', vastErrorSpy);
    player.vast({url: 'http://fake.ad.url'});
    sinon.assert.notCalled(vastErrorSpy);
  });

  it("must trigger 'adsready' if the url is set", function () {
    var adsReadySpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('adsready', adsReadySpy);
    player.vast({url: 'http://fake.ad.url'});
    sinon.assert.calledOnce(adsReadySpy);
  });

  it("must trigger 'adscanceled' and 'adserror' events if the url is set but the ads are disabled", function () {
    var player = videojs(document.createElement('video'), {});
    var adsCanceledSpy = sinon.spy();
    var adsErrorSpy = sinon.spy();
    player.on('adscanceled', adsCanceledSpy);
    player.on('adserror', adsErrorSpy);
    player.vast({url: 'http://fake.ad.url', adsEnabled: false});
    sinon.assert.calledOnce(adsCanceledSpy);
    sinon.assert.calledOnce(adsErrorSpy);
  });

  it("must trigger 'adsready' event whenever there is a contentupdate", function () {
    var adsReadySpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});

    player.vast({url: 'http://fake.ad.url'});
    player.on('adsready', adsReadySpy);
    player.trigger('contentupdate');
    sinon.assert.calledOnce(adsReadySpy);
  });

  it("must trigger 'adscanceled' and 'adserror' events whenever there is a contentupdate and the plugin is dissabled", function () {
    var player = videojs(document.createElement('video'), {});
    var adsCanceledSpy = sinon.spy();
    var adsErrorSpy = sinon.spy();
    player.vast({url: 'http://fake.ad.url', adsEnabled: false});
    player.on('adscanceled', adsCanceledSpy);
    player.on('adserror', adsErrorSpy);
    player.trigger('contentupdate');
    sinon.assert.calledOnce(adsCanceledSpy);
    sinon.assert.calledOnce(adsErrorSpy);
  });

  it("must be possible to set the 'timeout', 'prerollTimeout' and 'debug' mode of ads", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');
    var adsOpts = {
      timeout: 123,
      prerollTimeout: 123,
      debug: null,
      url: echoFn('http://fake.ad.url'),
      adCancelTimeout: 123,
      playAdAlways: true,
      adsEnabled: true
    };
    var player = videojs(document.createElement('video'), {});
    player.vast(adsOpts);

    sinon.assert.calledOnce(adsPlugin);
    assert.deepEqual(firstArg(adsPlugin), adsOpts);

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  describe("playAdAlways option", function () {
    var player, getVASTResponse, getVAstResponseCb, playAdCallback, clock;

    function simulateAdPlay(player) {
      getVASTResponse = sinon.spy(VASTClient.prototype, 'getVASTResponse');
      player.trigger('readyforpreroll');
      clock.tick(1);
      getVAstResponseCb = secondArg(getVASTResponse);

      //We simulate we get a VAST response
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      getVAstResponseCb(null, response);

      //We simulate we play the ad
      clock.tick(2);
      playAdCallback = secondArg(VASTIntegrator.prototype.playAd);
      playAdCallback(null, response);
      clock.tick(2);

      //We set the ads plugin on the content-playback state
      player.ads.state = 'content-playback'
    }

    beforeEach(function () {
      clock = sinon.useFakeTimers();
      sinon.stub(vastUtil, 'track').returns(null);
      sinon.spy(VASTIntegrator.prototype, 'playAd');
      player = videojs(document.createElement('video'), {});
    });

    afterEach(function () {
      clock.restore();
      vastUtil.track.restore();
      getVASTResponse.restore();
      VASTIntegrator.prototype.playAd.restore();
    });

    it("set to true, must try to play a new ad every time the users replays the ad", function () {
      player.vast({
        url: echoFn('/fake.ad.url'),
        playAdAlways: true
      });
      simulateAdPlay(player);
      getVASTResponse.reset();

      //We simulate we finish playing the video.
      player.trigger('ended');
      clock.tick(1);

      //We simulate a user play
      player.trigger('play');
      clock.tick(1);

      //We ensure a new VAST ad is requested
      sinon.assert.calledOnce(getVASTResponse);
      sinon.assert.calledWith(getVASTResponse, '/fake.ad.url');
    });

    it("set to false, must try not play a new ad every time the user replays the ad", function () {
      player.vast({
        url: echoFn('/fake.ad.url'),
        playAdAlways: false
      });

      simulateAdPlay(player);
      getVASTResponse.reset();

      //We simulate we finish playing the video.
      player.trigger('ended');
      clock.tick(1);

      //We simulate a user play
      player.trigger('play');
      clock.tick(1);

      //We ensure a new VAST ad is NOT requested
      sinon.assert.notCalled(getVASTResponse);
    });
  });

  describe("on 'readyforpreroll'", function () {
    var player, getVASTResponse, callback;

    function assertVASTTrackRequest(URLs, variables) {
      URLs = isArray(URLs) ? URLs : [URLs];
      sinon.assert.calledOnce(vastUtil.track);
      sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
    }

    function assertTriggersTrackError(fn, msg, code, vastResponse) {
      var adsErrorSpy = sinon.spy();
      var adscanceledSpy = sinon.spy();
      var vastAdErrorSpy = sinon.spy();
      player.on('vast.aderror', vastAdErrorSpy);
      player.on('adserror', adsErrorSpy);
      player.on('adscanceled', adscanceledSpy);

      fn();

      assertError(vastAdErrorSpy, msg, code);
      if (code && vastResponse) {
        assertVASTTrackRequest(vastResponse.errorURLMacros, {ERRORCODE: code});
      }
      sinon.assert.calledOnce(adsErrorSpy);
      sinon.assert.calledOnce(adscanceledSpy);
    }

    beforeEach(function () {
      this.clock = sinon.useFakeTimers();
      sinon.stub(vastUtil, 'track').returns(null);
      sinon.spy(VASTIntegrator.prototype, 'playAd');
      player = videojs(document.createElement('video'), {});
      player.vast({url: echoFn('/fake.ad.url')});
      getVASTResponse = sinon.spy(VASTClient.prototype, 'getVASTResponse');
      player.trigger('readyforpreroll');
      this.clock.tick(1);
      callback = secondArg(getVASTResponse);
    });

    afterEach(function () {
      this.clock.restore();
      vastUtil.track.restore();
      getVASTResponse.restore();
      VASTIntegrator.prototype.playAd.restore();
    });

    it("must request the vastResponse", function () {
      sinon.assert.calledOnce(getVASTResponse);
      sinon.assert.calledWith(getVASTResponse, '/fake.ad.url');
    });

    it("must track the vast response if there was an error retrieving the vast response", function () {
      assertTriggersTrackError(function () {
        callback(new VASTError('Foo VAST ERROR', 101));
      }, 'Foo VAST ERROR', 101);
    });

    it("must play the ad with the returned response", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);

      this.clock.tick(2);
      sinon.assert.calledWith(VASTIntegrator.prototype.playAd, response);
    });

    it("must start ad linear mode when the ad is about to be played", function () {
      var adstartSpy = sinon.spy();
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      player.on('adstart', adstartSpy);
      callback(null, response);
      this.clock.tick(2);
      sinon.assert.calledOnce(adstartSpy);
    });

    it("must end ad linear mode when the ads finish playing", function () {
      var adEndSpy = sinon.spy();
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      player.on('adend', adEndSpy);
      callback(null, response);
      this.clock.tick(2);
      var playAdCallback = secondArg(VASTIntegrator.prototype.playAd);
      playAdCallback(null, response);
      this.clock.tick(2);
      sinon.assert.calledOnce(adEndSpy);
    });

    it("must track the error if there as a problem playing the ad ", function () {
      var response = new VASTResponse();
      var clock = this.clock;
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      assertTriggersTrackError(function () {
        clock.tick(100000);
      }, 'on VASTIntegrator, timeout while waiting for the video to start playing');
    });
  });

  describe("loading spinner", function(){
    var player;

    beforeEach(function(){
      this.clock = sinon.useFakeTimers();
      player = videojs(document.createElement('video'), {});
      player.vast({url: 'http://fake.ad.url'});
    });

    afterEach(function(){
      this.clock.restore();
    });

    it("must be added on play event", function(){
      player.trigger('play');
      assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
    });

    it("must NOT be added on play event if the ads state is NOT 'preroll?'", function(){
      player.ads.state = 'content-playback';
      player.trigger('play');
      assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
    });

    it("must be removed on vast ad start", function(){
      player.trigger('play');
      assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
      player.trigger('vast.adstart');
      this.clock.tick(1);
      assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
    });

    it("must be removed if there was a error while trying to play the ad", function(){
      player.trigger('play');
      assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
      player.trigger('vast.aderror');
      this.clock.tick(1);
      assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
    });
  });
});