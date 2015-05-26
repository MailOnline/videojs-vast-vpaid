describe("VPAIDIntegrator", function(){
  var player, AD_START_TIMEOUT, vpaidAdUnit, adUnitWrapper, testDiv;
  function createElement(type) {

    videoEl.id = 'testVideoElm';
    testDiv.appendChild(videoEl);
  }

  beforeEach(function () {

    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
    var videoEl = document.createElement('video');
    testDiv.appendChild(videoEl);

    AD_START_TIMEOUT = 500;
    player = videojs(videoEl, {});
    dom.addClass(player.el(), 'vjs-test-player');
    vpaidAdUnit = {
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
      'unsubscribe': noop,
      'unloadAdUnit': noop
    };
    adUnitWrapper = new VPAIDAdUnitWrapper(vpaidAdUnit);
  });

  afterEach(function(){
    dom.remove(testDiv);
  });

  it("must be a function", function(){
    assert.isFunction(VPAIDIntegrator);
  });

  it("must return an instance of itSelf", function(){
    assert.instanceOf(VPAIDIntegrator(player), VPAIDIntegrator);
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

      //TODO: Yet to be finished
    });

    describe("loadAdUnit", function(){
      var fakeTech;
      function createMediaFile(url, type) {
        var xmlStr = '<MediaFile delivery="progressive" type="' + type + '" apiFramework="VPAID">' +
          '<![CDATA[' + url + ']]>' +
          '</MediaFile>';
        return new MediaFile(xml.toJXONTree(xmlStr));
      }

      beforeEach(function(){
        fakeTech = function (){

        };

        fakeTech.prototype.loadAdUnit = sinon.spy();
        fakeTech.supports = sinon.stub();
      });

      it("must be a function", function(){
        assert.isFunction(vpaidIntegrator._loadAdUnit);
      });

      it("must pass an error to the callback if it can not find a VPAID mediaFile", function(){
        var response = new VASTResponse();
        var callback = sinon.spy();
        vpaidIntegrator._loadAdUnit(response, callback);
        var error = firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._loadAdUnit, could not find a supported mediaFile');
      });

      it("must pass an error to the callback if it can not find a supported tech to load the ad unit", function(){
        var response = new VASTResponse();
        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'application/fake-type')
        ]);
        var callback = sinon.spy();
        vpaidIntegrator._loadAdUnit(response, callback);
        var error = firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._loadAdUnit, could not find a supported mediaFile');
      });

      it("must load the ad unit using a supported tech", function(){
        var callback = sinon.spy();
        var response = new VASTResponse();
        VPAIDIntegrator.techs.unshift(fakeTech);
        fakeTech.supports.returns(true);

        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'application/fake-type')
        ]);

        vpaidIntegrator._loadAdUnit(response, callback);
        sinon.assert.calledWith(fakeTech.prototype.loadAdUnit, vpaidIntegrator.containerEl, 'http://fakeVideoFile', sinon.match.func);

      });

      it("must propagate any error coming for the tech loadAdUnit", function(){
        var callback = sinon.spy();
        var response = new VASTResponse();
        VPAIDIntegrator.techs.unshift(fakeTech);
        fakeTech.supports.returns(true);

        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'application/fake-type')
        ]);

        vpaidIntegrator._loadAdUnit(response, callback);
        var responseBack = thirdArg(fakeTech.prototype.loadAdUnit);
        var fakeError = new Error();
        responseBack(fakeError);
        sinon.assert.calledWithExactly(callback, fakeError);
      });

      it("on success it must wrap the returned adUnit and pass it to the callback", function(){
        var callback = sinon.spy();
        var response = new VASTResponse();
        VPAIDIntegrator.techs.unshift(fakeTech);
        fakeTech.supports.returns(true);

        response._addMediaFiles([
          createMediaFile('http://fakeVideoFile', 'application/fake-type')
        ]);

        vpaidIntegrator._loadAdUnit(response, callback);
        var responseBack = thirdArg(fakeTech.prototype.loadAdUnit);
        responseBack(null, vpaidAdUnit);
        assert.instanceOf(secondArg(callback), VPAIDAdUnitWrapper);
      });
    });

    describe("handshake", function(){
      var next, response;
      beforeEach(function(){
        sinon.spy(vpaidAdUnit, 'handshakeVersion');
        next = sinon.spy();
        response = new VASTResponse();

      });

      it("must be a function", function(){
        assert.isFunction(vpaidIntegrator._handshake)
      });

      it("must pass an error to the callback if the VPAID version is smaller than 1.0", function(){
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '0.0.0');
        sinon.assert.calledOnce(next);
        var error = firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "0.0.0"' )
      });

      it("must pass an error to the callback if the VPAID version is bigger than 2.x.x", function(){
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '3.0.0');
        sinon.assert.calledOnce(next);
        var error = firstArg(next);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VPAIDIntegrator._handshake, unsupported version "3.0.0"' )
      });

      it("must pass an error to the callback if the handshake returns an error", function(){
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        var fakeError = new Error();
        respond(fakeError);
        sinon.assert.calledWith(next, fakeError);
      });

      it("must call the callback with null and the adUnit and the VASTResponse if the version is supported", function(){
        vpaidIntegrator._handshake(adUnitWrapper, response, next);
        sinon.assert.calledWith(vpaidAdUnit.handshakeVersion, '2.0');
        var respond = secondArg(vpaidAdUnit.handshakeVersion);
        respond(null, '2.0');
        sinon.assert.calledOnce(next);
        sinon.assert.calledWithExactly(next, null, adUnitWrapper, response);
      });
    });
    
    describe("initAd", function(){
      beforeEach(function(){
        sinon.spy(adUnitWrapper, 'initAd');
      });

      it("must be a function", function(){
        assert.isFunction(vpaidIntegrator._initAd);
      });

      it("must call pass the with, height , viewmode  desired bitrate to the adUnit's initAd", function(){
        var next = sinon.spy();
        vpaidIntegrator._initAd(adUnitWrapper, next);
        sinon.assert.calledWithExactly(adUnitWrapper.initAd, 720, 480, 'normal', -1, '', sinon.match.func)
      });
    });
  });
});