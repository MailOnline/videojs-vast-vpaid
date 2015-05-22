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
      'unsubscribe': noop,
      'unloadAdUnit': noop
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

    it("must complian if you pass an options that is not a hash", function(){
      assert.throws(function() {
        new VPAIDCreativeWrapper(vpaidCreative, 'foo');
      }, VASTError, "on VPAIDCreativeWrapper, expected options hash  but got 'foo'")
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

    describe("creativeAsyncCall", function(){
      beforeEach(function(){
        this.clock = sinon.useFakeTimers();
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must be a function", function(){
        assert.isFunction(wrapper.creativeAsyncCall);
      });

      it("must complain if the method is not part of the creative", function(){
        assert.throws(function () {
          wrapper.creativeAsyncCall('foo', noop);
        }, VASTError, "on VPAIDCreativeWrapper.creativeAsyncCall, invalid method name");
      });

      it("must complain if there is no callback", function(){
        assert.throws(function () {
          wrapper.creativeAsyncCall('initAd');
        }, VASTError, "on VPAIDCreativeWrapper.creativeAsyncCall, missing callback");
      });

      it("must call the creative method", function(){
        sinon.spy(vpaidCreative, 'initAd');
        wrapper.creativeAsyncCall('initAd', noop);
        sinon.assert.calledOnce(vpaidCreative.initAd)
      });

      it("must call the callback whenever the creative response comes back", function(){
        var cb = sinon.spy();
        sinon.spy(vpaidCreative, 'initAd');

        wrapper.creativeAsyncCall('initAd', cb);
        var wrapperCb = firstArg(vpaidCreative.initAd);
        sinon.assert.notCalled(cb);
        wrapperCb(null);

        sinon.assert.calledOnce(cb);
        sinon.assert.calledWith(cb, null);

        //it must only call the callback once.
        this.clock.tick(wrapper.options.responseTimeout);
        sinon.assert.calledOnce(cb);
      });

      describe("on response timeout", function(){
        it("must call the callback with a VASTError", function(){
          var cb = sinon.spy();
          sinon.spy(vpaidCreative, 'initAd');

          wrapper.creativeAsyncCall('initAd', cb);
          var wrapperCb = firstArg(vpaidCreative.initAd);
          sinon.assert.notCalled(cb);
          this.clock.tick(wrapper.options.responseTimeout);

          sinon.assert.calledOnce(cb);
          var error = firstArg(cb);
          assert.instanceOf(error, VASTError);
          assert.equal(error.message, "VAST Error: on VPAIDCreativeWrapper, timeout while waiting for a response on call 'initAd'");

          //it must not call the callback again
          wrapperCb(null);
          sinon.assert.calledOnce(cb);
        });

        it("must destroy the creative", function(){
          var cb = sinon.spy();
          sinon.spy(wrapper, 'destroy');
          wrapper.creativeAsyncCall('initAd', cb);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(wrapper.destroy);
        });

      });
    });

    describe("destroy", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.destroy);
      });

      it("must call the creative's 'unloadAdUnit' method", function(){
        sinon.stub(vpaidCreative, 'unloadAdUnit');
        wrapper.destroy();
        sinon.assert.calledOnce(vpaidCreative.unloadAdUnit);
      });
    });

    describe("on", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.on);
      });

      it("must call the subscribe method of the inner creative", function(){
        vpaidCreative.on = undefined;
        vpaidCreative.addEventListener = undefined;
        sinon.spy(vpaidCreative, 'subscribe');

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.subscribe, 'evtName', noop);
      });

      it("must call the addEventListener method of the inner creative", function(){
        vpaidCreative.subscribe = undefined;
        vpaidCreative.on = undefined;
        vpaidCreative.addEventListener = sinon.spy();

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.addEventListener, 'evtName', noop);
      });

      it("must call the on method of the inner creative", function(){
        vpaidCreative.subscribe = undefined;
        vpaidCreative.addEventListener = undefined;
        vpaidCreative.on = sinon.spy();

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.on, 'evtName', noop);
      });
    });

    describe("off", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.off);
      });

      it("must call the unsubscribe method of the inner creative", function(){
        vpaidCreative.off = undefined;
        vpaidCreative.removeEventListener = undefined;
        sinon.spy(vpaidCreative, 'unsubscribe');

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.unsubscribe, 'evtName', noop);
      });

      it("must call the removeEventListener method of the inner creative", function(){
        vpaidCreative.unsubscribe = undefined;
        vpaidCreative.on = undefined;
        vpaidCreative.removeEventListener = sinon.spy();

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.removeEventListener, 'evtName', noop);
      });

      it("must call the off method of the inner creative", function(){
        vpaidCreative.unsubscribe = undefined;
        vpaidCreative.removeEventListener = undefined;
        vpaidCreative.off = sinon.spy();

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidCreative.off, 'evtName', noop);
      });
    });

    describe("waitForEvent", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.waitForEvent);
      });

      it("must complain if you don't pass an evtName", function(){
        assert.throws(function () {
          wrapper.waitForEvent();
        }, VASTError, "on VPAIDCreativeWrapper.waitForEvent, missing evt name");
      });
      
      it("must complain if you don't pass a callback", function(){
        assert.throws(function () {
          wrapper.waitForEvent('adInit');
        }, VASTError, "on VPAIDCreativeWrapper.waitForEvent, missing callback");
      });

      it("must subscribe to the passed event", function(){
        var listener = sinon.spy();
        sinon.spy(wrapper, 'on');
        wrapper.waitForEvent('adInit', listener);
        sinon.assert.calledWith(wrapper.on, 'adInit', sinon.match.func);
      });

      describe("on response", function(){
        it("must call the callback with the null as the first arg and the listener args afterwards", function(){
          var callback = sinon.spy();
          var listener;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = secondArg(wrapper.on);

          //We simulate the response
          var evt = {type: 'adInit'};
          listener(evt, 'foo', 'bar');

          sinon.assert.calledWith(callback, null, evt, 'foo', 'bar');
        });
      });

      describe("on response timeout", function(){
        beforeEach(function(){
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function(){
          this.clock.restore();
        });

        it("must call the callback with a vastError", function(){
          var callback = sinon.spy();
          var error;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          error = firstArg(callback);

          assert.instanceOf(error, VASTError);
          assert.equal(error.message, "VAST Error: on VPAIDCreativeWrapper.waitForEvent, timeout while waiting for event 'adInit'")
        });

        it("must not call the callback once the event response comes", function(){
          var callback = sinon.spy();
          var listener;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = secondArg(wrapper.on);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          listener('adInint');
          sinon.assert.calledOnce(callback);
        });
      });
    });
  });
});