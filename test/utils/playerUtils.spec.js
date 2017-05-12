const dom = require('../../src/scripts/utils/dom');
const utilities = require('../../src/scripts/utils/utilityFunctions');
const playerUtils = require('../../src/scripts/utils/playerUtils');

const videoJsVersion = parseInt(videojs.VERSION.split('.')[0], 10);

if (videoJsVersion === 4) {
  require('../../src/scripts/plugin/components/ads-label_4');
  require('../../src/scripts/plugin/components/black-poster_4');
}
if (videoJsVersion === 5) {
  require('../../src/scripts/plugin/components/ads-label_5');
  require('../../src/scripts/plugin/components/black-poster_5');
}


describe('playerUtils', () => {
  let testDiv, player, tech;

  beforeEach(() => {
    testDiv = document.createElement('div');
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
    player = videojs('#playerVideoTestEl_playerUtils');
    tech = player.el().querySelector('.vjs-tech');
  });

  afterEach(() => {
    dom.remove(testDiv);
  });

  describe('getPlayerSnapshot', () => {
    it('must return a snapshot obj', () => {
      const snapshot = playerUtils.getPlayerSnapshot(player);

      assert.deepEqual(snapshot, {
        ended: false,
        src: 'http://vjs.zencdn.net/v/oceans.mp4',
        currentTime: 0,
        type: 'video/mp4',
        suppressedTracks: [],
        nativePoster: 'http://vjs.zencdn.net/v/oceans.png',
        style: 'border:none',
        playing: false
      });
    });

    it('must not set the style and the native poster if there is no tech', () => {
      // We remove the so the method can not find the tech
      dom.removeClass(tech, 'vjs-tech');
      const snapshot = playerUtils.getPlayerSnapshot(player);

      assert.deepEqual(snapshot, {
        ended: false,
        src: 'http://vjs.zencdn.net/v/oceans.mp4',
        currentTime: 0,
        type: 'video/mp4',
        playing: false,
        suppressedTracks: []
      });

      dom.addClass(tech, 'vjs-tech');
    });

    it('must keep the state (paused/playing) of the player', () => {
      sinon.stub(player, 'paused').returns(false);
      const snapshot = playerUtils.getPlayerSnapshot(player);

      assert.deepEqual(snapshot, {
        ended: false,
        src: 'http://vjs.zencdn.net/v/oceans.mp4',
        currentTime: 0,
        type: 'video/mp4',
        playing: true,
        suppressedTracks: [],
        nativePoster: 'http://vjs.zencdn.net/v/oceans.png',
        style: 'border:none'
      });
    });

    describe('suppressedTracks', () => {
      let testTrack;

      beforeEach(() => {
        // Note: for more info about tracks see https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
        testTrack = {
          kind: 'captions',
          label: 'test',
          language: 'en',
          mode: 'showing'
        };

        sinon.stub(player, 'remoteTextTracks').returns({
          tracks: [testTrack]
        });
      });

      afterEach(() => {
        player.remoteTextTracks.restore();
      });

      it('must suppress the remote textTracks and save the mode', () => {
        const snapshot = playerUtils.getPlayerSnapshot(player);
        const suppressedTracks = snapshot.suppressedTracks;
        const suppressedTrack = suppressedTracks[0];

        assert.equal(suppressedTracks.length, 1);
        assert.equal(suppressedTrack.mode, 'showing');
        assert.equal(suppressedTrack.track.mode, 'disabled');
      });

      it('must be empty if there are no remoteTracks', () => {
        player.remoteTextTracks.returns(null);
        const snapshot = playerUtils.getPlayerSnapshot(player);

        assert.deepEqual(snapshot.suppressedTracks, []);
      });
    });
  });

  describe('restorePlayerSnapshot', () => {
    let testTrack, snapshot;

    beforeEach(() => {
      testTrack = {
        kind: 'captions',
        label: 'test',
        language: 'en',
        mode: 'showing'
      };

      sinon.stub(player, 'remoteTextTracks').returns({
        tracks: [testTrack]
      });

      snapshot = playerUtils.getPlayerSnapshot(player);
    });

    afterEach(() => {
      player.remoteTextTracks.restore();
    });

    it('must restore the player poster', () => {
      tech.poster = '';
      playerUtils.restorePlayerSnapshot(player, snapshot);
      assert.equal(snapshot.nativePoster, 'http://vjs.zencdn.net/v/oceans.png');
      assert.equal(tech.poster, snapshot.nativePoster);
    });

    it('must restore the tech style', () => {
      tech.setAttribute('style', '');
      playerUtils.restorePlayerSnapshot(player, snapshot);
      assert.equal(snapshot.style, 'border:none');
      assert.equal(tech.getAttribute('style'), snapshot.style);
    });

    describe('when src has not changed', () => {
      beforeEach(() => {
        sinon.stub(player, 'play');
      });

      afterEach(() => {
        player.play.restore();
      });

      it('must restore the tracks', () => {
        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(snapshot.suppressedTracks.length, 1);
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'showing');
      });

      it('if snapshot was playing must start the video', () => {
        snapshot.playing = true;
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.calledOnce(player.play);
      });

      it('if snapshot was paused must not start the video', () => {
        snapshot.playing = false;
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.notCalled(player.play);
      });
    });

    describe('when src has changed', () => {
      beforeEach(() => {
        // We change the src of the player
        player.src('http://c.brightcove.com/services/mobile/streaming/index/rendition.m3u8?assetId=4367587778001');
      });

      it('must restore tracks on \'contentloadedmetadata\' event', () => {
        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(snapshot.suppressedTracks.length, 1);
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'disabled');
        player.trigger('contentloadedmetadata');
        assert.equal(snapshot.suppressedTracks[0].track.mode, 'showing');
      });

      it('must restore the src', () => {
        assert.equal(player.src(), 'http://c.brightcove.com/services/mobile/streaming/index/rendition.m3u8?assetId=4367587778001');
        assert.equal(player.currentType(), '');

        playerUtils.restorePlayerSnapshot(player, snapshot);
        assert.equal(player.src(), snapshot.src);
        assert.equal(player.currentType(), snapshot.type);
      });

      it('must load the restored src', () => {
        sinon.stub(player, 'load');
        playerUtils.restorePlayerSnapshot(player, snapshot);
        sinon.assert.calledOnce(player.load);
        player.load.restore();
      });

      describe('on \'canplay\' event', () => {
        beforeEach(() => {
          sinon.stub(player, 'play');
          sinon.stub(playerUtils, 'isReadyToResume');
          sinon.stub(player, 'currentTime');
        });

        afterEach(() => {
          player.play.restore();
          playerUtils.isReadyToResume.restore();
          player.currentTime.restore();
        });

        it('must resume the video if the tech is ready to resume', () => {
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

        it('must try to resume the video event the video el does not triggers the \'canplay\' evt', () => {
          const clock = sinon.useFakeTimers();

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

        it('must wait until the tech is ready to resume the player', () => {
          const clock = sinon.useFakeTimers();

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

        it('must try to resume the player if the tech takes more than 2 seconds to be ready', () => {
          const clock = sinon.useFakeTimers();

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

        it('must log a warning if the resume action throws an exception after waiting for the tech to be ready', () => {
          const clock = sinon.useFakeTimers();

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

  describe('isReadyToResume', () => {
    it('must return true if the tech.readyState > 1', () => {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: () => 2
      }));
    });

    it('must return true if the tech doesn\'t expose the seekable time ranges', () => {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: () => 0,
        seekable: () => undefined
      }));
    });

    it('must return true if the tech exposes the seekable time ranges', () => {
      assert.isTrue(playerUtils.isReadyToResume({
        readyState: () => 0,
        seekable: () => ({length: 1})
      }));
    });

    it('must return false if the tech isn not ready an seekable', () => {
      assert.isFalse(playerUtils.isReadyToResume({
        readyState: () => 0,
        seekable: () => ({length: 0})
      }));
    });
  });
});

describe('playerUtils.prepareForAds', () => {
  beforeEach(() => {
    sinon.stub(utilities, 'isIPhone').returns(false);
  });

  afterEach(() => {
    utilities.isIPhone.restore();
  });

  it('must add the blackPoster component to the player', () => {
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    assert.isObject(player.getChild('blackPoster'));
  });

  describe('', () => {
    let player, blackPoster;

    beforeEach(() => {
      player = videojs(document.createElement('video'), {});
      playerUtils.prepareForAds(player);

      blackPoster = player.getChild('blackPoster');
      sinon.stub(blackPoster, 'hide');
      sinon.stub(blackPoster, 'show');
    });

    afterEach(() => {
      blackPoster.hide.restore();
      blackPoster.show.restore();
    });

    it('must hide the BlackPoster on \'error\' event', () => {
      player.trigger('error');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it('must hide the BlackPoster on \'vast.adStart\' event', () => {
      player.trigger('vast.adStart');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it('must hide the blackPoster on \'vast.adsCancel\' event', () => {
      player.trigger('vast.adsCancel');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it('must hide the blackPoster on \'vast.adError\' event', () => {
      player.trigger('vast.adError');
      sinon.assert.calledOnce(blackPoster.hide);
    });

    it('must not hide the blackPoster if is already hidden', () => {
      dom.addClass(blackPoster.el(), 'vjs-hidden');
      player.trigger('vast.adStart');
      player.trigger('vast.adsCancel');
      sinon.assert.notCalled(blackPoster.hide);
    });
  });

  describe('monkeyPatched', () => {
    describe('player.play', () => {
      describe('on first play', () => {
        let player;

        beforeEach(() => {
          player = videojs(document.createElement('video'), {});
          sinon.stub(utilities, 'isMobile').returns(true);
        });

        afterEach(() => {
          utilities.isMobile.restore();
        });

        it('make sure volume and mute state are set on first play', () => {
          playerUtils.prepareForAds(player);
          player.volume(1);
          player.muted(false);
          player.play();

          assert.isFalse(player.muted());
          assert.equal(player.volume(), 1);
        });

        it('must restore the muted volume on  \'vast.reset\' evt', () => {
          playerUtils.prepareForAds(player);

          player.volume(1);
          player.muted(false);
          player.play();

          player.trigger('vast.reset');
          assert.isFalse(player.muted());
          assert.equal(player.volume(), 1);
        });

        it('must set the currentTime to 0 on \'vast.firstPlay\' evt', () => {
          const player = videojs(document.createElement('video'), {});

          sinon.stub(player, 'currentTime');
          sinon.assert.notCalled(player.currentTime);

          playerUtils.prepareForAds(player);
          player.play();
          sinon.assert.calledWithExactly(player.currentTime, 0);
        });

        it('must call player\'s play method', () => {
          const player = videojs(document.createElement('video'), {});
          const playStub = sinon.stub(player, 'play');

          playerUtils.prepareForAds(player);
          player.play();

          assert(playStub.calledOnce);
        });

        describe('on iPhone', () => {
          it('must NOT set the currentTime to 0 on the first play', () => {
            utilities.isIPhone.returns(true);
            const player = videojs(document.createElement('video'), {});

            sinon.stub(player, 'currentTime');
            sinon.assert.notCalled(player.currentTime);

            playerUtils.prepareForAds(player);
            sinon.assert.neverCalledWith(player.currentTime, 0);
          });

          it('must NOT restore the muted volume on  \'vast.firstPlay\' evt', () => {
            utilities.isIPhone.returns(true);
            playerUtils.prepareForAds(player);
            player.volume(1);
            player.muted(false);
            player.play();

            assert.isFalse(player.muted());
            assert.equal(player.volume(), 1);
          });
        });
      });

      describe('on Resume', () => {
        let player, playSpy;

        beforeEach(() => {
          player = videojs(document.createElement('video'), {});
          playSpy = sinon.spy(player, 'play');
        });

        it('must resume the video content', () => {
          playerUtils.prepareForAds(player);
          player.trigger('play');
          sinon.assert.notCalled(playSpy);
          player.play();
          sinon.assert.calledOnce(playSpy);
        });

        it('with an ad playing it must resume the ad and not resume the video content', () => {
          const fakeAdUnit = {
            resumeAd: sinon.spy()
          };

          playerUtils.prepareForAds(player);
          player.trigger('play');

          // We fake that an ad is playing
          player.vast = {adUnit: fakeAdUnit};
          player.play();
          assert.isTrue(playSpy.notCalled);
          sinon.assert.calledOnce(fakeAdUnit.resumeAd);
        });

        it('with an ad playing called with the callOrig flag to true, must call the orig play', () => {
          const fakeAdUnit = {
            resumeAd: sinon.spy()
          };

          playerUtils.prepareForAds(player);
          player.play();
          player.trigger('play');

          // We fake that an ad is playing
          player.vast = {adUnit: fakeAdUnit};
          sinon.assert.calledOnce(playSpy);

          player.play(true);
          sinon.assert.calledTwice(playSpy);
        });
      });

      it('must return the player', () => {
        const player = videojs(document.createElement('video'), {});

        playerUtils.prepareForAds(player);
        assert.equal(player.play(), player);
      });
    });

    describe('player.pause', () => {
      let player, pauseSpy;

      beforeEach(() => {
        player = videojs(document.createElement('video'), {});
        pauseSpy = sinon.spy(player, 'pause');
      });

      it('must return the player', () => {
        playerUtils.prepareForAds(player);
        assert.equal(player.pause(), player);
      });

      it('must pause the content', () => {
        playerUtils.prepareForAds(player);
        player.pause();
        assert.isTrue(pauseSpy.calledOnce);
      });

      describe('with an ad playing', () => {
        beforeEach(() => {
          player.vast = {
            adUnit: {
              pauseAd: sinon.spy()
            }
          };
        });

        it('must pause the ad and not the video content', () => {
          playerUtils.prepareForAds(player);
          player.pause();
          assert.isTrue(pauseSpy.notCalled);
          assert.isTrue(player.vast.adUnit.pauseAd.calledOnce);
        });

        it('must pause the content if called with the callOriginalPause flag to true', () => {
          playerUtils.prepareForAds(player);
          player.pause(true);
          assert.isTrue(pauseSpy.calledOnce);
          assert.isTrue(player.vast.adUnit.pauseAd.notCalled);
        });
      });
    });

    describe('player.paused', () => {
      let player, pausedStub;

      beforeEach(() => {
        player = videojs(document.createElement('video'), {});
        pausedStub = sinon.stub(player, 'paused');
      });

      it('must return true if the player is paused and false otherwise', () => {
        playerUtils.prepareForAds(player);
        pausedStub.returns(false);
        assert.isFalse(player.paused());

        pausedStub.returns(true);
        assert.isTrue(player.paused());
      });

      describe('with ads enabled', () => {
        beforeEach(() => {
          player.vast = {
            adUnit: {
              isPaused: sinon.stub()
            }
          };
        });

        it('must return true if the ad is paused and false otherwise', () => {
          playerUtils.prepareForAds(player);
          player.vast.adUnit.isPaused.returns(false);
          assert.isFalse(player.paused());

          player.vast.adUnit.isPaused.returns(true);
          assert.isTrue(player.paused());
        });

        it('must check if the content is paused if called with the callOriginalPause flag to true', () => {
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

  it('must not mute the video if the play is not the firstPlay', () => {
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    player.play();
    player.trigger('play');
    player.volume(1);
    player.muted(false);
    player.play();
    assert.isFalse(player.muted());
  });

  it('must not mute the video if it is on an iphone device', () => {
    utilities.isIPhone.returns(true);
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    player.play();
    assert.isFalse(player.muted());
  });

  it('must add the \'vjs-ad-playing\' class on vast.adStart to the player.el()', () => {
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
    player.trigger('vast.adStart');
    assert.isTrue(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  it('must remove the \'vjs-ad-playing\' class on vast.adsCancel to the player.el()', () => {
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    player.trigger('vast.adStart');
    player.trigger('vast.adsCancel');
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  it('must remove the \'vjs-ad-playing\' class on vast.adEnd to the player.el()', () => {
    const player = videojs(document.createElement('video'), {});

    playerUtils.prepareForAds(player);
    player.trigger('vast.adStart');
    player.trigger('vast.adEnd');
    assert.isFalse(dom.hasClass(player.el(), 'vjs-ad-playing'));
  });

  describe('firstPlay', () => {
    let player, firstPlaySpy;

    beforeEach(() => {
      const videoEl = document.createElement('video');

      player = videojs(videoEl, {});
      playerUtils.prepareForAds(player);
      firstPlaySpy = sinon.spy();
    });

    it('must be triggered on the first play', () => {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      sinon.assert.calledOnce(firstPlaySpy);
    });

    it('must not be triggered on a second play event', () => {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      player.trigger('play');
      player.trigger('play');
      player.trigger('play');
      sinon.assert.calledOnce(firstPlaySpy);
    });

    it('must be reset on \'vast.reset\' event', () => {
      player.on('vast.firstPlay', firstPlaySpy);
      player.trigger('play');
      player.trigger('vast.reset');
      player.trigger('play');
      sinon.assert.calledTwice(firstPlaySpy);
    });
  });
});

describe('playerUtils.removeNativePoster', () => {
  it('must remove the poster of the passed player', () => {
    const testDiv = document.createElement('div');

    testDiv.innerHTML = '<video id="playerVideoTestEl_removeNativePoster" class="video-js vjs-default-skin" ' +
      'controls preload="none" style="border:none"' +
      'poster="http://vjs.zencdn.net/v/oceans.png" >' +
      '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
      '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
      '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
      '</p>' +
      '</video>';
    document.body.appendChild(testDiv);

    const player = videojs('#playerVideoTestEl_removeNativePoster', {});
    const tech = player.el().querySelector('.vjs-tech');

    playerUtils.removeNativePoster(player);
    assert.isNull(tech.getAttribute('poster'));

    dom.remove(testDiv);
  });
});

describe('playerUtils.once', () => {
  it('must execute the passed handler once and only once no matter how many events we register to it.', () => {
    const spy = sinon.spy();
    const player = videojs(document.createElement('video'), {});

    playerUtils.once(player, ['play', 'playing', 'pause'], spy);
    player.trigger('play');
    player.trigger('playing');
    player.trigger('play');
    player.trigger('pause');
    sinon.assert.calledOnce(spy);
  });
});
