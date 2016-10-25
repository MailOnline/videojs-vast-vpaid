import dom from '../../src/scripts/utils/dom';
import utilities from '../../src/scripts/utils/utilityFunctions';

describe('utilities.noop', () => {
  it('must return undefined', () => {
    assert.isUndefined(utilities.noop());
    assert.isUndefined(utilities.noop('fooo'));
    assert.isUndefined(utilities.noop({}));
  });
});

describe('utilities.isNull', () => {
  it('must return true if the passed arg is null and false otherwise', () => {
    assert.isTrue(utilities.isNull(null));
    assert.isFalse(utilities.isNull(''));
    assert.isFalse(utilities.isNull(1));
    assert.isFalse(utilities.isNull(true));
    assert.isFalse(utilities.isNull({}));
    assert.isFalse(utilities.isNull(utilities.noop));
    assert.isFalse(utilities.isNull([]));
  });
});

describe('utilities.isDefined', () => {
  it('must return false if you pass undefined', () => {
    assert.isFalse(utilities.isDefined());
    assert.isFalse(utilities.isDefined());
  });

  it('must return true if you pass a defined argument', () => {
    assert.isTrue(utilities.isDefined(''));
    assert.isTrue(utilities.isDefined(1));
    assert.isTrue(utilities.isDefined(true));
    assert.isTrue(utilities.isDefined({}));
    assert.isTrue(utilities.isDefined(utilities.noop));
    assert.isTrue(utilities.isDefined([]));
  });
});

describe('utilities.isUndefined', () => {
  it('must return true if you pass undefined', () => {
    assert.isTrue(utilities.isUndefined());
    assert.isTrue(utilities.isUndefined());
  });

  it('must return true if you pass a defined argument', () => {
    assert.isFalse(utilities.isUndefined(''));
    assert.isFalse(utilities.isUndefined(1));
    assert.isFalse(utilities.isUndefined(true));
    assert.isFalse(utilities.isUndefined({}));
    assert.isFalse(utilities.isUndefined(utilities.noop));
    assert.isFalse(utilities.isUndefined([]));
  });
});

describe('utilities.isObject', () => {
  it('must return true if you pass and object and false otherwise', () => {
    assert.isTrue(utilities.isObject({}));
    assert.isTrue(utilities.isObject([]));
    assert.isTrue(utilities.isObject(window));

    assert.isFalse(utilities.isObject(''));
    assert.isFalse(utilities.isObject(0));
    assert.isFalse(utilities.isObject(true));
    assert.isFalse(utilities.isObject(utilities.noop));
    assert.isFalse(utilities.isObject());
  });
});

describe('utilities.isNumber', () => {
  it('must return true if you pass a number and false otherwise', () => {
    assert.isTrue(utilities.isNumber(12));
    assert.isFalse(utilities.isNumber('12'));
    assert.isFalse(utilities.isNumber([]));
    assert.isFalse(utilities.isNumber({}));
    assert.isFalse(utilities.isNumber(utilities.noop));
    assert.isFalse(utilities.isNumber(true));
  });
});

describe('utilities.isWindow', () => {
  it('must return true if you pass the window obj and false otherwise', () => {
    assert.isTrue(utilities.isWindow(window));
    assert.isFalse(utilities.isWindow({}));
    assert.isFalse(utilities.isWindow([]));
    assert.isFalse(utilities.isWindow(utilities.noop));
    assert.isFalse(utilities.isWindow(''));
    assert.isFalse(utilities.isWindow(123));
    assert.isFalse(utilities.isWindow(true));
  });
});

describe('utilities.isFunction', () => {
  it('must return true if the passed value is a function and false otherwise', () => {
    assert.isTrue(utilities.isFunction(utilities.noop));
    assert.isTrue(utilities.isFunction(() => {
    }));

    assert.isFalse(utilities.isFunction(''));
    assert.isFalse(utilities.isFunction([]));
    assert.isFalse(utilities.isFunction({}));
    assert.isFalse(utilities.isFunction(0));
    assert.isFalse(utilities.isFunction(true));
  });
});

describe('utilities.isArray', () => {
  it('must return true if you pass an array and false otherwise', () => {
    assert.isTrue(utilities.isArray([]));
    assert.isFalse(utilities.isArray(''));
    assert.isFalse(utilities.isArray({}));
    assert.isFalse(utilities.isArray(12));
    assert.isFalse(utilities.isArray(utilities.noop));
    assert.isFalse(utilities.isArray(true));
  });
});

describe('utilities.isArrayLike', () => {
  it('must return false if you don\'t pass an array like object', () => {
    assert.isFalse(utilities.isArrayLike({}));
    assert.isFalse(utilities.isArrayLike(88));
    assert.isFalse(utilities.isArrayLike(utilities.noop));
    assert.isFalse(utilities.isArrayLike());
    assert.isFalse(utilities.isArrayLike(true));
  });

  it('must return true if you pass an string', () => {
    assert.isTrue(utilities.isArrayLike('foobar'));
  });

  it('must return true if you pass an array', () => {
    assert.isTrue(utilities.isArrayLike([]));
  });

  it('must return true if you pass an element node', () => {
    const testDiv = document.createElement('div');

    document.body.appendChild(testDiv);

    assert.isTrue(utilities.isArrayLike(document.getElementsByTagName('div')));

    // IMPORTANT do not forget to remove the added testDiv to keep tests deterministic
    dom.remove(testDiv);
  });

  it('must return true if you pass an arguments object', () => {
    let args;

    args = 'foo';

    /* jshint unused:false*/
    (function (...params) {
      args = params;
    })();
    assert.isTrue(utilities.isArrayLike(args));
  });
});

describe('utilities.isString', () => {
  it('must return true if you pass an string and false otherwise', () => {
    assert.isTrue(utilities.isString(''));
    assert.isTrue(utilities.isString('  '));
    assert.isTrue(utilities.isString('fooo'));
    assert.isFalse(utilities.isString());
    assert.isFalse(utilities.isString({}));
    assert.isFalse(utilities.isString([]));
    assert.isFalse(utilities.isString(0));
  });
});

describe('utilities.isEmptyString', () => {
  it('must return true if you pass an empty string', () => {
    assert.isTrue(utilities.isEmptyString(''));
  });

  it('must return false if you pass a non empty string', () => {
    assert.isFalse(utilities.isEmptyString('foo'));
  });

  it('must return false if you don\'t pass a valid string', () => {
    assert.isFalse(utilities.isEmptyString());
    assert.isFalse(utilities.isEmptyString({}));
    assert.isFalse(utilities.isEmptyString([]));
    assert.isFalse(utilities.isEmptyString(0));
  });
});

describe('utilities.isNotEmptyString', () => {
  it('must return false if you don\'t pass a valid string', () => {
    assert.isFalse(utilities.isNotEmptyString());
    assert.isFalse(utilities.isNotEmptyString({}));
    assert.isFalse(utilities.isNotEmptyString([]));
    assert.isFalse(utilities.isNotEmptyString(0));
  });

  it('must return false if you pass an empty string', () => {
    assert.isFalse(utilities.isNotEmptyString(''));
  });

  it('must return true if you pass a string that is not empty', () => {
    assert.isTrue(utilities.isNotEmptyString('foo'));
    assert.isTrue(utilities.isNotEmptyString('  '));
  });
});

describe('utilities.arrayLikeObjToArray', () => {
  it('must transform the passed arguments object into an array', () => {
    const test = function (...args) {
      return utilities.arrayLikeObjToArray(args);
    };

    assert.deepEqual(test('1', 2, ['foo'], {name: 'carlos'}, utilities.noop), ['1', 2, ['foo'], {name: 'carlos'}, utilities.noop]);
  });
});

describe('utilities.forEach', () => {
  it('should not break if obj is an array we override hasOwnProperty', () => {
    const obj = [];
    const log = [];

    obj[0] = 1;
    obj[1] = 2;
    obj.hasOwnProperty = null;
    utilities.forEach(obj, (value, key) => {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['0:1', '1:2']);
  });

  it('should handle string values like arrays', () => {
    const log = [];

    utilities.forEach('bar', (value, key) => {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['0:b', '1:a', '2:r']);
  });

  it('should handle objects with length property as objects', () => {
    const obj = {
      foo: 'bar',
      length: 2
    };
    const log = [];

    utilities.forEach(obj, (value, key) => {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['foo:bar', 'length:2']);
  });


  it('should handle objects of custom types with length property as objects', () => {
    const CustomType = function () {
      this.length = 2;
      this.foo = 'bar';
    };
    const obj = new CustomType();
    const log = [];

    utilities.forEach(obj, (value, key) => {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['length:2', 'foo:bar']);
  });


  it('should not invoke the iterator for indexed properties which are not present in the collection', () => {
    const log = [];
    const collection = [];

    collection[5] = 'SPARSE';
    utilities.forEach(collection, (item, index) => {
      log.push(item + index);
    });
    assert.equal(log.length, 1);
    assert.equal(log[0], 'SPARSE5');
  });


  describe('ES spec api compliance', () => {
    const testForEachSpec = function testForEachSpec (expectedSize, collection) {
      const that = {};
      let size;

      size = expectedSize;

      utilities.forEach(collection, function (value, key, collectionArg) {
        assert.deepEqual(collectionArg, collection);
        assert.deepEqual(collectionArg[key], value);

        assert.equal(this, that);

        size--;
      }, that);

      assert.equal(size, 0);
    };


    it('should follow the ES spec when called with array', () => {
      testForEachSpec(2, [1, 2]);
    });


    it('should follow the ES spec when called with arguments', () => {
      testForEachSpec(2, (function (...args) {
        return args;
      })(1, 2));
    });

    it('should follow the ES spec when called with string', () => {
      testForEachSpec(2, '12');
    });

    it('should follow the ES spec when called with JSON', () => {
      testForEachSpec(2, {
        aa: 1,
        bb: 2
      });
    });

    it('should follow the ES spec when called with function', () => {
      const func = function () {
      };

      func.aa = 1;
      func.bb = 2;
      testForEachSpec(2, func);
    });
  });
});

describe('utilities.snake_case', () => {
  it('should convert to utilities.snake_case', () => {
    assert.equal(utilities.snake_case('ABC'), 'a_b_c');
    assert.equal(utilities.snake_case('alanBobCharles'), 'alan_bob_charles');
  });


  it('should allow separator to be overridden', () => {
    assert.equal(utilities.snake_case('ABC', '&'), 'a&b&c');
    assert.equal(utilities.snake_case('facebookButton', '-'), 'facebook-button');
    assert.equal(utilities.snake_case('alanBobCharles', '&'), 'alan&bob&charles');
  });
});

describe('utilities.isValidEmail', () => {
  it('must return true if you pass a valid email', () => {
    assert.isTrue(utilities.isValidEmail('carlos@carlos.com'));
    assert.isTrue(utilities.isValidEmail('  carlos@carlos.com  '));
    assert.isTrue(utilities.isValidEmail('1ca123a#=.rlos@carlos.com'));
  });

  it('must return false if you pass an invalid email', () => {
    assert.isFalse(utilities.isValidEmail());
    assert.isFalse(utilities.isValidEmail('carlo s@carlos.com'));
    assert.isFalse(utilities.isValidEmail('carlos@carlos/com'));
    assert.isFalse(utilities.isValidEmail('carlos@"carlos".com'));
    assert.isFalse(utilities.isValidEmail('carlos@carloscom'));
    assert.isFalse(utilities.isValidEmail('carloscarlos.com'));
    assert.isFalse(utilities.isValidEmail('carlos@'));
    assert.isFalse(utilities.isValidEmail('carlos.com'));
  });
});

describe('utilities.extend', () => {
  it('must return undefined if you don\'t pass anything', () => {
    assert.isUndefined(utilities.extend());
  });

  it('must return the passed object if that is the only thing you pass', () => {
    const oo = {};

    assert.strictEqual(utilities.extend(oo), oo);
  });

  // Regression test
  it('must be able to distinguish null fields', () => {
    assert.deepEqual(utilities.extend({foo: null}, {foo: null}), {foo: null});
  });

  it('must utilities.extend the first object with the subsequent objects', () => {
    const carlos = {
      name: 'Carlos',
      surname: 'Serrano',
      phone: '123456'
    };

    const susan = {
      name: 'Susan'
    };

    assert.deepEqual(utilities.extend({}, carlos, susan), {
      name: 'Susan',
      surname: 'Serrano',
      phone: '123456'
    });
  });

  it('must be possible to utilities.extend inner obj properties', () => {
    const opts = {
      plugin: {
        playerState: {}
      }
    };

    const opts2 = {
      plugin: {
        volume: {}
      }
    };

    assert.deepEqual(utilities.extend({}, opts, opts2), {
      plugin: {
        playerState: {},
        volume: {}
      }
    });
  });

  it('must be possible to utilities.extend inner obj properties (without mutates the original)', () => {
    const opts = {
      plugin: {
        playerState: {
          value1: 1,
          value2: 2
        }
      }
    };

    const opts2 = {
      plugin: {
        playerState: {
          value3: 3
        }
      }
    };


    assert.deepEqual(utilities.extend({}, opts, opts2), {
      plugin: {
        playerState: {
          value1: 1,
          value2: 2,
          value3: 3
        }
      }
    });

    assert.deepEqual(opts, {
      plugin: {
        playerState: {
          value1: 1,
          value2: 2
        }
      }
    });

    assert.deepEqual(opts2, {
      plugin: {
        playerState: {
          value3: 3
        }
      }
    });
  });
});

describe('utilities.capitalize', () => {
  it('must utilities.capitalize the first letter of the passed string', () => {
    assert.equal(utilities.capitalize('foo'), 'Foo');
    assert.equal(utilities.capitalize('Foo'), 'Foo');
    assert.equal(utilities.capitalize('FOO'), 'FOO');
    assert.equal(utilities.capitalize(''), '');
  });
});

describe('utilities.decapitalize', () => {
  it('must set as lowercase the first letter of the passed string', () => {
    assert.equal(utilities.decapitalize('Foo'), 'foo');
    assert.equal(utilities.decapitalize('foo'), 'foo');
    assert.equal(utilities.decapitalize('FO0Bar'), 'fO0Bar');
    assert.equal(utilities.decapitalize(''), '');
  });
});

describe('transform', () => {
  let array;

  beforeEach(() => {
    array = [
      {
        name: 'ITEM1'
      },
      {
        name: 'ITEM2'
      }
    ];
  });

  it('must call the transform function with each item of the array and its index', () => {
    const spy = sinon.spy();

    utilities.transformArray(array, spy);

    assert.isTrue(spy.calledTwice);
    assert.isTrue(spy.firstCall.calledWithExactly(array[0], 0));
    assert.isTrue(spy.secondCall.calledWithExactly(array[1], 1));
  });

  it('must return a transformed array', () => {
    const newArray = utilities.transformArray(array, (item, index) => index);

    assert.deepEqual(newArray, [0, 1]);
  });

  it('must ignore undefined transformed items', () => {
    const newArray = utilities.transformArray(array, () => { });

    assert.deepEqual(newArray, []);
  });
});

describe('utilities.toFixedDigits', () => {
  it('must return a string that contains the numbers with the fixed number of digits', () => {
    assert.equal(utilities.toFixedDigits(3, 2), '03');
    assert.equal(utilities.toFixedDigits(11, 2), '11');
    assert.equal(utilities.toFixedDigits(111, 5), '00111');
  });

  it('must be possible to pass a string number', () => {
    assert.equal(utilities.toFixedDigits('3', 2), '03');
  });

  it('must return \'NaN\' if you don\'t pass a numnber as the first arg', () => {
    assert.equal(utilities.toFixedDigits('null', 5), 'NaN');
    assert.equal(utilities.toFixedDigits({}, 5), 'NaN');
    assert.equal(utilities.toFixedDigits(null, 5), 'NaN');
  });

  it('must return the number as string if the number itself has mor digits that the passed digits', () => {
    assert.equal(utilities.toFixedDigits(111, 2), '111');
    assert.equal(utilities.toFixedDigits(1234, 2), '1234');
    assert.equal(utilities.toFixedDigits(45454, 2), '45454');
  });
});

describe('utilities.throttle, utilities.debounce', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('must utilities.throttles a function', () => {
    let counter;
    const inc = utilities.throttle(() => {
      counter++;
    }, 50);

    counter = 0;
    inc();
    setTimeout(inc, 20);
    setTimeout(inc, 25);
    clock.tick(70);
    inc();
    assert.equal(counter, 2);
  });

  it('must utilities.debounce a function', () => {
    let counter;
    const inc = utilities.debounce(() => {
      counter++;
    }, 50);

    counter = 0;
    inc();
    setTimeout(inc, 20);
    setTimeout(inc, 25);

    clock.tick(100);
    assert.equal(counter, 1);
  });
});

describe('utilities.treeSearch', () => {
  const obj = {
    children: [
      {
        name: 'key1',
        children: [
          {name: 'key2'},
          {
            name: 'key3',
            children: [
              {name: 'key4'}
            ]
          }
        ]
      }
    ]
  };

  const getChildren = function (parent) {
    return 'children' in parent && parent.children;
  };

  const isName = function (name) {
    return function (object) {
      return object.name === name;
    };
  };

  it('must traverse a tree', () => {
    const key1 = utilities.treeSearch(obj, getChildren, isName('key1'));
    const keyx = utilities.treeSearch(obj, getChildren, isName('keyx'));
    const key4 = utilities.treeSearch(obj, getChildren, isName('key4'));

    assert.equal(key1.name, 'key1');
    assert.isUndefined(keyx);
    assert.equal(key4.name, 'key4');
  });
});

describe('utilities.echoFn', () => {
  it('must return a function', () => {
    assert.isFunction(utilities.echoFn());
  });


  describe('returned curryfn ', () => {
    it('must return the passed value', () => {
      assert.equal(utilities.echoFn(1)(), 1);
      assert.equal(utilities.echoFn('1')(), '1');
      assert.equal(utilities.echoFn()());
      assert.equal(utilities.echoFn(null)(), null);
    });
  });
});

describe('utilities.isISO8601', () => {
  it('must return false for YYYY date format (year)', () => {
    assert.isTrue(utilities.isISO8601('1983'));
  });

  it('must return true for YYYY-MM date formats (year and month)', () => {
    assert.isTrue(utilities.isISO8601('1983-12'));
  });

  it('must return true for YYYY-MM-DD and YYYYMMDD and YYYYMMD date formats (complete date)', () => {
    assert.isTrue(utilities.isISO8601('1983-12-01'));
    assert.isTrue(utilities.isISO8601('19831201'));
    assert.isTrue(utilities.isISO8601('1983121'));
  });

  it('must return true for YYYY-MM-DDThh:mmTZD date formats (complete date plus hours and minutes)', () => {
    assert.isTrue(utilities.isISO8601('2009-05-19 00:00'));
    assert.isTrue(utilities.isISO8601('2009-05-19 14'));
    assert.isTrue(utilities.isISO8601('2009-05-19 14:31'));
    assert.isTrue(utilities.isISO8601('2009-05-19T14:39Z'));
  });

  it('must return true for YYYY-MM-DDThh:mm:ssTZD date formats (complete date plus hours, minutes and seconds)', () => {
    assert.isTrue(utilities.isISO8601('2010-02-18T16:23:48,444'));
    assert.isTrue(utilities.isISO8601('2010-02-18T16:23:48,3-06:00'));
  });

  it('must return true for YYYY-MM-DDThh:mm:ss.sTZD date formats (Complete date plus hours, minutes, seconds and a decimal fraction of a second)', () => {
    assert.isTrue(utilities.isISO8601('2010-02-18T16:23:48.5'));
    assert.isTrue(utilities.isISO8601('2009-05-19 143922.500'));
  });

  it('should not match the following corner cases', () => {
    assert.isFalse(utilities.isISO8601('200905'));
    assert.isFalse(utilities.isISO8601('2009367'));
    assert.isFalse(utilities.isISO8601('2009-'));
    assert.isFalse(utilities.isISO8601('2007-04-05T24:50'));
    assert.isFalse(utilities.isISO8601('2009-000'));
    assert.isFalse(utilities.isISO8601('2009-M511'));
    assert.isFalse(utilities.isISO8601('2009M511'));
    assert.isFalse(utilities.isISO8601('2009-05-19T14a39r'));
    assert.isFalse(utilities.isISO8601('2009-05-19T14:3924'));
    assert.isFalse(utilities.isISO8601('2009-0519'));
    assert.isFalse(utilities.isISO8601('2009-05-1914:39'));
    assert.isFalse(utilities.isISO8601('2009-05-19 14:'));
    assert.isFalse(utilities.isISO8601('2009-05-19r14:39'));
    assert.isFalse(utilities.isISO8601('2009-05-19 14a39a22'));
    assert.isFalse(utilities.isISO8601('200912-01'));
    assert.isFalse(utilities.isISO8601('2009-05-19 14:39:22+06a00'));
    assert.isFalse(utilities.isISO8601('2009-05-19 146922.500'));
    assert.isFalse(utilities.isISO8601('2010-02-18T16.5:23.35:48'));
    assert.isFalse(utilities.isISO8601('2010-02-18T16:23.35:48'));
    assert.isFalse(utilities.isISO8601('2010-02-18T16:23.35:48.45'));
    assert.isFalse(utilities.isISO8601('2009-05-19 14.5.44'));
    assert.isFalse(utilities.isISO8601('2010-02-18T16:23.33.600'));
    assert.isFalse(utilities.isISO8601('2010-02-18T16,25:23:48,444'));
  });
});

/* jshint maxlen: 500 */
describe('utilities.getInternetExplorerVersion', () => {
  const navigators = {
    nonIe: {
      appName: 'Netscape',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36'
    },
    ie8: {
      appName: 'Microsoft Internet Explorer',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)'

    },
    ie9: {
      appName: 'Microsoft Internet Explorer',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 4.0; InfoPath.3; MS-RTC LM 8; .NET4.0C; .NET4.0E)'
    },
    ie10: {
      appName: 'Microsoft Internet Explorer',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/5.0)'
    },
    ie106: {
      appName: 'Microsoft Internet Explorer',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.6; Windows NT 6.1; Trident/5.0; InfoPath.2; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727) 3gpp-gba UNTRUSTED/1.0'
    },
    ie11: {
      appName: 'Microsoft Internet Explorer',
      userAgent: 'Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
    }
  };

  it('must return -1 for nonIe browsers', () => {
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.nonIe), -1);
  });

  it('must return the appropiate IE versions', () => {
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.ie8), 8);
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.ie9), 9);
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.ie10), 10);
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.ie106), 10.6);
    assert.strictEqual(utilities.getInternetExplorerVersion(navigators.ie11), 11);
  });
});

describe('utilities.isOldIE', () => {
  it('must return true if the browser is IE and older than 10', () => {
    sinon.stub(utilities, 'getInternetExplorerVersion');

    utilities.getInternetExplorerVersion.returns(-1);
    assert.isFalse(utilities.isOldIE());
    utilities.getInternetExplorerVersion.returns(7);
    assert.isTrue(utilities.isOldIE());
    utilities.getInternetExplorerVersion.returns(8);
    assert.isTrue(utilities.isOldIE());
    utilities.getInternetExplorerVersion.returns(9);
    assert.isTrue(utilities.isOldIE());
    utilities.getInternetExplorerVersion.returns(10.6);
    assert.isFalse(utilities.isOldIE());
    utilities.getInternetExplorerVersion.returns(11);
    assert.isFalse(utilities.isOldIE());

    utilities.getInternetExplorerVersion.restore();
  });
});

describe('utilities.isIDevice', () => {
  let oldUA;

  beforeEach(() => {
    oldUA = utilities.UA;
  });

  afterEach(() => {
    utilities.UA = oldUA;
  });


  it('must return true if the userAgent contains iPhone', () => {
    utilities.UA = 'browser iPhone';
    assert.isTrue(utilities.isIDevice());
  });

  it('must return true it the userAgent contains iPad', () => {
    utilities.UA = 'browser iPad';
    assert.isTrue(utilities.isIDevice());
  });

  it('must return false it the userAgent does not contains iPad or iPhone', () => {
    utilities.UA = 'browser android';
    assert.isFalse(utilities.isIDevice());
  });
});

describe('utilities.isMobile', () => {
  let oldUA;

  beforeEach(() => {
    oldUA = utilities.UA;
  });

  afterEach(() => {
    utilities.UA = oldUA;
  });

  it('must return true if the userAgent contains iPhone or iPad or iPod or android or windows phone', () => {
    utilities.UA = 'browser iPhone';
    assert.isTrue(utilities.isMobile());
    utilities.UA = 'browser iPad';
    assert.isTrue(utilities.isMobile());
    utilities.UA = 'browser iPod';
    assert.isTrue(utilities.isMobile());
    utilities.UA = 'Android';
    assert.isTrue(utilities.isMobile());
    utilities.UA = 'Windows Phone';
    assert.isTrue(utilities.isMobile());
  });

  it('must return false it the userAgent is not from mobile', () => {
    utilities.UA = 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
    assert.isFalse(utilities.isMobile());
  });
});

describe('utilities.isIPhone', () => {
  it('must return true if the userAgent contains iPhone or iPod and false otherwise', () => {
    const oldUA = utilities.UA;

    utilities.UA = 'browser iPhone';
    assert.isTrue(utilities.isIPhone());
    utilities.UA = 'browser iPad';
    assert.isFalse(utilities.isIPhone());
    utilities.UA = 'browser iPod';
    assert.isTrue(utilities.isIPhone());
    utilities.UA = 'Android';
    assert.isFalse(utilities.isIPhone());
    utilities.UA = 'Windows Phone';
    assert.isFalse(utilities.isIPhone());
    utilities.UA = 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
    assert.isFalse(utilities.isIPhone());

    utilities.UA = oldUA;
  });
});

describe('utilities.isAndroid', () => {
  it('must return true if the userAgent contains iPhone or iPod and false otherwise', () => {
    const oldUA = utilities.UA;

    utilities.UA = 'browser iPhone';
    assert.isFalse(utilities.isAndroid());
    utilities.UA = 'browser iPad';
    assert.isFalse(utilities.isAndroid());
    utilities.UA = 'browser iPod';
    assert.isFalse(utilities.isAndroid());
    utilities.UA = 'Android';
    assert.isTrue(utilities.isAndroid());
    utilities.UA = 'Windows Phone';
    assert.isFalse(utilities.isAndroid());
    utilities.UA = 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
    assert.isFalse(utilities.isAndroid());

    utilities.UA = oldUA;
  });
});
