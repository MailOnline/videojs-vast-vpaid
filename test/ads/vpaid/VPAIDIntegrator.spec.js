describe("VPAIDIntegrator", function () {
  var player, vpaidAdUnit, adUnitWrapper, testDiv;
  beforeEach(function () {

    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
    var videoEl = document.createElement('video');
    testDiv.appendChild(videoEl);

    player = videojs(videoEl, {});
    dom.addClass(player.el(), 'vjs-test-player');
    vpaidAdUnit = {
      'handshakeVersion': noop,
      'initAd': noop,
      'startAd': noop,
      'stopAd': noop,
      'skipAd': noop,
      'resizeAd': noop,
      'pauseAd': noop,
      'expandAd': noop,
      'collapseAd': noop,
      'subscribe': noop,
      'unsubscribe': noop,
      'unloadAdUnit': noop,
      'on': sinon.spy()
    };
    adUnitWrapper = new VPAIDAdUnitWrapper(vpaidAdUnit);
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  it("must be a function", function () {
    assert.isFunction(VPAIDIntegrator);
  });

  it("must return an instance of itSelf", function () {
    assert.instanceOf(VPAIDIntegrator(player), VPAIDIntegrator);
  });

  describe("instance", function () {
    var vpaidIntegrator, callback, fakeTech, vastResponse;

    function createMediaFile(url, type) {
      var xmlStr = '<MediaFile delivery="progressive" type="' + type + '" apiFramework="VPAID">' +
        '<![CDATA[' + url + ']]>' +
        '</MediaFile>';
      return new MediaFile(xml.toJXONTree(xmlStr));
    }

    beforeEach(function () {
      var mediaFile = createMediaFile('http://fakeMediaFile', 'application/x-fake');
      vpaidIntegrator = new VPAIDIntegrator(player);
      callback = sinon.spy();

      fakeTech = function () {

      };

      fakeTech.prototype.loadAdUnit = sinon.spy();
      fakeTech.prototype.unloadAdUnit = sinon.spy();
      fakeTech.prototype.mediaFile = mediaFile;
      fakeTech.supports = sinon.stub();

      vastResponse = new VASTResponse();
      vastResponse._addMediaFiles([mediaFile]);
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    describe("playAd", function () {
      var loadAdUnit, playAdUnit, finishPlaying;

      beforeEach(function () {
        fakeTech.supports.returns(true);
        VPAIDIntegrator.techs.unshift(fakeTech);

        loadAdUnit = stubAsyncStep(vpaidIntegrator, '_loadAdUnit', this.clock);
        playAdUnit = stubAsyncStep(vpaidIntegrator, '_playAdUnit', this.clock);
        finishPlaying = stubAsyncStep(vpaidIntegrator, '_finishPlaying', this.clock);
      });

      afterEach(function () {
        VPAIDIntegrator.techs.shift();
      });

      it("must complain if you don't pass a VASTResponse", function () {
        vpaidIntegrator.playAd(null, callback);
        sinon.assert.calledOnce(callback);
        var error = firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VASTIntegrator.playAd, missing required VASTResponse')
      });

      it("must add 'vjs-vpaid-ad' class to the player element", function () {
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        vpaidIntegrator.playAd(vastResponse, callback);
        assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      it("must remove 'vjs-vpaid-ad' class once the adUnit finish playing", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick(1);

        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      it("must remove 'vjs-vpaid-ad' class if there is  an adserror", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('adserror');
        this.clock.tick(1);
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      it("must unload the adUnit if there is an adserror", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('adserror');
        this.clock.tick(1);
        sinon.assert.calledOnce(fakeTech.prototype.unloadAdUnit);
      });

      it("must unload the adUnit if the ad finishes playing", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick(1);
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);
        sinon.assert.calledOnce(fakeTech.prototype.unloadAdUnit);
      });

      it("must trigger 'VPAID.adended'", function () {
        player.on('VPAID.adended', callback);
        vpaidIntegrator.playAd(vastResponse, noop);
        this.clock.tick(1);
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledOnce(callback);
      });

    });

    describe("loadAdUnit", function () {
      it("must pass the containerEl", function () {
        var testTech = new fakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        sinon.assert.calledWithExactly(testTech.loadAdUnit, vpaidIntegrator.containerEl, sinon.match.func);
      });

      it("must pass the error , a wrapped adUnit and the vast response to the callback", function () {
        var testTech = new fakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        var techLoadAdUnitCb = secondArg(testTech.loadAdUnit);
        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, null, sinon.match.instanceOf(VPAIDAdUnitWrapper), vastResponse);
      });
    });

    describe("playAdUnit", function () {
      var initAd, setupEvents, startAd, handshake;

      beforeEach(function () {
        handshake = stubAsyncStep(vpaidIntegrator, '_handshake', this.clock);
        initAd = stubAsyncStep(vpaidIntegrator, '_initAd', this.clock);
        setupEvents = stubAsyncStep(vpaidIntegrator, '_setupEvents', this.clock);
        startAd = stubAsyncStep(vpaidIntegrator, '_startAd', this.clock);
      });

      it("must exec the steps to play the adUnit", function () {
        vpaidIntegrator._playAdUnit(vpaidAdUnit, vastResponse, callback);
        this.clock.tick(1);
        handshake.flush(null, vpaidAdUnit, vastResponse);
        initAd.flush(null, vpaidAdUnit, vastResponse);
        setupEvents.flush(null, vpaidAdUnit, vastResponse);
        startAd.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledOnce(handshake.stub());
        sinon.assert.calledOnce(initAd.stub());
        sinon.assert.calledOnce(setupEvents.stub());
        sinon.assert.calledOnce(startAd.stub());
      });

      it("must call the adUnit with the error, adUnit and vastResponse", function () {
        vpaidIntegrator._playAdUnit(vpaidAdUnit, vastResponse, callback);
        this.clock.tick(1);
        handshake.flush(null, vpaidAdUnit, vastResponse);
        initAd.flush(null, vpaidAdUnit, vastResponse);
        setupEvents.flush(null, vpaidAdUnit, vastResponse);
        startAd.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledWithExactly(callback, null, vpaidAdUnit, vastResponse);
      });
    });

    describe("handshake", function () {
      var next, response;
      beforeEach(function () {
        sinon.spy(vpaidAdUnit, 'handshakeVersion');
        next = sinon.spy();
        response = new VASTResponse();

      });

      it("must be a function", function () {
        assert.isFunction(vpaidIntegrator._handshake)
      });

      it("must pass an error to the callback if the VPAID version is smaller than 1.0", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '0.0.0');
        sinon.assert.calledOnce(next);
        var error = firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "0.0.0"')
      });

      it("must pass an error to the callback if the VPAID version is bigger than 2.x.x", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '3.0.0');
        sinon.assert.calledOnce(next);
        var error = firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "3.0.0"')
      });

      it("must pass an error to the callback if the handshake returns an error", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        var fakeError = new Error();
        respond(fakeError);
        sinon.assert.calledWith(next, fakeError);
      });

      it("must call the callback with null and the adUnit and the VASTResponse if the version is supported", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '2.0');
        sinon.assert.calledOnce(next);
        sinon.assert.calledWithExactly(next, null, adUnitWrapper, response);
      });
    });

    describe("initAd", function () {
      var response;

      beforeEach(function () {
        response = new VASTResponse();
        sinon.spy(adUnitWrapper, 'initAd');
      });

      it("must be a function", function () {
        assert.isFunction(vpaidIntegrator._initAd);
      });

      it("must call pass the with, height , viewmode  desired bitrate to the adUnit's initAd", function () {
        var next = sinon.spy();
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, '', sinon.match.func)
      });

      it("must pass the add parameters if present on the VASTResponse", function () {
        var next = sinon.spy();
        response.adParameters = "some params";
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, 'some params', sinon.match.func)
      });

      it("must propagate any error that may come from the adUnit and pass the adUnit and the VASTResponse", function () {
        var next = sinon.spy();
        var fakeError = new Error();
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        var respond = lastArg(adUnitWrapper.initAd);
        respond(fakeError);
        sinon.assert.calledWith(next, fakeError, adUnitWrapper, response);
      });
    });

    describe("setupEvents", function(){
      var tracker, adUnit, vastResponse, next;

      function FakeAdUnit() {
        var events = {};
        this.options = {
          src: 'fakeSrc'
        };
        this.volume = 0;

        this.setVolume = function(vol) {
          this.volume = vol;
        };

        this.getAdVolume = function(fn) {
          fn(this.volume);
        };

        this.on = function(evtName, handler) {
          if(!events[evtName]){
            events[evtName] = [];
          }

          events[evtName].push(handler);
        };

        this.trigger = function() {
          var args = arrayLikeObjToArray(arguments);
          var evtName = args.shift();
          var handlers = events[evtName];

          if(handlers){
            forEach(handlers, function(handler) {
              handler.apply(null, args);
            });
          }
        };
      }

      beforeEach(function(){
        tracker = sinon.createStubInstance(VASTTracker);
        sinon.stub(window, 'VASTTracker').returns(tracker);
        adUnit = new FakeAdUnit();
        vastResponse = new VASTResponse();
        next = sinon.spy();
        vpaidIntegrator._setupEvents(adUnit, vastResponse, next);
      });

      afterEach(function(){
        VASTTracker.restore();
      });


      it("must call next with no error and the passed adUnit and vastResponse", function(){
        sinon.assert.calledWithExactly(next, null, adUnit, vastResponse);
      });

      it("must create a tracker passing the adUnit src and the vast response", function(){
        sinon.assert.calledWithExactly(VASTTracker, adUnit.options.src, vastResponse);
      });

      it("on 'AdSkipped' event, must track skip", function(){
        adUnit.trigger('AdSkipped');
        sinon.assert.calledOnce(tracker.trackSkip);
      });

      it("on 'AdImpression' event, must track impressions", function(){
        adUnit.trigger('AdImpression');
        sinon.assert.calledOnce(tracker.trackImpressions);
      });

      it("on 'AdVideoStart' event, must track start", function(){
        adUnit.trigger('AdVideoStart');
        sinon.assert.calledOnce(tracker.trackStart);
      });

      it("on 'AdVideoFirstQuartile' event, must track first quartile", function(){
        adUnit.trigger('AdVideoFirstQuartile');
        sinon.assert.calledOnce(tracker.trackFirstQuartile);
      });

      it("on 'AdVideoMidpoint' event, must track midpoint", function(){
        adUnit.trigger('AdVideoMidpoint');
        sinon.assert.calledOnce(tracker.trackMidpoint);
      });

      it("on 'AdVideoThirdQuartile' event, must track third quartile", function(){
        adUnit.trigger('AdVideoThirdQuartile');
        sinon.assert.calledOnce(tracker.trackThirdQuartile);
      });

      it("on 'AdVideoComplete' event, must track complete", function(){
        adUnit.trigger('AdVideoComplete');
        sinon.assert.calledOnce(tracker.trackComplete);
      });

      it("on 'AdClickThru' event, must track click", function(){
        adUnit.trigger('AdClickThru');
        sinon.assert.calledOnce(tracker.trackClick);
      });

      it("on 'AdUserAcceptInvitation' event, must track acceptInvitation", function(){
        adUnit.trigger('AdUserAcceptInvitation');
        sinon.assert.calledOnce(tracker.trackAcceptInvitation);
        sinon.assert.calledOnce(tracker.trackAcceptInvitationLinear);
      });

      it("on 'AdUserClose' event, must track close", function(){
        adUnit.trigger('AdUserClose');
        sinon.assert.calledOnce(tracker.trackClose);
        sinon.assert.calledOnce(tracker.trackCloseLinear);
      });

      it("on 'AdPaused' event, must track pause", function(){
        adUnit.trigger('AdPaused');
        sinon.assert.calledOnce(tracker.trackPause);
      });

      it("on 'AdUserMinimize' event, must track collapse", function(){
        adUnit.trigger('AdUserMinimize');
        sinon.assert.calledOnce(tracker.trackCollapse);
      });

      it("on 'AdError' event, must track error with code 901", function(){
        adUnit.trigger('AdError');
        sinon.assert.calledWithExactly(tracker.trackErrorWithCode, 901);
      });

      it("on 'AdPlaying' event, must track resume", function(){
        adUnit.trigger('AdPlaying');
        sinon.assert.calledOnce(tracker.trackResume);
      });

      describe("on 'AdVolumeChange' evt,", function(){
        beforeEach(function(){
          sinon.stub(player, 'volume');
        });

        it("must track mute if the volume was not 0 but gets updated to 0", function(){
          player.volume.returns(10);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          sinon.assert.calledOnce(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 0);
        });

        it("must not track mute if the volume was already 0", function(){
          player.volume.returns(0);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 0);
        });

        it("must tack unmute if the volume was 0 and changes to not cero", function(){
          player.volume.returns(0);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.calledOnce(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
        it("must not tack unmute if the volume was not 0 and changes to not cero", function(){
          player.volume.returns(5);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
      });

    });

    describe("findSupportedTech", function () {
      it("must return null if you pass a wrong vastREsponse", function () {
        [undefined, null, [], {}, ''].forEach(function (wrongResponse) {
          assert.isNull(vpaidIntegrator._findSupportedTech(wrongResponse));
        });
      });

      it("must return null if the passed vast response is not supported", function () {
        var vastResponse = new VASTResponse();
        assert.isNull(vpaidIntegrator._findSupportedTech(vastResponse));

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', 'application/fake-type')]);
        assert.isNull(vpaidIntegrator._findSupportedTech(vastResponse));
      });

      it("must return an instance of the supported tech", function () {
        var vastResponse = new VASTResponse();
        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', 'application/x-shockwave-flash')]);

        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse), VPAIDFlashTech);
      });
    });

    describe("linkPlayerControls", function () {
      describe("volume control", function () {
        beforeEach(function () {
          sinon.stub(adUnitWrapper, 'setAdVolume');
          sinon.stub(adUnitWrapper, 'getAdVolume');
          sinon.stub(adUnitWrapper, 'on');
          sinon.stub(player, 'volume').returns(0.5);
        });

        it("must call the callback with null, adUnit and vast response", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          sinon.assert.calledWithExactly(callback, null, adUnitWrapper, vastResponse);
        });

        it("must update the adUnit volume on 'advolumechange'", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('advolumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0.5);
        });

        it("must update the adUnit volume to 0 if the player is muted", function(){
          sinon.stub(player, 'muted').returns(true);
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('advolumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0);
        });

        it("must update the player volume on 'AdVolumeChange'", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          var triggerAdVolumeChange = lastArg(adUnitWrapper.on);
          triggerAdVolumeChange();
          var getAdVolumeHandler = lastArg(adUnitWrapper.getAdVolume);
          getAdVolumeHandler(null, 0.1);
          sinon.assert.calledWith(player.volume, 0.1);
        });

        it("must unsubscribe on 'VPAID.adended' events", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('VPAID.adended');
          player.trigger('advolumechange');
          sinon.assert.notCalled(adUnitWrapper.setAdVolume);
        });
      });

      describe("fullscreen change", function () {
        beforeEach(function () {
          sinon.stub(adUnitWrapper, 'resizeAd');
        });

        it("must resize the adUnit on fullscreenchange", function () {
          sinon.stub(player, 'isFullscreen');
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('fullscreenchange');
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 720, 480, vpaidIntegrator.VIEW_MODE.NORMAL);

          player.isFullscreen.returns(true);
          player.trigger('fullscreenchange');
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 720, 480, vpaidIntegrator.VIEW_MODE.FULLSCREEN);
        });

        it("must unsubscribe on 'VPAID-adfinsished'", function () {
          sinon.stub(player, 'isFullscreen');
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('VPAID.adended');
          player.trigger('fullscreenchange');
          sinon.assert.notCalled(adUnitWrapper.resizeAd);
        });
      });
    });

    describe("startAd", function () {
      it("must call adUnit.startAd and pass the adUnit and vastResponse to the callback", function () {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, callback);

        sinon.assert.calledOnce(adUnitWrapper.startAd);

        var startAdCb = lastArg(adUnitWrapper.startAd);
        startAdCb(null);

        sinon.assert.calledWithExactly(callback, null, adUnitWrapper, vastResponse);
      });

      it("must trigger 'vast.adstart'", function () {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adstart', callback);
        var startAdCb = lastArg(adUnitWrapper.startAd);
        startAdCb(null);

        sinon.assert.calledOnce(callback);
      });

      it("must not trigger 'vast.adstart' if there is an error on startAd", function () {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adstart', callback);
        var startAdCb = lastArg(adUnitWrapper.startAd);
        startAdCb(new Error());

        sinon.assert.notCalled(callback);
      });
    });
  });
});