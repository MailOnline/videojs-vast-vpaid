const VPAIDAdUnitWrapper = require('../../../src/scripts/ads/vpaid/VPAIDAdUnitWrapper');
const VPAIDIntegrator = require('../../../src/scripts/ads/vpaid/VPAIDIntegrator');
const VPAIDFlashTech = require('../../../src/scripts/ads/vpaid/VPAIDFlashTech');
const VPAIDHTML5Tech = require('../../../src/scripts/ads/vpaid/VPAIDHTML5Tech');
const MediaFile = require('../../../src/scripts/ads/vast/MediaFile');
const VASTError = require('../../../src/scripts/ads/vast/VASTError');
const VASTResponse = require('../../../src/scripts/ads/vast/VASTResponse');
const VASTTracker = require('../../../src/scripts/ads/vast/VASTTracker');
const vastUtil = require('../../../src/scripts/ads/vast/vastUtil');
const dom = require('../../../src/scripts/utils/dom');
const utilities = require('../../../src/scripts/utils/utilityFunctions');
const xml = require('../../../src/scripts/utils/xml');
const testUtils = require('../../test-utils');

describe('VPAIDIntegrator', () => {
  let player, vpaidAdUnit, adUnitWrapper, testDiv;

  function FakeAdUnit () {
    const events = {};

    this.options = {
      src: 'fakeSrc'
    };
    this.volume = 0;
    this.isSkippable = false;

    this.resizeAd = sinon.spy();
    this.skipAd = sinon.spy();
    this.setVolume = function (vol) {
      this.volume = vol;
    };

    this.getAdVolume = function (fn) {
      const vol = this.volume;

      window.setTimeout(() => {
        fn(null, vol);
      }, 0);
    };

    this.on = function (evtName, handler) {
      if (!events[evtName]) {
        events[evtName] = [];
      }

      events[evtName].push(handler);
    };

    this.getAdSkippableState = function (fn) {
      const skippable = this.isSkippable;

      window.setTimeout(() => {
        fn(null, skippable);
      }, 0);
    };

    this.trigger = function () {
      const args = utilities.arrayLikeObjToArray(arguments);
      const evtName = args.shift();
      const handlers = events[evtName];

      if (handlers) {
        handlers.forEach((handler) => {
          handler(...args);
        });
      }
    };

    this.pauseAd = sinon.spy();
    this.resumeAd = sinon.spy();
  }

  beforeEach(() => {
    testDiv = document.createElement('div');
    document.body.appendChild(testDiv);
    const videoEl = document.createElement('video');

    testDiv.appendChild(videoEl);

    player = videojs(videoEl, {});
    dom.addClass(player.el(), 'vjs-test-player');
    vpaidAdUnit = {
      handshakeVersion: utilities.noop,
      initAd: utilities.noop,
      startAd: utilities.noop,
      stopAd: utilities.noop,
      skipAd: utilities.noop,
      resizeAd: utilities.noop,
      pauseAd: utilities.noop,
      expandAd: utilities.noop,
      collapseAd: utilities.noop,
      subscribe: utilities.noop,
      unsubscribe: utilities.noop,
      unloadAdUnit: utilities.noop,
      on: sinon.spy()
    };
    adUnitWrapper = new VPAIDAdUnitWrapper(vpaidAdUnit, {responseTimeout: 5000});
  });

  afterEach(() => {
    dom.remove(testDiv);
  });

  it('must return an instance of itself', () => {
    assert.instanceOf(new VPAIDIntegrator(player), VPAIDIntegrator);
  });

  describe('instance', () => {
    let vpaidIntegrator, callback, FakeTech, vastResponse;

    function createMediaFile (url, type) {
      const xmlStr = '<MediaFile delivery="progressive" type="' + type + '" apiFramework="VPAID">' +
        '<![CDATA[' + url + ']]>' +
        '</MediaFile>';

      return new MediaFile(xml.toJXONTree(xmlStr));
    }

    beforeEach(function () {
      const mediaFile = createMediaFile('http://fakeMediaFile', 'application/x-fake');

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

    describe('playAd', () => {
      let loadAdUnit, playAdUnit, finishPlaying;

      beforeEach(function () {
        FakeTech.supports.returns(true);
        vastUtil.VPAID_techs.unshift(FakeTech);

        loadAdUnit = testUtils.stubAsyncStep(vpaidIntegrator, '_loadAdUnit', this.clock);
        playAdUnit = testUtils.stubAsyncStep(vpaidIntegrator, '_playAdUnit', this.clock);
        finishPlaying = testUtils.stubAsyncStep(vpaidIntegrator, '_finishPlaying', this.clock);
      });

      afterEach(() => {
        vastUtil.VPAID_techs.shift();
      });

      it('must complain if you don\'t pass a VASTResponse', () => {
        vpaidIntegrator.playAd(null, callback);
        sinon.assert.calledOnce(callback);
        const error = testUtils.firstArg(callback);

        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VASTIntegrator.playAd, missing required VASTResponse');
      });

      it('must trigger an error if could not find a supported mediaFile', () => {
        sinon.stub(vastUtil, 'track');
        vastResponse._addErrorTrackUrl(xml.toJXONTree('<Error><![CDATA[https://fakeErrorUrl&error_code=[ERRORCODE]]]></Error>'));

        FakeTech.supports.returns(false);
        vpaidIntegrator.playAd(vastResponse, callback);
        sinon.assert.calledOnce(callback);
        const error = testUtils.firstArg(callback);

        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator.playAd, could not find a supported mediaFile');
        sinon.assert.calledWithExactly(vastUtil.track, ['https://fakeErrorUrl&error_code=[ERRORCODE]'], {ERRORCODE: 403});
        vastUtil.track.restore();
      });

      it('must trigger a vpaid.adEnd evt on vast.adsCancel evt', () => {
        const spy = sinon.spy();

        player.on('vpaid.adEnd', spy);
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('vast.adsCancel');
        assert.isTrue(spy.calledOnce);
      });

      it('must NOT trigger a vpaid.adEnd evt twice', () => {
        const spy = sinon.spy();

        player.on('vpaid.adEnd', spy);
        vpaidIntegrator.playAd(vastResponse, callback);
        player.trigger('vast.adsCancel');
        player.trigger('vast.adsCancel');
        assert.isTrue(spy.calledOnce);
      });

      it('must add \'vjs-vpaid-ad\' class to the player element', () => {
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        vpaidIntegrator.playAd(vastResponse, callback);
        assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      it('must remove \'vjs-vpaid-ad\' class once the adUnit finish playing', function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick();

        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
      });

      ['vast.adsCancel', 'vpaid.adEnd'].forEach((evt) => {
        it('must remove \'vjs-vpaid-ad\' class if there is  an \'' + evt + '\' event', function () {
          vpaidIntegrator.playAd(vastResponse, callback);
          player.trigger(evt);
          this.clock.tick();
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-ad'));
        });

        it('must unload the adUnit if there is an \'' + evt + '\' event', function () {
          vpaidIntegrator.playAd(vastResponse, callback);
          player.trigger(evt);
          this.clock.tick();
          sinon.assert.calledOnce(FakeTech.prototype.unloadAdUnit);
        });
      });

      it('must unload the adUnit if the ad finishes playing', function () {
        vpaidIntegrator.playAd(vastResponse, callback);
        this.clock.tick();
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);
        sinon.assert.calledOnce(FakeTech.prototype.unloadAdUnit);
      });

      it('must trigger \'vpaid.adEnd\'', function () {
        player.on('vpaid.adEnd', callback);
        vpaidIntegrator.playAd(vastResponse, utilities.noop);
        this.clock.tick();
        loadAdUnit.flush(null, vpaidAdUnit, vastResponse);
        playAdUnit.flush(null, vpaidAdUnit, vastResponse);
        finishPlaying.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledOnce(callback);
      });

      describe('return obj', () => {
        it('must have the type VPAID', () => {
          const adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);

          assert.equal(adUnit.type, 'VPAID');
        });

        it('must trigger the vpaid.pauseAd evt', () => {
          const adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          const spy = sinon.spy();

          sinon.stub(player, 'pause');
          player.on('vpaid.pauseAd', spy);
          adUnit.pauseAd();
          sinon.assert.calledOnce(spy);
          sinon.assert.calledOnce(player.pause);
          player.pause.restore();
        });

        it('must trigger the vpaid.resumeAd evt', () => {
          const adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);
          const spy = sinon.spy();

          player.on('vpaid.resumeAd', spy);
          adUnit.resumeAd();
          sinon.assert.calledOnce(spy);
        });

        it('must know if it is paused', () => {
          const adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);

          assert(adUnit.isPaused());
          adUnit._paused = false;
          assert(!adUnit.isPaused());
        });

        it('must be able to return the source of the ad', () => {
          const adUnit = vpaidIntegrator.playAd(vastResponse, utilities.noop);

          assert.equal(adUnit.getSrc(), FakeTech.prototype.mediaFile);
        });
      });
    });

    describe('loadAdUnit', () => {
      it('must pass the containerEl', () => {
        const testTech = new FakeTech();

        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        sinon.assert.calledWithExactly(testTech.loadAdUnit, vpaidIntegrator.containerEl, player.el().querySelector('.vjs-tech'), sinon.match.func);
      });

      it('must pass the error if there is an error loading the ad unit', () => {
        const testTech = new FakeTech();

        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        const techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);
        const fakeTechNativeError = new Error('error loading the ad unit.');

        techLoadAdUnitCb(fakeTechNativeError, undefined);
        sinon.assert.calledWithExactly(callback, fakeTechNativeError, undefined, vastResponse);
      });

      it('must pass the error, a wrapped adUnit and the vast response to the callback', () => {
        const testTech = new FakeTech();

        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        const techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);

        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, null, sinon.match.instanceOf(VPAIDAdUnitWrapper), vastResponse);
      });

      it('must pass the error if there is a problem creating the VPAIDAdUnitWrapper', () => {
        const testTech = new FakeTech();

        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        const techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);

        // We make the adUnit invalid
        vpaidAdUnit.initAd = undefined;

        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, sinon.match.instanceOf(VASTError), vpaidAdUnit, vastResponse);
        const error = testUtils.firstArg(callback);

        assert.equal(error.message, 'VAST Error: on VPAIDAdUnitWrapper, the passed VPAID adUnit does not fully implement the VPAID interface');
      });

      it('must add the tech class to the player and remove it on \'vpaid.adEnd\' event', () => {
        const testTech = new FakeTech();
        const fakeAdUnit = {};

        sinon.stub(VPAIDIntegrator.prototype, '_createVPAIDAdUnitWrapper').returns(fakeAdUnit);
        vpaidIntegrator._loadAdUnit(testTech, vastResponse, callback);
        const techLoadAdUnitCb = testUtils.thirdArg(testTech.loadAdUnit);

        // We make the adUnit invalid
        vpaidAdUnit.initAd = undefined;

        techLoadAdUnitCb(null, vpaidAdUnit);
        sinon.assert.calledWithExactly(callback, null, fakeAdUnit, vastResponse);
        assert.isTrue(dom.hasClass(player.el(), 'vjs-vpaid-fake-ad'));
        player.trigger('vpaid.adEnd');
        assert.isFalse(dom.hasClass(player.el(), 'vjs-vpaid-fake-ad'));
        VPAIDIntegrator.prototype._createVPAIDAdUnitWrapper.restore();
      });
    });

    describe('playAdUnit', () => {
      let initAd, setupEvents, startAd, handshake;

      beforeEach(function () {
        handshake = testUtils.stubAsyncStep(vpaidIntegrator, '_handshake', this.clock);
        initAd = testUtils.stubAsyncStep(vpaidIntegrator, '_initAd', this.clock);
        setupEvents = testUtils.stubAsyncStep(vpaidIntegrator, '_setupEvents', this.clock);
        startAd = testUtils.stubAsyncStep(vpaidIntegrator, '_startAd', this.clock);
      });

      it('must exec the steps to play the adUnit', function () {
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

      it('must call the adUnit with the error, adUnit and vastResponse', function () {
        vpaidIntegrator._playAdUnit(vpaidAdUnit, vastResponse, callback);
        this.clock.tick();
        handshake.flush(null, vpaidAdUnit, vastResponse);
        initAd.flush(null, vpaidAdUnit, vastResponse);
        setupEvents.flush(null, vpaidAdUnit, vastResponse);
        startAd.flush(null, vpaidAdUnit, vastResponse);

        sinon.assert.calledWithExactly(callback, null, vpaidAdUnit, vastResponse);
      });
    });

    describe('handshake', () => {
      let next, response;

      beforeEach(() => {
        sinon.spy(vpaidAdUnit, 'handshakeVersion');
        next = sinon.spy();
        response = new VASTResponse();
      });

      it('must pass an error to the callback if the VPAID version is smaller than 1.0', () => {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        const respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);

        respond(null, '0.0.0');
        sinon.assert.calledOnce(next);
        const error = testUtils.firstArg(next);

        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "0.0.0"');
      });

      it('must pass an error to the callback if the VPAID version is bigger than 2.x.x', () => {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        const respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);

        respond(null, '3.0.0');
        sinon.assert.calledOnce(next);
        const error = testUtils.firstArg(next);

        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "3.0.0"');
      });

      it('must pass an error to the callback if the handshake returns an error', () => {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        const respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);
        const fakeError = new Error();

        respond(fakeError);
        sinon.assert.calledWith(next, fakeError);
      });

      it('must call the callback with null and the adUnit and the VASTResponse if the version is supported', () => {
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        const respond = testUtils.secondArg(vpaidAdUnit.handshakeVersion);

        respond(null, '2.0');
        sinon.assert.calledOnce(next);
        sinon.assert.calledWithExactly(next, null, adUnitWrapper, response);
      });
    });

    describe('initAd', () => {
      let response;

      beforeEach(() => {
        response = new VASTResponse();
        sinon.spy(adUnitWrapper, 'initAd');
        sinon.stub(dom, 'getDimension').returns(
          {
            width: 720,
            height: 480
          }
        );
      });

      afterEach(() => {
        dom.getDimension.restore();
      });

      it('must call pass the with, height, viewmode, desired bitrate, and creativeData to the adUnit\'s initAd', () => {
        const next = sinon.spy();

        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, sinon.match({AdParameters: ''}), sinon.match.func);
      });

      it('must pass the add parameters if present on the VASTResponse', () => {
        const next = sinon.spy();

        response.adParameters = 'some params';
        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, sinon.match({AdParameters: 'some params'}), sinon.match.func);
      });

      it('must propagate any error that may come from the adUnit and pass the adUnit and the VASTResponse', () => {
        const next = sinon.spy();
        const fakeError = new Error();

        vpaidIntegrator._initAd(adUnitWrapper, response, next);
        const respond = testUtils.lastArg(adUnitWrapper.initAd);

        respond(fakeError);
        sinon.assert.calledWith(next, fakeError, adUnitWrapper, response);
      });
    });

    describe('setupEvents', () => {
      let tracker, adUnit, vastResponse, next;

      beforeEach(() => {
        tracker = sinon.createStubInstance(VASTTracker);
        sinon.stub(VPAIDIntegrator.prototype, '_createVASTTracker', () => {
          return tracker;
        });
        adUnit = new FakeAdUnit();
        vastResponse = new VASTResponse();
        next = sinon.spy();
        vpaidIntegrator._setupEvents(adUnit, vastResponse, next);
      });

      afterEach(() => {
        VPAIDIntegrator.prototype._createVASTTracker.restore();
      });

      it('must call next with no error and the passed adUnit and vastResponse', () => {
        sinon.assert.calledWithExactly(next, null, adUnit, vastResponse);
      });

      it('must create a tracker passing the adUnit src and the vast response', () => {
        sinon.assert.calledWithExactly(VPAIDIntegrator.prototype._createVASTTracker, adUnit.options.src, vastResponse);
      });

      it('must propagate adUnit events prepending the prefix \'vpaid.\' to the evt type', () => {
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
        ].forEach((evtType) => {
          const spy = sinon.spy();

          player.on('vpaid.' + evtType, spy);
          adUnit.trigger(evtType, {});
          sinon.assert.calledOnce(spy);
        });
      });

      it('on \'AdSkipped\' event, must track skip', () => {
        adUnit.trigger('AdSkipped');
        sinon.assert.calledOnce(tracker.trackSkip);
      });

      it('on \'AdImpression\' event, must track impressions', () => {
        adUnit.trigger('AdImpression');
        sinon.assert.calledOnce(tracker.trackImpressions);
      });

      it('on \'AdVideoStart\' event, must track start, resume the adUnit and trigger \'play\' evt', () => {
        const playSpy = sinon.spy();

        player.on('play', playSpy);
        vpaidIntegrator._adUnit = {
          isPaused: utilities.echoFn(true)
        };
        adUnit.trigger('AdVideoStart');
        sinon.assert.calledOnce(tracker.trackStart);

        assert.isFalse(vpaidIntegrator._adUnit._paused);
        assert(playSpy.calledOnce);
      });

      it('on \'AdStarted\' event, must track creativeView, resume the adUnit and trigger \'play\' evt', () => {
        const playSpy = sinon.spy();

        player.on('play', playSpy);
        vpaidIntegrator._adUnit = {
          isPaused: utilities.echoFn(true)
        };
        adUnit.trigger('AdStarted');
        sinon.assert.calledOnce(tracker.trackCreativeView);
        assert.isFalse(vpaidIntegrator._adUnit._paused);
        assert(playSpy.calledOnce);
      });

      it('on \'AdVideoFirstQuartile\' event, must track first quartile', () => {
        adUnit.trigger('AdVideoFirstQuartile');
        sinon.assert.calledOnce(tracker.trackFirstQuartile);
      });

      it('on \'AdVideoMidpoint\' event, must track midpoint', () => {
        adUnit.trigger('AdVideoMidpoint');
        sinon.assert.calledOnce(tracker.trackMidpoint);
      });

      it('on \'AdVideoThirdQuartile\' event, must track third quartile', () => {
        adUnit.trigger('AdVideoThirdQuartile');
        sinon.assert.calledOnce(tracker.trackThirdQuartile);
      });

      it('on \'AdVideoComplete\' event, must track complete', () => {
        adUnit.trigger('AdVideoComplete');
        sinon.assert.calledOnce(tracker.trackComplete);
      });

      describe('on \'AdClickThru\',', () => {
        beforeEach(() => {
          sinon.stub(window, 'open');
        });

        afterEach(() => {
          window.open.restore();
        });

        it('must track click', () => {
          adUnit.trigger('AdClickThru', {});
          sinon.assert.calledOnce(tracker.trackClick);
        });

        it('must not open a new window if the playerHandles is false', () => {
          adUnit.trigger('AdClickThru', {url: 'fake/click/thru/url', playerHandles: false});
          sinon.assert.notCalled(window.open);
        });

        it('must open the url passed if the playerHandles flag is true', () => {
          adUnit.trigger('AdClickThru', {url: 'fake/click/thru/url', playerHandles: true});
          sinon.assert.calledWithExactly(window.open, 'fake/click/thru/url', '_blank');
        });

        it('must no open any window if there is no click thru url passed or in the vastResponse', () => {
          adUnit.trigger('AdClickThru', '', 1, true);
          sinon.assert.notCalled(window.open);
        });

        it('must use the vastResponse clickThru macro if no url is passed', () => {
          vastResponse.clickThrough = 'fake/click/thru/url/[ASSETURI]';
          adUnit.trigger('AdClickThru', {url: null, playerHandles: true});
          sinon.assert.calledWithExactly(window.open, 'fake/click/thru/url/fakeSrc', '_blank');
        });
      });

      it('on \'AdUserAcceptInvitation\' event, must track acceptInvitation', () => {
        adUnit.trigger('AdUserAcceptInvitation');
        sinon.assert.calledOnce(tracker.trackAcceptInvitation);
        sinon.assert.calledOnce(tracker.trackAcceptInvitationLinear);
      });

      it('on \'AdUserClose\' event, must track close', () => {
        adUnit.trigger('AdUserClose');
        sinon.assert.calledOnce(tracker.trackClose);
        sinon.assert.calledOnce(tracker.trackCloseLinear);
      });

      it('on \'AdPaused\' event, must track pause, pause the adUnit and trigger \'pause\' evt', () => {
        const pauseSpy = sinon.spy();

        player.on('pause', pauseSpy);
        vpaidIntegrator._adUnit = {};
        adUnit.trigger('AdPaused');
        sinon.assert.calledOnce(tracker.trackPause);

        assert(vpaidIntegrator._adUnit._paused);
        assert(pauseSpy.calledOnce);
      });

      it('on \'AdUserMinimize\' event, must track collapse', () => {
        adUnit.trigger('AdUserMinimize');
        sinon.assert.calledOnce(tracker.trackCollapse);
      });

      it('on \'AdError\' event, must track error with code 901', () => {
        adUnit.trigger('AdError');
        sinon.assert.calledWithExactly(tracker.trackErrorWithCode, 901);
      });

      it('on \'AdPlaying\' event, must track resume, resume the adUnit and trigger \'play\' evt', () => {
        const playSpy = sinon.spy();

        player.on('play', playSpy);
        vpaidIntegrator._adUnit = {
          isPaused: utilities.echoFn(true)
        };
        adUnit.trigger('AdPlaying');
        sinon.assert.calledOnce(tracker.trackResume);

        assert.isFalse(vpaidIntegrator._adUnit._paused);
        assert(playSpy.calledOnce);
      });

      describe('on \'AdVolumeChange\' evt,', () => {
        beforeEach(function () {
          this.clock = sinon.useFakeTimers();
          sinon.stub(player, 'volume');
        });

        afterEach(function () {
          this.clock.restore();
        });

        it('must track mute if the volume was not 0 but gets updated to 0', function () {
          player.volume.returns(10);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.calledOnce(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 0);
        });

        it('must not track mute if the volume was already 0', function () {
          player.volume.returns(0);
          adUnit.setVolume(0);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
        });

        it('must tack unmute if the volume was 0 and changes to not cero', function () {
          player.volume.returns(0);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.calledOnce(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
        it('must not tack unmute if the volume was not 0 and changes to not cero', function () {
          player.volume.returns(5);
          adUnit.setVolume(10);
          adUnit.trigger('AdVolumeChange');
          this.clock.tick();
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
          sinon.assert.calledWithExactly(player.volume, 10);
        });
      });

      it('must pause the ad unit on \'vpaid.pauseAd\' evt', () => {
        player.trigger('vpaid.pauseAd');
        sinon.assert.calledOnce(adUnit.pauseAd);
      });

      it('must pause the ad unit on \'vpaid.resumeAd\' evt', () => {
        player.trigger('vpaid.resumeAd');
        sinon.assert.calledOnce(adUnit.resumeAd);
      });

      it('must not pause or resume the adUnit after \'vaid.adEnd\' event', () => {
        player.trigger('vpaid.adEnd');
        player.trigger('vpaid.resumeAd');
        player.trigger('vpaid.pauseAd');
        sinon.assert.notCalled(adUnit.resumeAd);
        sinon.assert.notCalled(adUnit.pauseAd);
      });
    });

    describe('addSkipButton', () => {
      let adUnit, vastResponse, next;

      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
        adUnit = new FakeAdUnit();
        vastResponse = new VASTResponse();
        next = sinon.spy();
        vpaidIntegrator._addSkipButton(adUnit, vastResponse, next);
      });

      afterEach(function () {
        this.clock.restore();
      });

      it('must call next with no error and the passed adUnit and vastResponse', () => {
        sinon.assert.calledWithExactly(next, null, adUnit, vastResponse);
      });

      describe('on \'AdSkippableStateChange\'', () => {
        it('must add the skip button if the adUnit is skippable', function () {
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();

          assert.isNotNull(player.el().querySelector('.vast-skip-button'));
        });

        it('must only add one skip button no matter how many \'AdSkippableStateChange\' evts we receive while the adUnit is skippable', function () {
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

        it('must remove the skip button if the adUnit is no longer skippable', function () {
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.isSkippable = false;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          assert.isNull(player.el().querySelector('.vast-skip-button'));
        });

        it('must remove the adUnit when you click on the skip button', function () {
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();

          const skipButton = player.el().querySelector('.vast-skip-button');

          testUtils.click(skipButton);
          sinon.assert.calledOnce(adUnit.skipAd);
        });

        it('must remove the adUnit on \'vast.adEnd\' event', function () {
          adUnit.isSkippable = true;
          adUnit.trigger('AdSkippableStateChange');
          this.clock.tick();
          adUnit.isSkippable = false;
          player.trigger('vast.adEnd');
          this.clock.tick();
          assert.isNull(player.el().querySelector('.vast-skip-button'));
        });

        it('must remove the adUnit on \'vast.adsCancel\' event', function () {
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

    describe('findSupportedTech', () => {
      const FLASH_APP_MIME = 'application/x-shockwave-flash';
      const JS_APP_MIME = 'application/javascript';
      let originalFlash, originalHtml5;

      beforeEach(() => {
        originalFlash = VPAIDFlashTech.VPAIDFLASHClient;
        originalHtml5 = VPAIDHTML5Tech.VPAIDHTML5Client;
        VPAIDFlashTech.VPAIDFLASHClient = {
          isSupported: function () {
            return true;
          }
        };

        VPAIDHTML5Tech.VPAIDHTML5Client = {
          isSupported: function () {
            return true;
          }
        };
      });

      afterEach(() => {
        VPAIDFlashTech.VPAIDFLASHClient = originalFlash;
        VPAIDHTML5Tech.VPAIDHTML5Client = originalHtml5;
      });

      it('must return null if you pass a wrong vastREsponse', () => {
        [undefined, null, [], {}, ''].forEach((wrongResponse) => {
          assert.isNull(vpaidIntegrator._findSupportedTech(wrongResponse));
        });
      });

      it('must return null if the passed vast response is not supported', () => {
        const vastResponse = new VASTResponse();

        assert.isNull(vpaidIntegrator._findSupportedTech(vastResponse));

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', 'application/fake-type')]);
        assert.isNull(vpaidIntegrator._findSupportedTech(vastResponse));
      });

      it('must return null if the tech is not supported', () => {
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME)]);

        sinon.stub(VPAIDFlashTech.VPAIDFLASHClient, 'isSupported', () => { return false; });

        assert.isNull(vpaidIntegrator._findSupportedTech(vastResponse));
      });

      it('must return an instance of the supported tech', () => {
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME)]);

        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse), VPAIDFlashTech);
      });

      it('must pass the settings to the to the created tech', () => {
        const settings = {vpaidFlashLoaderPath: '/VPAIDFlash.swf'};
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME)]);
        const flashTech = vpaidIntegrator._findSupportedTech(vastResponse, settings);

        assert.deepEqual(flashTech.settings, settings);
      });

      it('must return preferred tech if supported and available', () => {
        const settings = {preferredTech: 'html5'};
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME), createMediaFile('http://anotherFakeVideoFile', JS_APP_MIME)]);
        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse, settings), VPAIDHTML5Tech);
      });

      it('must return preferred tech if supported and available', () => {
        const settings = {preferredTech: 'flash'};
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME), createMediaFile('http://anotherFakeVideoFile', JS_APP_MIME)]);
        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse, settings), VPAIDFlashTech);
      });

      it('must return supported tech even if preferred tech is not available', () => {
        const settings = {preferredTech: 'html5'};
        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME)]);
        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse, settings), VPAIDFlashTech);
      });

      it('must return available, supported tech if preferred tech is not supported', () => {
        const settings = {preferredTech: 'flash'};

        VPAIDFlashTech.VPAIDFLASHClient = {
          isSupported: function () {
            return false;
          }
        };

        const vastResponse = new VASTResponse();

        vastResponse._addMediaFiles([createMediaFile('http://fakeVideoFile', FLASH_APP_MIME), createMediaFile('http://anotherFakeVideoFile', JS_APP_MIME)]);
        assert.instanceOf(vpaidIntegrator._findSupportedTech(vastResponse, settings), VPAIDHTML5Tech);
      });
    });

    describe('linkPlayerControls', () => {
      describe('volume control', () => {
        beforeEach(() => {
          sinon.stub(adUnitWrapper, 'setAdVolume');
          sinon.stub(adUnitWrapper, 'getAdVolume');
          sinon.stub(adUnitWrapper, 'on');
          sinon.stub(player, 'volume').returns(0.5);
        });

        it('must call the callback with null, adUnit and vast response', () => {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          sinon.assert.calledWithExactly(callback, null, adUnitWrapper, vastResponse);
        });

        it('must update the adUnit volume on \'volumechange\'', () => {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('volumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0.5);
        });

        it('must update the adUnit volume to 0 if the player is muted', () => {
          sinon.stub(player, 'muted').returns(true);
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('volumechange');
          sinon.assert.calledWith(adUnitWrapper.setAdVolume, 0);
        });

        it('must update the player volume on \'AdVolumeChange\'', () => {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          const triggerAdVolumeChange = testUtils.lastArg(adUnitWrapper.on);

          triggerAdVolumeChange();
          const getAdVolumeHandler = testUtils.lastArg(adUnitWrapper.getAdVolume);

          getAdVolumeHandler(null, 0.1);
          sinon.assert.calledWith(player.volume, 0.1);
        });

        it('must unsubscribe on \'vpaid.adEnd\' events', () => {
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('vpaid.adEnd');
          player.trigger('volumechange');
          sinon.assert.notCalled(adUnitWrapper.setAdVolume);
        });
      });

      describe('fullscreen change', () => {
        beforeEach(() => {
          sinon.stub(adUnitWrapper, 'resizeAd');
        });

        it('must resize the adUnit on fullscreenchange', () => {
          sinon.stub(player, 'isFullscreen');
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('fullscreenchange');
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 300, 150, vpaidIntegrator.VIEW_MODE.NORMAL);

          player.isFullscreen.returns(true);
          player.trigger('fullscreenchange');
          sinon.assert.calledWith(adUnitWrapper.resizeAd, 300, 150, vpaidIntegrator.VIEW_MODE.FULLSCREEN);
        });

        it('must unsubscribe on \'vpaid.adEnd\' event', () => {
          sinon.stub(player, 'isFullscreen');
          vpaidIntegrator._linkPlayerControls(adUnitWrapper, vastResponse, callback);
          player.trigger('vpaid.adEnd');
          player.trigger('fullscreenchange');
          sinon.assert.notCalled(adUnitWrapper.resizeAd);
        });
      });
    });

    describe('startAd', () => {
      it('must call adUnit.startAd and pass the adUnit and vastResponse to the callback', () => {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, callback);

        sinon.assert.calledOnce(adUnitWrapper.startAd);

        const startAdCb = testUtils.lastArg(adUnitWrapper.startAd);

        startAdCb(null);

        sinon.assert.calledWithExactly(callback, null, adUnitWrapper, vastResponse);
      });

      it('must trigger \'vast.adStart\'', () => {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, utilities.noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adStart', callback);
        const startAdCb = testUtils.lastArg(adUnitWrapper.startAd);

        startAdCb(null);

        sinon.assert.calledOnce(callback);
      });

      it('must not trigger \'vast.adStart\' if there is an error on startAd', () => {
        sinon.stub(adUnitWrapper, 'startAd');
        vpaidIntegrator._startAd(adUnitWrapper, vastResponse, utilities.noop);
        sinon.assert.calledOnce(adUnitWrapper.startAd);

        player.on('vast.adStart', callback);
        const startAdCb = testUtils.lastArg(adUnitWrapper.startAd);

        startAdCb(new Error());

        sinon.assert.notCalled(callback);
      });
    });
  });

  describe('must support autoResize', () => {
    it('must handle window resize', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();

      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('resize'));
      assert(adUnit.resizeAd.calledOnce);
    });

    it('must handle window orientation change', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();

      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('orientationchange'));
      assert(adUnit.resizeAd.calledOnce);
    });

    it('must handle vast.resize', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();

      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      player.trigger('vast.resize');
      assert(adUnit.resizeAd.calledOnce);
    });

    it('must ignore resize and orientation change when the flag is off', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: false});
      const adUnit = new FakeAdUnit();

      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      dom.dispatchEvent(window, new Event('orientationchange'));
      dom.dispatchEvent(window, new Event('resize'));
      assert.equal(adUnit.resizeAd.callCount, 0);
    });

    it('must not handle vast.resize after \'vpaid.adEnd\' events', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();

      vpaidIntegrator._setupEvents(adUnit, new VASTResponse(), utilities.noop);
      player.trigger('vpaid.adEnd');
      player.trigger('vast.resize');
      assert(adUnit.resizeAd.notCalled);
    });
  });

  describe('must finish destroy adUnit', () => {
    it('must destroy adUnit when AdStopped', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();
      const spy = sinon.spy();

      vpaidIntegrator._finishPlaying(adUnit, new VASTResponse(), spy);
      adUnit.trigger('AdStopped');
      assert(spy.calledOnce);
    });

    it('must destroy adUnit when AdStopped', () => {
      const vpaidIntegrator = new VPAIDIntegrator(player, {autoResize: true});
      const adUnit = new FakeAdUnit();
      const spy = sinon.spy();

      vpaidIntegrator._finishPlaying(adUnit, new VASTResponse(), spy);
      adUnit.trigger('AdError');
      assert(spy.calledOnce);
    });
  });
});
