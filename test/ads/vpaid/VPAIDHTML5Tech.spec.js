const VPAIDHTML5Tech = require('../../../src/scripts/ads/vpaid/VPAIDHTML5Tech');
const VASTError = require('../../../src/scripts/ads/vast/VASTError');
const dom = require('../../../src/scripts/utils/dom');
const utilities = require('../../../src/scripts/utils/utilityFunctions');

const VAST_ERROR_PREFIX = 'VAST Error: ';

describe('VPAIDHTML5Tech', () => {
  it('must return an instance of itself', () => {
    assert.instanceOf(new VPAIDHTML5Tech({src: 'fakeSource'}), VPAIDHTML5Tech);
  });

  it('must implement supports', () => {
    sinon.stub(utilities, 'isOldIE').returns(false);
    assert.isFunction(VPAIDHTML5Tech.supports);
    assert(!VPAIDHTML5Tech.supports('application/x-shockwave-flash'));
    assert(VPAIDHTML5Tech.supports('application/javascript'));

    // Must return false for old IE (IE9 and below)
    utilities.isOldIE.returns(9);
    assert(!VPAIDHTML5Tech.supports('application/javascript'));

    utilities.isOldIE.restore();
  });

  it('must complain if you don\'t pass a valid media file', () => {
    [undefined, null, {}, []].forEach((invalidMediaFile) => {
      assert.throws(() => {
         // eslint-disable-next-line
         new VPAIDHTML5Tech(invalidMediaFile);
      }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_MEDIA_FILE);
    });
  });

  describe('instance', () => {
    let vpaidTech, testDiv, testVideo;

    beforeEach(() => {
      vpaidTech = new VPAIDHTML5Tech({src: 'http://fake.mediaFile.url'});
      testDiv = document.createElement('div');
      testVideo = document.createElement('video');
      document.body.appendChild(testDiv);
    });

    afterEach(() => {
      dom.remove(testDiv);
      dom.remove(testVideo);
    });


    it('must publish the name of the tech', () => {
      assert.equal(vpaidTech.name, 'vpaid-html5');
    });

    describe('loadAdUnit', () => {
      it('must throw a VASTError if you don\'t pass a valid dom Element to contain the ad', () => {
        [undefined, null, {}, [], 123].forEach((invalidDOMElement) => {
          assert.throws(() => {
            vpaidTech.loadAdUnit(invalidDOMElement);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_DOM_CONTAINER_EL);
        });
      });

      it('must throw a VASTError if you don\'t pass a valid vide Element to contain the video ad', () => {
        [undefined, null, {}, [], 123].forEach((invalidDOMElement) => {
          assert.throws(() => {
            vpaidTech.loadAdUnit(testDiv, invalidDOMElement);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_DOM_CONTAINER_EL);
        });
      });

      it('must throw a VASTError if you don\'t pass a callback to call once the ad have been loaded', () => {
        [undefined, null, {}, 123].forEach((invalidCallback) => {
          assert.throws(() => {
            vpaidTech.loadAdUnit(testDiv, testVideo, invalidCallback);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.MISSING_CALLBACK);
        });
      });

      it('must not throw an error if pass valid arguments', () => {
        assert.doesNotThrow(() => {
          vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);
        });
      });

      it('must set properties into vpaidTech', () => {
        assert.isNull(vpaidTech.containerEl);
        assert.isNull(vpaidTech.vpaidHTMLClient);

        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        assert.equal(vpaidTech.containerEl, testDiv);
        assert.equal(vpaidTech.videoEl, testVideo);
        assert.instanceOf(vpaidTech.vpaidHTMLClient, VPAIDHTML5Tech.VPAIDHTML5Client);
      });
    });

    describe('unloadAdUnit', () => {
      it('must do nothing if there is no loaded adUnit', () => {
        assert.doesNotThrow(() => {
          vpaidTech.unloadAdUnit();
        });
      });

      it('must unload the adUnit', () => {
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        const vpaidClient = vpaidTech.vpaidHTMLClient;

        vpaidClient.destroy = sinon.spy();

        vpaidTech.unloadAdUnit();

        assert(vpaidClient.destroy.calledOnce);
      });

      it('must remove the containerEl', () => {
        sinon.stub(dom, 'remove');
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        vpaidTech.vpaidHTMLClient.destroy = utilities.noop;
        vpaidTech.unloadAdUnit();

        assert(dom.remove.calledWithExactly(testDiv));
        dom.remove.restore();
      });

      it('must set instance properties: to null', () => {
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        vpaidTech.unloadAdUnit();

        assert.isNull(vpaidTech.vpaidHTMLClient);
        assert.isNull(vpaidTech.containerEl);
      });
    });
  });
});

