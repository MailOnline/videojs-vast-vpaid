'use strict';

describe("VASTResponse", function () {

  var Ad = require('ads/vast/Ad');
  var InLine = require('ads/vast/InLine');
  var Linear = require('ads/vast/Linear');
  var NonLinear = require('ads/vast/NonLinear');
  var TrackingEvent = require('ads/vast/TrackingEvent');
  var VASTResponse = require('ads/vast/VASTResponse');
  var VideoClicks = require('ads/vast/VideoClicks');
  var Wrapper = require('ads/vast/Wrapper');

  var xml = require('utils/xml');
  var utilities = require('utils/utilityFunctions');

  var testUtils = require('../../test-utils');

  function assertVASTResponseEmpty(vastResponse) {
    assert.deepEqual(vastResponse, new VASTResponse());
  }

  it("must return an instance of itself", function () {
    assert.instanceOf(new VASTResponse(), VASTResponse);
  });

  describe("instance", function () {
    var response;

    beforeEach(function () {
      response = new VASTResponse();
    });

    // FIELDS
    describe("ads", function () {
      it("must be an array", function () {
        assert.isArray(response.ads);
      });
    });

    describe("errorURLMacros", function () {
      it("must be an array", function () {
        assert.isArray(response.errorURLMacros);
      });
    });

    describe("impressions", function () {
      it("must be an array", function () {
        assert.isArray(response.impressions);
      });
    });

    describe("clickThrough", function () {
      it("must be undefined by default", function () {
        assert.isUndefined(response.clickThrough);
      });
    });

    describe("clickTrackings", function () {
      it("must be an array", function () {
        assert.isArray(response.clickTrackings);
      });
    });

    describe("customClicks", function () {
      it("must be an array", function () {
        assert.isArray(response.customClicks);
      });
    });

    describe("trackingEvents", function () {
      it("must be an array", function () {
        assert.isObject(response.trackingEvents);
      });
    });

    describe("adTitle", function () {
      it("must be an empty string", function () {
        assert.isTrue(utilities.isEmptyString(response.adTitle));
      });
    });

    describe('duration', function () {
      it("must be undefined by default", function () {
        assert.isUndefined(response.duration);
      });
    });

    describe("mediaFiles", function(){
      it("must be an empty array by default", function(){
        testUtils.assertEmptyArray(response.mediaFiles);
      });
    });

    describe("skipoffset", function(){
      it("must be undefined by default", function(){
        assert.isUndefined(response.skipoffset);
      });
    });

    //HELPER FUNCTIONS

    describe("addAd", function () {
      it("must add the passed ad to the ads array", function () {
        var vastJTree = xml.toJXONTree('<VAST><Ad></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        response.addAd(ad);
        assert.deepEqual([ad], response.ads);
      });

      it("must not add anything if undefined", function () {
        response.addAd();
        assert.deepEqual([], response.ads);
      });

      it("must not add anything if the passed ad is not an instance of Ad", function () {
        response.addAd(xml.toJXONTree('<VAST><Ad></Ad></VAST>'));
        assert.deepEqual([], response.ads);
      });

      it("must add the InLine to the response if the passed ad has an InLine", function(){
        var vastJTree = xml.toJXONTree('<VAST><Ad><InLine></InLine></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        sinon.stub(response, '_addInLine');
        response.addAd(ad);
        sinon.assert.calledWithExactly(response._addInLine, ad.inLine);
      });

      it("must add the wrapper to the response if the passed ad has a wrapper", function(){
        var vastJTree = xml.toJXONTree('<VAST><Ad><Wrapper></Wrapper></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        sinon.stub(response, '_addWrapper');
        response.addAd(ad);
        sinon.assert.calledWithExactly(response._addWrapper, ad.wrapper);
      });
    });

    describe("hasLinear", function(){
      it("must return false by default", function(){
        assert.isFalse(response.hasLinear());
      });

      it("must return true if you add linear ad to the response", function(){
        var linearXML = '<Linear><Duration>00:00:58</Duration></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);
        assert.isTrue(response.hasLinear());
      });
    });

    describe("hasNonLinear", function(){
      it("must return false by default", function(){
        assert.isFalse(response.hasNonLinear());
      });

      it("must return true if you add nonlinear ad to the response", function(){
        var nonLinear = new NonLinear(xml.toJXONTree('<NonLinear></NonLinear>'));
        response._addNonLinearAd(nonLinear);
        assert.isTrue(response.hasNonLinear());
      });
    });

    describe("_addErrorTrackUrl", function () {
      it("must be possible to pass the error as a string", function () {
        response._addErrorTrackUrl('http://t4.liverail.com/?metric=error&erc=[ERRORCODE]');
        assert.deepEqual(['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]'], response.errorURLMacros);
      });

      it("must add the passed error to the errorURLMacros", function () {
        var vastJTree = xml.toJXONTree('<VAST><Error><![CDATA[http://t4.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></VAST>');
        response._addErrorTrackUrl(vastJTree.error);
        assert.deepEqual(['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]'], response.errorURLMacros);
      });

      it("must not add anything if the error has no URL template", function () {
        var vastJTree = xml.toJXONTree('<VAST><Error><![CDATA[]]></Error></VAST>');
        response._addErrorTrackUrl(vastJTree.error);
        assert.deepEqual([], response.errorURLMacros);
      });

      it("must not add anything if you pass undefined", function () {
        response._addErrorTrackUrl();
        assert.deepEqual([], response.errorURLMacros);
      });
    });

    describe("_addImpressions", function () {
      it("must not add any impression if you don't pass an array of impressions", function () {
        response._addImpressions();
        response._addImpressions({});
        response._addImpressions('');
        response._addImpressions([]);
        testUtils.assertEmptyArray(response.impressions);
      });

      it("must add the passed impressionTree to the impressions array", function () {
        var impressionTree = xml.toJXONTree('<InLine><Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression></InLine>');
        var inLine = new InLine(impressionTree);
        response._addImpressions(inLine.impressions);
        assert.deepEqual([
            "http://Impression.url.track.com"
          ],
          response.impressions);
      });

      it("must add all passed impressionTree array to the impressions array", function () {
        var impressionXML = '<Wrapper>' +
          '<Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression>' +
          '<Impression><![CDATA[http://Impression2.url.track.com]]></Impression>' +
          '<Impression id="1111"></Impression>' +
          '</Wrapper>';
        var impressionTree = xml.toJXONTree(impressionXML);
        var wrapper = new Wrapper(impressionTree);
        response._addImpressions(wrapper.impressions);
        assert.deepEqual([
            "http://Impression.url.track.com",
            "http://Impression2.url.track.com"
          ],
          response.impressions);
      });
    });

    describe("addClickTrough", function () {
      it("must not add anything if you don't pass a url str", function () {
        response._addClickThrough();
        response._addClickThrough({});
        response._addClickThrough('');
        assert.isUndefined(response.clickThrough);
      });

      it("must add the passed clickthrough to the response ", function () {
        response._addClickThrough('http://wwww.clickThrough.url.com');
        assert.equal('http://wwww.clickThrough.url.com', response.clickThrough);
      });
    });

    describe("_addClickTrackings", function () {
      it("must not add any clickTracking if you don't pass an array of tracking urls", function () {
        response._addClickTrackings();
        response._addClickTrackings({});
        response._addClickTrackings('');
        response._addClickTrackings([]);
        testUtils.assertEmptyArray(response.clickTrackings);
      });

      it("must add all the passed clickTrackings to the response", function () {
        response._addClickTrackings([
          'http://ClickTracking1',
          'http://ClickTracking2'
        ]);

        assert.deepEqual([
          'http://ClickTracking1',
          'http://ClickTracking2'
        ], response.clickTrackings);
      });
    });

    describe("_addCustomClicks", function () {
      it("must not add any customClick unless you pass an array with them inside", function () {
        response._addCustomClicks();
        response._addCustomClicks({});
        response._addCustomClicks('');
        response._addCustomClicks([]);
        testUtils.assertEmptyArray(response.customClicks);
      });

      it("must add all the passed customCustom clicks to the response", function () {
        response._addCustomClicks([
          'http://CustomClick1',
          'http://CustomClick2'
        ]);

        assert.deepEqual([
          'http://CustomClick1',
          'http://CustomClick2'
        ], response.customClicks);
      });
    });

    describe("_addTrackingEvents", function(){
      function createTrackEvent(eventName, uri) {
        var trackingXML = '<Tracking event="' + eventName + '">' +
          '<![CDATA[' + uri + ']]>' +
          '</Tracking>';
        return new TrackingEvent(xml.toJXONTree(trackingXML));
      }

      it("must populate the tracking event with the passed events", function(){
        var startEvent = createTrackEvent('start', 'http://track.url.com');
        response._addTrackingEvents(startEvent);
        assert.deepEqual(response.trackingEvents, {
          start: [startEvent]
        });


        var startEvent2 = createTrackEvent('start', 'http://track.url2.com');
        var endEvent = createTrackEvent('end', 'http://track.url3.com');
        response._addTrackingEvents([startEvent2, endEvent]);
        assert.deepEqual(response.trackingEvents, {
          start: [startEvent, startEvent2],
          end: [endEvent]
        });
      });

      it("must not do anything if we don't pass a tracking event", function(){
        response._addTrackingEvents();
        response._addTrackingEvents([]);
        assert.deepEqual(response.trackingEvents, {});
      });
    });

    describe("_addTitle", function () {
      it("must not set the title in the response if you don't pass a strinc with text on it", function () {
        response._addTitle('');
        response._addTitle({});
        response._addTitle([]);
        response._addTitle();

        assert.equal('', response.adTitle);
      });

      it("must set the passed title into the response", function () {
        response._addTitle('The title of the ad');
        assert.equal('The title of the ad', response.adTitle);
      });
    });

    describe("_addDuration", function () {
      it("must add the duration to the response", function () {
        response._addDuration(123);
        assert.equal(response.duration, 123);
      });

      it("must not add anything to the response if you don't pass a number for the duration", function () {
        response._addDuration('1234');
        response._addDuration();
        response._addDuration([222]);
        assert.equal(response.duration, undefined);
      });
    });

    describe("_addVideoClicks", function () {
      it("must not add anything to the response if you don't pass an instace of InLine", function () {
        response._addVideoClicks();
        response._addVideoClicks({});
        response._addVideoClicks([]);
        response._addVideoClicks('');
        assertVASTResponseEmpty(response);
      });

      it("must add the clickThrough to the response", function () {
        var videoClicksXML = '<VideoClicks><ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough></VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.equal(response.clickThrough, 'http://www.target.com');
      });

      it("must add the clickTrackings to the response", function () {
        var videoClicksXML = '<VideoClicks>' +
          '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
          '<ClickTracking><![CDATA[ http://www.tracking2.com ]]></ClickTracking>' +
          '</VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.deepEqual(response.clickTrackings,
          [
            'http://www.tracking1.com',
            'http://www.tracking2.com'
          ]);
      });

      it("must add the customClicks to the response", function () {
        var videoClicksXML = '<VideoClicks>' +
          '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
          '<CustomClick><![CDATA[ http://www.tracking2.com ]]></CustomClick>' +
          '</VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.deepEqual(response.customClicks,
          [
            'http://www.tracking1.com',
            'http://www.tracking2.com'
          ]);
      });
    });

    describe("_addMediaFiles", function(){
      it("must not add any mediaFile unless you pass an array with them inside", function () {
        response._addMediaFiles();
        response._addMediaFiles({});
        response._addMediaFiles('');
        response._addMediaFiles([]);
        testUtils.assertEmptyArray(response.mediaFiles);
      });

      it("must add the passed mediaFiles to the response", function(){
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear>' +
          '<MediaFiles>' +
          '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '<MediaFile id="2" delivery="streaming" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '</MediaFiles>' +
          '</Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));

        response._addMediaFiles(linear.mediaFiles);
        assert.deepEqual(response.mediaFiles, linear.mediaFiles);
      });
    });

    describe("_addLinear", function () {
      it("must not add anything to the response if you don't pass an instace of InLine", function () {
        response._addLinear();
        response._addLinear({});
        response._addLinear([]);
        response._addLinear('');
        assertVASTResponseEmpty(response);
      });

      it("must add the duration to the response", function(){
        var linearXML = '<Linear><Duration>00:00:58</Duration></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);
        assert.equal(response.duration, 58000);
      });

      it("must add the trackings to the response", function () {
        var linearXML = '<Linear><TrackingEvents>' +
          '<Tracking event="firstQuartile"><![CDATA[ http://www.tracking1.com ]]></Tracking>' +
          '</TrackingEvents></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);
        assert.equal(response.trackingEvents.firstQuartile.length, 1);
      });

      it("must add the videoClicks to the response", function () {
        var linearXML = '<Linear><VideoClicks>' +
          '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
          '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
          '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
          '</VideoClicks></Linear>';

        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);

        assert.deepEqual(response.clickThrough, 'http://www.target.com');
        assert.deepEqual(response.clickTrackings, ['http://www.tracking1.com']);
        assert.deepEqual(response.customClicks, ['http://www.tracking1.com']);
      });

      it("must add the mediaFiles to the response", function () {
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear><MediaFiles>' +
          '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '</MediaFiles></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.deepEqual(response.mediaFiles, linear.mediaFiles);
      });

      it("must add the skipoffset to the response", function(){
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear skipoffset="00:00:01.000"></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.equal(response.skipoffset, 1000);
      });

      it("must add the adParameters to the response", function(){
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear>' +
            '<AdParameters xmlEncoded="true"><![CDATA['+xml.encode('<data>Some Data</data>')+']]></AdParameters>' +
          '</Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.equal(response.adParameters, '<data>Some Data</data>');
      });
    });

    describe("_addInLine", function () {
      it("must not add anything to the response if you don't pass an instance of InLine", function () {
        response._addInLine();
        response._addInLine({});
        response._addInLine([]);
        response._addInLine('');
        assertVASTResponseEmpty(response);
      });

      it("must add the title to the response", function () {
        var inLine = new InLine(xml.toJXONTree('<InLine><AdTitle>Foo title</AdTitle></InLine>'));
        response._addInLine(inLine);
        assert.equal(response.adTitle, 'Foo title');
      });

      it("must add the error url macro to the response", function () {
        var inLine = new InLine(xml.toJXONTree('<InLine><Error><![CDATA[http://errorUrl[ERRORCODE]]]></Error></InLine>'));
        response._addInLine(inLine);
        assert.deepEqual(response.errorURLMacros, ['http://errorUrl[ERRORCODE]']);

      });

      it("must add the impressions to the response", function () {
        var impressionXML = '<Inline>' +
          '<Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression>' +
          '<Impression><![CDATA[http://Impression2.url.track.com]]></Impression>' +
          '<Impression id="1111"></Impression>' +
          '</Inline>';
        var inLine = new InLine(xml.toJXONTree(impressionXML));
        response._addInLine(inLine);

        assert.deepEqual([
            "http://Impression.url.track.com",
            "http://Impression2.url.track.com"
            ],
          response.impressions);
      });

      it("must add the linear to the response", function () {
        var inLineXML = '<InLine><Creatives><Creative><Linear><Duration>00:00:58</Duration></Linear></Creative></Creatives></InLine>';
        var inLine = new InLine(xml.toJXONTree(inLineXML));
        response._addInLine(inLine);
        assert.equal(response.duration, 58000);// The duration gets added as part of the linear
      });
    });

    describe("_addWrapper", function () {
      it("must not add anything to the response if you don't pass an instance of Wrapper", function () {
        response._addWrapper();
        response._addWrapper({});
        response._addWrapper([]);
        response._addWrapper('');
        assertVASTResponseEmpty(response);
      });

      it("must add the error url macro to the response", function () {
        var wrapper = new Wrapper(xml.toJXONTree('<Wrapper><Error><![CDATA[http://errorUrl[ERRORCODE]]]></Error></Wrapper>'));
        response._addWrapper(wrapper);
        assert.deepEqual(response.errorURLMacros, ['http://errorUrl[ERRORCODE]']);
      });

      it("must add the impressions to the response", function () {
        var wrapperXML = '<Wrapper>' +
          '<Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression>' +
          '<Impression><![CDATA[http://Impression2.url.track.com]]></Impression>' +
          '<Impression id="1111"></Impression>' +
          '</Wrapper>';
        var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
        response._addWrapper(wrapper);

        assert.deepEqual([
            "http://Impression.url.track.com",
            "http://Impression2.url.track.com"
          ],
          response.impressions);
      });

      describe("with linear creative", function(){
        it("must add the videoClicks", function(){
          var wrapperXML = '<Wrapper><Creatives><Creative><Linear><VideoClicks>' +
            '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
            '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
            '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
            '</VideoClicks></Linear></Creative></Creatives></Wrapper>';

          var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
          response._addWrapper(wrapper);

          assert.isUndefined(response.clickThrough);
          assert.deepEqual(response.clickTrackings, ['http://www.tracking1.com']);
          assert.deepEqual(response.customClicks, ['http://www.tracking1.com']);
        });

        it("must add the trackingEvents", function(){
          var wrapperXML = '<Wrapper><Creatives><Creative><Linear><TrackingEvents>' +
            '<Tracking event="firstQuartile"><![CDATA[ http://www.tracking1.com ]]></Tracking>' +
            '</TrackingEvents></Linear></Creative></Creatives></Wrapper>';

          var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
          response._addWrapper(wrapper);
          assert.equal(response.trackingEvents.firstQuartile.length, 1);
        });
      });

    });
  });
});