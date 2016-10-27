const testUtils = require('../../test-utils');

describe.skip('Creative', () => {
  const Creative = require('../../../src/scripts/ads/vast/Creative');
  const Linear = require('../../../src/scripts/ads/vast/Linear');

  const xml = require('../../../src/scripts/utils/xml');

  it('must return an instance of Creative', () => {
    assert.instanceOf(new Creative(xml.toJXONTree('<Creative id="8455"></Creative>')), Creative);
  });

  it('must set the id if passed', () => {
    const creativeXML = '<Creative id="8455"></Creative>';
    const creative = new Creative(xml.toJXONTree(creativeXML));

    assert.equal(creative.id, '8455');
  });

  it('must set the sequence if set', () => {
    const creativeXML = '<Creative id="8455" sequence="1"></Creative>';
    const creative = new Creative(xml.toJXONTree(creativeXML));

    assert.equal(creative.sequence, 1);
  });

  it('must set the the ad id if set', () => {
    const creativeXML = '<Creative adId="8455"></Creative>';
    const creative = new Creative(xml.toJXONTree(creativeXML));

    assert.equal(creative.adId, 8455);
  });

  it('must set the the apiFramework if set', () => {
    const creativeXML = '<Creative apiFramework="fooFramework"></Creative>';
    const creative = new Creative(xml.toJXONTree(creativeXML));

    assert.equal(creative.apiFramework, 'fooFramework');
  });

  it('must set the linear if passed as part of the jxonTreeData', () => {
    const creativeXML = '<Creative apiFramework="fooFramework">' +
      '<Linear>' +
      '<Duration>00:00:58</Duration>' +
      '<MediaFiles></MediaFiles>' +
      '</Linear>' +
      '</Creative>';
    const creative = new Creative(xml.toJXONTree(creativeXML));

    assert.instanceOf(creative.linear, Linear);
  });

  describe('companionAds', () => {
    const creativeXML = '<Creative sequence="1">' +
      '<CompanionAds>' +
      '</CompanionAds>' +
      '</Creative>';

    it('must handle when no companionAds', () => {
      function newCreative () {
        return new Creative(xml.toJXONTree(creativeXML));
      }
      assert.doesNotThrow(newCreative);
    });
  });

  describe('isSupported', () => {
    let creative;

    beforeEach(() => {
      const creativeXML = '<Creative apiFramework="fooFramework">' +
        '<Linear>' +
        '<Duration>00:00:58</Duration>' +
        '<MediaFiles></MediaFiles>' +
        '</Linear>' +
        '</Creative>';

      creative = new Creative(xml.toJXONTree(creativeXML));
    });

    it('must return true if the creative does not contain a linear', () => {
      delete creative.linear;
      assert.isTrue(creative.isSupported());
    });

    it('must returns false if it contains a non supported linear', () => {
      creative.linear = {
        isSupported: function () {
          return false;
        }
      };
      assert.isFalse(creative.isSupported());
    });

    it('must returns true if it contains a supported linear', () => {
      creative.linear = {
        isSupported: function () {
          return true;
        }
      };
      assert.isTrue(creative.isSupported());
    });
  });

  describe('parseCreatives', () => {
    let parseCreatives;

    beforeEach(() => {
      parseCreatives = Creative.parseCreatives;
    });

    it('must return an empty array if you pass no creativesJTree', () => {
      testUtils.assertEmptyArray(parseCreatives());
    });

    it('must return an empty array if there is no real creatives', () => {
      const inlineXML = '<InLine><Creatives></Creatives></InLine>';

      testUtils.assertEmptyArray(parseCreatives(xml.toJXONTree(inlineXML).creatives));
    });

    it('must be an array or creatives', () => {
      const inlineXML = '<InLine>' +
        '<Creatives>' +
          '<Creative id="8454" sequence="1"></Creative>' +
            '<Creative id="8455" sequence="2"></Creative>' +
              '</Creatives>' +
                '</InLine>';
      const creativesJTree = xml.toJXONTree(inlineXML).creatives;
      const creatives = parseCreatives(creativesJTree);

      assert.isArray(creatives);
      assert.instanceOf(creatives[0], Creative);
      assert.equal(creatives[0].id, 8454);
      assert.instanceOf(creatives[1], Creative);
      assert.equal(creatives[1].id, 8455);
    });
  });
});
