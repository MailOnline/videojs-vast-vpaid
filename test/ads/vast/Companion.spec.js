const Companion = require('../../../src/scripts/ads/vast/Companion');
const TrackingEvent = require('../../../src/scripts/ads/vast/TrackingEvent');
const xml = require('../../../src/scripts/utils/xml');

describe('Companion', () => {
  it('must return an instance of Companion', () => {
    const companion = new Companion(xml.toJXONTree('<Companion><StaticResource></StaticResource></Companion>'));

    assert.instanceOf(companion, Companion);
  });

  // Required Elements
  describe('staticResource', () => {
    it('must contain the static resource and mime type', () => {
      const companionXML = '<Companion><StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource></Companion>';
      const companion = new Companion(xml.toJXONTree(companionXML));

      assert.equal(companion.staticResource, 'http://www.example.com/image.jpg');
      assert.equal(companion.creativeType, 'image/jpeg');
    });
  });

  const companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>' +
        '<TrackingEvents><Tracking event="creativeView"><![CDATA[http://www.example.com/whatever]]></Tracking></TrackingEvents>' +
        '<CompanionClickThrough><![CDATA[http://www.example.com/tracker.html]]></CompanionClickThrough>' +
    '</Companion>';

  // Optional Elements
  describe('trackingEvents', () => {
    /* jshint maxlen: 500 */
    it('must be filled with all the tracking events that the xml provides', () => {
      const companion = new Companion(xml.toJXONTree(companionXML));
      const trackingEvents = companion.trackingEvents;

      // First tracking event
      const tracking = trackingEvents[0];

      assert.instanceOf(tracking, TrackingEvent);
      assert.equal(tracking.name, 'creativeView');
    });
  });

  describe('dimensions', () => {
    it('must contain creative dimensions', () => {
      const companion = new Companion(xml.toJXONTree(companionXML));

      assert.equal(companion.width, 300);
      assert.equal(companion.height, 250);
    });
  });

  describe('clickthrough', () => {
    it('must provide companion impression tracker', () => {
      const companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>' +
        '<CompanionClickThrough><![CDATA[http://www.example.com/tracker.html]]></CompanionClickThrough>' +
        '</Companion>';
      const companion = new Companion(xml.toJXONTree(companionXML));

      assert.equal(companion.companionClickThrough, 'http://www.example.com/tracker.html');
    });
  });
});
