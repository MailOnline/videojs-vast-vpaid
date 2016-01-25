var async = require('utils/async');
var utilities = require('utils/utilityFunctions');

describe("async", function () {
  it("must be an object", function () {
    assert.isObject(async);
  });

  describe("setImmediate", function () {
    beforeEach(function () {
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it("must call the passed function asynchronously", function () {
      var spy = sinon.spy();
      async.setImmediate(spy);
      sinon.assert.notCalled(spy);
      this.clock.tick();
      sinon.assert.calledOnce(spy);
    });
  });

  describe("iterator", function () {
    var task1, task2, task3;

    beforeEach(function () {
      task1 = sinon.spy();
      task2 = sinon.spy();
      task3 = sinon.spy();
    });

    it("must return an iterator that iterates over the array of tasks", function () {
      var next = async.iterator([task1, task2, task3]);
      while (next !== null) {
        next = next();
      }
      sinon.assert.callOrder(task1, task2, task3);
    });

    it("must be possible to pass args to the tasks", function () {
      var tasks = [task1, task2, task3];
      var next = async.iterator(tasks);
      while (next !== null) {
        next = next('foo', 'bar');
      }
      tasks.forEach(function (task) {
        sinon.assert.calledWithExactly(task, 'foo', 'bar');
      });
    });
  });

  describe("waterfall", function () {
    it("must pass an error to the callback if you don't pass an array for tasks", function () {
      var callback = sinon.spy();
      async.waterfall(null, callback);
      var error = callback.lastCall.args[0];
      assert.instanceOf(error, Error);
      assert.equal('First argument to waterfall must be an array of functions', error.message);
    });

    it("must call the callback with no args if the task array is empty", function () {
      var callback = sinon.spy();
      async.waterfall([], callback);
      assert.equal(callback.lastCall.args.length, 0);
    });

    describe("given an array of tasks", function () {
      var task1, task2, task3, callback;

      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
        task1 = sinon.spy();
        task2 = sinon.spy();
        task3 = sinon.spy();
        callback = sinon.spy();
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must call the all the tasks passing the arguments of the previous one to the next task", function () {
        var spy = sinon.spy();

        function startCounter(next) {
          next(null, 0);
        }

        function increaseCounter(counter, next) {
          next(null, counter + 1);
        }

        async.waterfall([
          startCounter,
          increaseCounter,
          increaseCounter,
          increaseCounter
        ], function (error, counter) {
          assert.isNull(error);
          assert.equal(3, counter);
          spy();
        });

        this.clock.tick(5);
        sinon.assert.calledOnce(spy);
      });

      it("must call the callback if an error occur on one of the task", function () {
        var spy = sinon.spy();

        function startCounter(next) {
          next(null, 0);
        }

        function increaseCounter(counter, next) {
          next(null, counter + 1);
        }

        function throwError(counter, next) {
          next(new Error(), counter);
        }

        async.waterfall([
          startCounter,
          increaseCounter,
          increaseCounter,
          throwError,
          increaseCounter
        ], function (error, counter) {
          assert.instanceOf(error, Error);
          assert.equal(2, counter);
          spy();
        });

        this.clock.tick(5);
        sinon.assert.calledOnce(spy);
      });
    });
  });

  describe("when", function () {
    it("must return a function", function () {
      assert.isFunction(async.when(false, utilities.noop));
    });

    it("must throw an exception if the second argument is not a callback", function () {
      assert.throws(function () {
        async.when();
      }, Error, 'async.when error: missing callback argument');
    });

    describe("with truthy condition", function () {
      it("must call the callback with the same arguments that where passed to the return if function", function () {
        var spy = sinon.spy();
        var ifFn = async.when(true, spy);

        ifFn("1", 2, null, utilities.noop);
        sinon.assert.calledWithExactly(spy, "1", 2, null, utilities.noop);
      });
    });

    describe("with falsy condition,", function () {
      it("must not call the callback and call the next callback passed passing null (for no error) and the rest of the args", function () {
        var callback = sinon.spy();
        var next = sinon.spy();
        var ifFn = async.when(false, callback);

        ifFn("1", 2, null, next);
        sinon.assert.notCalled(callback);
        sinon.assert.calledWithExactly(next, null, "1", 2, null);
      });
    });

    describe("with conditional function,", function () {
      it("must use whatever the condition return to decide weather to execute the condition or not.", function () {
        var callback = sinon.spy();
        var next = sinon.spy();
        var ifFn = async.when(function () {
          return false;
        }, callback);

        ifFn("1", 2, null, next);
        sinon.assert.notCalled(callback);
        sinon.assert.calledWithExactly(next, null, "1", 2, null);
      });

      it("must pass the arguments to the conditional function", function(){
          var callback = sinon.spy();
          var next = sinon.spy();
          var condition = sinon.stub();
          var ifFn = async.when(condition, callback);
          condition.returns(true);

          ifFn("1", 2, null, next);

          sinon.assert.notCalled(next);
          sinon.assert.calledWithExactly(condition, "1", 2, null);
          sinon.assert.calledWithExactly(callback, "1", 2, null, next);
      });
    });
  });
});