describe("VPAIDIntegrator", function () {
  var player, AD_START_TIMEOUT, vpaidAdUnit, adUnitWrapper, testDiv;
  beforeEach(function () {

    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
    var videoEl = document.createElement('video');
    testDiv.appendChild(videoEl);

    AD_START_TIMEOUT = 500;
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
      'unloadAdUnit': noop
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

  it("must publish the passed player and adStartTimeout", function () {
    var vpaidIntegrator = new VPAIDIntegrator(player, AD_START_TIMEOUT);
    assert.equal(vpaidIntegrator.player, player);
    assert.equal(vpaidIntegrator.adStartTimeout, AD_START_TIMEOUT);
  });

  it("must set the adStartTimeout to 5000 ms if no timeout is passed to the constructor", function () {
    var vpaidIntegrator = new VPAIDIntegrator(player);
    assert.equal(vpaidIntegrator.player, player);
    assert.equal(vpaidIntegrator.adStartTimeout, 5000);
  });

  describe("instance", function () {
    var vpaidIntegrator, callback, vpaidTesAdUnit, fakeTech, response;

    function createMediaFile(url, type) {
      var xmlStr = '<MediaFile delivery="progressive" type="' + type + '" apiFramework="VPAID">' +
        '<![CDATA[' + url + ']]>' +
        '</MediaFile>';
      return new MediaFile(xml.toJXONTree(xmlStr));
    }

    beforeEach(function () {
      var mediaFile = createMediaFile('http://fakeMediaFile', 'application/x-fake');
      vpaidIntegrator = new VPAIDIntegrator(player, AD_START_TIMEOUT);
      callback = sinon.spy();

      vpaidTesAdUnit = {
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

      fakeTech = function (){

      };

      fakeTech.prototype.loadAdUnit = sinon.spy();
      fakeTech.prototype.unloadAdUnit = sinon.spy();
      fakeTech.prototype.mediaFile = mediaFile;
      fakeTech.supports = sinon.stub();

      response = new VASTResponse();
      response._addMediaFiles([mediaFile]);
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function(){
      this.clock.restore();
    });

    describe("playAd", function () {
        var loadAdUnit, playAdUnit, finishPlaying;

        beforeEach(function(){
          fakeTech.supports.returns(true);
          VPAIDIntegrator.techs.unshift(fakeTech);

          loadAdUnit = stubAsyncStep(vpaidIntegrator, '_loadAdUnit', this.clock);
          playAdUnit = stubAsyncStep(vpaidIntegrator, '_playAdUnit', this.clock);
          finishPlaying = stubAsyncStep(vpaidIntegrator, '_finishPlaying', this.clock);
        });

        afterEach(function(){
          VPAIDIntegrator.techs.shift();
        });

        it("must complain if you don't pass a VASTResponse", function(){
          vpaidIntegrator.playAd(null, callback);
          sinon.assert.calledOnce(callback);
          var error = firstArg(callback);
          assert.instanceOf(error, VASTError);
          assert.equal(error.message, 'VAST Error: on VASTIntegrator.playAd, missing required VASTResponse')
        });

        it("must add 'vjs-vpaid-ad' class to the player element", function(){
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
          vpaidIntegrator.playAd(response, callback);
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        });

        it("must remove 'vjs-vpaid-ad' class once the adUnit finish playing", function(){
          vpaidIntegrator.playAd(response, callback);
          this.clock.tick(1);

          loadAdUnit.flush(null, vpaidTesAdUnit, response);
          playAdUnit.flush(null, vpaidTesAdUnit, response);
          finishPlaying.flush(null, vpaidTesAdUnit, response);

          assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        });

        it("must remove 'vjs-vpaid-ad' class if there is  an ad start timeout", function(){
          vpaidIntegrator.playAd(response, callback);
          this.clock.tick(vpaidIntegrator.adStartTimeout);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        });

        it("must pass an error to the callback if there is an ad start timeout", function(){
          vpaidIntegrator.playAd(response, callback);
          this.clock.tick(vpaidIntegrator.adStartTimeout);
          sinon.assert.calledOnce(callback);
          var error = firstArg(callback);
          assert.instanceOf(error, VASTError);
          assert.equal(error.message, 'VAST Error: on VPAIDIntegrator, timeout while waiting for the ad to start')
        });

        it("must unload the adUnit if there is an ad start timeout", function(){
          vpaidIntegrator.playAd(response, callback);
          this.clock.tick(vpaidIntegrator.adStartTimeout);
          sinon.assert.calledOnce(fakeTech.prototype.unloadAdUnit);
        });

        it("must unload the adUnit if the ad finishes playing", function(){
          vpaidIntegrator.playAd(response, callback);
          this.clock.tick(1);
          loadAdUnit.flush(null, vpaidTesAdUnit, response);
          playAdUnit.flush(null, vpaidTesAdUnit, response);
          finishPlaying.flush(null, vpaidTesAdUnit, response);
          sinon.assert.calledOnce(fakeTech.prototype.unloadAdUnit);
        });
    });
    
    describe("loadAdUnit", function(){
      it("must pass the containerEl", function(){
        var testTech = new fakeTech();
        vpaidIntegrator._loadAdUnit(testTech, response, callback);
        sinon.assert.calledWithExactly(testTech.loadAdUnit, vpaidIntegrator.containerEl, sinon.match.func);
      });

      it("must pass the error , a wrapped adUnit and the vast response to the callback", function(){
        var testTech = new fakeTech();
        vpaidIntegrator._loadAdUnit(testTech, response, callback);
        var techLoadAdUnitCb = secondArg(testTech.loadAdUnit);
        techLoadAdUnitCb(null, vpaidTesAdUnit);
        sinon.assert.calledWithExactly(callback, null, sinon.match.instanceOf(VPAIDAdUnitWrapper), response);
      });
    });

    describe("playAdUnit", function(){
      var initAd, setupEvents, startAd, handshake;

      beforeEach(function(){
        handshake = stubAsyncStep(vpaidIntegrator, '_handshake', this.clock);
        initAd = stubAsyncStep(vpaidIntegrator, '_initAd', this.clock);
        setupEvents = stubAsyncStep(vpaidIntegrator, '_setupEvents', this.clock);
        startAd = stubAsyncStep(vpaidIntegrator, '_startAd', this.clock);
      });

      it("must exec the steps to play the adUnit", function(){
        vpaidIntegrator._playAdUnit(vpaidTesAdUnit, response, callback);
        this.clock.tick(1);
        handshake.flush(null, vpaidTesAdUnit, response);
        initAd.flush(null, vpaidTesAdUnit, response);
        setupEvents.flush(null, vpaidTesAdUnit, response);
        startAd.flush(null, vpaidTesAdUnit, response);

        sinon.assert.calledOnce(handshake.stub());
        sinon.assert.calledOnce(initAd.stub());
        sinon.assert.calledOnce(setupEvents.stub());
        sinon.assert.calledOnce(startAd.stub());
      });

      it("must call the adUnit with the error, adUnit and vastResponse", function(){
        vpaidIntegrator._playAdUnit(vpaidTesAdUnit, response, callback);
        this.clock.tick(1);
        handshake.flush(null, vpaidTesAdUnit, response);
        initAd.flush(null, vpaidTesAdUnit, response);
        setupEvents.flush(null, vpaidTesAdUnit, response);
        startAd.flush(null, vpaidTesAdUnit, response);

        sinon.assert.calledWithExactly(callback, null, vpaidTesAdUnit, response);
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

      it("must return an instance of the supported tech", function(){
        var vastResponse = new VASTResponse();
        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', 'application/x-shockwave-flash')]);

        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse), VPAIDFlashTech);
      });
    });
  });
});