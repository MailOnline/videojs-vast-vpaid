var HttpRequest = require('utils/http').HttpRequest;
var HttpRequestError = require('utils/http').HttpRequestError;
var utilities = require('utils/utilityFunctions');

var testUtils = require('../test-utils');

describe("HttpRequest", function () {
  it("must throw an exception if you don't pass a xhrFactory function", function () {
    assert.throws(function () {
      /*jshint unused:false*/
      var http = new HttpRequest();
    }, HttpRequestError, 'HttpRequest Error: Missing XMLHttpRequest factory method');
  });

  it("must publish the xhrFactory in this.createXhr", function () {
    var http = new HttpRequest(utilities.noop);
    assert.strictEqual(http.createXhr, utilities.noop);
  });

  describe("instance", function () {
    var $http, xhr;

    beforeEach(function () {
      xhr = {
        open: sinon.spy(),
        send: sinon.spy(),
        setRequestHeader: sinon.spy(),
        abort: function() {
          this.onabort();
        }
      };
      $http = new HttpRequest(function () {
        return xhr;
      });
    });

    describe("run", function () {
      it("must throw an exception if you don't pass a valid url", function () {
        assert.throws(function () {
          $http.run('GET');
        }, HttpRequestError, "HttpRequest Error: Invalid url 'undefined'");

        assert.throws(function () {
          $http.run('GET', {});
        }, HttpRequestError, "HttpRequest Error: Invalid url '[object Object]");

        assert.throws(function () {
          $http.run('GET', '');
        }, HttpRequestError, "HttpRequest Error: Invalid url ''");
      });

      it("must throw an exception if you don't pass a handler function to the request", function () {
        assert.throws(function () {
          $http.run('GET', 'http://localhost');
        }, HttpRequestError, "HttpRequest Error: Invalid handler 'undefined' for the http request");

        assert.throws(function () {
          $http.run('GET', 'http://localhost', {});
        }, HttpRequestError, "HttpRequest Error: Invalid handler '[object Object]' for the http request");
      });

      it("must not throw any error if you pass a valid url and a valid handler function", function () {
        assert.doesNotThrow(function () {
          $http.run('GET', 'localhost', utilities.noop);
        }, HttpRequestError);
      });

      it("must throw an exception if you pass a wrong an invalid type for the options", function () {
        assert.throws(function () {
          $http.run('GET', 'localhost', utilities.noop, '');
        }, HttpRequestError, "HttpRequest Error: Invalid options map ''");
      });

      it("must open an async xhr get request using the passed url", function () {
        $http.run('GET', 'http://localhost', utilities.noop);
        assert.isTrue(xhr.open.calledOnce);
        assert.isTrue(xhr.open.calledWith('GET', 'http://localhost/', true));
      });

      it("must normalize the url before opening the connection", function () {
        $http.run('GET', '/fake_request', utilities.noop);
        assert.match(xhr.open.lastCall.args[1], /^https?:\/\/[^/]+\/fake_request$/);

        $http.run('GET', 'fake_request', utilities.noop);
        assert.match(xhr.open.lastCall.args[1], /^https?:\/\/[^/]+\/fake_request$/);
      });

      it("must be possible to set the headers of the request", function () {
        $http.run('GET', '/fake_request', utilities.noop, {
          headers: {
            header1: 'val1',
            header2: 'val2'
          }
        });

        assert.isTrue(xhr.setRequestHeader.calledTwice);
        var firstCall = xhr.setRequestHeader.firstCall;
        var secondCall = xhr.setRequestHeader.secondCall;

        assert.deepEqual(firstCall.args, ['header1', 'val1']);
        assert.deepEqual(secondCall.args, ['header2', 'val2']);
      });

      it("must be possible to mark the request 'withCredentials'", function () {
        $http.run('GET', '/fake_request', utilities.noop, {withCredentials: true});
        assert.isTrue(xhr.withCredentials);
      });

      it("must send the request", function () {
        $http.run('GET', '/fake_request', utilities.noop);
        assert.isTrue(xhr.send.calledOnce);
      });

      describe("with timeout", function(){
        beforeEach(function(){
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function(){
          this.clock.restore();
        });

        it("must call the error callback if the timeout exceed the set time in ms", function(){
          var callback = sinon.spy();
          $http.run('GET', '/fake_request', callback, {timeout: 100});
          this.clock.tick(101);
          assert.isTrue(callback.calledOnce);
          assert.equal(callback.lastCall.args[0], -1);//status
          assert.equal(callback.lastCall.args[1], null);//response
          assert.equal(callback.lastCall.args[2], null);//header string
          assert.equal(callback.lastCall.args[3], '');//Status Text
        });

        it("must not call the error callback if the request gets resolved before the timeout", function(){
          var callback = sinon.spy();
          var fakeResponse = {};
          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = "200 OK";
          assert.isFalse(callback.calledOnce);

          $http.run('GET', '/fake_request', callback, {timeout: 100});
          xhr.onload(); //We simulate the success by calling onLoad
          this.clock.tick(101);
          assert.isTrue(callback.calledOnce);
          assert.isTrue(callback.lastCall.calledWithExactly(
            200,
            fakeResponse,
            'ResponseHeaders',
            '200 OK'
          ));
        });
      });


      describe("onSuccess", function () {
        var callback, fakeResponse;
        beforeEach(function () {
          fakeResponse = {};
          callback = sinon.spy();
          $http.run('GET', '/fake_request', callback);
          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = "200 OK";

          xhr.onload(); //We simulate the success by calling onLoad
        });

        it("must call the callback", function () {
          assert.isTrue(callback.calledOnce);
        });

        it("must pass the status, the response, the responseHeaders and the statusText to the callback", function () {
          var lastCbCall = callback.lastCall;
          assert.isTrue(lastCbCall.calledWithExactly(
            200,
            fakeResponse,
            'ResponseHeaders',
            '200 OK'
          ));
        });
      });

      ['onerror', 'onabort'].forEach(function (onFail) {
        describe(onFail, function () {
          var callback, fakeResponse;
          beforeEach(function () {
            fakeResponse = {};
            callback = sinon.spy();
            $http.run('GET', '/fake_request', callback);
            xhr.response = fakeResponse;
            xhr.status = 200;
            xhr.getAllResponseHeaders = function () {
              return 'ResponseHeaders';
            };
            xhr.statusText = "200 OK";

            xhr[onFail](); //We simulate the fail by calling the fail method i.e. onError/onAbort
          });

          it("must call the callback", function () {
            assert.isTrue(callback.calledOnce);
          });

          it("must pass -1 as the status", function () {
            assert.equal(callback.lastCall.args[0], -1);
          });

          it("must pass null as response", function () {
            assert.equal(callback.lastCall.args[1], null);
          });

          it("must pass null as the response headers", function () {
            assert.equal(callback.lastCall.args[2], null);
          });

          it("must pass an empty string as the responseText", function () {
            assert.equal(callback.lastCall.args[3], '');
          });
        });
      });
    });

    describe("get", function () {
      it("must do a GET request", function () {
        var run = sinon.spy($http, 'run');
        var options = {};

        $http.get('http://localhost', utilities.noop, options);
        assert.isTrue(run.calledOnce);
        assert.isTrue(run.lastCall.calledWithExactly(
          'GET',
          'http://localhost',
          sinon.match.func,
          options
        ));
      });

      describe("onSuccess", function () {
        var callback, fakeResponse;

        beforeEach(function () {
          fakeResponse = {};
          callback = sinon.spy();
          $http.get('http://localhost', callback);
          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = "200 OK";

          xhr.onload(); //We simulate the success by calling onLoad

        });

        it("must pass null to the callback", function () {
          assert.isTrue(callback.calledOnce);
          sinon.assert.calledWith(callback, null);
        });

        it("must call the success callback with the data that comes from the server, the status, the headersString and the statusText", function () {
          assert.isTrue(callback.calledWithExactly(
            null,
            fakeResponse,
            200,
            'ResponseHeaders',
            '200 OK'
          ));
        });
      });

      describe("onError", function () {
        var callback, fakeResponse;

        beforeEach(function () {
          fakeResponse = {};
          callback = sinon.spy();
          $http.get('http://localhost', callback);
          xhr.response = fakeResponse;
          xhr.status = 404;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = "404 not found";

          xhr.onload(); //We simulate the error by calling onLoad
        });

        it("must pass the error as the first argument of the callback", function () {
          assert.isTrue(callback.calledOnce);
          assert.instanceOf(testUtils.firstArg(callback), HttpRequestError);
          assert.equal(testUtils.firstArg(callback).message, 'HttpRequest Error: 404 not found');
        });

        it("must pass the error and the data that comes from the server, the status, the headersString and the statusText", function () {
          var httpError = testUtils.firstArg(callback);
          assert.isTrue(callback.calledWithExactly(
            httpError,
            fakeResponse,
            404,
            'ResponseHeaders',
            "404 not found"
          ));
        });
      });

      describe("options", function () {
        it("must be used on the actual request", function () {
          $http.get('http://localhost', utilities.noop, {withCredentials: true});
          assert.isTrue(xhr.withCredentials);
        });

        it("must work event if the optional error callback is passed", function () {
          $http.get('http://localhost', utilities.noop, {withCredentials: true});
          assert.isTrue(xhr.withCredentials);
        });
      });
    });
  });
});