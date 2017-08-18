var MediaFile = require('ads/vast/MediaFile');
var VASTClient = require('ads/vast/VASTClient');
var VASTError = require('ads/vast/VASTError');
var VASTIntegrator = require('ads/vast/VASTIntegrator');
var VASTResponse = require('ads/vast/VASTResponse');
var vastUtil = require('ads/vast/vastUtil');

var dom = require('utils/dom');
var playerUtils = require('utils/playerUtils');
var utilities = require('utils/utilityFunctions');
var xml = require('utils/xml');

var testUtils = require('../test-utils');

var videoJsVersion = parseInt(videojs.VERSION.split('.')[0], 10);

if(videoJsVersion === 5) {
  require('videojs_6.vast.vpaid');
}

describe("videojs.vast plugin", function () {
  var testDiv, videoEl, player;

  function assertError(callback, msg, code) {
    var error = testUtils.firstArg(callback).error;

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

  function assertVASTTrackRequest(URLs, variables) {
    URLs = utilities.isArray(URLs) ? URLs : [URLs];
    sinon.assert.calledOnce(vastUtil.track);
    sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
  }

  function assertTriggersTrackError(fn, msg, code, vastResponse) {
    var adsCanceledSpy = sinon.spy();
    var vastAdErrorSpy = sinon.spy();
    player.on('vast.adError', vastAdErrorSpy);
    player.on('vast.adsCancel', adsCanceledSpy);

    fn();

    assertError(vastAdErrorSpy, msg, code);
    if (code && vastResponse) {
      assertVASTTrackRequest(vastResponse.errorURLMacros, {ERRORCODE: code});
    }
    sinon.assert.called(adsCanceledSpy);
  }

  beforeEach(function () {
    window.iPhone = false;
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

  it("must trigger 'vast.adError' event with an explanatory error if there was a problem initializing the ads", function () {
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});

    player.on('vast.adError', spy);
    player.vastClient();
    sinon.assert.calledOnce(spy);
    assertError(spy, 'on VideoJS VAST plugin, missing adTagUrl on options object');
  });

  it("must not trigger 'vast.adError' if the adTagUrl is passed as part of the options", function () {
    var vastErrorSpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('vast.adError', vastErrorSpy);
    player.vastClient({adTagUrl: 'http://fake.ad.url'});
    sinon.assert.notCalled(vastErrorSpy);
  });

  it("must not trigger 'vast.adError' if the adTagXML is defined as part of the options", function(){
    var vastErrorSpy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('vast.adError', vastErrorSpy);
    player.vastClient({adTagXML: utilities.noop});
    sinon.assert.notCalled(vastErrorSpy);
  });

  it("must trigger a 'vast.adError' if the passed adTagXML is not a function", function(){
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});

    player.on('vast.adError', spy);
    player.vastClient({adTagXML: 'NOT A FUNCTION'});
    sinon.assert.calledOnce(spy);
    assertError(spy, 'on VideoJS VAST plugin, the passed adTagXML option does not contain a function');
  });

  it("must cancel the ads on 'vast.reset' evt", function(){
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    player.on('vast.adsCancel', spy);
    player.vastClient({adTagUrl: 'http://fake.ad.url'});
    player.trigger('vast.reset');
    sinon.assert.calledOnce(spy);
  });

  describe("playAdAlways option", function () {
    var resetSpy;

    beforeEach(function () {
      this.clock = sinon.useFakeTimers();
      player = videojs(document.createElement('video'), {});
      resetSpy = sinon.spy();
    });

    afterEach(function(done){
      this.clock.restore();
      done();
    });

    it("set to true, must reset plugin 'vast.firstPlay' event", function () {
      player.vastClient({
        adTagUrl: utilities.echoFn('/fake.ad.url'),
        playAdAlways: true
      });
      player.on('vast.reset', resetSpy);
      //We simulate we finish playing the video.
      player.trigger('vast.contentEnd');
      this.clock.tick();
      sinon.assert.calledOnce(resetSpy);
    });

    it("set to false, must try not play a new ad every time the user replays the ad", function () {
      player.vastClient({
        adTagUrl: utilities.echoFn('/fake.ad.url'),
        playAdAlways: false
      });

      player.on('vast.reset', resetSpy);
      //We simulate we finish playing the video.
      player.trigger('vast.contentEnd');
      this.clock.tick();
      sinon.assert.notCalled(resetSpy);
    });
  });

  describe("player.vast", function () {
    var vastAd;

    beforeEach(function () {
      player = videojs(document.createElement('video'), {});
      vastAd = player.vastClient({adTagUrl: 'http://fake.ad.url'});
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

  describe("on 'vast.firstPlay' event", function(){
    var clock;

    beforeEach(function () {
      clock = sinon.useFakeTimers();
      player = videojs(document.createElement('video'), {});
      player.vastClient({
        adTagUrl: utilities.echoFn('/fake.ad.url'),
        playAdAlways: true
      });
    });

    afterEach(function(done){
      clock.restore();
      done();
    });

    it("must cancel the ads if the ads are not enabled", function(){
      var adsCanceled = sinon.spy();
      player.on('vast.adsCancel', adsCanceled);
      player.vast.disable();
      player.trigger('vast.firstPlay');
      clock.tick();
      sinon.assert.calledOnce(adsCanceled);
    });

    it("must cancel the ad on replay if the ads are disabled and trigger the content events", function(){
      var adsCanceled = sinon.spy();
      var contentStart = sinon.spy();
      var contentEnd = sinon.spy();
      player.vast.disable();
      player.trigger('vast.firstPlay');
      clock.tick();
      //We simulate we finish playing the video.
      player.trigger('vast.contentEnd');
      clock.tick();
      player.on('vast.adsCancel', adsCanceled);
      player.on('vast.contentStart', contentStart);
      player.on('vast.contentEnd', contentEnd);

      //We simulate the second first play (replay)
      player.trigger('vast.firstPlay');
      clock.tick();

      sinon.assert.calledOnce(adsCanceled);
      sinon.assert.notCalled(contentStart);
      sinon.assert.notCalled(contentEnd);

      player.trigger('playing');

      sinon.assert.calledOnce(adsCanceled);
      sinon.assert.calledOnce(contentStart);
      sinon.assert.notCalled(contentEnd);

      player.trigger('ended');

      sinon.assert.calledOnce(adsCanceled);
      sinon.assert.calledOnce(contentStart);
      sinon.assert.calledOnce(contentEnd);
    });

    it("must remove the native poster to prevent flickering when video content starts", function(){
      var tech = player.el().querySelector('.vjs-tech');
      player.trigger('vast.firstPlay');
      clock.tick();
      assert.isNull(tech.getAttribute('poster'));
    });

    describe("with ads enabled", function(){
      it("must not cancel the ads", function(){
        var adsCanceled = sinon.spy();
        player.on('vast.adsCancel', adsCanceled);
        player.vast.enable();
        player.trigger('vast.firstPlay');
        clock.tick();

        sinon.assert.notCalled(adsCanceled);
      });

      describe("loading spinner", function(){
        beforeEach(function(){
          player = videojs(document.createElement('video'), {});
          player.vastClient({adTagUrl: utilities.echoFn('/fake.ad.url')});
        });

        it("must be added while we retrieve the ad", function(){
          player.trigger('vast.firstPlay');
          clock.tick();
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });

        it("must be removed on vast ad start", function(){
          player.trigger('vast.firstPlay');
          clock.tick();
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
          player.trigger('vast.adStart');
          clock.tick(100);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });

        it("must be removed if ads are canceled while trying to play the ad", function(){
          player.trigger('vast.firstPlay');
          clock.tick();
          assert.isTrue(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
          player.trigger('vast.adsCancel');
          clock.tick(100);
          assert.isFalse(dom.hasClass(player.el(), 'vjs-vast-ad-loading'));
        });
      });

      it("must pause the video if it is not paused", function(){
        player = videojs(document.createElement('video'), {});
        player.vastClient({adTagUrl: utilities.echoFn('/fake.ad.url'), adCancelTimeout:5000});
        sinon.spy(player, 'pause');
        player.trigger('vast.firstPlay');
        clock.tick();
        sinon.assert.calledOnce(player.pause);
      });

      it("must cancel the ads if there it takes too much time (adCancelTimeout) to start the ad", function(){
        player = videojs(document.createElement('video'), {});
        player.vastClient({adTagUrl: utilities.echoFn('/fake.ad.url'), adCancelTimeout: 3000});

        assertTriggersTrackError(function () {
          player.trigger('vast.firstPlay');
          clock.tick(3001);
        }, 'timeout while waiting for the video to start playing', 402);
      });

      it("must not cancel the ad if the ad starts before the timeout", function(){
        var adsCancelSpy = sinon.spy();
        player = videojs(document.createElement('video'), {});
        player.vastClient({adTagUrl: utilities.echoFn('/fake.ad.url'), adCancelTimeout: 3000});
        player.on('vast.adsCancel', adsCancelSpy);
        player.trigger('vast.firstPlay');
        clock.tick();
        player.trigger('vast.adStart');
        clock.tick(3000);
        sinon.assert.notCalled(adsCancelSpy);
      });
    });

    describe("vast.contentStart && vast.contentEnd", function(){
      var contentStartSpy, contentEndedSpy;

      beforeEach(function(){
        contentStartSpy = sinon.spy();
        contentEndedSpy = sinon.spy();
        player.trigger('vast.firstPlay');
        clock.tick();
        player.on('vast.contentStart', contentStartSpy);
        player.on('vast.contentEnd', contentEndedSpy);
        player.trigger('vast.adsCancel');
      });

      it("must be triggered on content playing and content end", function(){
        player.trigger('playing');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
        player.trigger('ended');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.calledOnce(contentEndedSpy);
      });

      it("must not be triggered if there is an vast.reset after restoring the content", function(){
        player.trigger('vast.reset');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.notCalled(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });

      it("must not be triggered if there is an vast.firstPlay after restoring the content", function(){
        player.trigger('vast.firstPlay');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.notCalled(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });

      it("must not trigger vast.contentEnd if there is a vast.reset after restoring the content", function(){
        player.trigger('playing');
        player.trigger('vast.reset');
        player.trigger('ended');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });

      it("must not trigger vast.contentEnd if there is a vast.firstPlay after restoring the content", function(){
        player.trigger('playing');
        player.trigger('vast.firstPlay');
        player.trigger('ended');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });

      it("must not trigger vast.contentEnd if there is a vast.reset while playing the content", function(){
        player.trigger('playing');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
        player.trigger('vast.reset');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });

      it("must not trigger vast.contentEnd if there is a vast.firstPlay while playing the content", function(){
        player.trigger('playing');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
        player.trigger('vast.firstPlay');
        sinon.assert.calledOnce(contentStartSpy);
        sinon.assert.notCalled(contentEndedSpy);
      });
    });

    it("must set the player.vast.adUnit to null once we finish playing", function(){
      player.vast.adUnit = {
        type: 'FAKE',
        isPaused: function() {
          return false;
        },
        pauseAd: utilities.noop
      };
      player.vast.disable();
      player.trigger('vast.firstPlay');
      clock.tick();
      assert.isNull(player.vast.adUnit);
    });

    describe(":", function(){
      beforeEach(function(){
        sinon.stub(playerUtils, 'restorePlayerSnapshot');
      });

      afterEach(function(){
        playerUtils.restorePlayerSnapshot.restore();
      });

      it("must remove the adUnit and restore the video content on 'vast.adsCancel' evt", function(){
        player.vast.adUnit = {
          type: 'FAKE',
          pauseAd: utilities.noop,
          resumeAd: utilities.noop,
          isPaused: utilities.noop
        };
        player.trigger('vast.firstPlay');
        clock.tick();
        player.trigger('vast.adsCancel');
        assert.isNull(player.vast.adUnit);
        sinon.assert.calledOnce(playerUtils.restorePlayerSnapshot);
      });

       it("must remove the adUnit but not restore the video content on 'vast.reset' evt", function(){
        player.vast.adUnit = {
          type: 'FAKE',
          pauseAd: utilities.noop,
          resumeAd: utilities.noop,
          isPaused: utilities.noop
        };
        player.trigger('vast.firstPlay');
        clock.tick();
        player.trigger('vast.reset');
        assert.isNull(player.vast.adUnit);
        sinon.assert.notCalled(playerUtils.restorePlayerSnapshot);
      });
    });
  });

  describe("playPrerollAd", function () {
    var getVASTResponse, callback, old_UA;

    beforeEach(function () {
      old_UA = utilities._UA;
      utilities._UA = "iPhone";

      this.clock = sinon.useFakeTimers();
      sinon.stub(vastUtil, 'track').returns(null);
      sinon.spy(VASTIntegrator.prototype, 'playAd');
      player = videojs(document.createElement('video'), {});
      player.vastClient({adTagUrl: utilities.echoFn('/fake.ad.url')});
      getVASTResponse = sinon.spy(VASTClient.prototype, 'getVASTResponse');
      player.trigger('vast.firstPlay');
      this.clock.tick();
      callback = testUtils.secondArg(getVASTResponse);
    });

    afterEach(function (done) {
      this.clock.restore();
      vastUtil.track.restore();
      getVASTResponse.restore();
      VASTIntegrator.prototype.playAd.restore();
      utilities._UA = old_UA;
      done();
    });

    it("must request the vastResponse", function () {
      sinon.assert.calledOnce(getVASTResponse);
      sinon.assert.calledWith(getVASTResponse, '/fake.ad.url');
    });

    it("must request the vastResponse using the adTagXML function if provided", function(){
      player = videojs(document.createElement('video'), {});
      player.vastClient({adTagXML: utilities.noop});
      player.trigger('vast.firstPlay');
      this.clock.tick();
      sinon.assert.calledWith(getVASTResponse, utilities.noop);
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

      this.clock.tick();
      sinon.assert.calledWith(VASTIntegrator.prototype.playAd, response);
    });

    it("must not prevent manual progress if you play the ad on a no IDevice", function(){
      utilities._UA = "android";
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.alwaysCalledWith(player.currentTime);
    });

    it("must prevent manual progress when you play the ad", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.calledWithExactly(player.currentTime, 1);
    });

    it("must prevent ad skip if 'ended' event is triggered but ad wasn't finished", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'duration').returns(10);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.trigger('ended');
      this.clock.tick();
      sinon.assert.calledWithExactly(player.currentTime, 1);
    });

    it("must NOT prevent ad skip if 'ended' event is triggered and Ad is finished", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'duration').returns(10);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(3);
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(5);
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(7);
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(9);
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      player.trigger('ended');
      this.clock.tick();
      // we expect player.currentTime to have never been called with params
      sinon.assert.neverCalledWith(player.currentTime, sinon.match.defined);
    });


    it("must pause the play if the user tries to skip the ad manually twice", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      callback(null, response);
      this.clock.tick();
      sinon.spy(player, 'pause');
      player.trigger('timeupdate');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.notCalled(player.pause);
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.called(player.pause);
      player.pause.reset();
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.called(player.pause);
    });

    it("must not prevent the manual progress after the ad has ended", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      var setCurrentTime = player.currentTime.withArgs(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.trigger('vast.adEnd');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.notCalled(setCurrentTime);
    });

    it("must not prevent the manual progress after the ad has been canceled", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      sinon.stub(player, 'currentTime').returns(1);
      var setCurrentTime = player.currentTime.withArgs(1);
      callback(null, response);
      this.clock.tick();
      player.trigger('timeupdate');
      this.clock.tick();
      player.trigger('vast.adsCancel');
      this.clock.tick();
      player.currentTime.returns(10);
      player.trigger('timeupdate');
      this.clock.tick();
      sinon.assert.notCalled(setCurrentTime);
    });

    it("must add the adsLabel component once we know the ad is going to start. (i.e. vast.adstart)", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      assert.isObject(player.controlBar.getChild('AdsLabel'));
    });

    it("must NOT add the adsLabel component if the ad gets canceled. (i.e. vast.adstart)", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adsCancel');
      player.trigger('vast.adStart');
      assert.isUndefined(player.controlBar.getChild('AdsLabel'));
    });

    it("must NOT add the adsLabel component if there is an error in the player. (i.e. vast.adstart)", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('error');
      player.trigger('vast.adStart');
      assert.isUndefined(player.controlBar.getChild('AdsLabel'));
    });

    it("must remove the adsLabel component when the ads finish playing", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      var playAdCallback = testUtils.secondArg(VASTIntegrator.prototype.playAd);
      playAdCallback(null, response);
      this.clock.tick();
      assert.isNull(player.controlBar.getChild('AdsLabel'));
    });

    it("must remove the adsLabel component on 'vast.adsCancel' event", function () {
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      player.trigger('vast.adsCancel');

      this.clock.tick();
      assert.isNull(player.controlBar.getChild('AdsLabel'));
    });

    it("must not ad the adsLabel if the ad has finished playing", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adsCancel');
      player.trigger('vast.adStart');
      assert.isUndefined(player.controlBar.getChild('AdsLabel'));
    });

    it("must track the error if there as a problem playing the ad", function () {
      var response = new VASTResponse();
      var clock = this.clock;
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      clock.tick();
      assertTriggersTrackError(function () {
        player.trigger('error');
        clock.tick();
      }, 'on VASTIntegrator, Player is unable to play the Ad');
    });

    it("must not play the ad if the ad was previously canceled due to an adCancelTimeout", function () {
      var adstartSpy = sinon.spy();
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);

      player.trigger('vast.firstPlay');
      //We force the adCancelTimeout
      this.clock.tick(3001);
      player.on('vast.adStart', adstartSpy);
      callback(null, response);
      this.clock.tick();
      sinon.assert.notCalled(adstartSpy);
    });

    it("must remove the adUnit and restore the video content after the ad has finished playing", function(){
      sinon.stub(playerUtils, 'restorePlayerSnapshot');
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      var playAdCallback = testUtils.secondArg(VASTIntegrator.prototype.playAd);
      assert.isNotNull(player.vast.adUnit);

      playAdCallback(null, response);
      this.clock.tick();
      assert.isNull(player.vast.adUnit);

      sinon.assert.calledOnce(playerUtils.restorePlayerSnapshot);
      playerUtils.restorePlayerSnapshot.restore();
    });

    it("must remove the adUnit and restore the video content on adsCancel", function(){
      sinon.stub(playerUtils, 'restorePlayerSnapshot');
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);

      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      assert.isNotNull(player.vast.adUnit);

      player.trigger('vast.adsCancel');
      assert.isNull(player.vast.adUnit);

      sinon.assert.calledOnce(playerUtils.restorePlayerSnapshot);
      playerUtils.restorePlayerSnapshot.restore();
    });

    it("must publish the adUnit on the player.vast obj on 'vast.adStart' evt", function(){
      var response = new VASTResponse();
      response._addMediaFiles([
        createMediaFile('http://fakeVideoFile', 'video/mp4')
      ]);
      callback(null, response);
      this.clock.tick();
      player.trigger('vast.adStart');
      assert.equal(player.vast.adUnit.type, 'VAST');
    });
  });

  describe("on iPhone", function(){
    beforeEach(function(){
      this.clock = sinon.useFakeTimers();
      sinon.stub(utilities, 'isIPhone').returns(true);
    });

    afterEach(function(done){
      utilities.isIPhone.restore();
      this.clock.tick();
      this.clock.restore();
      done();
    });

    it("must not play the ad if the video content has played more than what specified on the iosPrerollCancelTimeout and must track the error", function(){
      var player = videojs(document.createElement('video'), {});
      var errorSpy = sinon.spy();

      sinon.stub(player, 'currentTime').returns(2000);
      player.on('vast.adError', errorSpy);

      player.vastClient({adTagUrl: 'http://fake.ad.url', iosPrerollCancelTimeout: 1000});
      player.trigger('vast.firstPlay');
      this.clock.tick();
      sinon.assert.calledOnce(errorSpy);
      assert.equal(testUtils.firstArg(errorSpy).error.message, 'VAST Error: video content has been playing before preroll ad');
    });

    it("must play the ad if the video content has played less than what specified on the iosPrerollCancelTimeout", function(){
      var player = videojs(document.createElement('video'), {});
      var errorSpy = sinon.spy();
      sinon.stub(player, 'currentTime').returns(500);
      player.on('vast.adError', errorSpy);
      player.vastClient({adTagUrl: 'http://fake.ad.url', iosPrerollCancelTimeout: 1000});
      player.trigger('vast.firstPlay');
      this.clock.tick();
      sinon.assert.notCalled(errorSpy);
    });
  });
});


