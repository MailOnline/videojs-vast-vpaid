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
    var vpaidFlashClient, testDiv;

    beforeEach(function () {
      vpaidFlashClient = new VPAIDFlashTech({src:'http://fake.mediaFile.url'});
      testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
    });

    afterEach(function () {
      dom.remove(testDiv);
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
            vpaidFlashClient.loadAdUnit(testDiv, invalidCallback);
          }, VASTError, 'on VPAIDFlashTech.loadAdUnit, missing valid callback');
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidFlashClient.loadAdUnit(testDiv, noop);
        });
      });

      it("must publish the containerEl and the vpaidFlashToJs into the instance", function(){
        assert.isNull(vpaidFlashClient.containerEl);
        assert.isNull(vpaidFlashClient.vpaidFlashToJS);
        vpaidFlashClient.loadAdUnit(testDiv, noop);
        assert.equal(vpaidFlashClient.containerEl, testDiv);
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
        vpaidFlashClient.loadAdUnit(testDiv, noop);
        var vpaidFlashToJS = vpaidFlashClient.vpaidFlashToJS;
        vpaidFlashToJS.destroy = sinon.spy();

        vpaidFlashClient.unloadAdUnit();

        sinon.assert.calledOnce(vpaidFlashToJS.destroy);
      });

      it("must remove the containerEl", function(){
        sinon.stub(dom, 'remove');
        vpaidFlashClient.loadAdUnit(testDiv, noop);
        //We mock destroy to prevent exception
        vpaidFlashClient.vpaidFlashToJS.destroy = noop;
        vpaidFlashClient.unloadAdUnit();


        sinon.assert.calledWithExactly(dom.remove, testDiv);
        dom.remove.restore();
      });

      it("must set instance properties: containerEl and vpaidFlashToJS to null", function(){
        vpaidFlashClient.loadAdUnit(testDiv, noop);
        //We mock destroy to prevent exception
        vpaidFlashClient.vpaidFlashToJS.destroy = noop;

        vpaidFlashClient.unloadAdUnit();

        assert.isNull(vpaidFlashClient.vpaidFlashToJS);
        assert.isNull(vpaidFlashClient.containerEl);
      });
    });
  });
});