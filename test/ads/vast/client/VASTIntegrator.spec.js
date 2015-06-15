describe("VASTIntegrator", function () {

  function assertNoError(callback) {
    assert.isFalse(!!firstArg(callback));
  }

  function assertError(callback, msg, code) {
    var error = firstArg(callback);
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

  it("must be a function", function () {
    assert.isFunction(VASTIntegrator);
  });

  describe("instance", function () {
    var vastIntegrator, player, callback, AD_START_TIMEOUT;

    function assertVASTTrackRequest(URLs, variables) {
      URLs = isArray(URLs) ? URLs : [URLs];
      sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
    }

    beforeEach(function () {
      sinon.stub(vastUtil, 'track', noop);
      AD_START_TIMEOUT = 500;
      player = videojs(document.createElement('video'), {});
      player.ads({});
      player.ads.snapshot={}; //We fake the snapshot to prevent undesired errors in tests
      vastIntegrator = new VASTIntegrator(player, AD_START_TIMEOUT);
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

      it("must be a function", function () {
        assert.isFunction(vastIntegrator.playAd);
      });

      it("must call the callback with an error if you don't pass a valid VASTResponse", function () {
        vastIntegrator.playAd(null, callback);
        assertError(callback, 'On VASTIntegrator, missing required VASTResponse');
      });

      it("must play the ad using the response", function () {
        var response = new VASTResponse();

        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);

        response.skipoffset = 10000;

        vastIntegrator.playAd(response, callback);
        this.clock.tick(1);
        assert.isObject(skipButton(player));
        assert.isObject(clickThroughAnchor(player));
        player.trigger('adended');
        assertNoError(callback);
        assert.equal(response, secondArg(callback));
        assert.isNull(skipButton(player));
        assert.isNull(clickThroughAnchor(player));
      });

      it("must pass an error to the callback if there was a problem playing the ad", function () {
        var response = new VASTResponse();
        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);
        vastIntegrator.playAd(response, callback);
        this.clock.tick(AD_START_TIMEOUT);
        assertError(callback, 'on VASTIntegrator, timeout while waiting for the video to start playing');
        assert.equal(response, secondArg(callback));
      });

      it("must track the error", function(){
        var response = new VASTResponse();
        response._addErrorTrackUrl('http://fake.error.url');
        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'video/mp4')
        ]);
        vastIntegrator.playAd(response, callback);
        this.clock.tick(AD_START_TIMEOUT);
        assertVASTTrackRequest(['http://fake.error.url'],{ ERRORCODE: 402});
      });
    });

    describe("_selectAdSource", function () {
      it("must be a function", function () {
        assert.isFunction(vastIntegrator._selectAdSource);
      });

      it("must pass a VASTError to the callback if passed VASTResponse does not contain any mediaFile supported by the player", function () {
        var response = new VASTResponse();
        vastIntegrator._selectAdSource(response, callback);
        assertError(callback, "Could not find Ad mediafile supported by this player", 403);
        assert.equal(response, secondArg(callback));
      });

      it("must call the callback with the selected mediaFile an the response", function () {
        var response = new VASTResponse();
        var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        response._addMediaFiles([mediaFile]);
        vastIntegrator._selectAdSource(response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile, response);
      });
    });

    describe("_createVASTTracker", function () {
      it("must be a function", function () {
        assert.isFunction(vastIntegrator._createVASTTracker);
      });

      it("must call the callback with a VASTError if there was a problem creating the VASTTracker", function () {
        var response = new VASTResponse();
        vastIntegrator._createVASTTracker(createMediaFile('', 'video/mp4'), response, callback);
        assertError(callback, 'on VASTTracker constructor, missing required the URI of the ad asset being played');
        assert.equal(response, secondArg(callback));
      });

      it("must call the callback with the selected mediaFile, the tracker and the response", function () {
        var response = new VASTResponse();
        var mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        vastIntegrator._createVASTTracker(mediaFile, response, callback);
        assertNoError(callback);
        assert.equal(mediaFile, secondArg(callback));
        assert.instanceOf(thirdArg(callback), VASTTracker);
        assert.equal(fourthArg(callback), response);
      });
    });

    describe("_setupEvents", function () {
      var tracker, response, mediaFile;

      beforeEach(function () {
        response = new VASTResponse();
        tracker = sinon.createStubInstance(VASTTracker);
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        vastIntegrator._setupEvents(mediaFile, tracker, response, callback);
      });

      it("must be a function", function () {
        assert.isFunction(vastIntegrator._setupEvents);
      });

      it("must track fullscreen change", function () {
        player.isFullscreen(true);
        player.trigger('adfullscreenchange');
        sinon.assert.calledOnce(tracker.trackFullscreen);
        sinon.assert.notCalled(tracker.trackExitFullscreen);
        player.isFullscreen(false);
        player.trigger('adfullscreenchange');
        sinon.assert.calledOnce(tracker.trackFullscreen);
        sinon.assert.calledOnce(tracker.trackExitFullscreen);
      });

      it("must track impressions on adsStart", function () {
        player.trigger('vast.adstart');
        sinon.assert.calledOnce(tracker.trackImpressions);
      });

      it("must track pause and resume events", function () {
        player.trigger('adpause');
        sinon.assert.calledOnce(tracker.trackPause);
        sinon.assert.notCalled(tracker.trackResume);
        player.trigger('play');
        sinon.assert.calledOnce(tracker.trackPause);
        sinon.assert.calledOnce(tracker.trackResume);
      });

      it("must track progress", function () {
        player.trigger('adtimeupdate');
        sinon.assert.calledWithExactly(tracker.trackProgress, 0);
        sinon.stub(player, 'currentTime').returns(5);
        player.trigger('adtimeupdate');
        sinon.assert.calledWithExactly(tracker.trackProgress, 5000);
      });

      it("must track muted and unmuted events", function () {
        var muted = sinon.stub(player, 'muted');
        player.muted.returns(true);
        player.trigger('advolumechange');
        sinon.assert.calledOnce(tracker.trackMute);
        sinon.assert.notCalled(tracker.trackUnmute);
        player.muted.returns(false);
        player.trigger('advolumechange');
        sinon.assert.calledOnce(tracker.trackMute);
        sinon.assert.calledOnce(tracker.trackUnmute);
      });

      it("must call the callback with the adMediafile and the response", function () {
        sinon.assert.calledWithExactly(callback, null, mediaFile, response);
      });

      describe("on 'vast.adend' even", function () {
        beforeEach(function () {
          player.trigger('vast.adend');
        });

        it("must track trackComplete", function () {
          sinon.assert.calledOnce(tracker.trackComplete);
        });

        it("must stop tracking fullscreenchange", function () {
          player.isFullscreen(true);
          player.trigger('adfullscreenchange');
          player.isFullscreen(false);
          player.trigger('adfullscreenchange');
          sinon.assert.notCalled(tracker.trackFullscreen);
          sinon.assert.notCalled(tracker.trackExitFullscreen);
        });

        it("must stop tracking impressions on adsStart", function () {
          player.trigger('adsStart');
          sinon.assert.notCalled(tracker.trackImpressions);
        });

        it("must stop tracking pause and resume events", function () {
          player.trigger('adPause');
          player.trigger('play');
          sinon.assert.notCalled(tracker.trackPause);
          sinon.assert.notCalled(tracker.trackResume);
        });

        it("must stop tracking progress", function () {
          player.trigger('adtimeupdate');
          sinon.assert.notCalled(tracker.trackProgress);
        });

        it("must stop tracking muted and unmuted events", function () {
          var muted = sinon.stub(player, 'muted');
          player.muted.returns(true);
          player.trigger('advolumechange');
          player.muted.returns(false);
          player.trigger('advolumechange');
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

      it("must be a function", function () {
        assert.isFunction(vastIntegrator._playSelectedAd);
      });

      it("must must trigger vast.adstart when the add is ready to be played", function () {
        var spy = sinon.spy();
        player.on('vast.adstart', spy);
        sinon.assert.notCalled(spy);

        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        //when the ad is ready to play there is a durationchange event
        player.trigger('addurationchange');
        sinon.assert.calledOnce(spy);
      });

      it("must change the source of the player", function () {
        sinon.spy(player, 'src');
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.calledWithExactly(player.src, mediaFile);
      });

      it("must play the player whenever the source is ready", function () {
        sinon.spy(player, 'play');
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.notCalled(player.play);

        player.trigger('addurationchange');
        sinon.assert.calledOnce(player.play);
      });

      it("must end linear ad Mode once the player has finished playing", function () {
        var spy = sinon.spy();
        player.on('vast.adend', spy);
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.notCalled(spy);

        player.trigger('adended');
        sinon.assert.calledOnce(spy);
      });

      it("must once the ad ended playing call the callback with the response and no error", function () {
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('adended');
        sinon.assert.calledWithExactly(callback, null, response);
      });

      it("must call the callback with an error if the player does not start playing the ad after a predefined timeout", function () {
        var clock = sinon.useFakeTimers();
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        sinon.assert.notCalled(callback);

        clock.tick(AD_START_TIMEOUT);
        assertError(callback, "on VASTIntegrator, timeout while waiting for the video to start playing", 402);
        assert.equal(secondArg(callback), response);
        clock.restore();
      });

      it("must call the callback with an error if the player had a problem playing the ad", function(){
        vastIntegrator._playSelectedAd(mediaFile, response, callback);
        player.trigger('error');
        assertError(callback, "on VASTIntegrator, Player is unable to play the Ad ", 400);
      });
    });

    describe("_addSkipButton", function () {
      var response, mediaFile, tracker;

      beforeEach(function () {
        response = new VASTResponse();
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        tracker = sinon.createStubInstance(VASTTracker);
      });

      it("must be a function", function () {
        assert.isFunction(vastIntegrator._addSkipButton);
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
          assert.isObject(skipButton(player));
        });

        it("must remove the skip button once the ad finish playing", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          player.trigger('vast.adend');
          assert.isNull(skipButton(player));
        });

        it("must remove the skip button if there was an error playing the ad", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          player.trigger('vast.aderror');
          assert.isNull(skipButton(player));
        });

        it("must track the skip if you click on an enabled skip button", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          dom.addClass(skipBut, 'enabled');
          click(skipBut);
          sinon.assert.calledOnce(tracker.trackSkip);
        });

        it("must NOT track the skip if you click on a skip button that is not Enabled", function () {
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          click(skipBut);
          sinon.assert.notCalled(tracker.trackSkip);
        });

        it("must trigger the end of the ad if you click on an enabled skip button", function () {
          var spy = sinon.spy();
          player.on('adended', spy);
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          dom.addClass(skipBut, 'enabled');
          click(skipBut);
          sinon.assert.calledOnce(spy);
        });

        it("must NOT trigger the end of the ad if you click on a skip button that is not enabled", function () {
          var spy = sinon.spy();
          player.on('adended', spy);
          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          var skipBut = skipButton(player);
          click(skipBut);
          sinon.assert.notCalled(spy);
        });

        it("must update the offset time left everytime there is a timeupate", function () {
          var skipBut;

          vastIntegrator._addSkipButton(mediaFile, tracker, response, callback);
          skipBut = skipButton(player);

          sinon.stub(player, 'currentTime');

          player.currentTime.returns(0);
          player.trigger('adtimeupdate');
          assert.equal('Skip in 10...', skipBut.innerHTML);

          player.currentTime.returns(5);
          player.trigger('adtimeupdate');
          assert.equal('Skip in 05...', skipBut.innerHTML);

          player.currentTime.returns(10);
          player.trigger('adtimeupdate');
          assert.equal('Skip ad', skipBut.innerHTML);

          player.currentTime.returns(15);
          player.trigger('adtimeupdate');
          assert.equal('Skip ad', skipBut.innerHTML);
        });
      });
    });

    describe("_addClickThrough", function () {
      var response, mediaFile, tracker;

      function resetAnchorToPreventPageReload(anchor) {
        anchor.target = "_self";
        anchor.href = "#"
      }

      beforeEach(function () {
        response = new VASTResponse();
        mediaFile = createMediaFile('http://foo.video.url.mp4', 'video/mp4');
        tracker = sinon.createStubInstance(VASTTracker);
      });

      it("must be a function", function () {
        assert.isFunction(vastIntegrator._addClickThrough);
      });

      it("must call the callback with the source, the tracker and the response", function () {
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        sinon.assert.calledWithExactly(callback, null, mediaFile, tracker, response);
      });

      it("must add the blocker anchor to the player", function () {
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isObject(clickThroughAnchor(player));
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

      it("must not set the target if there is no clickthroug on the response", function(){
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
        click(anchor);
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
        click(anchor);        sinon.assert.notCalled(tracker.trackClick);
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
        player.trigger('adtimeupdate');
        assert.equal(
          "http://fake.url?assetUri=" + mediaFile.src + "&contentPlayHead:00:00:05.000",
          clickThroughAnchor(player).getAttribute('href')
        );
      });

      it("must remove the anchor when the ad ends", function(){
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isObject(clickThroughAnchor(player));
        player.trigger('vast.adend');
        assert.isNull(clickThroughAnchor(player));
      });

      it("must remove the anchor on ad error", function(){
        vastIntegrator._addClickThrough(mediaFile, tracker, response, callback);
        assert.isObject(clickThroughAnchor(player));
        player.trigger('vast.aderror');
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