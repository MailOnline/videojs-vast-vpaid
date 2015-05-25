describe("VPAIDFlashTech", function () {
  it("must be a function", function () {
    assert.isFunction(VPAIDFlashTech);
  });

  it("must return an instance of itself", function () {
    assert.instanceOf(VPAIDFlashTech(), VPAIDFlashTech);
  });

  describe("supports", function () {
    it("must be a function", function () {
      assert.isFunction(VPAIDFlashTech.supports);
    });

    it("must return true when you pass 'application/xshockwave-flash' as type and false otherwise", function () {
      assert.isTrue(VPAIDFlashTech.supports('application/xshockwave-flash'));
      assert.isFalse(VPAIDFlashTech.supports('application/javascript'));
      assert.isFalse(VPAIDFlashTech.supports(undefined));
      assert.isFalse(VPAIDFlashTech.supports(null));
      assert.isFalse(VPAIDFlashTech.supports(123));
    });
  });

  describe("instance", function () {
    var vpaidFlashClient;

    beforeEach(function () {
      vpaidFlashClient = new VPAIDFlashTech();
    });

    describe("loadAdUnit", function () {
      it("must be a function", function () {
        assert.isFunction(vpaidFlashClient.loadAdUnit)
      });

      it("must throw a VASTError if you don't pass a valid 'VPAIDCreativeUrl'", function () {
        [undefined, null, {}, 123].forEach(function (invalidCreativeUrl) {
          assert.throws(function () {
            vpaidFlashClient.loadAdUnit(document.createElement('div'), invalidCreativeUrl);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, invalid VPAIDCreativeUrl');
        });
      });

      it("must throw a VASTError if you don't pass a valid dom Element to contain the ad", function(){
        [undefined, null, {}, 123].forEach(function (invalidDomElement) {
          assert.throws(function () {
            vpaidFlashClient.loadAdUnit(invalidDomElement);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, invalid dom container element');
        });
      });

      it("must throw a VASTError if you don't pass a callback to call once the ad have been loaded", function(){
        [undefined, null, {}, 123].forEach(function (invalidCallback) {
          assert.throws(function () {
            vpaidFlashClient.loadAdUnit(document.createElement('div'), 'fakeVPAIDCreativeURL', invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, missing valid callback');
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidFlashClient.loadAdUnit(document.createElement('div'), 'fakeVPAIDCreativeURL', noop);
        });
      });
    });
  });
});