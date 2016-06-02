'use strict';

describe("Linear", function () {

  var Linear = require('ads/vast/Linear');
  var MediaFile = require('ads/vast/MediaFile');
  var TrackingEvent = require('ads/vast/TrackingEvent');
  var VideoClicks = require('ads/vast/VideoClicks');

  var xml = require('utils/xml');

  it("must return an instance of Linear", function () {
    var linear = new Linear(xml.toJXONTree('<Linear></Linear>'));
    assert.instanceOf(linear, Linear);
  });

  //Required Elements
  describe("duration", function () {
    it("must contain the duration specified on the xml in ms", function () {
      var linearXML = '<Linear><Duration>00:00:58</Duration></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.duration, 58000);
    });
  });

  describe("mediaFiles", function () {
    it("must be an array", function () {
      var linearXML = '<Linear><MediaFiles></MediaFiles></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.isArray(linear.mediaFiles);
    });

    it("must contain all the specified mediaFiles", function () {
      var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Linear>' +
        '<Duration>00:00:58</Duration>' +
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

      assert.equal(linear.mediaFiles.length, 2);
      assert.instanceOf(linear.mediaFiles[0], MediaFile);
      assert.equal(1, linear.mediaFiles[0].id);
      assert.instanceOf(linear.mediaFiles[1], MediaFile);
      assert.equal(2, linear.mediaFiles[1].id);
    });
  });

  //Optional Elements
  describe("videoClicks", function () {
    it("must be an instance of videoClicks", function () {
      var linearXML = '<Linear><VideoClicks></VideoClicks></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.instanceOf(linear.videoClicks, VideoClicks);
    });
  });

  describe("trackingEvents", function () {
    /*jshint maxlen: 500 */
    it("must be filled with all the tracking events that the xml provides", function () {
      var linearXML = '<Linear>' +
        '<TrackingEvents>' +
        '<Tracking event="firstQuartile">' +
        '<![CDATA[http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=]]>' +
        '</Tracking>' +
        '<Tracking event="midQuartile">' +
        '<![CDATA[http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=]]>' +
        '</Tracking>' +
        '</TrackingEvents>' +
        '</Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      var trackingEvents = linear.trackingEvents;

      //First tracking event
      var tracking = trackingEvents[0];
      assert.instanceOf(tracking, TrackingEvent);
      assert.equal(tracking.name, 'firstQuartile');

      //Second tracking event
      tracking = trackingEvents[1];
      assert.instanceOf(tracking, TrackingEvent);
      assert.equal(tracking.name, 'midQuartile');
    });

    it("must properly set progress events", function () {
      var linearXML = '<Linear>' +
        '<TrackingEvents>' +
        '<Tracking event="progress" offset="10%"><![CDATA[track.url.com]]></Tracking>' +
        '<Tracking event="progress" offset="00:01:00"><![CDATA[track.url.com]]></Tracking>' +
        '</TrackingEvents>' +
        '<Duration>00:00:00.100</Duration>' +
        '</Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      var trackingEvents = linear.trackingEvents;

      assert.isArray(trackingEvents);
      assert.equal(trackingEvents.length, 2);
      assert.equal(trackingEvents[0].name, 'progress');
      assert.equal(trackingEvents[0].uri, 'track.url.com');
      assert.equal(trackingEvents[0].offset, 10);
      assert.equal(trackingEvents[1].name, 'progress');
      assert.equal(trackingEvents[1].uri, 'track.url.com');
      assert.equal(trackingEvents[1].offset, 60000);
    });
  });

  describe("skipoffset", function () {
    it("must contain whatever is set on the xml but parsed into ms", function () {
      var linearXML = '<Linear skipoffset="00:00:05.000"></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.skipoffset, 5000);
    });

    it("must be possible to set the skipoffset as a percentage", function () {
      var linearXML = '<Linear skipoffset="10%"><Duration>00:00:01</Duration></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.skipoffset, 100);
    });

    it("must be possible to set the skipoffset as a percentage with decimals", function () {
      var linearXML = '<Linear skipoffset="10.5%"><Duration>00:00:01</Duration></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.skipoffset, 105);
    });

    it("as percentage with no linear.duration must be null", function () {
      var linearXML = '<Linear skipoffset="10%"></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.isNull(linear.skipoffset);
    });
  });

  describe("AdParameters", function () {
    it("must handle when no parameters is passed", function () {

      [true, false].map(function(xmlEncoded) {
        return '<AdParameters xmlEncoded="' + xmlEncoded + '"><![CDATA[ ]]></AdParameters>';
      }).forEach(function (adParametersString) {

        var linearXML = '<Linear skipoffset="10%">' + adParametersString + '</Linear>';
        assert.doesNotThrow(function () {
          return new Linear(xml.toJXONTree(linearXML));
        });
      });
    });

    it("must be added to the linear", function () {
      var encodedAdParameters = xml.encode('<some>data</some>');

      var linearXML = '<Linear skipoffset="10%"><AdParameters><![CDATA[' + encodedAdParameters + ']]></AdParameters></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.adParameters, encodedAdParameters);
    });

    it("with xmlEncoded to true, must decode the ad params before adding them to the linear", function () {
      var encodedAdParameters = xml.encode('<some>data</some>');

      var linearXML = '<Linear skipoffset="10%"><AdParameters xmlEncoded="true"><![CDATA[' + encodedAdParameters + ']]></AdParameters></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.adParameters, '<some>data</some>');
    });

    it("with xmlEncoded to false, must NOT decode the ad params before adding them to the linear", function () {
      var encodedAdParameters = xml.encode('<some>data</some>');

      var linearXML = '<Linear skipoffset="10%"><AdParameters xmlEncoded="false"><![CDATA[' + encodedAdParameters + ']]></AdParameters></Linear>';
      var linear = new Linear(xml.toJXONTree(linearXML));
      assert.equal(linear.adParameters, encodedAdParameters);
    });
  });

  describe("isSupported", function () {
    var linear;

    beforeEach(function () {
      var linearXML = '<Linear><MediaFiles></MediaFiles></Linear>';
      linear = new Linear(xml.toJXONTree(linearXML));
    });

    it("must return true if at least one of the mediaFiles is supported", function () {
      linear.mediaFiles = [
        {
          isSupported: function () {
            return false;
          }
        },
        {
          isSupported: function () {
            return true;
          }
        }
      ];

      assert.isTrue(linear.isSupported());
    });

    it("must return false if none of the mediaFiles are supported", function () {
      linear.mediaFiles = [
        {
          isSupported: function () {
            return false;
          }
        },
        {
          isSupported: function () {
            return false;
          }
        }
      ];

      assert.isFalse(linear.isSupported());
    });
  });
});
