

describe('Ad', () => {
  const Ad = require('../../../src/scripts/ads/vast/Ad');
  const InLine = require('../../../src/scripts/ads/vast/InLine');
  const Wrapper = require('../../../src/scripts/ads/vast/Wrapper');

  const xml = require('../../../src/scripts/utils/xml');

  it('must be a constructor function', () => {
    assert.isFunction(Ad);
  });

  it('must return an instance of Ad', () => {
    assert.instanceOf(new Ad(xml.toJXONTree('<ad></ad>')), Ad);
  });

  it('must set the id of the ad', () => {
    const ad = new Ad(xml.toJXONTree('<Ad id="107195552"></Ad>'));

    assert.equal(ad.id, '107195552');
  });

  it('must not set the id if not defined in the xml', () => {
    const ad = new Ad(xml.toJXONTree('<Ad></Ad>'));

    assert.isUndefined(ad.id);
  });

  it('must not set the sequence number if not defined', () => {
    const ad = new Ad(xml.toJXONTree('<ad></ad>'));

    assert.isUndefined(ad.sequence);
  });

  it('must set the sequence number if defined as attr', () => {
    const ad = new Ad(xml.toJXONTree('<Ad sequence="1"></Ad>'));

    assert.strictEqual(ad.sequence, 1);
  });

  it('must set the inline as an InLine instance object if set', () => {
    const adXML = '<Ad id="107195552"><InLine></InLine></Ad>';
    const ad = new Ad(xml.toJXONTree(adXML));

    assert.instanceOf(ad.inLine, InLine);
  });

  it('must set the wrapper as a Wrapper instance object if set', () => {
    const adXML = '<Ad id="107195552"><Wrapper></Wrapper></Ad>';
    const ad = new Ad(xml.toJXONTree(adXML));

    assert.instanceOf(ad.wrapper, Wrapper);
  });
});
