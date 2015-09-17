describe("noop", function () {
  it("must return undefined", function () {
    assert.isUndefined(noop());
    assert.isUndefined(noop('fooo'));
    assert.isUndefined(noop({}));
  });
});

describe("isNull", function(){
  it("must return true if the passed arg is null and false otherwise", function(){
    assert.isTrue(isNull(null));
    assert.isFalse(isNull(''));
    assert.isFalse(isNull(1));
    assert.isFalse(isNull(true));
    assert.isFalse(isNull({}));
    assert.isFalse(isNull(noop));
    assert.isFalse(isNull([]));
  });
});

describe("isDefined", function () {
  it("must return false if you pass undefined", function () {
    assert.isFalse(isDefined());
    assert.isFalse(isDefined(undefined));
  });

  it("must return true if you pass a defined argument", function () {
    assert.isTrue(isDefined(''));
    assert.isTrue(isDefined(1));
    assert.isTrue(isDefined(true));
    assert.isTrue(isDefined({}));
    assert.isTrue(isDefined(noop));
    assert.isTrue(isDefined([]));
  });
});

describe("isUndefined", function () {
  it("must return true if you pass undefined", function () {
    assert.isTrue(isUndefined());
    assert.isTrue(isUndefined(undefined));
  });

  it("must return true if you pass a defined argument", function () {
    assert.isFalse(isUndefined(''));
    assert.isFalse(isUndefined(1));
    assert.isFalse(isUndefined(true));
    assert.isFalse(isUndefined({}));
    assert.isFalse(isUndefined(noop));
    assert.isFalse(isUndefined([]));
  });
});

describe("isObject", function () {
  it("must return true if you pass and object and false otherwise", function () {
    assert.isTrue(isObject({}));
    assert.isTrue(isObject([]));
    assert.isTrue(isObject(window));

    assert.isFalse(isObject(''));
    assert.isFalse(isObject(0));
    assert.isFalse(isObject(true));
    assert.isFalse(isObject(noop));
    assert.isFalse(isObject());
  });
});

describe("isNumber", function () {
  it("must return true if you pass a number and false otherwise", function () {
    assert.isTrue(isNumber(12));
    assert.isFalse(isNumber('12'));
    assert.isFalse(isNumber([]));
    assert.isFalse(isNumber({}));
    assert.isFalse(isNumber(noop));
    assert.isFalse(isNumber(true));
  });
});

describe("isWindow", function () {
  it("must return true if you pass the window obj and false otherwise", function () {
    assert.isTrue(isWindow(window));
    assert.isFalse(isWindow({}));
    assert.isFalse(isWindow([]));
    assert.isFalse(isWindow(noop));
    assert.isFalse(isWindow(''));
    assert.isFalse(isWindow(123));
    assert.isFalse(isWindow(true));
  });
});

describe("isFunction", function () {
  it("must return true if the passed value is a function and false otherwise", function () {
    assert.isTrue(isFunction(noop));
    assert.isTrue(isFunction(function () {
    }));

    assert.isFalse(isFunction(''));
    assert.isFalse(isFunction([]));
    assert.isFalse(isFunction({}));
    assert.isFalse(isFunction(0));
    assert.isFalse(isFunction(true));
  });
});

describe("isArray", function () {
  it("must return true if you pass an array and false otherwise", function () {
    assert.isTrue(isArray([]));
    assert.isFalse(isArray(''));
    assert.isFalse(isArray({}));
    assert.isFalse(isArray(12));
    assert.isFalse(isArray(noop));
    assert.isFalse(isArray(true));
  });
});

describe("isArrayLike", function () {

  it("must return false if you don't pass an array like object", function () {
    assert.isFalse(isArrayLike({}));
    assert.isFalse(isArrayLike(88));
    assert.isFalse(isArrayLike(noop));
    assert.isFalse(isArrayLike());
    assert.isFalse(isArrayLike(true));
  });

  it("must return true if you pass an string", function () {
    assert.isTrue(isArrayLike('foobar'));
  });

  it("must return true if you pass an array", function () {
    assert.isTrue(isArrayLike([]));
  });

  it("must return true if you pass an element node", function () {
    var testDiv = document.createElement("div");
    document.body.appendChild(testDiv);

    assert.isTrue(isArrayLike(document.getElementsByTagName("div")));

    //IMPORTANT do not forget to remove the added testDiv to keep tests deterministic
    dom.remove(testDiv);
  });

  it("must return true if you pass an arguments object", function () {
    var args = 'foo';
    (function (a, b) {
      args = arguments;
    })();
    assert.isTrue(isArrayLike(args));
  });
});

describe("isString", function () {
  it("must return true if you pass an string and false otherwise", function () {
    assert.isTrue(isString(''));
    assert.isTrue(isString('  '));
    assert.isTrue(isString('fooo'));
    assert.isFalse(isString());
    assert.isFalse(isString({}));
    assert.isFalse(isString([]));
    assert.isFalse(isString(0));
  });
});

describe("isEmptyString", function(){
  it("must return true if you pass an empty string", function(){
    assert.isTrue(isEmptyString(''));
  });

  it("must return false if you pass a non empty string", function(){
    assert.isFalse(isEmptyString("foo"));
  });

  it("must return false if you don't pass a valid string", function () {
    assert.isFalse(isEmptyString());
    assert.isFalse(isEmptyString({}));
    assert.isFalse(isEmptyString([]));
    assert.isFalse(isEmptyString(0));
  });

});

describe("isNotEmptyString", function () {
  it("must return false if you don't pass a valid string", function () {
    assert.isFalse(isNotEmptyString());
    assert.isFalse(isNotEmptyString({}));
    assert.isFalse(isNotEmptyString([]));
    assert.isFalse(isNotEmptyString(0));
  });

  it("must return false if you pass an empty string", function () {
    assert.isFalse(isNotEmptyString(''));
  });

  it("must return true if you pass a string that is not empty", function () {
    assert.isTrue(isNotEmptyString('foo'));
    assert.isTrue(isNotEmptyString('  '));
  });
});

describe("arrayLikeObjToArray", function(){
  it("must transform the passed arguments object into an array", function(){
    function test() {
      return arrayLikeObjToArray(arguments);
    }

    assert.deepEqual(test('1', 2, ['foo'], {name: "carlos"}, noop), ['1', 2, ['foo'], {name: "carlos"}, noop]);
  });
});

describe('forEach', function () {
  it('should iterate over *own* object properties', function () {
    function MyObj() {
      this.bar = 'barVal';
      this.baz = 'bazVal';
    }

    MyObj.prototype.foo = 'fooVal';

    var obj = new MyObj(),
      log = [];

    forEach(obj, function (value, key) {
      log.push(key + ':' + value);
    });

    assert.deepEqual(log, ['bar:barVal', 'baz:bazVal']);
  });


  it('should not break if obj is an array we override hasOwnProperty', function () {
    /* jshint -W001 */
    var obj = [];
    obj[0] = 1;
    obj[1] = 2;
    obj.hasOwnProperty = null;
    var log = [];
    forEach(obj, function (value, key) {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['0:1', '1:2']);
  });

  it('should handle string values like arrays', function () {
    var log = [];

    forEach('bar', function (value, key) {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['0:b', '1:a', '2:r']);
  });

  it('should handle objects with length property as objects', function () {
    var obj = {
        'foo': 'bar',
        'length': 2
      },
      log = [];

    forEach(obj, function (value, key) {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['foo:bar', 'length:2']);
  });


  it('should handle objects of custom types with length property as objects', function () {
    function CustomType() {
      this.length = 2;
      this.foo = 'bar';
    }

    var obj = new CustomType(),
      log = [];

    forEach(obj, function (value, key) {
      log.push(key + ':' + value);
    });
    assert.deepEqual(log, ['length:2', 'foo:bar']);
  });


  it('should not invoke the iterator for indexed properties which are not present in the collection', function () {
    var log = [];
    var collection = [];
    collection[5] = 'SPARSE';
    forEach(collection, function (item, index) {
      log.push(item + index);
    });
    assert.equal(log.length, 1);
    assert.equal(log[0], 'SPARSE5');
  });


  describe('ES spec api compliance', function () {

    function testForEachSpec(expectedSize, collection) {
      var that = {};

      forEach(collection, function (value, key, collectionArg) {
        assert.deepEqual(collectionArg, collection);
        assert.deepEqual(collectionArg[key], value);

        assert.equal(this, that);

        expectedSize--;
      }, that);

      assert.equal(expectedSize, 0);
    }


    it('should follow the ES spec when called with array', function () {
      testForEachSpec(2, [1, 2]);
    });


    it('should follow the ES spec when called with arguments', function () {
      testForEachSpec(2, (function () {
        return arguments;
      }(1, 2)));
    });

    it('should follow the ES spec when called with string', function () {
      testForEachSpec(2, '12');
    });

    it('should follow the ES spec when called with JSON', function () {
      testForEachSpec(2, {a: 1, b: 2});
    });


    it('should follow the ES spec when called with function', function () {
      function f() {
      }

      f.a = 1;
      f.b = 2;
      testForEachSpec(2, f);
    });
  });
});

describe('snake_case', function () {
  it('should convert to snake_case', function () {
    assert.equal(snake_case('ABC'), 'a_b_c');
    assert.equal(snake_case('alanBobCharles'), 'alan_bob_charles');
  });


  it('should allow separator to be overridden', function () {
    assert.equal(snake_case('ABC', '&'), 'a&b&c');
    assert.equal(snake_case('facebookButton', '-'), 'facebook-button');
    assert.equal(snake_case('alanBobCharles', '&'), 'alan&bob&charles');
  });
});

describe("isValidEmail", function () {
  it("must return true if you pass a valid email", function () {
    assert.isTrue(isValidEmail('carlos@carlos.com'));
    assert.isTrue(isValidEmail('  carlos@carlos.com  '));
    assert.isTrue(isValidEmail('1ca123a#=.rlos@carlos.com'));
  });

  it("must return false if you pass an invalid email", function () {
    assert.isFalse(isValidEmail());
    assert.isFalse(isValidEmail('carlo s@carlos.com'));
    assert.isFalse(isValidEmail('carlos@carlos/com'));
    assert.isFalse(isValidEmail('carlos@"carlos".com'));
    assert.isFalse(isValidEmail('carlos@carloscom'));
    assert.isFalse(isValidEmail('carloscarlos.com'));
    assert.isFalse(isValidEmail('carlos@'));
    assert.isFalse(isValidEmail('carlos.com'));
  });
});

describe("extend", function () {
  it("must return undefined if you don't pass anything", function () {
    assert.isUndefined(extend());
  });

  it("must return the passed object if that is the only thing you pass", function () {
    var o = {};
    assert.strictEqual(extend(o), o);
  });

  //Regression test
  it("must be able to distinguish null fields", function(){
    assert.deepEqual(extend({foo: null}, {foo: null}), {foo: null});
  });

  it("must extend the first object with the subsequent objects", function () {
    var carlos = {
      name: 'Carlos',
      surname: "Serrano",
      phone: '123456'
    };

    var susan = {
      name: 'Susan'
    };

    assert.deepEqual(extend({}, carlos, susan), {
      name: 'Susan',
      surname: "Serrano",
      phone: '123456'
    });
  });

  it("must be possible to extend inner obj properties", function(){
    var opts = {
      plugin: {
        playerState: {}
      }
    };

    var opts2 = {
      plugin: {
        volume: {}
      }
    };

    assert.deepEqual(extend({}, opts, opts2), {
      plugin: {
        playerState: {},
        volume: {}
      }
    });
  });

  it("must be possible to extend inner obj properties (without mutates the original)", function(){
    var opts = {
      plugin: {
        playerState: {
          value1 : 1,
          value2 : 2
        }
      }
    };

    var opts2 = {
      plugin: {
        playerState: {
          value3 : 3
        }
      }
    };


    assert.deepEqual(extend({}, opts, opts2), {
      plugin: {
        playerState: {
          value1 : 1,
          value2 : 2,
          value3 : 3
        }
      }
    });

    assert.deepEqual(opts, {
      plugin: {
        playerState: {
          value1 : 1,
          value2 : 2
        }
      }
    });

    assert.deepEqual(opts2, {
      plugin: {
        playerState: {
          value3 : 3
        }
      }
    });

  });


});

describe("capitalize", function(){
  it("must capitalize the first letter of the passed string", function(){
    assert.equal(capitalize("foo"), "Foo");
    assert.equal(capitalize("Foo"), "Foo");
    assert.equal(capitalize("FOO"), "FOO");
    assert.equal(capitalize(""), "");
  });
});

describe("decapitalize", function(){
  it("must set as lowercase the first letter of the passed string", function(){
    assert.equal(decapitalize("Foo"), "foo");
    assert.equal(decapitalize("foo"), "foo");
    assert.equal(decapitalize("FO0Bar"), "fO0Bar");
    assert.equal(decapitalize(""), "");
  });
});

describe("transform", function(){
  var array;

  beforeEach(function(){
    array = [
      {
        name: 'ITEM1'
      },
      {
        name: 'ITEM2'
      }
    ];
  });
  
  it("must call the transform function with each item of the array and its index", function(){
    var spy = sinon.spy();

    transformArray(array, spy);

    assert.isTrue(spy.calledTwice);
    assert.isTrue(spy.firstCall.calledWithExactly(array[0], 0));
    assert.isTrue(spy.secondCall.calledWithExactly(array[1], 1));
  });

  it("must return a transformed array", function(){
    var newArray = transformArray(array, function(item, index){
      return index;
    });

    assert.deepEqual(newArray, [0, 1]);
  });

  it("must ignore undefined transformed items", function(){
    var newArray = transformArray(array, function(item, index){
      return undefined;
    });

    assert.deepEqual(newArray, []);
  });
});

describe("toFixedDigits", function(){
  it("must return a string that contains the numbers with the fixed number of digits", function(){
    assert.equal(toFixedDigits(3, 2), '03');
    assert.equal(toFixedDigits(11, 2), '11');
    assert.equal(toFixedDigits(111,5), '00111');
  });

  it("must be possible to pass a string number", function(){
    assert.equal(toFixedDigits('3', 2), '03');

  });

  it("must return 'NaN' if you don't pass a numnber as the first arg", function(){
    assert.equal(toFixedDigits('null',5), 'NaN');
    assert.equal(toFixedDigits({},5), 'NaN');
    assert.equal(toFixedDigits(null,5), 'NaN');
  });

  it("must return the number as string if the number itself has mor digits that the passed digits", function(){
    assert.equal(toFixedDigits(111, 2), '111');
    assert.equal(toFixedDigits(1234, 2), '1234');
    assert.equal(toFixedDigits(45454, 2), '45454');
  });
});

describe("throttle, debounce", function(){
  var clock;
  beforeEach(function (){
    clock = sinon.useFakeTimers();
  });

  afterEach(function (){
    clock.restore();
  });

  it("must throttles a function", function(){
    var counter = 0;
    var inc = throttle(function (){counter++;}, 50);
    inc();
    setTimeout(inc, 20);
    setTimeout(inc, 25);
    clock.tick(70);
    inc();
    assert.equal(counter, 2);
  });

  it("must debounce a function", function(){
    var counter = 0;
    var inc = debounce(function (){counter++;}, 50);
    inc();
    setTimeout(inc, 20);
    setTimeout(inc, 25);

    clock.tick(100);
    assert.equal(counter, 1);

  });

});

describe("treeSearch", function(){

  var obj = {
    children: [
      {
        name: "key1",
        children: [
          {name: "key2"},
          {
            name: "key3",
            children: [
              {name: "key4"}
            ]
          }
        ]
      }
    ]
  };

  var getChildren = function (obj){
    return ("children" in obj) && obj.children;
  };

  var isName = function (name){
    return function (obj){
      return obj.name == name;
    };
  };

  it("must traverse a tree", function(){
    var key1 = treeSearch(obj, getChildren, isName('key1'));
    assert.equal(key1.name, "key1");
    var keyx = treeSearch(obj, getChildren, isName('keyx'));
    assert.isUndefined(keyx);
    var key4 = treeSearch(obj, getChildren, isName('key4'));
    assert.equal(key4.name, "key4");
  });

});

describe("echoFn", function(){
  it("must return a function", function(){
    assert.isFunction(echoFn());
  });


  describe("returned curryfn ", function(){
    it("must return the passed value", function(){
      assert.equal(echoFn(1)(), 1);
      assert.equal(echoFn('1')(), '1');
      assert.equal(echoFn()(), undefined);
      assert.equal(echoFn(null)(), null);
    });
  });
});

describe("isISO8601", function(){
  it("must return false for YYYY date format (year)", function(){
    assert.isTrue(isISO8601("1983"));
  });

  it("must return true for YYYY-MM date formats (year and month)", function(){
    assert.isTrue(isISO8601("1983-12"));
  });

  it("must return true for YYYY-MM-DD and YYYYMMDD and YYYYMMD date formats (complete date)", function(){
    assert.isTrue(isISO8601("1983-12-01"));
    assert.isTrue(isISO8601("19831201"));
    assert.isTrue(isISO8601("1983121"));
  });

  it("must return true for YYYY-MM-DDThh:mmTZD date formats (complete date plus hours and minutes)", function(){
    assert.isTrue(isISO8601("2009-05-19 00:00"));
    assert.isTrue(isISO8601("2009-05-19 14"));
    assert.isTrue(isISO8601("2009-05-19 14:31"));
    assert.isTrue(isISO8601("2009-05-19T14:39Z"));
  });

  it("must return true for YYYY-MM-DDThh:mm:ssTZD date formats (complete date plus hours, minutes and seconds)", function(){
    assert.isTrue(isISO8601("2010-02-18T16:23:48,444"));
    assert.isTrue(isISO8601("2010-02-18T16:23:48,3-06:00"));
  });

  it("must return true for YYYY-MM-DDThh:mm:ss.sTZD date formats (Complete date plus hours, minutes, seconds and a decimal fraction of a second)", function(){
    assert.isTrue(isISO8601("2010-02-18T16:23:48.5"));
    assert.isTrue(isISO8601("2009-05-19 143922.500"));
  });

  it("should not match the following corner cases", function(){
    assert.isFalse(isISO8601("200905"));
    assert.isFalse(isISO8601("2009367"));
    assert.isFalse(isISO8601("2009-"));
    assert.isFalse(isISO8601("2007-04-05T24:50"));
    assert.isFalse(isISO8601("2009-000"));
    assert.isFalse(isISO8601("2009-M511"));
    assert.isFalse(isISO8601("2009M511"));
    assert.isFalse(isISO8601("2009-05-19T14a39r"));
    assert.isFalse(isISO8601("2009-05-19T14:3924"));
    assert.isFalse(isISO8601("2009-0519"));
    assert.isFalse(isISO8601("2009-05-1914:39"));
    assert.isFalse(isISO8601("2009-05-19 14:"));
    assert.isFalse(isISO8601("2009-05-19r14:39"));
    assert.isFalse(isISO8601("2009-05-19 14a39a22"));
    assert.isFalse(isISO8601("200912-01"));
    assert.isFalse(isISO8601("2009-05-19 14:39:22+06a00"));
    assert.isFalse(isISO8601("2009-05-19 146922.500"));
    assert.isFalse(isISO8601("2010-02-18T16.5:23.35:48"));
    assert.isFalse(isISO8601("2010-02-18T16:23.35:48"));
    assert.isFalse(isISO8601("2010-02-18T16:23.35:48.45"));
    assert.isFalse(isISO8601("2009-05-19 14.5.44"));
    assert.isFalse(isISO8601("2010-02-18T16:23.33.600"));
    assert.isFalse(isISO8601("2010-02-18T16,25:23:48,444"));
  });
});

/*jshint maxlen: 500 */
describe("getInternetExplorerVersion", function(){
  var navigators = {
    nonIe: {
      appName: 'Netscape',
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36"
    },
    ie8: {
      appName: 'Microsoft Internet Explorer',
      userAgent: "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)"

    },
    ie9: {
      appName: 'Microsoft Internet Explorer',
      userAgent: "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 4.0; InfoPath.3; MS-RTC LM 8; .NET4.0C; .NET4.0E)"
    },
    ie10: {
      appName: 'Microsoft Internet Explorer',
      userAgent: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/5.0)"
    },
    ie106: {
      appName: 'Microsoft Internet Explorer',
      userAgent: "Mozilla/5.0 (compatible; MSIE 10.6; Windows NT 6.1; Trident/5.0; InfoPath.2; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727) 3gpp-gba UNTRUSTED/1.0"
    },
    ie11: {
      appName: 'Microsoft Internet Explorer',
      userAgent: "Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"
    }
  };

  it("must return -1 for nonIe browsers", function(){
    assert.strictEqual(getInternetExplorerVersion(navigators.nonIe), -1);
  });

  it("must return the appropiate IE versions", function(){
    assert.strictEqual(getInternetExplorerVersion(navigators.ie8), 8);
    assert.strictEqual(getInternetExplorerVersion(navigators.ie9), 9);
    assert.strictEqual(getInternetExplorerVersion(navigators.ie10), 10);
    assert.strictEqual(getInternetExplorerVersion(navigators.ie106), 10.6);
    assert.strictEqual(getInternetExplorerVersion(navigators.ie11), 11);
  });
});

describe("isOldIE", function(){
  it("must return true if the browser is IE and older thatn 10", function(){
    sinon.stub(window, 'getInternetExplorerVersion');
    window.getInternetExplorerVersion.returns(-1);
    assert.isFalse(isOldIE());
    window.getInternetExplorerVersion.returns(7);
    assert.isTrue(isOldIE());
    window.getInternetExplorerVersion.returns(8);
    assert.isTrue(isOldIE());
    window.getInternetExplorerVersion.returns(9);
    assert.isTrue(isOldIE());
    window.getInternetExplorerVersion.returns(10.6);
    assert.isFalse(isOldIE());
    window.getInternetExplorerVersion.returns(11);
    assert.isFalse(isOldIE());
    window.getInternetExplorerVersion.restore();
  });
});

describe("isIDevice", function(){
  var old_UA;

  beforeEach(function(){
    old_UA = _UA;
  });

  afterEach(function(){
    _UA = old_UA;
  });


  it("must return true if the userAgent contains iPhone", function(){
    _UA = "browser iPhone";
    assert.isTrue(isIDevice());
  });

  it("must return true it the userAgent contains iPad", function(){
    _UA = "browser iPad";
    assert.isTrue(isIDevice());
  });

  it("must return false it the userAgent does not contains iPad or iPhone", function(){
    _UA = "browser android";
    assert.isFalse(isIDevice());
  });
});

describe("isMobile", function(){
  var old_UA;

  beforeEach(function(){
    old_UA = window._UA;
  });

  afterEach(function(){
    window._UA = old_UA;
  });

  it("must return true if the userAgent contains iPhone or iPad or iPod or android or windows phone", function(){
    window._UA = "browser iPhone";
    assert.isTrue(isMobile());
    window._UA = "browser iPad";
    assert.isTrue(isMobile());
    window._UA = "browser iPod";
    assert.isTrue(isMobile());
    window._UA = "Android";
    assert.isTrue(isMobile());
    window._UA = "Windows Phone";
    assert.isTrue(isMobile());
  });

  it("must return false it the userAgent is not from mobile", function(){
    window._UA = "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)";
    assert.isFalse(isMobile());
  });
});

describe("isIPhone", function(){
  var old_UA;

  beforeEach(function(){
    old_UA = window._UA;
  });

  afterEach(function(){
    window._UA = old_UA;
  });

  it("must return true if the userAgent contains iPhone or iPod and false otherwise", function(){
    window._UA = "browser iPhone";
    assert.isTrue(isIPhone());
    window._UA = "browser iPad";
    assert.isFalse(isIPhone());
    window._UA = "browser iPod";
    assert.isTrue(isIPhone());
    window._UA = "Android";
    assert.isFalse(isIPhone());
    window._UA = "Windows Phone";
    assert.isFalse(isIPhone());
    window._UA = "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)";
    assert.isFalse(isIPhone());
  });
});

describe("isAndroid", function(){
  var old_UA;

  beforeEach(function(){
    old_UA = window._UA;
  });

  afterEach(function(){
    window._UA = old_UA;
  });

  it("must return true if the userAgent contains iPhone or iPod and false otherwise", function(){
    window._UA = "browser iPhone";
    assert.isFalse(isAndroid());
    window._UA = "browser iPad";
    assert.isFalse(isAndroid());
    window._UA = "browser iPod";
    assert.isFalse(isAndroid());
    window._UA = "Android";
    assert.isTrue(isAndroid());
    window._UA = "Windows Phone";
    assert.isFalse(isAndroid());
    window._UA = "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)";
    assert.isFalse(isAndroid());
  });
});
