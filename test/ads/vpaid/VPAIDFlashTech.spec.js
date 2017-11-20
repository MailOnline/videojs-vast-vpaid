const VPAIDFlashTech = require('../../../src/scripts/ads/vpaid/VPAIDFlashTech');
const VASTError = require('../../../src/scripts/ads/vast/VASTError');
const dom = require('../../../src/scripts/utils/dom');
const utilities = require('../../../src/scripts/utils/utilityFunctions');
const testUtils = require('../../test-utils');

describe('VPAIDFlashTech', () => {
  it('must return an instance of itself', () => {
    assert.instanceOf(new VPAIDFlashTech({src: 'fakeSource'}), VPAIDFlashTech);
  });

  describe('supports', () => {
    describe('must handle flash support', () => {
      const FLASH_STRING = 'application/x-shockwave-flash';
      let originalFlash;

      beforeEach(() => {
        originalFlash = VPAIDFlashTech.VPAIDFLASHClient;
        VPAIDFlashTech.VPAIDFLASHClient = {
          isSupported: function () {
            return true;
          }
        };
      });

      afterEach(() => {
        VPAIDFlashTech.VPAIDFLASHClient = originalFlash;
      });

      it('must return true when you pass \'application/x-shockwave-flash\' if the browser supports', () => {
        assert.isTrue(VPAIDFlashTech.supports(FLASH_STRING));
      });

      it('must return false when you pass \'application/x-shockwave-flash\' if the browser doesn\'t support it', () => {
        sinon.stub(VPAIDFlashTech.VPAIDFLASHClient, 'isSupported', () => { return false; });
        assert.isFalse(VPAIDFlashTech.supports(FLASH_STRING));
      });
    });

    it('must return true when you pass \'application/javascript\' as type and false otherwise', () => {
      assert.isFalse(VPAIDFlashTech.supports('application/javascript'));
      assert.isFalse(VPAIDFlashTech.supports(undefined));
      assert.isFalse(VPAIDFlashTech.supports(null));
      assert.isFalse(VPAIDFlashTech.supports(123));
    });
  });

  it('must complain if you don\'t pass a valid media file', () => {
    [undefined, null, {}, []].forEach((invalidMediaFile) => {
      assert.throws(() => {
        // eslint-disable-next-line
        new VPAIDFlashTech(invalidMediaFile);
      }, VASTError, 'VAST Error: on VPAIDFlashTech, invalid MediaFile');
    });
  });

  describe('instance', () => {
    let vpaidFlashTech, testDiv, settings;

    beforeEach(() => {
      settings = {
        vpaidFlashLoaderPath: '/VPAIDFlash.swf'
      };
      vpaidFlashTech = new VPAIDFlashTech({src: 'http://fake.mediaFile.url'}, settings);
      testDiv = document.createElement('div');
      document.body.appendChild(testDiv);
    });

    afterEach(() => {
      dom.remove(testDiv);
    });

    it('must publish the settings', () => {
      assert.equal(vpaidFlashTech.settings, settings);
    });

    it('must publish the name of the tech', () => {
      assert.equal(vpaidFlashTech.name, 'vpaid-flash');
    });

    describe('loadAdUnit', () => {
      it('must throw a VASTError if you don\'t pass a valid dom Element to contain the ad', () => {
        [undefined, null, {}, 123].forEach((invalidDomElement) => {
          assert.throws(() => {
            vpaidFlashTech.loadAdUnit(invalidDomElement);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, invalid dom container element');
        });
      });

      it('must throw a VASTError if you don\'t pass a callback to call once the ad have been loaded', () => {
        [undefined, null, {}, 123].forEach((invalidCallback) => {
          assert.throws(() => {
            vpaidFlashTech.loadAdUnit(testDiv, null, invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, missing valid callback');
        });
      });

      it('must not throw an error if pass valid arguments', () => {
        assert.doesNotThrow(() => {
          vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);
        });
      });

      it('must publish the containerEl and the vpaidFlashToJs into the instance', () => {
        assert.isNull(vpaidFlashTech.containerEl);
        assert.isNull(vpaidFlashTech.vpaidFlashClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);
        assert.equal(vpaidFlashTech.containerEl, testDiv);
        assert.instanceOf(vpaidFlashTech.vpaidFlashClient, VPAIDFlashTech.VPAIDFLASHClient);
      });

      it('must pass the vpaidFlashLoaderPath to the VPAIDFLASHClient constructor', () => {
        sinon.stub(VPAIDFlashTech, 'VPAIDFLASHClient');
        vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);
        sinon.assert.calledWith(VPAIDFlashTech.VPAIDFLASHClient, testDiv, sinon.match.func, {
          data: settings.vpaidFlashLoaderPath
        });
        VPAIDFlashTech.VPAIDFLASHClient.restore();
      });

      it('must pass an error to the callback if there is an error instantiating the VPAIDFLASHClient', () => {
        const fakeVpaidClient = {
          loadAdUnit: sinon.spy()
        };
        const callback = sinon.spy();

        sinon.stub(VPAIDFlashTech, 'VPAIDFLASHClient').returns(fakeVpaidClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, callback);
        const flushVPAIDClient = testUtils.secondArg(VPAIDFlashTech.VPAIDFLASHClient);
        const fakeError = new Error('There was an error');

        flushVPAIDClient(fakeError);
        sinon.assert.calledWith(callback, fakeError);
        VPAIDFlashTech.VPAIDFLASHClient.restore();
      });

      it('must call the loadAdUnit function of the VPAIDFLAHSClient and the callback', () => {
        const fakeVpaidClient = {
          loadAdUnit: sinon.spy()
        };
        const callback = sinon.spy();

        sinon.stub(VPAIDFlashTech, 'VPAIDFLASHClient').returns(fakeVpaidClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, callback);
        const flushVPAIDClient = testUtils.secondArg(VPAIDFlashTech.VPAIDFLASHClient);

        flushVPAIDClient(null);
        sinon.assert.calledWith(fakeVpaidClient.loadAdUnit, vpaidFlashTech.mediaFile.src, callback);
        VPAIDFlashTech.VPAIDFLASHClient.restore();
      });
    });

    describe('unloadUnit', () => {
      it('must do nothing if the there is no loaded adUnit', () => {
        assert.doesNotThrow(() => {
          vpaidFlashTech.unloadAdUnit();
        });
      });

      it('must unload the adUnit', () => {
        vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);
        const vpaidFlashClient = vpaidFlashTech.vpaidFlashClient;

        vpaidFlashClient.destroy = sinon.spy();

        vpaidFlashTech.unloadAdUnit();

        sinon.assert.calledOnce(vpaidFlashClient.destroy);
      });

      it('must remove the containerEl', () => {
        sinon.stub(dom, 'remove');
        vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);

        // We mock destroy to prevent exception
        vpaidFlashTech.vpaidFlashClient.destroy = utilities.noop;
        vpaidFlashTech.unloadAdUnit();


        sinon.assert.calledWithExactly(dom.remove, testDiv);
        dom.remove.restore();
      });

      it('must set instance properties: containerEl and vpaidFlashClient to null', () => {
        vpaidFlashTech.loadAdUnit(testDiv, null, utilities.noop);

        // We mock destroy to prevent exception
        vpaidFlashTech.vpaidFlashClient.destroy = utilities.noop;

        vpaidFlashTech.unloadAdUnit();

        assert.isNull(vpaidFlashTech.vpaidFlashClient);
        assert.isNull(vpaidFlashTech.containerEl);
      });
    });
  });
});
