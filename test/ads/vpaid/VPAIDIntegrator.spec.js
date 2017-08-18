var VPAIDAdUnitWrapper = require('ads/vpaid/VPAIDAdUnitWrapper');
var VPAIDIntegrator = require('ads/vpaid/VPAIDIntegrator');
var VPAIDHTML5Tech = require('ads/vpaid/VPAIDHTML5Tech');

var MediaFile = require('ads/vast/MediaFile');
var VASTError = require('ads/vast/VASTError');
var VASTResponse = require('ads/vast/VASTResponse');
var VASTTracker = require('ads/vast/VASTTracker');
var vastUtil = require('ads/vast/vastUtil');

var dom = require('utils/dom');
var utilities = require('utils/utilityFunctions');
var xml = require('utils/xml');

var testUtils = require('../../test-utils');

describe("VPAIDIntegrator", function () {
  var player, vpaidAdUnit, adUnitWrapper, testDiv;

  function FakeAdUnit() {
    var events = {};
    this.options = {
      src: 'fakeSrc'
    };
    this.volume = 0;
    this.isSkippable = false;

    this.resizeAd = sinon.spy();
    this.skipAd = sinon.spy();
    this.setVolume = function(vol) {
      this.volume = vol;
    };

    this.getAdVolume = function(fn) {
      var vol = this.volume;
      window.setTimeout(function() {
        fn(null, vol);
      }, 0);

    };

    this.on = function(evtName, handler) {
      if(!events[evtName]){
        events[evtName] = [];
      }

      events[evtName].push(handler);
    };

    this.getAdSkippableState = function(fn) {
      var skippable = this.isSkippable;
      window.setTimeout(function() {
        fn(null, skippable);
      }, 0);
    };

    this.trigger = function() {
      var args = utilities.arrayLikeObjToArray(arguments);
      var evtName = args.shift();
      var handlers = events[evtName];

      if(handlers){
        handlers.forEach(function(handler) {
          handler.apply(null, args);
        });
      }
    };

    this.pauseAd = sinon.spy();
    this.resumeAd = sinon.spy();
  }

  beforeEach(function () {

    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
    var videoEl = document.createElement('video');
    testDiv.appendChild(videoEl);

    player = videojs(videoEl, {});
    dom.addClass(player.el(), 'vjs-test-player');
    vpaidAdUnit = {
      'handshakeVersion': utilities.noop,
      'initAd': utilities.noop,
      'startAd': utilities.noop,
      'stopAd': utilities.noop,
      'skipAd': utilities.noop,
      'resizeAd': utilities.noop,
      'pauseAd': utilities.noop,
      'expandAd': utilities.noop,
      'collapseAd': utilities.noop,
      'subscribe': utilities.noop,
      'unsubscribe': utilities.noop,
      'unloadAdUnit': utilities.noop,
      'on': sinon.spy()
    };
    adUnitWrapper = new VPAIDAdUnitWrapper(vpaidAdUnit, {responseTimeout: 5000});
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  it("must return an instance of itself", function () {
    assert.instanceOf(new VPAIDIntegrator(player), VPAIDIntegrator);
  });

  describe("instance", function () {
    var vpaidIntegrator, callback, FakeTech, vastResponse;

    function createMediaFile(url, type) {
      var xmlStr = '<MediaFile delivery="progressive" type="' + type + '" apiFramework="VPAID">' +
        '<![CDATA[' + url + ']]>' +
        '</MediaFile>';
      return new MediaFile(xml.toJXONTree(xmlStr));
    }

    beforeEach(function () {
      var mediaFile = createMediaFile('http://fakeMediaFile', 'application/x-fake');
      vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      callback = sinon.spy();

      FakeTech = function () {

      };

      FakeTech.prototype.name = 'vpaid-fake';
      FakeTech.prototype.loadAdUnit = sinon.spy();
      FakeTech.prototype.unloadAdUnit = sinon.spy();
      FakeTech.prototype.mediaFile = mediaFile;
      FakeTech.supports = sinon.stub();

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
        FakeTech.supports.returns(true);
        vastUtil.VPAID_techs.unshift(FakeTech);

        loadAdUnit = testUtils.stubAsyncStep(vpaidIntegrator, '_loadAdUnit', this.clock);
        playAdUnit = testUtils.stubAsyncStep(vpaidIntegrator, '_playAdUnit', this.clock);
        finishPlaying = testUtils.stubAsyncStep(vpaidIntegrator, '_finishPlaying', this.clock);
      });

      afterEach(function () {
        vastUtil.VPAID_techs.shift();
      });

      it("must complain if you don't pass a VASTResponse", function () {
        vpaidIntegrator.playAd(null, callback);
        sinon.assert.calledOnce(callback);
        var error = testUtils.firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VASTIntegrator.playAd, missing required VASTResponse');
      });

      it("must trigger an error if could not find a supported mediaFile", function () {
        sinon.stub(vastUtil, 'track');
        vastResponse._addErrorTrackUrl(xml.toJXONTree('<Error><![CDATA[https://fakeErrorUrl&error_code=[ERRORCODE]]]></Error>'));

        FakeTech.supports.returns(false);
        vpaidIntegrator.playAd(vastResponse, callback);
        sinon.assert.calledOnce(callback);
        var error = testUtils.firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator.playAd, could not find a supported mediaFile');
        sinon.assert.calledWithExactly(vastUtil.track, ["https://fakeErrorUrl&error_code=[ERRORCODE]"], { ERRORCODE: 403 });
        vastUtil.track.restore();
      });

      it("must trigger a vpaid.adEnd evt on vast.adsCancel evt", function(){
        var spy = sinon.spy();
        player.on('vpaid.adEnd', spy);
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('vast.adsCancel');
        assert.isTrue(spy.calledOnce);
      });

      it("must NOT trigger a vpaid.adEnd evt twice", function(){
        var spy = sinon.spy();
        player.on('vpaid.adEnd', spy);
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('vast.adsCancel');
        player.trigger('vast.adsCancel');
        assert.isTrue(spy.calledOnce);
      });

      it("must add 'vjs-vpaid-ad' class to the player element", function () {
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        vpaidIntegrator.playAd(vastResponse, callback);
        assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      it("must remove 'vjs-vpaid-ad' class once the adUnit finish playing", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick();

        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      ['vast.adsCancel', 'vpaid.adEnd'].forEach(function (evt) {
        it("must remove 'vjs-vpaid-ad' class if there is  an '"+evt+"' event", function () {
          vpaidIntegrator.playAd(vastResponse, callback);
          player.trigger(evt);
          this.clock.tick();
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        });

        it("must unload the adUnit if there is an '"+evt+"' event", function () {
          vpaidIntegrator.playAd(vastResponse, callback);
          player.trigger(evt);
          this.clock.tick();
          sinon.assert.calledOnce(FakeTech.prototype.unloadAdUnit);
        });
      });

      it("must unload the adUnit if the ad finishes playing", function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick();
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);
        sinon.assert.calledOnce(FakeTech.prototype.unloadAdUnit);
      });

      it("must trigger 'vpaid.adEnd'", function () {
        player.on('vpaid.adEnd', callback);
        vpaidIntegrator.playAd(vastResponse, utilities.noop);
        this.clock.tick();
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledOnce(callback);
      });

      describe("return obj", function(){
        it("must have the type VPAID", function(){
          var adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          assert.equal(adUnit.type, 'VPAID');
        });

        it("must trigger the vpaid.pauseAd evt", function(){
          var adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          var spy = sinon.spy();
          sinon.stub(player, 'pause');
          player.on('vpaid.pauseAd', spy);
          adUnit.pauseAd();
          sinon.assert.calledOnce(spy);
          sinon.assert.calledOnce(player.pause);
          player.pause.restore();
        });

        it("must trigger the vpaid.resumeAd evt", function(){
          var adUnit =vpaidIntegrator.playAd(vastResponse, utilities.noop);
          var spy = sinon.spy();
          player.on('vpaid.resumeAd', spy);
          adUnit.resumeAd();
          sinon.assert.calledOnce(spy);
        });

        it("must know if it is paused", function(){
          var adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          assert(adUnit.isPaused());
          adUnit._paused = false;
          assert(!adUnit.isPaused());
        });

        it("must be able to return the source of the ad", function(){
          var adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          assert.equal(adUnit.getSrc(), FakeTech.prototype.mediaFile);
        });
      });
    });

    describe("loadAdUnit", function () {
      it("must pass the containerEl", function () {
        var testTech = new FakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        sinon.assert.calledWithExactly(testTech.loadAdUnit, vpaidIntegrator.containerEl, player.el().querySelector('.vjs-tech'), sinon.match.func);
      });

      it("must pass the error if there is an error loading the ad unit", function(){
        var testTech = new FakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        var techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);
        var fakeTechNativeError = new Error('error loading the ad unit.');
        techLoadAdUnitCb(fakeTechNativeError, undefined);
        sinon.assert.calledWithExactly(callback, fakeTechNativeError, undefined, vastResponse);
      });

      it("must pass the error, a wrapped adUnit and the vast response to the callback", function () {
        var testTech = new FakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        var techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);
        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, null, sinon.match.instanceOf(VPAIDAdUnitWrapper), vastResponse);
      });

      it("must pass the error if there is a problem creating the VPAIDAdUnitWrapper", function(){
        var testTech = new FakeTech();
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        var techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);
        //We make the adUnit invalid
        vpaidAdUnit.initAd = undefined;

        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, sinon.match.instanceOf(VASTError), vpaidAdUnit, vastResponse);
        var error = testUtils.firstArg(callback);
        assert.equal(error.message, 'VAST Error: on VPAIDAdUnitWrapper, the passed VPAID adUnit does not fully implement the VPAID interface');
      });

      it("must add the tech class to the player and remove it on 'vpaid.adEnd' event",function(){
        var testTech = new FakeTech();
        var fakeAdUnit = {};
        sinon.stub(VPAIDIntegrator.prototype, '_createVPAIDAdUnitWrapper').returns(fakeAdUnit);
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        var techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);
        //We make the adUnit invalid
        vpaidAdUnit.initAd = undefined;

        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, null, fakeAdUnit, vastResponse);
        assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-fake-ad'));
        player.trigger('vpaid.adEnd');
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-fake-ad'));
        VPAIDIntegrator.prototype._createVPAIDAdUnitWrapper.restore();
      });
    });

    describe("playAdUnit", function () {
      var initAd, setupEvents, startAd, handshake;

      beforeEach(function () {
        handshake = testUtils.stubAsyncStep(vpaidIntegrator, '_handshake', this.clock);
        initAd = testUtils.stubAsyncStep(vpaidIntegrator, '_initAd', this.clock);
        setupEvents = testUtils.stubAsyncStep(vpaidIntegrator, '_setupEvents', this.clock);
        startAd = testUtils.stubAsyncStep(vpaidIntegrator, '_startAd', this.clock);
      });

      it("must exec the steps to play the adUnit", function () {
        vpaidIntegrator._playAdUnit(vpaidAdUnit, vastResponse, callback);
        this.clock.tick();
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
        this.clock.tick();
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

      it("must pass an error to the callback if the VPAID version is smaller than 1.0", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '0.0.0');
        sinon.assert.calledOnce(next);
        var error = testUtils.firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "0.0.0"');
      });

      it("must pass an error to the callback if the VPAID version is bigger than 2.x.x", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '3.0.0');
        sinon.assert.calledOnce(next);
        var error = testUtils.firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "3.0.0"');
      });

      it("must pass an error to the callback if the handshake returns an error", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);
        var fakeError = new Error();
        respond(fakeError);
        sinon.assert.calledWith(next, fakeError);
      });

      it("must call the callback with null and the adUnit and the VASTResponse if the version is supported", function () {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);
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
        sinon.stub(dom, 'getDimension').returns(
          {
            width: 720,
            height: 480
          }
        );
      });

      afterEach(function(){
        dom.getDimension.restore();
      });

      it("must call pass the with, height, viewmode, desired bitrate, and creativeData to the adUnit's initAd", function () {
        var next = sinon.spy();
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, sinon.match({AdParameters: ''}), sinon.match.func);
      });

      it("must pass the add parameters if present on the VASTResponse", function () {
        var next = sinon.spy();
        response.adParameters = 'some params';
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, sinon.match({AdParameters: 'some params'}), sinon.match.func);
      });

      it("must propagate any error that may come from the adUnit and pass the adUnit and the VASTResponse", function () {
        var next = sinon.spy();
        var fakeError = new Error();
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        var respond = testUtils.lastArg(adUnitWrapper.initAd);
        respond(fakeError);
        sinon.assert.calledWith(next, fakeError, adUnitWrapper, response);
      });
    });

    describe("setupEvents", function(){
      var tracker, adUnit, vastResponse, next;

      beforeEach(function(){
        tracker = sinon.createStubInstance(VASTTracker);
        sinon.stub(VPAIDIntegrator.prototype, '_createVASTTracker', function() {
          return tracker;
        });
        adUnit = new FakeAdUnit();
        vastResponse = new VASTResponse();
        next = sinon.spy();
        vpaidIntegrator._setupEvents(adUnit, vastResponse, next);
      });

      afterEach(function(){
        VPAIDIntegrator.prototype._createVASTTracker.restore();
      });

      it("must call next with no error and the passed adUnit and vastResponse", function(){
        sinon.assert.calledWithExactly(next, null, adUnit, vastResponse);
      });

      it("must create a tracker passing the adUnit src and the vast response", function(){
        sinon.assert.calledWithExactly(VPAIDIntegrator.prototype._createVASTTracker, adUnit.options.src, vastResponse);
      });

      it("must propagate adUnit events prepending the prefix 'vpaid.' to the evt type", function(){
        [
          'AdSkipped',
          'AdImpression',
          'AdStarted',
          'AdVideoStart',
          'AdPlaying',
          'AdPaused',
          'AdVideoFirstQuartile',
          'AdVideoMidpoint',
          'AdVideoThirdQuartile',
          'AdVideoComplete',
          'AdClickThru',
          'AdUserAcceptInvitation',
          'AdUserClose',
          'AdUserMinimize',
          'AdError',
          'AdVolumeChange'
        ].forEach(function (evtType) {
          var spy = sinon.spy();
          player.on('vpaid.'+ evtType, spy);
          adUnit.trigger(evtType, {});
          sinon.assert.calledOnce(spy);
        });

      });

      it("on 'AdSkipped' event, must track skip", function(){
        adUnit.trigger('AdSkipped');
        sinon.assert.calledOnce(tracker.trackSkip);
      });

      it("on 'AdImpression' event, must track impressions", function(){
        adUnit.trigger('AdImpression');
        sinon.assert.calledOnce(tracker.trackImpressions);
      });

      it("on 'AdVideoStart' event, must track start, resume the adUnit and trigger 'play' evt", function(){
        var playSpy = sinon.spy();
        player.on('play', playSpy);
        vpaidIntegrator._adUnit = {
          isPaused: utilities.echoFn(true)
        };
        adUnit.trigger('AdVideoStart');
        sinon.assert.calledOnce(tracker.trackStart);

        assert.isFalse(vpaidIntegrator._adUnit._paused);
        assert(playSpy.calledOnce);
      });

      it("on 'AdStarted' event, must track creativeView, resume the adUnit and trigger 'play' evt", function(){
        var playSpy = sinon.spy();
        player.on('play', playSpy);
        vpaidIntegrator._adUnit = {
          isPaused: utilities.echoFn(true)
        };
        adUnit.trigger('AdStarted');
        sinon.assert.calledOnce(tracker.trackCreativeView);
        assert.isFalse(vpaidIntegrator._adUnit._paused);
        assert(playSpy.calledOnce);
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

      describe("on 'AdClickThru',", function(){
        beforeEach(function(){
          sinon.stub(window, 'open');
        });

        afterEach(function(){
          window.open.restore();
        });

        it("must track click", function(){
          adUnit.trigger('AdClickThru', {});
          sinon.assert.calledOnce(tracker.trackClick);
        });

        it("must not open a new window if the playerHandles is false", function(){
          adUnit.trigger('AdClickThru', {url: 'fake/click/thru/url', playerHandles: false });
          sinon.assert.notCalled(window.open);
        });

        it("must open the url passed if the playerHandles flag is true", function(){
          adUnit.trigger('AdClickThru', {url: 'fake/click/thru/url', playerHandles: true });
          sinon.assert.calledWithExactly(window.open, 'fake/click/thru/url', '_blank');
        });

        it("must no open any window if there is no click thru url passed or in the vastResponse", function(){
          adUnit.trigger('AdClickThru', '', 1, true);
          sinon.assert.notCalled(window.open);
        });

        it("must use the vastResponse clickThru macro if no url is passed", function(){
          vastResponse.clickThrough = 'fake/click/thru/url/[ASSETURI]';
          adUnit.trigger('AdClickThru', {url: null, playerHandles: true });
          sinon.assert.calledWithExactly(window.open, 'fake/click/thru/url/fakeSrc', '_blank');
        });
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

      it("on 'AdPaused' event, must track pause, pause the adUnit and trigger 'pause' evt", function(){
        var pauseSpy = sinon.spy();
        player.on('pause', pauseSpy);
        vpaidIntegrator._adUnit = {};
        adUnit.trigger('AdPaused');
        sinon.assert.calledOnce(tracker.trackPause);

        assert(vpaidIntegrator._adUnit._paused);
        assert(pauseSpy.calledOnce);
      });

      it("on 'AdUserMinimize' event, must track collapse", function(){
        adUnit.trigger('AdUserMinimize');
        sinon.assert.calledOnce(tracker.trackCollapse);
      });

      it("on 'AdError' event, must track error with code 901", function(){
        adUnit.trigger('AdError');
        sinon.assert.calledWithExactly(tracker.trackErrorWithCode, 901);
      });

      it("on 'AdPlaying' event, must track resume, resume the adUnit and trigger 'play' evt", function(){
          var playSpy = sinon.spy();
          player.on('play', playSpy);
          vpaidIntegrator._adUnit = {
            isPaused: utilities.echoFn(true)
          };
          adUnit.trigger('AdPlaying');
          sinon.assert.calledOnce(tracker.trackResume);

          assert.isFalse(vpaidIntegrator._adUnit._paused);
          assert(playSpy.calledOnce);
      });

      describe("on 'AdVolumeChange' evt,", function(){
        beforeEach(function(){
          this.clock = sinon.useFakeTimers();
          sinon.stub(player, 'volume');
        });

        afterEach(function(){
          this.clock.restore();
        });

        it("must track mute if the volume was not 0 but gets updated to 0", function(){
          player.volume.returns(10);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.calledOnce(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 0);
        });

        it("must not track mute if the volume was already 0", function(){
          player.volume.returns(0);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
        });

        it("must tack unmute if the volume was 0 and changes to not cero", function(){
          player.volume.returns(0);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.calledOnce(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
        it("must not tack unmute if the volume was not 0 and changes to not cero", function(){
          player.volume.returns(5);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
      });

      it("must pause the ad unit on 'vpaid.pauseAd' evt", function(){
        player.trigger('vpaid.pauseAd');
        sinon.assert.calledOnce(adUnit.pauseAd);
      });

      it("must pause the ad unit on 'vpaid.resumeAd' evt", function(){
        player.trigger('vpaid.resumeAd');
        sinon.assert.calledOnce(adUnit.resumeAd);
      });

      it("must not pause or resume the adUnit after 'vaid.adEnd' event", function(){
        player.trigger('vpaid.adEnd');
        player.trigger('vpaid.resumeAd');
        player.trigger('vpaid.pauseAd');
        sinon.assert.notCalled(adUnit.resumeAd);
        sinon.assert.notCalled(adUnit.pauseAd);
      });
    });

    describe("addSkipButton", function(){
      var adUnit, vastResponse, next;

      beforeEach(function(){
        this.clock = sinon.useFakeTimers();
        adUnit = new FakeAdUnit();
        vastResponse = new VASTResponse();
        next = sinon.spy();
        vpaidIntegrator._addSkipButton(adUnit, vastResponse, next);
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must call next with no error and the passed adUnit and vastResponse", function(){
        sinon.assert.calledWithExactly(next, null, adUnit, vastResponse);
      });

      describe("on 'AdSkippableStateChange'", function(){
        it("must add the skip button if the adUnit is skippable", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();

          assert.isNotNull(player.el().querySelector('.vast-skip-button'));
        });

        it("must only add one skip button no matter how many 'AdSkippableStateChange' evts we receive while the adUnit is skippable", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();

          assert.equal(player.el().querySelectorAll('.vast-skip-button').length, 1);
        });

        it("must remove the skip button if the adUnit is no longer skippable", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.isSkippable = false;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          assert.isNull(player.el().querySelector('.vast-skip-button'));

        });

        it("must remove the adUnit when you click on the skip button", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();

          var skipButton = player.el().querySelector('.vast-skip-button');
          testUtils.click(skipButton);
          sinon.assert.calledOnce(adUnit.skipAd);
        });

        it("must remove the adUnit on 'vast.adEnd' event", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.isSkippable = false;
          player.trigger('vast.adEnd');
          this.clock.tick();
          assert.isNull(player.el().querySelector('.vast-skip-button'));
        });

        it("must remove the adUnit on 'vast.adsCancel' event", function(){
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.isSkippable = false;
          player.trigger('vast.adsCancel');
          this.clock.tick();
          assert.isNull(player.el().querySelector('.vast-skip-button'));
        });
      });

    });

    describe("findSupportedTech", function () {
      var originalHtml5;

      beforeEach(function() {
        originalHtml5 = VPAIDHTML5Tech.VPAIDHTML5Client;
        VPAIDHTML5Tech.VPAIDHTML5Client = {
          isSupported: function() {
            return true;
          }
        };
      });

      afterEach(function() {
        VPAIDHTML5Tech.VPAIDHTML5Client = originalHtml5;
      });

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

        it("must update the adUnit volume on 'volumechange'", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('volumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0.5);
        });

        it("must update the adUnit volume to 0 if the player is muted", function(){
          sinon.stub(player, 'muted').returns(true);
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('volumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0);
        });

        it("must update the player volume on 'AdVolumeChange'", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          var triggerAdVolumeChange = testUtils.lastArg(adUnitWrapper.on);
          triggerAdVolumeChange();
          var getAdVolumeHandler = testUtils.lastArg(adUnitWrapper.getAdVolume);
          getAdVolumeHandler(null, 0.1);
          sinon.assert.calledWith(player.volume, 0.1);
        });

        it("must unsubscribe on 'vpaid.adEnd' events", function () {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('vpaid.adEnd');
          player.trigger('volumechange');
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
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 300, 150, vpaidIntegrator.VIEW_MODE.NORMAL);

          player.isFullscreen.returns(true);
          player.trigger('fullscreenchange');
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 300, 150, vpaidIntegrator.VIEW_MODE.FULLSCREEN);
        });

        it("must unsubscribe on 'vpaid.adEnd' event", function () {
          sinon.stub(player, 'isFullscreen');
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('vpaid.adEnd');
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

        var startAdCb = testUtils.lastArg(adUnitWrapper.startAd);
        startAdCb(null);

        sinon.assert.calledWithExactly(callback, null, adUnitWrapper, vastResponse);
      });

      it("must trigger 'vast.adStart'", function () {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, utilities.noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adStart', callback);
        var startAdCb = testUtils.lastArg(adUnitWrapper.startAd);
        startAdCb(null);

        sinon.assert.calledOnce(callback);
      });

      it("must not trigger 'vast.adStart' if there is an error on startAd", function () {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, utilities.noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adStart', callback);
        var startAdCb = testUtils.lastArg(adUnitWrapper.startAd);
        startAdCb(new Error());

        sinon.assert.notCalled(callback);
      });
    });
  });

  describe("must support autoResize", function() {
    it("must handle window resize", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('resize'));
      assert(adUnit.resizeAd.calledOnce);
    });

    it("must handle window orientation change", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('orientationchange'));
      assert(adUnit.resizeAd.calledOnce);
    });

    it("must handle vast.resize", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      player.trigger('vast.resize');
      assert(adUnit.resizeAd.calledOnce);
    });

    it("must ignore resize and orientation change when the flag is off", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: false});
      var adUnit = new FakeAdUnit();
      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('orientationchange'));
      dom.dispatchEvent(window, new Event('resize'));
      assert.equal(adUnit.resizeAd.callCount, 0);
    });

    it("must not handle vast.resize after 'vpaid.adEnd' events", function(){
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      player.trigger('vpaid.adEnd');
      player.trigger('vast.resize');
      assert(adUnit.resizeAd.notCalled);
    });
  });

  describe("must finish destroy adUnit", function() {
    it("must destroy adUnit when AdStopped", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      var spy = sinon.spy();
      vpaidIntegrator._finishPlaying(adUnit, new VASTResponse(), spy);
      adUnit.trigger('AdStopped');
      assert(spy.calledOnce);
    });

    it("must destroy adUnit when AdStopped", function() {
      var vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      var adUnit = new FakeAdUnit();
      var spy = sinon.spy();
      vpaidIntegrator._finishPlaying(adUnit, new VASTResponse(), spy);
      adUnit.trigger('AdError');
      assert(spy.calledOnce);
    });
  });
});
