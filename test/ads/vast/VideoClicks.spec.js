const VideoClicks = require('../../../src/scripts/ads/vast/VideoClicks');
const xml = require('../../../src/scripts/utils/xml');

describe('VideoClicks', () => {
  let videoClicks, videoClicksXML;

  beforeEach(() => {
    videoClicksXML = '<VideoClicks>' +
    '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
    '</VideoClicks>';
    videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));
  });

  it('must return an instance of VideoClicks', () => {
    assert.instanceOf(new VideoClicks(videoClicksXML), VideoClicks);
  });

  it('must set the clickThrough', () => {
    assert.equal(videoClicks.clickThrough, 'http://www.target.com');
  });

  // Optional Elements
  describe('clickTrackings', () => {
    it('must be an array', () => {
      assert.isArray(videoClicks.clickTrackings);
    });

    it('must be optional to have clickTrackings', () => {
      assert.equal(videoClicks.clickTrackings.length, 0);
    });

    it('must contain all the clicktracking uris set on the xml', () => {
      const videoClicksXML = '<VideoClicks>' +
        '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
        '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
        '<ClickTracking><![CDATA[ http://www.tracking2.com ]]></ClickTracking>' +
        '</VideoClicks>';

      videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));
      assert.equal(videoClicks.clickTrackings.length, 2);
      assert.equal(videoClicks.clickTrackings[0], 'http://www.tracking1.com');
      assert.equal(videoClicks.clickTrackings[1], 'http://www.tracking2.com');
    });
  });

  describe('customClicks', () => {
    it('must be an array', () => {
      assert.isArray(videoClicks.customClicks);
    });

    it('must be optional', () => {
      assert.equal(videoClicks.customClicks.length, 0);
    });

    it('must contain all the customClicks uris set on the xml', () => {
      const videoClicksXML = '<VideoClicks>' +
        '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
        '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
        '<CustomClick><![CDATA[ http://www.tracking2.com ]]></CustomClick>' +
        '</VideoClicks>';

      videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));
      assert.equal(videoClicks.customClicks.length, 2);
      assert.equal(videoClicks.customClicks[0], 'http://www.tracking1.com');
      assert.equal(videoClicks.customClicks[1], 'http://www.tracking2.com');
    });
  });
});
