'use strict';

describe("TrackingEvent", function () {

  var TrackingEvent = require('ads/vast/TrackingEvent');

  var xml = require('utils/xml');

  var tracking, trackingXML;
  /*jshint maxlen: 500 */
  beforeEach(function(){
    trackingXML = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Tracking event="firstQuartile">' +
      '<![CDATA[http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=]]>' +
      '</Tracking>';
    tracking = new TrackingEvent(xml.toJXONTree(trackingXML));
  });

  it("must return an instance of Tracking", function () {
    assert.instanceOf(new TrackingEvent(xml.toJXONTree(trackingXML)), TrackingEvent);
  });

  describe("name", function () {
    it("must contain the event set on the html", function () {
      assert.equal(tracking.name, 'firstQuartile');
    });
  });

  describe("uri", function(){
    it("must contain the tracking uri", function(){
      /*jshint maxlen: 700 */
      assert.equal(tracking.uri, 'http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=');
    });
  });

  describe("offset", function(){
    it("must not be added if the event is not progress", function(){
      trackingXML = '<Tracking event="firstQuartile" offset="10%"><![CDATA[http://sample.track.url.com]]></Tracking>';
      tracking = new TrackingEvent(xml.toJXONTree(trackingXML));
      assert.isUndefined(tracking.offset);
    });

    it("must be added if the event progress and the attr is present and the duration is passed to the constructor", function(){
      trackingXML = '<Tracking event="progress" offset="10%"><![CDATA[http://sample.track.url.com]]></Tracking>';
      tracking = new TrackingEvent(xml.toJXONTree(trackingXML), 100);
      assert.equal(tracking.offset, 10);
    });
  });
});