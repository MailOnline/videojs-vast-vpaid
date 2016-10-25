const VPAIDAdUnitWrapper = require('../../../src/scripts/ads/vpaid/VPAIDAdUnitWrapper');
const VASTError = require('../../../src/scripts/ads/vast/VASTError');
const utilities = require('../../../src/scripts/utils/utilityFunctions');
const testUtils = require('../../test-utils');

describe('VPAIDAdUnitWrapper', () => {
  let vpaidAdUnit;

  beforeEach(() => {
    vpaidAdUnit = {
      handshakeVersion: utilities.noop,
      initAd: utilities.noop,
      startAd: utilities.noop,
      stopAd: utilities.noop,
      skipAd: utilities.noop,
      resizeAd: utilities.noop,
      pauseAd: utilities.noop,
      expandAd: utilities.noop,
      collapseAd: utilities.noop,
      subscribe: utilities.noop,
      unsubscribe: utilities.noop,
      unloadAdUnit: utilities.noop
    };
  });

  describe('checkVPAIDInterface', () => {
    it('must return false if you pass an obj that does not fully implements the VPAID interface', () => {
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface());
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(null));
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(utilities.noop));
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface('foo'));
    });

    it('must return true if you pass an object that fully implements the VPAID interface', () => {
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it('must return false if there is no method to subscribe to events', () => {
      vpaidAdUnit.subscribe = undefined;
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it('must return true if there is a method to subscribe to events', () => {
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.subscribe = undefined;
      vpaidAdUnit.on = utilities.noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.on = undefined;
      vpaidAdUnit.addEventListener = utilities.noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it('must return false if there is no method to unsubscribe to events', () => {
      vpaidAdUnit.unsubscribe = undefined;
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it('must return true if there is a method to unsubscribe from events', () => {
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.unsubscribe = undefined;
      vpaidAdUnit.off = utilities.noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.off = undefined;
      vpaidAdUnit.removeEventListener = utilities.noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });
  });

  describe('constructor', () => {
    it('must return an instance of itself', () => {
      assert.instanceOf(new VPAIDAdUnitWrapper(vpaidAdUnit, {responseTimeout: 5000}), VPAIDAdUnitWrapper);
    });

    it('must throw a VASTError if the passed VPAIDAdUnit does not fully implement the VPAID api', () => {
      [null, undefined, utilities.noop, 'foo', {}, []].forEach((invalidAdUnit) => {
        assert.throws(() => {
          // eslint-disable-next-line
          new VPAIDAdUnitWrapper(invalidAdUnit, {responseTimeout: 5000});
        }, VASTError, 'on VPAIDAdUnitWrapper, the passed VPAID adUnit does not fully implement the VPAID interface');
      });
    });

    it('must complain if you pass an options that is not a hash', () => {
      assert.throws(() => {
        // eslint-disable-next-line
        new VPAIDAdUnitWrapper(vpaidAdUnit, 'foo');
      }, VASTError, 'on VPAIDAdUnitWrapper, expected options hash  but got \'foo\'');
    });

    it('must publish the VPAIDAdUnit in \'_adUnit\'', () => {
      const wrapper = new VPAIDAdUnitWrapper(vpaidAdUnit, {responseTimeout: 5000});

      assert.equal(wrapper._adUnit, vpaidAdUnit);
    });
  });

  describe('instance', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = new VPAIDAdUnitWrapper(vpaidAdUnit, {responseTimeout: 5000});
    });

    describe('adUnitAsyncCall', () => {
      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
      });

      afterEach(function () {
        this.clock.restore();
      });

      it('must complain if the method is not part of the adUnit', () => {
        assert.throws(() => {
          wrapper.adUnitAsyncCall('foo', utilities.noop);
        }, VASTError, 'on VPAIDAdUnitWrapper.adUnitAsyncCall, invalid method name');
      });

      it('must complain if there is no callback', () => {
        assert.throws(() => {
          wrapper.adUnitAsyncCall('initAd');
        }, VASTError, 'on VPAIDAdUnitWrapper.adUnitAsyncCall, missing callback');
      });

      it('must call the adUnit method', () => {
        sinon.spy(vpaidAdUnit, 'initAd');
        wrapper.adUnitAsyncCall('initAd', utilities.noop);
        sinon.assert.calledOnce(vpaidAdUnit.initAd);
      });

      it('must call the callback whenever the adUnit response comes back', function () {
        const cb = sinon.spy();

        sinon.spy(vpaidAdUnit, 'initAd');

        wrapper.adUnitAsyncCall('initAd', cb);
        const wrapperCb = testUtils.firstArg(vpaidAdUnit.initAd);

        sinon.assert.notCalled(cb);
        wrapperCb(null);

        sinon.assert.calledOnce(cb);
        sinon.assert.calledWith(cb, null);

        // it must only call the callback once.
        this.clock.tick(wrapper.options.responseTimeout);
        sinon.assert.calledOnce(cb);
      });

      describe('on response timeout', () => {
        it('must call the callback with a VASTError', function () {
          const cb = sinon.spy();

          sinon.spy(vpaidAdUnit, 'initAd');

          wrapper.adUnitAsyncCall('initAd', cb);
          const wrapperCb = testUtils.firstArg(vpaidAdUnit.initAd);

          sinon.assert.notCalled(cb);
          this.clock.tick(wrapper.options.responseTimeout);

          sinon.assert.calledOnce(cb);
          const error = testUtils.firstArg(cb);

          assert.instanceOf(error, VASTError);
          assert.equal(error.message, 'VAST Error: on VPAIDAdUnitWrapper, timeout while waiting for a response on call \'initAd\'');

          // it must not call the callback again
          wrapperCb(null);
          sinon.assert.calledOnce(cb);
        });
      });
    });

    describe('on', () => {
      it('must call the subscribe method of the inner adunit', () => {
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.addEventListener = undefined;
        sinon.spy(vpaidAdUnit, 'subscribe');

        wrapper.on('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.subscribe, 'evtName', utilities.noop);
      });

      it('must call the addEventListener method of the inner adunit', () => {
        vpaidAdUnit.subscribe = undefined;
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.addEventListener = sinon.spy();

        wrapper.on('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.addEventListener, 'evtName', utilities.noop);
      });

      it('must call the on method of the inner adunit', () => {
        vpaidAdUnit.subscribe = undefined;
        vpaidAdUnit.addEventListener = undefined;
        vpaidAdUnit.on = sinon.spy();

        wrapper.on('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.on, 'evtName', utilities.noop);
      });
    });

    describe('off', () => {
      it('must call the unsubscribe method of the inner adunit', () => {
        vpaidAdUnit.off = undefined;
        vpaidAdUnit.removeEventListener = undefined;
        sinon.spy(vpaidAdUnit, 'unsubscribe');

        wrapper.off('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.unsubscribe, 'evtName', utilities.noop);
      });

      it('must call the removeEventListener method of the inner adunit', () => {
        vpaidAdUnit.unsubscribe = undefined;
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.removeEventListener = sinon.spy();

        wrapper.off('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.removeEventListener, 'evtName', utilities.noop);
      });

      it('must call the off method of the inner adunit', () => {
        vpaidAdUnit.unsubscribe = undefined;
        vpaidAdUnit.removeEventListener = undefined;
        vpaidAdUnit.off = sinon.spy();

        wrapper.off('evtName', utilities.noop);
        sinon.assert.calledWith(vpaidAdUnit.off, 'evtName', utilities.noop);
      });
    });

    describe('waitForEvent', () => {
      it('must complain if you don\'t pass an evtName', () => {
        assert.throws(() => {
          wrapper.waitForEvent();
        }, VASTError, 'on VPAIDAdUnitWrapper.waitForEvent, missing evt name');
      });

      it('must complain if you don\'t pass a callback', () => {
        assert.throws(() => {
          wrapper.waitForEvent('adInit');
        }, VASTError, 'on VPAIDAdUnitWrapper.waitForEvent, missing callback');
      });

      it('must subscribe to the passed event', () => {
        const listener = sinon.spy();

        sinon.spy(wrapper, 'on');
        wrapper.waitForEvent('adInit', listener);
        sinon.assert.calledWith(wrapper.on, 'adInit', sinon.match.func);
      });

      describe('on response', () => {
        it('must call the callback with the null as the first arg and the listener args afterwards', () => {
          const callback = sinon.spy();
          let listener;

          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = testUtils.secondArg(wrapper.on);

          // We simulate the response
          const evt = {type: 'adInit'};

          listener(evt, 'foo', 'bar');

          sinon.assert.calledWith(callback, null, evt, 'foo', 'bar');
        });
      });

      describe('on response timeout', () => {
        beforeEach(function () {
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function () {
          this.clock.restore();
        });

        it('must call the callback with a vastError', function () {
          const callback = sinon.spy();
          let error;

          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          error = testUtils.firstArg(callback);

          assert.instanceOf(error, VASTError);
          assert.equal(error.message, 'VAST Error: on VPAIDAdUnitWrapper.waitForEvent, timeout while waiting for event \'adInit\'');
        });

        it('must not call the callback once the event response comes', function () {
          const callback = sinon.spy();
          let listener;

          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = testUtils.secondArg(wrapper.on);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          listener('adInint');
          sinon.assert.calledOnce(callback);
        });
      });
    });
  });
});
