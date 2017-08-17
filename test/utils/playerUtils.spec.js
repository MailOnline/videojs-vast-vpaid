var dom = require('utils/dom');
var utilities = require('utils/utilityFunctions');
var playerUtils = require('utils/playerUtils');

var videoJsVersion = parseInt(videojs.VERSION.split('.')[0], 10);

if(videoJsVersion === 5) {
  require('plugin/components/ads-label_5');
  require('plugin/components/black-poster_5');
}


describe("playerUtils", function () {
  var testDiv, player, tech;
  beforeEach(function () {
    testDiv = document.createElement("div");
    testDiv.innerHTML = '<video id="playerVideoTestEl_playerUtils" class="video-js vjs-default-skin" ' +
      'controls preload="none" style="border:none"' +
      'poster="http://vjs.zencdn.net/v/oceans.png" >' +
      '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
      '<source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm"/>' +
      '<source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg"/>' +
      '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
      '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
      '</p>' +
      '</video>';
    document.body.appendChild(testDiv);
    player = videojs("#playerVideoTestEl_playerUtils");
    tech = player.el().querySelector('.vjs-tech');
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  describe("getPlayerSnapshot", function () {
    it("must return a snapshot obj", function () {
      var snapshot = playerUtils.getPlayerSnapshot(player);
      assert.deepEqual(snapshot, {
        ended: false,
        src: "http://vjs.zencdn.net/v/oceans.mp4",
        currentTime: 0,
        type: 'video/mp4',
        suppressedTracks: [],
        nativePoster: 'http://vjs.zencdn.net/v/oceans.png',
        style: 'border:none',
        playing: false
      });
    });

    it("must not set the style and the native poster if there is no tech", function () {
      dom.removeClass(tech, 'vjs-tech');//We remove the so the method can not find the tech
      var snapshot = playerUtils.getPlayerSnapshot(player);
      assert.deepEqual(snapshot, {
        ended: false,
        src: "http://vjs.zencdn.net/v/oceans.mp4",
        currentTime: 0,
        type: 'video/mp4',
        playing: false,
        suppressedTracks: []
      });

      dom.addClass(tech, 'vjs-tech');
    });

    it("must keep the state (paused/playing) of the player", function () {
      sinon.stub(player, 'paused').returns(false);
      var snapshot = playerUtils.getPlayerSnapshot(player);
      assert.deepEqual(snapshot, {
        ended: false,
        src: "http://vjs.zencdn.net/v/oceans.mp4",
        currentTime: 0,
        type: 'video/mp4',
        playing: true,
        suppressedTracks: [],
        nativePoster: 'http://vjs.zencdn.net/v/oceans.png',
        style: 'border:none'
      });
    });

    describe("suppressedTracks", function () {
      var testTrack;

      beforeEach(function () {
        //Note: for more info about tracks see https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
        testTrack = {
          kind: 'captions',
          label: 'test',
          language: 'en',
          mode: 'showing'
        };

        sinon.stub(player, 'remoteTextTracks').returns({
          tracks_: [testTrack]
        });
      });

      afterEach(function () {
        player.remoteTextTracks.restore();
      });

      it("must suppress the remote textTracks and save the mode", function () {
        var snapshot = playerUtils.getPlayerSnapshot(player);
        var suppressedTracks = snapshot.suppressedTracks;
        var suppressedTrack = suppressedTracks[0];
        assert.equal(suppressedTracks.length, 1);
        assert.equal(suppressedTrack.mode, 'showing');
        assert.equal(suppressedTrack.track.mode, 'disabled');
      });

      it("must be empty if there are no remoteTracks", function () {
        player.remoteTextTracks.returns(null);
        var snapshot = playerUtils.getPlayerSnapshot(player);
        assert.deepEqual(snapshot.suppressedTracks, []);
      });

    });
  });

  describe("restorePlayerSnapshot", function () {
    var testTrack, snapshot;

    beforeEach(function () {
      testTrack = {
        kind: 'captions',
        label: 'test',
        language: 'en',
        mode: 'showing'
      };

      sinon.stub(player, 'remoteTextTracks').returns({
        tracks_: [testTrack]
      });

      snapshot = playerUtils.getPlayerSnapshot(player);
    });

    afterEach(function () {
      player.remoteTextTracks.restore();
    });

    it("must restore the player poster", function () {
      tech.poster = '';
      playerUtils.restorePlayerSnapshot(player, snapshot);
      assert.equal(snapshot.nativePoster, "http://vjs.zencdn.net/v/oceans.png");
      assert.equal(tech.poster, snapshot.nativePoster);
    });

    it("must restore the tech style", function () {
      tech.setAttribute('style', '');
      playerUtils.restorePlayerSnapshot(player, snapshot);
      assert.equal(snapshot.style, 'border:none');
      assert.equal(tech.getAttribute('style'), snapshot.style);
    });

    describe("when src has not changed", function () {
      beforeEach(function () {
        sinon.stub(player, 'play');
      });

      afterEach(function () {
        player.play.restore();
      });
      it("must restore the tracks", function () {
        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(snapshot.suppressedTracks.length, 1);
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'showing');
      });

      it("if snapshot was playing must start the video", function () {
        snapshot.playing = true;
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.calledOnce(player.play);
      });

      it("if snapshot was paused must not start the video", function () {
        snapshot.playing = false;
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.notCalled(player.play);
      });
    });

    describe("when src has changed", function () {
      beforeEach(function () {
        //We change the src of the player
        player.src("http://c.brightcove.com/services/mobile/streaming/index/rendition.m3u8?assetId=4367587778001");
      });

      it("must restore tracks on 'contentloadedmetadata' event", function () {
        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(snapshot.suppressedTracks.length, 1);
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'disabled');
        player.trigger('contentloadedmetadata');
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'showing');
      });

      it("must restore the src", function () {
        assert.equal(player.src(), "http://c.brightcove.com/services/mobile/streaming/index/rendition.m3u8?assetId=4367587778001");
        assert.equal(player.currentType(), '');

        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(player.src(), snapshot.src);
        assert.equal(player.currentType(), snapshot.type);
      });

      it("must load the restored src", function () {
        sinon.stub(player, 'load');
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.calledOnce(player.load);
        player.load.restore();
      });

      describe("on 'canplay' event", function () {
        beforeEach(function () {
          sinon.stub(player, 'play');
          sinon.stub(playerUtils, 'isReadyToResume');
          sinon.stub(player, 'currentTime');
        });

        afterEach(function () {
          player.play.restore();
          playerUtils.isReadyToResume.restore();
          player.currentTime.restore();
        });

        it("must resume the video if the tech is ready to resume", function () {
          snapshot.playing = true;
          snapshot.currentTime = 10;
          playerUtils.isReadyToResume.returns(true);
          player.currentTime.returns(0);
          player.play.reset();
          player.currentTime.reset();
          playerUtils.restorePlayerSnapshot(player, snapshot);
          sinon.assert.notCalled(player.play);
          player.trigger('canplay');

          sinon.assert.calledWithExactly(player.currentTime, snapshot.currentTime);
          player.trigger('seeked');
          sinon.assert.called(player.play);
        });

        it("must try to resume the video event the video el does not triggers the 'canplay' evt", function(){
          var clock = sinon.useFakeTimers();
          snapshot.playing = true;
          snapshot.currentTime = 10;
          playerUtils.isReadyToResume.returns(true);
          player.currentTime.returns(0);
          player.play.reset();
          player.currentTime.reset();
          playerUtils.restorePlayerSnapshot(player, snapshot);
          sinon.assert.notCalled(player.play);
          clock.tick(1000);

          sinon.assert.calledWithExactly(player.currentTime, snapshot.currentTime);
          player.trigger('seeked');
          sinon.assert.called(player.play);
          clock.restore();
        });

        it("must wait until the tech is ready to resume the player", function () {
          var clock = sinon.useFakeTimers();
          snapshot.playing = true;
          snapshot.currentTime = 10;
          playerUtils.isReadyToResume.returns(false);
          player.currentTime.returns(0);
          player.play.reset();
          playerUtils.restorePlayerSnapshot(player, snapshot);
          player.trigger('canplay');
          sinon.assert.notCalled(player.play);
          sinon.assert.notCalled(player.currentTime);
          clock.tick(1000);
          playerUtils.isReadyToResume.returns(false);
          clock.tick(1100);

          sinon.assert.calledWithExactly(player.currentTime, snapshot.currentTime);
          player.trigger('seeked');
          sinon.assert.called(player.play);

          clock.restore();
        });

        it("must try to resume the player if the tech takes more than 2 seconds to be ready", function () {
          var clock = sinon.useFakeTimers();
          snapshot.playing = true;
          snapshot.currentTime = 10;
          playerUtils.isReadyToResume.returns(false);
          player.currentTime.returns(0);
          player.play.reset();
          playerUtils.restorePlayerSnapshot(player, snapshot);
          player.trigger('canplay');
          sinon.assert.notCalled(player.play);
          sinon.assert.notCalled(player.currentTime);
          clock.tick(2000);

          sinon.assert.calledWithExactly(player.currentTime, snapshot.currentTime);
          player.trigger('seeked');
          sinon.assert.called(player.play);

          clock.restore();
        });

        it("must log a warning if the resume action throws an exception after waiting for the tech to be ready", function () {
          var clock = sinon.useFakeTimers();
          sinon.stub(videojs.log, 'warn');
          snapshot.playing = true;
          snapshot.currentTime = 0;
          playerUtils.isReadyToResume.returns(false);
          player.currentTime.returns(0);
          player.play.reset();
          playerUtils.restorePlayerSnapshot(player, snapshot);
          player.trigger('canplay');
          sinon.assert.notCalled(player.play);
          sinon.assert.notCalled(player.currentTime);
          player.play.throws();
          clock.tick(2000);

          sinon.assert.calledWith(videojs.log.warn, 'Failed to resume the content after an advertisement');
          clock.restore();
        });
      });
    });
  });

  describe("isReadyToResume", function () {
    it("must return true if the tech.readyState > 1", function () {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: function() {return 2;}
      }));
    });

    it("must return true if the tech doesn't expose the seekable time ranges", function () {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: function() {return 0;},
        seekable: function() {return undefined;}
      }));
    });

    it("must return true if the tech exposes the seekable time ranges", function () {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: function() {return 0;},
        seekable: function() {return {length: 1};}
      }));
    });

    it("must return false if the tech isn not ready an seekable", function () {
      assert.isFalse(playerUtils.isReadyToResume({
        readyState: function() {return 0;},
        seekable: function() {return {length: 0};}
      }));
    });
  });
});

describe("playerUtils.prepareForAds", function () {
  beforeEach(function () {
    sinon.stub(utilities, 'isIPhone').returns(false);
  });

  afterEach(function () {
    utilities.isIPhone.restore();
  });

  it("must add the blackPoster component to the player", function () {
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    assert.isObject(player.getChild('blackPoster'));
  });

  describe("", function () {
    var player, blackPoster;

    beforeEach(function () {
      player = videojs(document.createElement('video'), {});
      playerUtils.prepareForAds(player);

      blackPoster = player.getChild('blackPoster');
      sinon.stub(blackPoster, 'hide');
      sinon.stub(blackPoster, 'show');
    });

    afterEach(function () {
      blackPoster.hide.restore();
      blackPoster.show.restore();
    });

    it("must hide the BlackPoster on 'error' event", function () {
      player.trigger('error');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it("must hide the BlackPoster on 'vast.adStart' event", function () {
      player.trigger('vast.adStart');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it("must hide the blackPoster on 'vast.adsCancel' event", function () {
      player.trigger('vast.adsCancel');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it("must hide the blackPoster on 'vast.adError' event", function () {
      player.trigger('vast.adError');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it("must not hide the blackPoster if is already hidden", function () {
      dom.addClass(blackPoster.el(), 'vjs-hidden');
      player.trigger('vast.adStart');
      player.trigger('vast.adsCancel');
      sinon.assert.notCalled(blackPoster.hide);
    });
  });

  describe("monkeyPatched", function () {
    describe("player.play", function () {
      describe("on first play", function () {
          var player;

          beforeEach(function () {
            player = videojs(document.createElement('video'), {});
            sinon.stub(utilities, 'isMobile').returns(true);
          });

          afterEach(function () {
            utilities.isMobile.restore();
          });

          it("must mute the player when you first play the video (player's play method)", function () {
            playerUtils.prepareForAds(player);
            player.volume(1);
            player.muted(false);
            player.play();
            assert.isTrue(player.muted());
          });

          it("must restore the muted volume on  'vast.firstPlay' evt", function () {
            playerUtils.prepareForAds(player);
            player.volume(1);
            player.muted(false);
            player.play();
            assert.isTrue(player.muted());

            player.trigger('vast.firstPlay');
            assert.isFalse(player.muted());
            assert.equal(player.volume(), 1);
          });

          it("must restore the muted volume on  'vast.reset' evt", function () { // need to be sure we need to reset the volume on reset
            playerUtils.prepareForAds(player);
            player.volume(1);
            player.muted(false);
            player.play();
            assert.isTrue(player.muted());

            player.trigger('vast.reset');
            assert.isFalse(player.muted());
            assert.equal(player.volume(), 1);
          });

          it("must set the currentTime to 0 on 'vast.firstPlay' evt", function () {
            var player = videojs(document.createElement('video'), {});
            sinon.stub(player, 'currentTime');
            sinon.assert.notCalled(player.currentTime);

            playerUtils.prepareForAds(player);
            player.play();
            player.trigger('vast.firstPlay');
            sinon.assert.calledWithExactly(player.currentTime, 0);
          });

          it("must call player's play method", function () {
            var player = videojs(document.createElement('video'), {});
            var playStub = sinon.stub(player, 'play');
            playerUtils.prepareForAds(player);
            player.play();

            assert(playStub.calledOnce);
          });

          describe("on iPhone", function () {
            it("must NOT set the currentTime to 0 on the first play", function () {
              utilities.isIPhone.returns(true);
              var player = videojs(document.createElement('video'), {});
              sinon.stub(player, 'currentTime');
              sinon.assert.notCalled(player.currentTime);

              playerUtils.prepareForAds(player);
              player.trigger('vast.firstPlay');
              sinon.assert.neverCalledWith(player.currentTime, 0);
            });

            it("must NOT restore the muted volume on  'vast.firstPlay' evt", function () {
              utilities.isIPhone.returns(true);
              playerUtils.prepareForAds(player);
              player.volume(1);
              player.muted(false);
              player.play();
              assert.isFalse(player.muted());

              player.trigger('vast.firstPlay');
              assert.isFalse(player.muted());
              assert.equal(player.volume(), 1);
            });


          });
      });

      describe("on Resume", function () {
        var player, playSpy;

        beforeEach(function () {
          player = videojs(document.createElement('video'), {});
          playSpy = sinon.spy(player, 'play');
        });

        it("must resume the video content", function () {
          playerUtils.prepareForAds(player);
          player.trigger('play');
          sinon.assert.notCalled(playSpy);
          player.play();
          sinon.assert.calledOnce(playSpy);
        });

        it("with an ad playing it must resume the ad and not resume the video content", function () {
          var fakeAdUnit = {
            resumeAd: sinon.spy()
          };

          playerUtils.prepareForAds(player);
          player.trigger('play');

          //We fake that an ad is playing
          player.vast = {adUnit: fakeAdUnit};
          player.play();
          assert.isTrue(playSpy.notCalled);
          sinon.assert.calledOnce(fakeAdUnit.resumeAd);
        });

        it("with an ad playing called with the callOrig flag to true, must call the orig play", function () {
          var fakeAdUnit = {
            resumeAd: sinon.spy()
          };

          playerUtils.prepareForAds(player);
          player.play();

          //We fake that an ad is playing
          player.vast = {adUnit: fakeAdUnit};
          sinon.assert.calledOnce(playSpy);

          player.play(true);
          sinon.assert.calledTwice(playSpy);
        });
      });

      it("must return the player", function () {
        var player = videojs(document.createElement('video'), {});
        playerUtils.prepareForAds(player);
        assert.equal(player.play(), player);
      });
    });

    describe("player.pause", function () {
      var player, pauseSpy;

      beforeEach(function () {
        player = videojs(document.createElement('video'), {});
        pauseSpy = sinon.spy(player, 'pause');
      });

      it("must return the player", function () {
        playerUtils.prepareForAds(player);
        assert.equal(player.pause(), player);
      });

      it("must pause the content", function () {
        playerUtils.prepareForAds(player);
        player.pause();
        assert.isTrue(pauseSpy.calledOnce);
      });

      describe("with an ad playing", function () {
        beforeEach(function () {
          player.vast = {
            adUnit: {
              pauseAd: sinon.spy()
            }
          };
        });

        it("must pause the ad and not the video content", function(){
          playerUtils.prepareForAds(player);
          player.pause();
          assert.isTrue(pauseSpy.notCalled);
          assert.isTrue(player.vast.adUnit.pauseAd.calledOnce);
        });

        it("must pause the content if called with the callOriginalPause flag to true", function(){
          playerUtils.prepareForAds(player);
          player.pause(true);
          assert.isTrue(pauseSpy.calledOnce);
          assert.isTrue(player.vast.adUnit.pauseAd.notCalled);
        });
      });
    });

    describe("player.paused", function(){
      var player, pausedStub;

      beforeEach(function () {
        player = videojs(document.createElement('video'), {});
        pausedStub = sinon.stub(player, 'paused');
      });

      it("must return true if the player is paused and false otherwise", function(){
        playerUtils.prepareForAds(player);
        pausedStub.returns(false);
        assert.isFalse(player.paused());

        pausedStub.returns(true);
        assert.isTrue(player.paused());
      });

      describe("with ads enabled", function(){
        beforeEach(function () {
          player.vast = {
            adUnit: {
              isPaused: sinon.stub()
            }
          };
        });

        it("must return true if the ad is paused and false otherwise", function(){
          playerUtils.prepareForAds(player);
          player.vast.adUnit.isPaused.returns(false);
          assert.isFalse(player.paused());

          player.vast.adUnit.isPaused.returns(true);
          assert.isTrue(player.paused());
        });

        it("must check if the content is paused if called with the callOriginalPause flag to true", function(){
          playerUtils.prepareForAds(player);
          pausedStub.returns(false);
          assert.isFalse(player.paused(true));

          pausedStub.returns(true);
          assert.isTrue(player.paused(true));
          sinon.assert.notCalled(player.vast.adUnit.isPaused);
        });

      });
    });
  });

  it("must not mute the video if the play is not the firstPlay", function () {
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    player.play();// First Play
    player.trigger('play');
    player.volume(1);
    player.muted(false);
    player.play();// Second Play
    assert.isFalse(player.muted());
  });

  it("must not mute the video if it is on an iphone device", function () {
    utilities.isIPhone.returns(true);
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    player.play();// First Play
    assert.isFalse(player.muted());
  });

  it("must add the 'vjs-ad-playing' class on vast.adStart to the player.el()", function () {
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
    player.trigger('vast.adStart');
    assert.isTrue(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  it("must remove the 'vjs-ad-playing' class on vast.adsCancel to the player.el()", function () {
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    player.trigger('vast.adStart');
    player.trigger('vast.adsCancel');
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  it("must remove the 'vjs-ad-playing' class on vast.adEnd to the player.el()", function () {
    var player = videojs(document.createElement('video'), {});
    playerUtils.prepareForAds(player);
    player.trigger('vast.adStart');
    player.trigger('vast.adEnd');
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  describe("firstPlay", function () {
    var player, firstPlaySpy;

    beforeEach(function () {
      var videoEl = document.createElement('video');
      player = videojs(videoEl, {});
      playerUtils.prepareForAds(player);
      firstPlaySpy = sinon.spy();
    });

    it("must be triggered on the first play", function () {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      sinon.assert.calledOnce(firstPlaySpy);
    });

    it("must not be triggered on a second play event", function () {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      player.trigger('play');
      player.trigger('play');
      player.trigger('play');
      sinon.assert.calledOnce(firstPlaySpy);
    });

    it("must be reset on 'vast.reset' event", function () {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      player.trigger('vast.reset');
      player.trigger('play');
      sinon.assert.calledTwice(firstPlaySpy);
    });
  });
});

describe("playerUtils.removeNativePoster", function () {
  var testDiv, player, tech;

  beforeEach(function () {
    testDiv = document.createElement("div");
    testDiv.innerHTML = '<video id="playerVideoTestEl_removeNativePoster" class="video-js vjs-default-skin" ' +
      'controls preload="none" style="border:none"' +
      'poster="http://vjs.zencdn.net/v/oceans.png" >' +
      '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
      '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
      '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
      '</p>' +
      '</video>';
    document.body.appendChild(testDiv);
    player = videojs("#playerVideoTestEl_removeNativePoster", {});
    tech = player.el().querySelector('.vjs-tech');
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  it("must remove the poster of the passed player", function () {
    playerUtils.removeNativePoster(player);
    assert.isNull(tech.getAttribute('poster'));
  });
});

describe("playerUtils.once", function () {
  it("must execute the passed handler once and only once no matter how many events we register to it.", function () {
    var spy = sinon.spy();
    var player = videojs(document.createElement('video'), {});
    playerUtils.once(player, ['play', 'playing', 'pause'], spy);
    player.trigger('play');
    player.trigger('playing');
    player.trigger('play');
    player.trigger('pause');
    sinon.assert.calledOnce(spy);
  });
});
