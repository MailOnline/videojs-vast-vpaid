'use strict';

describe("VASTIntegrator", function () {

  var MediaFile = require('ads/vast/MediaFile');
  var VASTError = require('ads/vast/VASTError');
  var VASTIntegrator = require('ads/vast/VASTIntegrator');
  var VASTResponse = require('ads/vast/VASTResponse');
  var VASTTracker = require('ads/vast/VASTTracker');
  var vastUtil = require('ads/vast/vastUtil');

  var dom = require('utils/dom');
  var utilities = require('utils/utilityFunctions');
  var xml = require('utils/xml');

  var testUtils = require('../../test-utils');

  function assertNoError(callback) {
    assert.isFalse(!!testUtils.firstArg(callback));
  }

  function assertError(callback, msg, code) {
    var error = testUtils.firstArg(callback);
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

  function skipButton(player) {
    return player.el().querySelector('.vast-skip-button');
  }

  function clickThroughAnchor(player) {
    return player.el().querySelector('.vast-blocker');
  }

  describe("instance", function () {
    var vastIntegrator, player, callback;

    function assertVASTTrackRequest(URLs, variables) {
      URLs = utilities.isArray(URLs) ? URLs : [URLs];
      sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
    }

    beforeEach(function () {
      sinon.stub(vastUtil, 'track', utilities.noop);
      player = videojs(document.createElement('video'), {});
      vastIntegrator = new VASTIntegrator(player);
      callback = sinon.spy();
    });

    afterEach(function () {
      vastUtil.track.restore();
    });

    describe("playAd", function () {
      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
      });

      afterEach(function () {
        this.clock.restore();
      });

      it("must call the callback with an error if you don't pass a valid VASTResponse", function () {
        vastIntegrator.playAd(null, callback);
        assertError(callback, 'On VASTIntegrator, missing required VASTResponse');
      });

      it("must set preload to auto", function () {
        // without preload=auto the durationchange event is never fired
        var response = new VASTResponse();
        var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        response._addMediaFiles([mediaFile]);
        player.preload("none");
        vastIntegrator.playAd(response, utilities.noop);
        this.clock.tick(10); // FF fail to set preload if there isn't at least an instruction in the middle
        assert.equal(player.options().preload, "auto");
      });

      it("must play the ad using the response", function () {
        var response = new VASTResponse();

        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);

        response.skipoffset = 10000;

        vastIntegrator.playAd(response, callback);
        this.clock.tick();
        assert.isNotNull(skipButton(player));
        assert.isNotNull(clickThroughAnchor(player));
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('ended');
        player.trigger('vast.adEnd');
        assertNoError(callback);
        assert.equal(response, testUtils.secondArg(callback));
        assert.isNull(skipButton(player));
        assert.isNull(clickThroughAnchor(player));
      });

      it("must pass an error to the callback if there was a problem playing the ad", function () {
        var response = new VASTResponse();
        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);
        vastIntegrator.playAd(response, callback);
        this.clock.tick();
        player.trigger('error');
        this.clock.tick();
        assertError(callback, 'on VASTIntegrator, Player is unable to play the Ad');
        assert.equal(response, testUtils.secondArg(callback));
      });

      it("must track the error", function(){
        var response = new VASTResponse();
        response._addErrorTrackUrl('http://fake.error.url');
        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);
        vastIntegrator.playAd(response, callback);
        this.clock.tick();
        player.trigger('error');
        this.clock.tick();
        assertVASTTrackRequest(['http://fake.error.url'],{ ERRORCODE: 400});
      });

      describe("return obj", function(){
        it("must contain the type 'VAST", function(){
          var adUnit = vastIntegrator.playAd(new VASTResponse(), utilities.noop);
          assert.equal(adUnit.type, 'VAST');
        });

        it("must be able to pause the adUnit", function(){
          var adUnit = vastIntegrator.playAd(new VASTResponse(), utilities.noop);
          sinon.spy(player, 'pause');
          adUnit.pauseAd();
          sinon.assert.calledOnce(player.pause);
        });

        it("must be able to resume the adUnit", function(){
          var adUnit = vastIntegrator.playAd(new VASTResponse(), utilities.noop);
          sinon.spy(player, 'play');
          adUnit.resumeAd();
          sinon.assert.calledOnce(player.play);
        });

        it("must be able to tell if the adUnit is paused", function(){
          var adUnit = vastIntegrator.playAd(new VASTResponse(), utilities.noop);
          sinon.stub(player, 'paused').returns(true);
          assert.isTrue(adUnit.isPaused());
          player.paused.returns(false);
          assert.isFalse(adUnit.isPaused());
        });

        it("must be able to return the src of the ad playing", function(){
          var response = new VASTResponse();
          var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
          response._addMediaFiles([mediaFile]);
          var adUnit = vastIntegrator.playAd(response, utilities.noop);
          assert.isNull(adUnit.getSrc());//Must return null until a src have been selected
          this.clock.tick();
          assert.equal(adUnit.getSrc(), mediaFile);
        });
      });
    });

    describe("_selectAdSource", function () {
      it("must pass a VASTError to the callback if passed VASTResponse does not contain any mediaFile supported by the player", function () {
        var response = new VASTResponse();
        vastIntegrator._selectAdSource(response, callback);
        assertError(callback, "Could not find Ad mediafile supported by this player", 403);
        assert.equal(response, testUtils.secondArg(callback));
      });

      it("must call the callback with the selected mediaFile an the response", function () {
        var response = new VASTResponse();
        var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        response._addMediaFiles([mediaFile]);
        vastIntegrator._selectAdSource(response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile, response);
      });

      it("must return the best match for the player width", function(){
        var response = new VASTResponse();
        var mediaFile1 = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        var mediaFile2 = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        mediaFile2.width = 640;
        response._addMediaFiles([mediaFile1, mediaFile2]);

        //We set the player width to 640px
        player.el().getBoundingClientRect = function (){
          return {
            width: 640,
            height: 280
          };
        };

        vastIntegrator._selectAdSource(response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile2, response);
      });
    });

    describe("_createVASTTracker", function () {
      it("must call the callback with a VASTError if there was a problem creating the VASTTracker", function () {
        var response = new VASTResponse();
        vastIntegrator._createVASTTracker(createMediaFile('', 'video/mp4'), response, callback);
        assertError(callback, 'on VASTTracker constructor, missing required the URI of the ad asset being played');
        assert.equal(response, testUtils.secondArg(callback));
      });

      it("must call the callback with the selected mediaFile, the tracker and the response", function () {
        var response = new VASTResponse();
        var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        vastIntegrator._createVASTTracker(mediaFile, response, callback);
        assertNoError(callback);
        assert.equal(mediaFile, testUtils.secondArg(callback));
        assert.instanceOf(testUtils.thirdArg(callback), VASTTracker);
        assert.equal(testUtils.fourthArg(callback), response);
      });
    });

    describe("_setupEvents", function () {
      var tracker, response, mediaFile;

      beforeEach(function () {
        response = new VASTResponse();
        tracker = sinon.createStubInstance(VASTTracker);
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        vastIntegrator._setupEvents(mediaFile, tracker, response, callback);

        sinon.stub(player, 'currentTime').returns(1);
        sinon.stub(player, 'duration').returns(20);
      });

      it("must track fullscreen change", function () {
        player.isFullscreen(true);
        player.trigger('fullscreenchange');
        sinon.assert.calledOnce(tracker.trackFullscreen);
        sinon.assert.notCalled(tracker.trackExitFullscreen);
        player.isFullscreen(false);
        player.trigger('fullscreenchange');
        sinon.assert.calledOnce(tracker.trackFullscreen);
        sinon.assert.calledOnce(tracker.trackExitFullscreen);
      });

      it("must track impressions and creativeView on adsStart", function () {
        player.trigger('vast.adStart');
        sinon.assert.calledOnce(tracker.trackImpressions);
        sinon.assert.calledOnce(tracker.trackCreativeView);
      });

      it("must track pause and resume events", function () {
        player.trigger('pause');
        sinon.assert.calledOnce(tracker.trackPause);
        sinon.assert.notCalled(tracker.trackResume);
        player.trigger('play');
        sinon.assert.calledOnce(tracker.trackPause);
        sinon.assert.calledOnce(tracker.trackResume);
      });

      it("must NOT track pause and resume events if the ad has finished playing", function(){
        player.currentTime.returns(20);
        player.duration.returns(20);
        player.trigger('pause');
        sinon.assert.notCalled(tracker.trackPause);
        sinon.assert.notCalled(tracker.trackResume);
        player.trigger('play');
        sinon.assert.notCalled(tracker.trackPause);
        sinon.assert.notCalled(tracker.trackResume);
      });

      it("must not track resume event if the ad gets canceled while paused", function(){
        player.trigger('pause');
        player.trigger('vast.adsCancel');
        player.trigger('play');
        sinon.assert.notCalled(tracker.trackResume);
      });

      //This test looks like a contradiction but it test the corner case for browsers whose
      //player.duration and player.currentTime do not equal when the video has ended
      it("must not track resume event if the ad ends while being paused", function(){
        player.trigger('pause');
        player.trigger('vast.adEnd');
        player.trigger('play');
        sinon.assert.notCalled(tracker.trackResume);
      });

      it("must track progress", function () {
        player.trigger('timeupdate');
        sinon.assert.calledWithExactly(tracker.trackProgress, 1000);
        player.currentTime.returns(5);
        player.trigger('timeupdate');
        sinon.assert.calledWithExactly(tracker.trackProgress, 5000);
      });

      it("must track muted and unmuted events", function () {
        sinon.stub(player, 'muted');
        player.muted.returns(true);
        player.trigger('volumechange');
        sinon.assert.calledOnce(tracker.trackMute);
        sinon.assert.notCalled(tracker.trackUnmute);
        player.muted.returns(false);
        player.trigger('volumechange');
        sinon.assert.calledOnce(tracker.trackMute);
        sinon.assert.calledOnce(tracker.trackUnmute);
      });

      it("must call the callback with the adMediafile and the response", function () {
        sinon.assert.calledWithExactly(callback, null, mediaFile, response);
      });

      it("must not track complete evt on 'vast.adCancel'", function(){
        player.trigger('vast.adsCancel');
        player.trigger('vast.adEnd');
        sinon.assert.notCalled(tracker.trackComplete);
      });

      it("must not track complete evt on 'vast.adSkip'", function(){
        player.trigger('vast.adSkip');
        player.trigger('vast.adEnd');
        sinon.assert.notCalled(tracker.trackComplete);
      });

      describe("on 'vast.adEnd' even", function () {
        beforeEach(function () {
          player.trigger('vast.adEnd');
        });

        it("must track trackComplete", function () {
          sinon.assert.calledOnce(tracker.trackComplete);
        });

        it("must stop tracking fullscreenchange", function () {
          player.isFullscreen(true);
          player.trigger('fullscreenchange');
          player.isFullscreen(false);
          player.trigger('fullscreenchange');
          sinon.assert.notCalled(tracker.trackFullscreen);
          sinon.assert.notCalled(tracker.trackExitFullscreen);
        });

        it("must stop tracking impressions on adsStart", function () {
          player.trigger('vast.adStart');
          sinon.assert.notCalled(tracker.trackImpressions);
        });

        it("must stop tracking pause and resume events", function () {
          player.trigger('pause');
          player.trigger('play');
          sinon.assert.notCalled(tracker.trackPause);
          sinon.assert.notCalled(tracker.trackResume);
        });

        it("must stop tracking progress", function () {
          player.trigger('timeupdate');
          sinon.assert.notCalled(tracker.trackProgress);
        });

        it("must stop tracking muted and unmuted events", function () {
          sinon.stub(player, 'muted');
          player.muted.returns(true);
          player.trigger('volumechange');
          player.muted.returns(false);
          player.trigger('volumechange');
          sinon.assert.notCalled(tracker.trackMute);
          sinon.assert.notCalled(tracker.trackUnmute);
        });
      });
    });

    describe("_playSelectedAd", function () {
      var response, mediaFile;

      beforeEach(function () {
        response = new VASTResponse();
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
      });

      it("must must trigger vast.adStart when the add is playing for the first time", function () {
        var spy = sinon.spy();
        player.on('vast.adStart', spy);
        sinon.assert.notCalled(spy);

        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        //when the ad is ready to play there is a durationchange event
        player.trigger('durationchange');
        player.trigger('playing');

        sinon.assert.calledOnce(spy);
      });

      it("must must not trigger vast.adStart when the ad is paused and played again", function () {
        var spy = sinon.spy();
        player.on('vast.adStart', spy);
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('durationchange');
        player.trigger('playing');

        sinon.assert.calledOnce(spy);
        player.trigger('playing');

        sinon.assert.calledOnce(spy);
      });

      it("must change the source of the player", function () {
        sinon.spy(player, 'src');
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.calledWithExactly(player.src, mediaFile);
      });

      it("must play the ad whenever the source is ready", function () {
        sinon.spy(player, 'play');
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.notCalled(player.play);

        player.trigger('durationchange');
        sinon.assert.calledOnce(player.play);
      });

      it("must once the ad ended playing call the callback with the response and no error", function () {
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.stub(player, 'duration').returns(10);
        sinon.stub(player, 'currentTime').returns(9);
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.calledWithExactly(callback, null, response);
      });

      it("must NOT call the callback if the 'ended' event is triggered but the Ad isnt't yet finished", function () {
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.stub(player, 'duration').returns(10);
        sinon.stub(player, 'currentTime').returns(1);
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.notCalled(callback);
      });

      it("must on 'vast.adSkip' evt, call the callback with the response and no error", function () {
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('vast.adSkip');
        sinon.assert.calledWithExactly(callback, null, response);
      });

      it("must not trigger vast.adStart or call the callback if the ad was canceled before the playing evt", function () {
        var spy = sinon.spy();
        player.on('vast.adStart', spy);
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('durationchange');
        player.trigger('vast.adsCancel');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.notCalled(spy);
        sinon.assert.notCalled(callback);
      });

      it("must not call the callback if the ad was canceled before the ended evt", function () {
        var spy = sinon.spy();
        player.on('vast.adStart', spy);
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('vast.adsCancel');
        player.trigger('ended');
        sinon.assert.calledOnce(spy);
        sinon.assert.notCalled(callback);
      });

      it("must not call the callback if the ad was canceled before the durationchange evt", function () {
        var spy = sinon.spy();
        player.on('vast.adStart', spy);
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('vast.adsCancel');
        player.trigger('durationchange');
        player.trigger('playing');
        player.trigger('ended');
        sinon.assert.notCalled(spy);
        sinon.assert.notCalled(callback);
      });

      it("must call the callback with an error if the player had a problem playing the ad", function(){
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('error');
        assertError(callback, "on VASTIntegrator, Player is unable to play the Ad", 400);
      });
    });

    describe("_addSkipButton", function () {
      var response, mediaFile, tracker;

      beforeEach(function () {
        response = new VASTResponse();
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        tracker = sinon.createStubInstance(VASTTracker);
      });

      it("must call the callback with the source, the tracker and the response", function () {
        vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile, tracker, response);
      });

      it("must not add the skipButton to the player", function () {
        vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
        var skipButton = player.el().querySelector('.vast-skip-button');
        assert.isNull(skipButton);
      });

      describe("with an skippable ad on the response", function () {
        beforeEach(function () {
          response.skipoffset = 10000; // 10 seconds
        });

        it("must add the skipButton to the player", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          assert.isNotNull(skipButton(player));
        });

        it("must remove the skip button once the ad finish playing", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          player.trigger('vast.adEnd');
          assert.isNull(skipButton(player));
        });

        it("must remove the skip button if the ad gets canceled", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          player.trigger('vast.adsCancel');
          assert.isNull(skipButton(player));
        });

        it("must track the skip if you click on an enabled skip button", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          dom.addClass(skipBut, 'enabled');
          testUtils.click(skipBut);
          sinon.assert.calledOnce(tracker.trackSkip);
        });

        it("must NOT track the skip if you click on a skip button that is not Enabled", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          testUtils.click(skipBut);
          sinon.assert.notCalled(tracker.trackSkip);
        });

        it("must trigger the 'vast.adSkip' evt if you click on an enabled skip button", function () {
          var spy = sinon.spy();
          player.on('vast.adSkip', spy);
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          dom.addClass(skipBut, 'enabled');
          testUtils.click(skipBut);
          sinon.assert.calledOnce(spy);
        });

        it("must NOT trigger the 'vast.adSkip' evt if you click on a skip button that is not enabled", function () {
          var spy = sinon.spy();
          player.on('vast.adSkip', spy);
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          testUtils.click(skipBut);
          sinon.assert.notCalled(spy);
        });

        it("must update the offset time left everytime there is a timeupate", function () {
          var skipBut;

          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          skipBut = skipButton(player);

          sinon.stub(player, 'currentTime');

          player.currentTime.returns(0);
          player.trigger('timeupdate');
          assert.equal('Skip in 10...', skipBut.innerHTML);

          player.currentTime.returns(5);
          player.trigger('timeupdate');
          assert.equal('Skip in 05...', skipBut.innerHTML);

          player.currentTime.returns(10);
          player.trigger('timeupdate');
          assert.equal('Skip ad', skipBut.innerHTML);

          player.currentTime.returns(15);
          player.trigger('timeupdate');
          assert.equal('Skip ad', skipBut.innerHTML);
        });
      });
    });

    describe("_addClickThrough", function () {
      var response, mediaFile, tracker;

      function resetAnchorToPreventPageReload(anchor) {
        anchor.target = "_self";
        anchor.href = "#";
      }

      beforeEach(function () {
        response = new VASTResponse();
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        tracker = sinon.createStubInstance(VASTTracker);
      });

      it("must call the callback with the source, the tracker and the response", function () {
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile, tracker, response);
      });

      it("must add the blocker anchor to the player", function () {
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isNotNull(clickThroughAnchor(player));
      });

      it("must set the href of the anchor to '#' if no clickThrough is provided on the response", function () {
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.equal('#', clickThroughAnchor(player).getAttribute('href'));
      });

      it("must set the href of the anchor to the result of parsing the clickThrough found in the response", function () {
        response.clickThrough = 'http://fake.url?assetUri=[ASSETURI]&contentPlayHead:[CONTENTPLAYHEAD]';
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.equal(
          "http://fake.url?assetUri=" + mediaFile.src + "&contentPlayHead:00:00:00.000",
          clickThroughAnchor(player).getAttribute('href')
        );
      });

      it("must set the target of the anchor to blank if there is a clickthrough on the response", function(){
        response.clickThrough = 'http://fake.url?assetUri=[ASSETURI]&contentPlayHead:[CONTENTPLAYHEAD]';
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.equal('_blank', clickThroughAnchor(player).target);
      });

      it("must not set the target if there is no clickthrough on the response", function(){
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.equal('', clickThroughAnchor(player).target);
      });

      it("must pause the player and track the click when you click on the anchor if the player is playing", function(){
        var anchor;
        sinon.stub(player, 'pause');
        sinon.stub(player, 'paused');
        sinon.stub(player, 'play');
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);

        player.paused.returns(false);
        anchor = clickThroughAnchor(player);
        resetAnchorToPreventPageReload(anchor);
        testUtils.click(anchor);
        sinon.assert.calledOnce(tracker.trackClick);
        sinon.assert.notCalled(player.play);
        sinon.assert.calledOnce(player.pause);
      });

      it("must play the ad when you click on the anchor if the player is paused", function(){
        var anchor;
        sinon.stub(player, 'paused');
        sinon.stub(player, 'play');
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        player.paused.returns(true);

        anchor = clickThroughAnchor(player);
        resetAnchorToPreventPageReload(anchor);
        testUtils.click(anchor);
        sinon.assert.notCalled(tracker.trackClick);
        sinon.assert.calledOnce(player.play);
      });

      it("must update the clickThrough anchor on timeupdate", function(){
        sinon.stub(player, 'currentTime');
        player.currentTime.returns(0);
        response.clickThrough = 'http://fake.url?assetUri=[ASSETURI]&contentPlayHead:[CONTENTPLAYHEAD]';
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.equal(
          "http://fake.url?assetUri=" + mediaFile.src + "&contentPlayHead:00:00:00.000",
          clickThroughAnchor(player).getAttribute('href')
        );

        player.currentTime.returns(5);
        player.trigger('timeupdate');
        assert.equal(
          "http://fake.url?assetUri=" + mediaFile.src + "&contentPlayHead:00:00:05.000",
          clickThroughAnchor(player).getAttribute('href')
        );
      });

      it("must remove the anchor when the ad ends", function(){
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isNotNull(clickThroughAnchor(player));
        player.trigger('vast.adEnd');
        assert.isNull(clickThroughAnchor(player));
      });

      it("must remove the anchor on ad cancel", function(){
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isNotNull(clickThroughAnchor(player));
        player.trigger('vast.adsCancel');
        assert.isNull(clickThroughAnchor(player));
      });
    });

    describe("_trackError", function(){
      it("must track the passed error on the response.erroURLMacros", function(){
        var error = new VASTError('Fake message', 101);
        var response = new VASTResponse();
        response._addErrorTrackUrl('http://fake.error.url');

        vastIntegrator._trackError(error, response);
        assertVASTTrackRequest(['http://fake.error.url'],{ ERRORCODE: 101});
      });
    });
  });
});
