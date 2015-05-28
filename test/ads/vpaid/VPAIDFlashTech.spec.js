describe("VPAIDFlashTech", function () {
  it("must be a function", function () {
    assert.isFunction(VPAIDFlashTech);
  });

  it("must return an instance of itself", function () {
    assert.instanceOf(VPAIDFlashTech({src:'fakeSource'}), VPAIDFlashTech);
  });

  describe("supports", function () {
    it("must be a function", function () {
      assert.isFunction(VPAIDFlashTech.supports);
    });

    it("must return true when you pass 'application/x-shockwave-flash' as type and false otherwise", function () {
      assert.isTrue(VPAIDFlashTech.supports('application/x-shockwave-flash'));
      assert.isFalse(VPAIDFlashTech.supports('application/javascript'));
      assert.isFalse(VPAIDFlashTech.supports(undefined));
      assert.isFalse(VPAIDFlashTech.supports(null));
      assert.isFalse(VPAIDFlashTech.supports(123));
    });
  });

  it("must complain if you don't pass a valid media file", function(){
    [undefined, null, {}, []].forEach(function (invalidMediaFile) {
      assert.throws(function() {
        new VPAIDFlashTech(invalidMediaFile);
      }, VASTError, 'VAST Error: on VPAIDFlashTech, invalid MediaFile')
    });
  });

  describe("instance", function () {
    var vpaidFlashClient;

    beforeEach(function () {
      vpaidFlashClient = new VPAIDFlashTech({src:'http://fake.mediaFile.url'});
    });

    describe("loadAdUnit", function () {
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
            vpaidFlashClient.loadAdUnit(document.createElement('div'), invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, missing valid callback');
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidFlashClient.loadAdUnit(document.createElement('div'), noop);
        });
      });

      it("must publish the containerEl and the vpaidFlashToJs into the instance", function(){
        assert.isNull(vpaidFlashClient.containerEl);
        assert.isNull(vpaidFlashClient.vpaidFlashToJS);
        var container = document.createElement('div');
        vpaidFlashClient.loadAdUnit(container, noop);
        assert.equal(vpaidFlashClient.containerEl, container);
        assert.instanceOf(vpaidFlashClient.vpaidFlashToJS, VPAIDFlashToJS);
      });
    });

    describe("unloadUnit", function(){
      it("must do nothing if the there is no loaded adUnit", function(){
        assert.doesNotThrow(function() {
          vpaidFlashClient.unloadAdUnit();
        });
      });

      it("must unload the adUnit", function(){
        var container = document.createElement('div');
        vpaidFlashClient.loadAdUnit(container, noop);
        var vpaidFlashToJS = vpaidFlashClient.vpaidFlashToJS;
        vpaidFlashToJS.unloadAdUnit = sinon.spy();

        vpaidFlashClient.unloadAdUnit();

        sinon.assert.calledOnce(vpaidFlashToJS.unloadAdUnit);
      });

      it("must empty the containerEl", function(){
        var container = document.createElement('div');
        container.innerHTML = 'foo bar';
        vpaidFlashClient.loadAdUnit(container, noop);
        //We mock unloadAdUnit to prevent exception
        vpaidFlashClient.vpaidFlashToJS.unloadAdUnit = noop;
        vpaidFlashClient.unloadAdUnit();

        assert.equal(container.innerHTML, '');
      });

      it("must set instance properties: containerEl and vpaidFlashToJS to null", function(){
        vpaidFlashClient.loadAdUnit(document.createElement('div'), noop);
        //We mock unloadAdUnit to prevent exception
        vpaidFlashClient.vpaidFlashToJS.unloadAdUnit = noop;

        vpaidFlashClient.unloadAdUnit();

        assert.isNull(vpaidFlashClient.vpaidFlashToJS);
        assert.isNull(vpaidFlashClient.containerEl);
      });
    });
  });
});