describe("VPAIDFlashTech", function () {
  it("must return an instance of itself", function () {
    assert.instanceOf(VPAIDFlashTech({src:'fakeSource'}), VPAIDFlashTech);
  });

  describe("supports", function () {
    describe('must handle flash support', function() {
      var FLASH_STRING = 'application/x-shockwave-flash';
      var originalFlash;

      beforeEach(function() {
        originalFlash = VPAIDFLASHClient;
        VPAIDFLASHClient = {
          isSupported: function() {
            return true;
          }
        };
      });

      afterEach(function() {
        VPAIDFLASHClient = originalFlash;
      });

      it("must return true when you pass 'application/x-shockwave-flash' if the browser supports", function() {
        assert.isTrue(VPAIDFlashTech.supports(FLASH_STRING));
      });

      it("must return false when you pass 'application/x-shockwave-flash' if the browser doesn't support it", function() {
        sinon.stub(VPAIDFLASHClient, 'isSupported', function () {return false;});
        assert.isFalse(VPAIDFlashTech.supports(FLASH_STRING));
      });

    });

    it("must return true when you pass 'application/javascript' as type and false otherwise", function () {
      assert.isFalse(VPAIDFlashTech.supports('application/javascript'));
      assert.isFalse(VPAIDFlashTech.supports(undefined));
      assert.isFalse(VPAIDFlashTech.supports(null));
      assert.isFalse(VPAIDFlashTech.supports(123));
    });
  });

  it("must complain if you don't pass a valid media file", function(){
    [undefined, null, {}, []].forEach(function (invalidMediaFile) {
      assert.throws(function() {
        var tech = new VPAIDFlashTech(invalidMediaFile);
      }, VASTError, 'VAST Error: on VPAIDFlashTech, invalid MediaFile');
    });
  });

  describe("instance", function () {
    var vpaidFlashTech, testDiv, settings;

    beforeEach(function () {
      settings = {
        vpaidFlashLoaderPath: '/VPAIDFlash.swf'
      };
      vpaidFlashTech = new VPAIDFlashTech({src:'http://fake.mediaFile.url'}, settings);
      testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
    });

    afterEach(function () {
      dom.remove(testDiv);
    });

    it("must publish the settings", function(){
      assert.equal(vpaidFlashTech.settings, settings);
    });

    it("must publish the name of the tech", function(){
      assert.equal(vpaidFlashTech.name, 'vpaid-flash');
    });

    describe("loadAdUnit", function () {
      it("must throw a VASTError if you don't pass a valid dom Element to contain the ad", function(){
        [undefined, null, {}, 123].forEach(function (invalidDomElement) {
          assert.throws(function () {
            vpaidFlashTech.loadAdUnit(invalidDomElement);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, invalid dom container element');
        });
      });

      it("must throw a VASTError if you don't pass a callback to call once the ad have been loaded", function(){
        [undefined, null, {}, 123].forEach(function (invalidCallback) {
          assert.throws(function () {
            vpaidFlashTech.loadAdUnit(testDiv, null, invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, missing valid callback');
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        });
      });

      it("must publish the containerEl and the vpaidFlashToJs into the instance", function(){
        assert.isNull(vpaidFlashTech.containerEl);
        assert.isNull(vpaidFlashTech.vpaidFlashClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        assert.equal(vpaidFlashTech.containerEl, testDiv);
        assert.instanceOf(vpaidFlashTech.vpaidFlashClient, VPAIDFLASHClient);
      });

      it("must pass the vpaidFlashLoaderPath to the VPAIDFLASHClient constructor", function(){
        sinon.stub(window, 'VPAIDFLASHClient');
        vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        sinon.assert.calledWith(VPAIDFLASHClient, testDiv, sinon.match.func, {
          data: settings.vpaidFlashLoaderPath
        });
        window.VPAIDFLASHClient.restore();
      });

      it("must pass an error to the callback if there is an error instantiating the VPAIDFLASHClient", function(){
        var fakeVpaidClient = {
          loadAdUnit: sinon.spy()
        };
        var callback = sinon.spy();
        sinon.stub(window, 'VPAIDFLASHClient').returns(fakeVpaidClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, callback);
        var flushVPAIDClient = secondArg(VPAIDFLASHClient);
        var fakeError = new Error('There was an error');
        flushVPAIDClient(fakeError);
        sinon.assert.calledWith(callback, fakeError);
        window.VPAIDFLASHClient.restore();
      });

      it("must call the loadAdUnit function of the VPAIDFLAHSClient and the callback", function(){
        var fakeVpaidClient = {
          loadAdUnit: sinon.spy()
        };
        var callback = sinon.spy();
        sinon.stub(window, 'VPAIDFLASHClient').returns(fakeVpaidClient);
        vpaidFlashTech.loadAdUnit(testDiv, null, callback);
        var flushVPAIDClient = secondArg(VPAIDFLASHClient);
        flushVPAIDClient(null);
        sinon.assert.calledWith(fakeVpaidClient.loadAdUnit, vpaidFlashTech.mediaFile.src, callback);
        window.VPAIDFLASHClient.restore();
      });
    });

    describe("unloadUnit", function(){
      it("must do nothing if the there is no loaded adUnit", function(){
        assert.doesNotThrow(function() {
          vpaidFlashTech.unloadAdUnit();
        });
      });

      it("must unload the adUnit", function(){
        vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        var vpaidFlashClient = vpaidFlashTech.vpaidFlashClient;
        vpaidFlashClient.destroy = sinon.spy();

        vpaidFlashTech.unloadAdUnit();

        sinon.assert.calledOnce(vpaidFlashClient.destroy);
      });

      it("must remove the containerEl", function(){
        sinon.stub(dom, 'remove');
        vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        //We mock destroy to prevent exception
        vpaidFlashTech.vpaidFlashClient.destroy = noop;
        vpaidFlashTech.unloadAdUnit();


        sinon.assert.calledWithExactly(dom.remove, testDiv);
        dom.remove.restore();
      });

      it("must set instance properties: containerEl and vpaidFlashClient to null", function(){
        vpaidFlashTech.loadAdUnit(testDiv, null, noop);
        //We mock destroy to prevent exception
        vpaidFlashTech.vpaidFlashClient.destroy = noop;

        vpaidFlashTech.unloadAdUnit();

        assert.isNull(vpaidFlashTech.vpaidFlashClient);
        assert.isNull(vpaidFlashTech.containerEl);
      });
    });
  });
});
