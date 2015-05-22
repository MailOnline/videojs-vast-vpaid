describe("VPAIDFlashTech", function () {
  it("must be a function", function () {
    assert.isFunction(VPAIDFlashTech);
  });

  it("must return an instance of itself", function () {
    assert.instanceOf(VPAIDFlashTech(), VPAIDFlashTech);
  });

  describe("instance", function () {
    var vpaidFlashClient;

    beforeEach(function () {
      vpaidFlashClient = new VPAIDFlashTech();
    });

    describe("supports", function () {
      it("must be a function", function () {
        assert.isFunction(vpaidFlashClient.supports);
      });

      it("must return true when you pass 'application/xshockwave-flash' as type and false otherwise", function () {
        assert.isTrue(vpaidFlashClient.supports('application/xshockwave-flash'));
        assert.isFalse(vpaidFlashClient.supports('application/javascript'));
        assert.isFalse(vpaidFlashClient.supports(undefined));
        assert.isFalse(vpaidFlashClient.supports(null));
        assert.isFalse(vpaidFlashClient.supports(123));
      });
    });

    describe("load", function () {
      it("must be a function", function () {
        assert.isFunction(vpaidFlashClient.load)
      });

      it("must throw a VASTError if you don't pass a valid 'VPAIDCreativeUrl'", function () {
        [undefined, null, {}, 123].forEach(function (invalidCreativeUrl) {
          assert.throws(function () {
            vpaidFlashClient.load(invalidCreativeUrl);
          }, VASTError, 'on VPAIDFlashTech.load, invalid VPAIDCreativeUrl');
        });
      });

      it("must throw a VASTError if you don't pass a valid dom Element to contain the ad", function(){
        [undefined, null, {}, 123].forEach(function (invalidDomElement) {
          assert.throws(function () {
            vpaidFlashClient.load('fakeVPAIDCreativeURL', invalidDomElement);
          }, VASTError, 'on VPAIDFlashTech.load, invalid dom container element');
        });
      });

      it("must throw a VASTError if you don't pass a callback to call once the ad have been loaded", function(){
        [undefined, null, {}, 123].forEach(function (invalidCallback) {
          assert.throws(function () {
            vpaidFlashClient.load('fakeVPAIDCreativeURL', document.createElement('div'), invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.load, missing valid callback');
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidFlashClient.load('fakeVPAIDCreativeURL', document.createElement('div'), noop);
        });
      });
    });
  });
});