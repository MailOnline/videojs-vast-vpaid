// Small subset of async

const utilities = require('./utilityFunctions');

const async = {};

async.setImmediate = function (fn) {
  setTimeout(fn, 0);
};

async.iterator = function (tasks) {
  const makeCallback = function (index) {
    const fn = function () {
      if (tasks.length) {
        tasks[index].apply(null, arguments);
      }

      return fn.next();
    };

    fn.next = function () {
      return index < tasks.length - 1 ? makeCallback(index + 1) : null;
    };

    return fn;
  };

  return makeCallback(0);
};


async.waterfall = function (tasks, callback) {
  callback = callback || function () { };
  if (!utilities.isArray(tasks)) {
    const err = new Error('First argument to waterfall must be an array of functions');

    return callback(err);
  }
  if (!tasks.length) {
    return callback();
  }
  const wrapIterator = function (iterator) {
    return function (err) {
      if (err) {
        callback(...arguments);
        callback = function () {
        };
      }
      else {
        const args = Array.prototype.slice.call(arguments, 1);
        const next = iterator.next();

        if (next) {
          args.push(wrapIterator(next));
        }
        else {
          args.push(callback);
        }
        async.setImmediate(() => {
          iterator(...args);
        });
      }
    };
  };

  wrapIterator(async.iterator(tasks))();
};

async.when = function (condition, callback) {
  if (!utilities.isFunction(callback)) {
    throw new Error('async.when error: missing callback argument');
  }

  const isAllowed = utilities.isFunction(condition) ? condition : function () {
    return Boolean(condition);
  };

  return function () {
    const args = utilities.arrayLikeObjToArray(arguments);
    const next = args.pop();

    if (isAllowed(...args)) {
      return callback.apply(this, arguments);
    }

    args.unshift(null);

    return next(...args);
  };
};

module.exports = async;

