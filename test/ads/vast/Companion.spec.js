var Companion = require('ads/vast/Companion');
var TrackingEvent = require('ads/vast/TrackingEvent');

var xml = require('utils/xml');

describe("Companion", function(){
  it("must return an instance of Companion", function(){
    var companion = new Companion(xml.toJXONTree('<Companion><StaticResource></StaticResource></Companion>'));
    assert.instanceOf(companion, Companion);
  });

  //Required Elements
  describe("staticResource", function(){
    it("must contain the static resource and mime type", function(){
      var companionXML = '<Companion><StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource></Companion>';
      var companion = new Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.staticResource, "http://www.example.com/image.jpg");
      assert.equal(companion.creativeType, "image/jpeg");
    });
  });

  var companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>' +
        '<TrackingEvents><Tracking event="creativeView"><![CDATA[http://www.example.com/whatever]]></Tracking></TrackingEvents>' +
        '<CompanionClickThrough><![CDATA[http://www.example.com/tracker.html]]></CompanionClickThrough>' +
    '</Companion>';

  //Optional Elements
  describe("trackingEvents", function(){
    /*jshint maxlen: 500 */
    it("must be filled with all the tracking events that the xml provides", function(){
      var companion = new Companion(xml.toJXONTree(companionXML));
      var trackingEvents = companion.trackingEvents;

      //First tracking event
      var tracking = trackingEvents[0];
      assert.instanceOf(tracking, TrackingEvent);
      assert.equal(tracking.name, 'creativeView');
    });
  });

  describe("dimensions", function(){
    it("must contain creative dimensions", function(){
      var companion = new Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.width, 300);
      assert.equal(companion.height, 250);
    });
  });

  describe("clickthrough", function(){
    it("must provide companion impression tracker", function(){
      var companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>'+
        '<CompanionClickThrough><![CDATA[http://www.example.com/tracker.html]]></CompanionClickThrough>'+
        '</Companion>';
      var companion = new Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.companionClickThrough, "http://www.example.com/tracker.html");
    });
  });
});