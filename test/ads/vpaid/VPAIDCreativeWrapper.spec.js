describe("VPAIDCreativeWrapper", function(){
  var vpaidCreative;

  beforeEach(function(){
    vpaidCreative = {
      'handshakeVersion': noop,
      'initAd': noop,
      'startAd': noop,
      'stopAd': noop,
      'skipAd': noop,
      'resizeAd': noop,
      'pauseAd': noop,
      'expandAd': noop,
      'collapseAd': noop,
      'subscribe': noop,
      'unsubscribe': noop
    };
  });

  it("must be a function", function(){
    assert.isFunction(VPAIDCreativeWrapper);
  });

  describe("checkVPAIDInterface", function(){
    it("must be a function", function(){
      assert.isFunction(VPAIDCreativeWrapper.checkVPAIDInterface);
    });

    it("must return false if you pass an obj that does not fully implements the VPAID interface", function(){
      assert.isFalse(VPAIDCreativeWrapper.checkVPAIDInterface());
      assert.isFalse(VPAIDCreativeWrapper.checkVPAIDInterface(null));
      assert.isFalse(VPAIDCreativeWrapper.checkVPAIDInterface(noop));
      assert.isFalse(VPAIDCreativeWrapper.checkVPAIDInterface('foo'));
    });

    it("must return true if you pass an object that fully implements the VPAID interface", function(){
      assert.isTrue(VPAIDCreativeWrapper.checkVPAIDInterface(vpaidCreative));
    });
  });

  describe("constructor", function(){
    it("must return an instance of itself", function(){
     assert.instanceOf(VPAIDCreativeWrapper(vpaidCreative), VPAIDCreativeWrapper);
    });

    it("must throw a VASTError if the passed VPAIDCreative does not fully implement the VPAID api", function(){
     [null, undefined, noop, 'foo', {}, []].forEach(function(invalidCreative) {
       assert.throws(function () {
         new VPAIDCreativeWrapper(invalidCreative);
       }, VASTError, 'on VPAIDCreativeWrapper, the passed VPAID creative does not fully implement the VPAID interface');
     });
    });

    it("must publish the VPAIDCreative in '_creative'", function(){
      var wrapper = new VPAIDCreativeWrapper(vpaidCreative);
      assert.equal(wrapper._creative, vpaidCreative);
    });
  });

  describe("instance", function(){
    var wrapper;

    beforeEach(function(){
      wrapper = new VPAIDCreativeWrapper(vpaidCreative);
    });

    describe("on", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.on)
      });
    });
  });
});