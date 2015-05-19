describe("VPAIDIntegrator", function(){
  var player, AD_START_TIMEOUT;


  beforeEach(function () {
    AD_START_TIMEOUT = 500;
    player = videojs(document.createElement('video'), {});
  });

  it("must be a function", function(){
    assert.isFunction(VPAIDIntegrator);
  });

  it("must return an instance of itSelf", function(){
    assert.instanceOf(VPAIDIntegrator(), VPAIDIntegrator);
  });

  it("must publish the passed player and adStartTimeout", function(){
    var vpaidIntegrator = new VPAIDIntegrator(player, AD_START_TIMEOUT);
    assert.equal(vpaidIntegrator.player, player);
    assert.equal(vpaidIntegrator.adStartTimeout, AD_START_TIMEOUT);
  });

  it("must set the adStartTimeout to 5000 ms if no timeout is passed to the constructor", function(){
    var vpaidIntegrator = new VPAIDIntegrator(player);
    assert.equal(vpaidIntegrator.player, player);
    assert.equal(vpaidIntegrator.adStartTimeout, 5000);
  });

  describe("instance", function(){
    var vpaidIntegrator, callback;

    beforeEach(function(){
      vpaidIntegrator = new VPAIDIntegrator(player, AD_START_TIMEOUT);
      callback = sinon.spy();
    });

    describe("playAd", function(){
      it("must be a function", function(){
        assert.isFunction(vpaidIntegrator.playAd);
      });
    });
  });
});