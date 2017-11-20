const async = require('../../src/scripts/utils/async');
const utilities = require('../../src/scripts/utils/utilityFunctions');

describe('async', () => {
  it('must be an object', () => {
    assert.isObject(async);
  });

  describe('setImmediate', () => {
    it('must call the passed function asynchronously', function () {
      this.clock = sinon.useFakeTimers();

      const spy = sinon.spy();

      async.setImmediate(spy);
      sinon.assert.notCalled(spy);
      this.clock.tick();
      sinon.assert.calledOnce(spy);

      this.clock.restore();
    });
  });

  describe('iterator', () => {
    let task1, task2, task3;

    beforeEach(() => {
      task1 = sinon.spy();
      task2 = sinon.spy();
      task3 = sinon.spy();
    });

    it('must return an iterator that iterates over the array of tasks', () => {
      let nextTask;

      nextTask = async.iterator([task1, task2, task3]);

      while (nextTask !== null) {
        nextTask = nextTask();
      }
      sinon.assert.callOrder(task1, task2, task3);
    });

    it('must be possible to pass args to the tasks', () => {
      let nextTask;
      const tasks = [task1, task2, task3];

      nextTask = async.iterator(tasks);

      while (nextTask !== null) {
        nextTask = nextTask('foo', 'bar');
      }
      tasks.forEach((task) => {
        sinon.assert.calledWithExactly(task, 'foo', 'bar');
      });
    });
  });

  describe('waterfall', () => {
    it('must pass an error to the callback if you don\'t pass an array for tasks', () => {
      const callback = sinon.spy();

      async.waterfall(null, callback);
      const error = callback.lastCall.args[0];

      assert.instanceOf(error, Error);
      assert.equal('First argument to waterfall must be an array of functions', error.message);
    });

    it('must call the callback with no args if the task array is empty', () => {
      const callback = sinon.spy();

      async.waterfall([], callback);
      assert.equal(callback.lastCall.args.length, 0);
    });

    describe('given an array of tasks', () => {
      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
      });

      afterEach(function () {
        this.clock.restore();
      });

      it('must call the all the tasks passing the arguments of the previous one to the next task', function () {
        const spy = sinon.spy();

        const startCounter = function (next) {
          next(null, 0);
        };

        const increaseCounter = function (counter, next) {
          next(null, counter + 1);
        };

        async.waterfall([
          startCounter,
          increaseCounter,
          increaseCounter,
          increaseCounter
        ], (error, counter) => {
          assert.isNull(error);
          assert.equal(3, counter);
          spy();
        });

        this.clock.tick(5);
        sinon.assert.calledOnce(spy);
      });

      it('must call the callback if an error occur on one of the task', function () {
        const spy = sinon.spy();
        const startCounter = function (next) {
          next(null, 0);
        };
        const increaseCounter = function (counter, next) {
          next(null, counter + 1);
        };

        const throwError = function (counter, next) {
          next(new Error(), counter);
        };

        async.waterfall([
          startCounter,
          increaseCounter,
          increaseCounter,
          throwError,
          increaseCounter
        ], (error, counter) => {
          assert.instanceOf(error, Error);
          assert.equal(2, counter);
          spy();
        });

        this.clock.tick(5);
        sinon.assert.calledOnce(spy);
      });
    });
  });

  describe('when', () => {
    it('must return a function', () => {
      assert.isFunction(async.when(false, utilities.noop));
    });

    it('must throw an exception if the second argument is not a callback', () => {
      assert.throws(() => {
        async.when();
      }, Error, 'async.when error: missing callback argument');
    });

    describe('with truthy condition', () => {
      it('must call the callback with the same arguments that where passed to the return if function', () => {
        const spy = sinon.spy();
        const ifFn = async.when(true, spy);

        ifFn('1', 2, null, utilities.noop);
        sinon.assert.calledWithExactly(spy, '1', 2, null, utilities.noop);
      });
    });

    describe('with falsy condition,', () => {
      it('must not call the callback and call the next callback passed passing null (for no error) and the rest of the args', () => {
        const callback = sinon.spy();
        const next = sinon.spy();
        const ifFn = async.when(false, callback);

        ifFn('1', 2, null, next);
        sinon.assert.notCalled(callback);
        sinon.assert.calledWithExactly(next, null, '1', 2, null);
      });
    });

    describe('with conditional function,', () => {
      it('must use whatever the condition return to decide weather to execute the condition or not.', () => {
        const callback = sinon.spy();
        const next = sinon.spy();
        const ifFn = async.when(() => false, callback);

        ifFn('1', 2, null, next);
        sinon.assert.notCalled(callback);
        sinon.assert.calledWithExactly(next, null, '1', 2, null);
      });

      it('must pass the arguments to the conditional function', () => {
        const callback = sinon.spy();
        const next = sinon.spy();
        const condition = sinon.stub();
        const ifFn = async.when(condition, callback);

        condition.returns(true);

        ifFn('1', 2, null, next);

        sinon.assert.notCalled(next);
        sinon.assert.calledWithExactly(condition, '1', 2, null);
        sinon.assert.calledWithExactly(callback, '1', 2, null, next);
      });
    });
  });
});
