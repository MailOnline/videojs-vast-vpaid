

describe('VASTTracker', () => {
  const TrackingEvent = require('../../../src/scripts/ads/vast/TrackingEvent');
  const VASTError = require('../../../src/scripts/ads/vast/VASTError');
  const VASTTracker = require('../../../src/scripts/ads/vast/VASTTracker');
  const VASTResponse = require('../../../src/scripts/ads/vast/VASTResponse');
  const vastUtil = require('../../../src/scripts/ads/vast/vastUtil');

  const utilities = require('../../../src/scripts/utils/utilityFunctions');
  const xml = require('../../../src/scripts/utils/xml');

  let response, ASSET_URI;

  function createTrackEvent (eventName, uri) {
    const trackingXML = '<Tracking event="' + eventName + '">' +
      '<![CDATA[' + uri + ']]>' +
      '</Tracking>';

    return new TrackingEvent(xml.toJXONTree(trackingXML));
  }

  beforeEach(() => {
    response = new VASTResponse();
    response._addDuration(100000);// <== 100 seconds
    ASSET_URI = 'http://ASSET_URI';
  });

  it('must return an instance of itself', () => {
    assert.instanceOf(new VASTTracker(ASSET_URI, response), VASTTracker);
  });

  it('must throw an error if you don\'t pass an asset URI to the constructor', () => {
    assert.throws(() => {
      // eslint-disable-next-line
      new VASTTracker();
    }, VASTError, 'VAST Error: on VASTTracker constructor, missing required the URI of the ad asset being played');
  });

  it('must throw an error if you don\'t pass a VASTResponse obj to the constructor', () => {
    assert.throws(() => {
      // eslint-disable-next-line
      new VASTTracker(ASSET_URI);
    }, VASTError, 'VAST Error: on VASTTracker constructor, missing required VAST response');
  });

  describe('instance', () => {
    let origTrack;

    function assertVASTTrackRequest (URLs, variables) {
      URLs = utilities.isArray(URLs) ? URLs : [URLs];
      sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
    }

    beforeEach(() => {
      origTrack = vastUtil.track;
      vastUtil.track = sinon.spy();
    });

    afterEach(() => {
      vastUtil.track = origTrack;
    });

    it('must publish the response', () => {
      const tracker = new VASTTracker(ASSET_URI, response);

      assert.equal(tracker.response, response);
    });

    it('must publish the assetUri passed to the constructor', () => {
      const tracker = new VASTTracker(ASSET_URI, response);

      assert.equal(tracker.assetURI, ASSET_URI);
    });

    it('must set the progress to 0 at start', () => {
      const tracker = new VASTTracker(ASSET_URI, response);

      assert.equal(tracker.progress, 0);
    });

    it('must publish the quartiles using the duration set on the vastResponse', () => {
      response._addDuration(10000);
      const tracker = new VASTTracker(ASSET_URI, response);

      assert.deepEqual(tracker.quartiles, {
        firstQuartile: {tracked: false, time: 2500},
        midpoint: {tracked: false, time: 5000},
        thirdQuartile: {tracked: false, time: 7500}
      });
    });

    describe('trackURLs', () => {
      let tracker;

      beforeEach(() => {
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must add ASSETURI and CONTENTPLAYHEAD to the tracking variables', () => {
        tracker.trackURLs(['http://sample.track.url']);
        assertVASTTrackRequest(['http://sample.track.url'], {
          ASSETURI: ASSET_URI,
          CONTENTPLAYHEAD: '00:00:00.000'
        });
      });

      it('must track the passed urls with he passed variables', () => {
        tracker.trackURLs(['http://sample.track.url'], {FOOVAR: 'FOOVAR'});
        assertVASTTrackRequest(['http://sample.track.url'], {
          ASSETURI: ASSET_URI,
          CONTENTPLAYHEAD: '00:00:00.000',
          FOOVAR: 'FOOVAR'
        });
      });

      it('must not track anything if the passed urls is not an array with urls', () => {
        tracker.trackURLs([], {FOOVAR: 'FOOVAR'});
        tracker.trackURLs({}, {FOOVAR: 'FOOVAR'});
        tracker.trackURLs(null, {FOOVAR: 'FOOVAR'});
        tracker.trackURLs(undefined, {FOOVAR: 'FOOVAR'});
        sinon.assert.notCalled(vastUtil.track);
      });
    });

    describe('trackEvent', () => {
      let tracker;

      beforeEach(() => {
        response._addTrackingEvents([
          createTrackEvent('start', 'http://start.trackEvent.url'),
          createTrackEvent('pause', ''),
          createTrackEvent('close', 'http://close.trackEvent.url'),
          createTrackEvent('firstQuartile', 'http://firstQuartile.trackEvent.url')
        ]);
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must track the passed event', () => {
        tracker.trackEvent('start');
        assertVASTTrackRequest(['http://start.trackEvent.url'], {ASSETURI: ASSET_URI, CONTENTPLAYHEAD: '00:00:00.000'});

        tracker.progress = 120;
        tracker.trackEvent('close');
        assertVASTTrackRequest(['http://close.trackEvent.url'], {ASSETURI: ASSET_URI, CONTENTPLAYHEAD: '00:00:00.120'});
      });

      it('must not track anything if the tracker is not tracking the passed event', () => {
        tracker.trackEvent('fooEvent');
        sinon.assert.notCalled(vastUtil.track);
      });

      it('must not track anything if the tracking event has undefined url', () => {
        tracker.trackEvent('pause');
        sinon.assert.notCalled(vastUtil.track);
      });

      it('must be possible to mark an track event as track one.', () => {
        tracker.trackEvent('start', true);
        assertVASTTrackRequest(['http://start.trackEvent.url'], {ASSETURI: ASSET_URI, CONTENTPLAYHEAD: '00:00:00.000'});

        assert.isUndefined(tracker.response.trackingEvents.start);

        vastUtil.track.reset();
        tracker.trackEvent('start');
        sinon.assert.notCalled(vastUtil.track);
      });
    });

    describe('trackProgress', () => {
      let tracker, progressEvent, progressEvent2;

      beforeEach(() => {
        progressEvent = createTrackEvent('progress', 'http://progress.track.url');
        progressEvent.offset = 100;
        progressEvent2 = createTrackEvent('progress', 'http://progress2.track.url');
        progressEvent2.offset = 150;
        response._addTrackingEvents([
          createTrackEvent('start', 'http://start.track.url'),
          createTrackEvent('rewind', 'http://rewind.track.url'),
          createTrackEvent('firstQuartile', 'http://firstQuartile.track.url'),
          createTrackEvent('midpoint', 'http://midpoint.track.url'),
          createTrackEvent('thirdQuartile', 'http://thirdQuartile.track.url'),
          progressEvent,
          progressEvent2
        ]);
        tracker = new VASTTracker(ASSET_URI, response);
        sinon.spy(tracker, 'trackEvent');
        sinon.spy(tracker, 'trackURLs');
      });

      it('must set the progress in the tracker', () => {
        tracker.trackProgress(124324);
        assert.equal(tracker.progress, 124324);
      });

      it('must not set the progress if you don\'t pass an number for the progress', () => {
        tracker.trackProgress();
        tracker.trackProgress(null);
        tracker.trackProgress('foo');
        tracker.trackProgress([]);
        tracker.trackProgress({});
        assert.equal(tracker.progress, 0);
      });

      it('must track start event whenever the progress becomes bigger that 0 for the first time.', () => {
        tracker.trackProgress(1);
        sinon.assert.calledWithExactly(tracker.trackEvent, 'start', true);
      });

      it('must NOT track the rewind event if the new progress is smaller than the current one by less thant 3 seconds', () => {
        tracker.trackProgress(1000);
        tracker.trackEvent.reset();

        tracker.trackProgress(5);
        sinon.assert.notCalled(tracker.trackEvent);
      });

      it('must track the rewind event if the new progress is smaller than the current one by more than 3 seconds', () => {
        tracker.trackProgress(10000);
        tracker.trackEvent.reset();

        tracker.trackProgress(5000);
        sinon.assert.calledWithExactly(tracker.trackEvent, 'rewind', false);
      });

      it('must track the quartile on the proper order', () => {
        tracker.trackEvent.reset();

        // FirstQuartile
        tracker.trackProgress(10000);// <== 10 seconds
        sinon.assert.neverCalledWith(tracker.trackEvent, 'firstQuartile', true);
        tracker.trackProgress(25000);// <== 25 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'firstQuartile', true);

        // midPoint
        tracker.trackProgress(35000);// <== 35 seconds
        sinon.assert.neverCalledWith(tracker.trackEvent, 'midpoint', true);
        tracker.trackProgress(50000);// <== 50 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'midpoint', true);

        // thirdQuartile
        tracker.trackProgress(65000);// <== 65 seconds
        sinon.assert.neverCalledWith(tracker.trackEvent, 'thirdQuartile', true);
        tracker.trackProgress(75500);// <== 75.5 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'thirdQuartile', true);
      });

      it('must not be possible to track a bigger quartile if the previous quartile has not been tracked', () => {
        tracker.trackEvent.reset();

        tracker.trackProgress(75500);// <== 75.5 seconds
        tracker.trackProgress(50000);// <== 50 seconds
        sinon.assert.neverCalledWith(tracker.trackEvent, 'firstQuartile', true);
        sinon.assert.neverCalledWith(tracker.trackEvent, 'thirdQuartile', true);
        sinon.assert.neverCalledWith(tracker.trackEvent, 'midpoint', true);

        tracker.trackProgress(29000);// <== 25 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'firstQuartile', true);
        sinon.assert.neverCalledWith(tracker.trackEvent, 'thirdQuartile', true);
        sinon.assert.neverCalledWith(tracker.trackEvent, 'midpoint', true);

        tracker.trackProgress(50000);// <== 25 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'firstQuartile', true);
        sinon.assert.calledWithExactly(tracker.trackEvent, 'midpoint', true);
        sinon.assert.neverCalledWith(tracker.trackEvent, 'thirdQuartile', true);

        tracker.trackProgress(78500);// <== 25 seconds
        sinon.assert.calledWithExactly(tracker.trackEvent, 'firstQuartile', true);
        sinon.assert.calledWithExactly(tracker.trackEvent, 'midpoint', true);
        sinon.assert.calledWithExactly(tracker.trackEvent, 'thirdQuartile', true);
      });

      it('must trigger the progress event after the specified offset has passed', () => {
        tracker.trackProgress(95);
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent.uri]);
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent2.uri]);
        tracker.trackProgress(100);
        sinon.assert.calledWithExactly(tracker.trackURLs, [progressEvent.uri]);
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent2.uri]);

        // Second tracking event
        tracker.trackURLs.reset();
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent.uri]);
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent2.uri]);

        tracker.trackProgress(150);
        sinon.assert.neverCalledWith(tracker.trackURLs, [progressEvent.uri]);
        sinon.assert.calledWithExactly(tracker.trackURLs, [progressEvent2.uri]);
      });
    });

    [
      'rewind',
      'fullscreen',
      'exitFullscreen',
      'pause',
      'resume',
      'mute',
      'unmute',
      'acceptInvitation',
      'acceptInvitationLinear',
      'collapse',
      'expand'
    ].forEach((eventName) => {
      const fnName = 'track' + utilities.capitalize(eventName);

      describe(fnName, () => {
        let tracker;

        beforeEach(() => {
          tracker = new VASTTracker(ASSET_URI, response);
          sinon.spy(tracker, 'trackEvent');
        });

        it('must track the \'' + eventName + '\' event', () => {
          tracker[fnName]();
          sinon.assert.calledWithExactly(tracker.trackEvent, eventName);
        });
      });
    });

    [
      'start',
      'skip',
      'close',
      'closeLinear'
    ].forEach((eventName) => {
      const fnName = 'track' + utilities.capitalize(eventName);

      describe(fnName, () => {
        let tracker;

        beforeEach(() => {
          tracker = new VASTTracker(ASSET_URI, response);
          sinon.spy(tracker, 'trackEvent');
        });

        it('must track the \'' + eventName + '\' event', () => {
          tracker[fnName]();
          sinon.assert.calledWithExactly(tracker.trackEvent, eventName, true);
        });
      });
    });

    [
      'firstQuartile',
      'midpoint',
      'thirdQuartile'
    ].forEach((quartile) => {
      const fnName = 'track' + utilities.capitalize(quartile);

      describe(fnName, () => {
        let tracker;

        beforeEach(() => {
          tracker = new VASTTracker(ASSET_URI, response);
          sinon.spy(tracker, 'trackEvent');
        });

        it('must track the \'' + quartile + '\' event', () => {
          tracker[fnName]();
          sinon.assert.calledWithExactly(tracker.trackEvent, quartile, true);
          assert.isTrue(tracker.quartiles[quartile].tracked);
        });
      });
    });

    describe('trackComplete', () => {
      let tracker;

      beforeEach(() => {
        tracker = new VASTTracker(ASSET_URI, response);
        sinon.spy(tracker, 'trackEvent');
      });

      it('must not track the complete event if the thirdQuartile was not tracked', () => {
        tracker.trackComplete();
        sinon.assert.neverCalledWith(tracker.trackEvent, 'complete', true);
      });

      it('must track the complete event if the thirdQuartile was tracked', () => {
        tracker.quartiles.thirdQuartile.tracked = true;
        tracker.trackComplete();
        sinon.assert.calledWithExactly(tracker.trackEvent, 'complete', true);
      });
    });


    describe('trackErrorWithCode', () => {
      let tracker;

      beforeEach(() => {
        response._addErrorTrackUrl('http://error.track.url');
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must track the passed error code', () => {
        tracker.trackErrorWithCode(101);
        assertVASTTrackRequest(['http://error.track.url'], {
          ASSETURI: ASSET_URI,
          CONTENTPLAYHEAD: '00:00:00.000',
          ERRORCODE: 101
        });
      });

      it('must not track anything if you don\'t pass a valid error code', () => {
        tracker.trackErrorWithCode('1224');
        tracker.trackErrorWithCode(null);
        tracker.trackErrorWithCode({});
        tracker.trackErrorWithCode();
        sinon.assert.notCalled(vastUtil.track);
      });
    });

    describe('trackImpressions', () => {
      let tracker;

      beforeEach(() => {
        response._addImpressions(['http://impressions.track.url']);
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must track the impressionURLs', () => {
        tracker.trackImpressions();
        assertVASTTrackRequest(['http://impressions.track.url'], {
          ASSETURI: ASSET_URI,
          CONTENTPLAYHEAD: '00:00:00.000'
        });
      });
    });

    describe('trackCreativeView', () => {
      let tracker;

      beforeEach(() => {
        response._addTrackingEvents([
          createTrackEvent('creativeView', 'http://creativeView.trackEvent.url')
        ]);
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must track the creativeViewURLs when called with trackCreativeView', () => {
        tracker.trackCreativeView();
        assertVASTTrackRequest(['http://creativeView.trackEvent.url'], {ASSETURI: ASSET_URI, CONTENTPLAYHEAD: '00:00:00.000'});
      });

      it('must track the creativeViewURLs when called with trackEvent', () => {
        tracker.trackEvent('creativeView');
        assertVASTTrackRequest(['http://creativeView.trackEvent.url'], {ASSETURI: ASSET_URI, CONTENTPLAYHEAD: '00:00:00.000'});
      });
    });

    describe('trackClick', () => {
      let tracker;

      beforeEach(() => {
        response._addClickTrackings(['http://click.track.url']);
        tracker = new VASTTracker(ASSET_URI, response);
      });

      it('must track the clickTracking URLS', () => {
        tracker.trackClick();
        assertVASTTrackRequest(['http://click.track.url'], {
          ASSETURI: ASSET_URI,
          CONTENTPLAYHEAD: '00:00:00.000'
        });
      });
    });
  });
});
