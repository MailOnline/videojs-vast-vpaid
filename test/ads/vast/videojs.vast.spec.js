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
    assert.isDefined(player.vastClient);
  });

  it("must initialize ads plugin", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');

    videojs(document.createElement('video'), {});
    sinon.assert.notCalled(adsPlugin);

    videojs(document.createElement('video'), {
      plugins: {
        'vastClient': {
          url: 'http://Fake.ads.url'
        }
      }
    });
    sinon.assert.calledOnce(adsPlugin);

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  describe("player.vast", function () {
    var player, vastAd;

    beforeEach(function () {
      player = videojs(document.createElement('video'), {});
      vastAd = player.vastClient({url: 'http://fake.ad.url'});
    });

    it("must be equal to the object returned by the plugin", function(){
      assert.strictEqual(vastAd, player.vast);
    });

    describe("isEnabled", function () {
      it("must return true when the vast plugin is first enabled", function () {
        assert.isTrue(player.vast.isEnabled());
      });
    });

    describe("enable", function () {
      it("must enable the ads", function () {
        player.vast.disable();
        assert.isFalse(vastAd.isEnabled());
        player.vast.enable();
        assert.isTrue(vastAd.isEnabled());
      });
    });

    describe("disable", function () {
      it("must disable the ads", function () {
        player.vast.disable();
        assert.isFalse(player.vast.isEnabled());
      });
    });
  });

  it("must not initialize the ads if no url is passed", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');
    var player = videojs(document.createElement('video'), {});
    player.vastClient();

    sinon.assert.notCalled(adsPlugin);

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  it("must trigger 'vast.aderror' event with an explanatory error if there was a problem initializing the ads", function () {
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});

    player.on('vast.aderror', spy);
    player.vastClient();
    sinon.assert.calledOnce(spy);
    assertError(spy, 'on VideoJS VAST plugin, missing url on options object');
  });

  it("must not trigger 'vast.aderror' if the ads url is passed as part of the options", function () {
    var vastErrorSpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('vast.aderror', vastErrorSpy);
    player.vastClient({url: 'http://fake.ad.url'});
    sinon.assert.notCalled(vastErrorSpy);
  });

  it("must be possible to set the 'timeout', 'prerollTimeout' and 'debug' mode of ads", function () {
    // We spy the ads plugin
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');
    var adsOpts = {
      timeout: 123,
      prerollTimeout: 23,
      debug: null,
      url: echoFn('http://fake.ad.url'),
      adCancelTimeout: 123,
      playAdAlways: true,
      adsEnabled: true
    };
    var player = videojs(document.createElement('video'), {});
    player.vastClient(adsOpts);

    sinon.assert.calledOnce(adsPlugin);
    assert.deepEqual(firstArg(adsPlugin), extend({postrollTimeout: 0}, adsOpts));

    //We restore the ads plugin
    vjs.Player.prototype.ads.restore();
  });

  it("must default the value of prerolTimeout to whatever value the adCancelTimeout has", function(){
    var adsPlugin = sinon.spy(vjs.Player.prototype, 'ads');
    var adsOpts = {
      timeout: 123,
      debug: null,
      url: echoFn('http://fake.ad.url'),
      adCancelTimeout: 123,
      playAdAlways: true,
      adsEnabled: true
    };
    var player = videojs(document.createElement('video'), {});
    player.vastClient(adsOpts);

    sinon.assert.calledOnce(adsPlugin);
    assert.deepEqual(firstArg(adsPlugin), extend({postrollTimeout: 0, prerollTimeout: 123}, adsOpts));

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
      player.vastClient({
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
      player.vastClient({
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
      player.vastClient({url: echoFn('/fake.ad.url')});
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

      this.clock.tick(1);
      sinon.assert.calledWith(VASTIntegrator.prototype.playAd, response);
    });

    it("must prevent manual progress when you play the ad", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick(1);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      player.currentTime.returns(10);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      sinon.assert.calledWithExactly(player.currentTime, 1);
    });

    it("must pause the play if the user tries to skip the ad manually twice", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick(1);
      sinon.spy(player, 'pause');
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      player.currentTime.returns(10);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      sinon.assert.notCalled(player.pause);
      player.currentTime.returns(10);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      sinon.assert.calledOnce(player.pause);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      sinon.assert.calledTwice(player.pause);
    });

    it("must not prevent the manual progress after the ad has ended", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      var setCurrentTime = player.currentTime.withArgs(1);
      callback(null, response);
      this.clock.tick(1);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      player.trigger('adended');
      this.clock.tick(1);
      player.currentTime.returns(10);
      player.trigger('adtimeupdate');
      this.clock.tick(1);
      sinon.assert.notCalled(setCurrentTime);
    });

    it("must start ad linear mode when the ad is about to be played", function () {
      var adstartSpy = sinon.spy();
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      player.on('adstart', adstartSpy);
      callback(null, response);
      this.clock.tick(1);
      sinon.assert.calledOnce(adstartSpy);
    });

    it("must ad the adsLabel component once we know the ad is going to start. (i.e. vast.adstart)", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick(1);
      player.trigger('vast.adstart');
      assert.isObject(player.controlBar.getChild('AdsLabel'));
    });

    it("must end ad linear mode when the ads finish playing", function () {
      var adEndSpy = sinon.spy();
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      player.on('adend', adEndSpy);
      callback(null, response);
      this.clock.tick(1);
      var playAdCallback = secondArg(VASTIntegrator.prototype.playAd);
      playAdCallback(null, response);
      this.clock.tick(1);
      sinon.assert.calledOnce(adEndSpy);
    });

    it("must remove the adsLabel component when the ads finish playing", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick(1);
      player.trigger('vast.adstart');
      var playAdCallback = secondArg(VASTIntegrator.prototype.playAd);
      playAdCallback(null, response);
      this.clock.tick(1);
      assert.isNull(player.controlBar.getChild('AdsLabel'));
    });

    it("must remove the adsLabel component on adserror", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick(1);
      player.trigger('vast.adstart');
      player.trigger('adserror');

      this.clock.tick(1);
      assert.isNull(player.controlBar.getChild('AdsLabel'));
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
  
  describe("on 'play' event", function(){
    var player;

    beforeEach(function () {
      player = videojs(document.createElement('video'), {});
      player.vastClient({url: echoFn('/fake.ad.url')});
    });

    it("must cancel the ads if the ads are not enabled", function(){
      var adsCanceled = sinon.spy();
      var adsError = sinon.spy();
      player.on('adscanceled', adsCanceled);
      player.on('adserror', adsError);
      player.vast.disable();

      player.trigger('play');

      sinon.assert.calledOnce(adsCanceled);
      sinon.assert.calledOnce(adsError);
    });

    describe("with ads enabled", function(){
      it("must not cancel the ads", function(){
        var adsCanceled = sinon.spy();
        var adsError = sinon.spy();
        player.on('adscanceled', adsCanceled);
        player.on('adserror', adsError);
        player.vast.enable();

        player.trigger('play');

        sinon.assert.notCalled(adsCanceled);
        sinon.assert.notCalled(adsError);
      });

      it("must not init the ads if the ad state is not 'content-set'", function(){
        var adsreadySpy = sinon.spy();
        player.on('adsready', adsreadySpy);
        player.ads.state = 'content-playback';
        player.trigger('play');
        sinon.assert.notCalled(adsreadySpy);
      });

      it("must not init the ad if the video content has started playing more than the setted 'preroll delay' (i.e. adCancelTimeout - prerollTimout)", function(){
        var adsreadySpy = sinon.spy();
        player = videojs(document.createElement('video'), {});
        player.vastClient({url: echoFn('/fake.ad.url'), prerollTimeout: 500, adCancelTimeout:5000});
        sinon.stub(player, 'currentTime').returns(5000);
        player.on('adsready', adsreadySpy);
        player.trigger('play');
        sinon.assert.notCalled(adsreadySpy);
      });

      it("must init the ad if the video content has not played for more than the allowed 'preroll delay' (i.e. adCancelTimeout - prerollTimout)", function(){
        var adsreadySpy = sinon.spy();
        player = videojs(document.createElement('video'), {});
        player.vastClient({url: echoFn('/fake.ad.url'), prerollTimeout: 500, adCancelTimeout:5000});
        sinon.stub(player, 'currentTime').returns(300);
        player.on('adsready', adsreadySpy);
        player.trigger('play');
        sinon.assert.calledOnce(adsreadySpy);
      });

      it("if adCancelTimeout and prerollTimeout are equal, it must never start playing the ad if the content have started ", function(){
        var adsreadySpy = sinon.spy();
        player = videojs(document.createElement('video'), {});
        player.vastClient({url: echoFn('/fake.ad.url')});
        sinon.stub(player, 'currentTime').returns(300);
        player.on('adsready', adsreadySpy);
        player.trigger('play');
        sinon.assert.notCalled(adsreadySpy);
      });

      describe("loading spinner", function(){
        var player, adsreadySpy;

        beforeEach(function(){
          this.clock = sinon.useFakeTimers();
          adsreadySpy = sinon.spy();
          player = videojs(document.createElement('video'), {});
          player.vastClient({url: echoFn('/fake.ad.url')});
          player.on('adsready', adsreadySpy);
        });

        afterEach(function(){
          this.clock.restore();
        });

        it("must be added when the ads are ready", function(){
          player.trigger('play');
          sinon.assert.calledOnce(adsreadySpy);
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });

        it("must NOT be added on play event if the ads state is NOT 'preroll?'", function(){
          player.ads.state = 'content-playback';
          player.trigger('play');
          sinon.assert.notCalled(adsreadySpy);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });

        it("must be removed on vast ad start", function(){
          player.trigger('play');
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
          player.trigger('vast.adstart');
          this.clock.tick(100);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });

        it("must be removed if there was a error while trying to play the ad", function(){
          player.trigger('play');
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
          player.trigger('vast.aderror');
          this.clock.tick(100);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });
      });

    });
  });
});