const HttpRequest = require('../../src/scripts/utils/http').HttpRequest;
const HttpRequestError = require('../../src/scripts/utils/http').HttpRequestError;
const utilities = require('../../src/scripts/utils/utilityFunctions');
const testUtils = require('../test-utils');

describe('HttpRequest', () => {
  it('must throw an exception if you don\'t pass a xhrFactory function', () => {
    assert.throws(() => {
      // eslint-disable-next-line
      new HttpRequest();
    }, HttpRequestError, 'HttpRequest Error: Missing XMLHttpRequest factory method');
  });

  it('must publish the xhrFactory in this.createXhr', () => {
    const http = new HttpRequest(utilities.noop);

    assert.strictEqual(http.createXhr, utilities.noop);
  });

  describe('instance', () => {
    let httpRequest, xhr;

    beforeEach(() => {
      xhr = {
        open: sinon.spy(),
        send: sinon.spy(),
        setRequestHeader: sinon.spy(),
        // eslint-disable-next-line
        abort: function () {
          return this.onabort();
        }
      };
      httpRequest = new HttpRequest(() => xhr);
    });

    describe('run', () => {
      it('must throw an exception if you don\'t pass a valid url', () => {
        assert.throws(() => {
          httpRequest.run('GET');
        }, HttpRequestError, 'HttpRequest Error: Invalid url \'undefined\'');

        assert.throws(() => {
          httpRequest.run('GET', {});
        }, HttpRequestError, 'HttpRequest Error: Invalid url \'[object Object]');

        assert.throws(() => {
          httpRequest.run('GET', '');
        }, HttpRequestError, 'HttpRequest Error: Invalid url \'\'');
      });

      it('must throw an exception if you don\'t pass a handler function to the request', () => {
        assert.throws(() => {
          httpRequest.run('GET', 'http://localhost');
        }, HttpRequestError, 'HttpRequest Error: Invalid handler \'undefined\' for the http request');

        assert.throws(() => {
          httpRequest.run('GET', 'http://localhost', {});
        }, HttpRequestError, 'HttpRequest Error: Invalid handler \'[object Object]\' for the http request');
      });

      it('must not throw any error if you pass a valid url and a valid handler function', () => {
        assert.doesNotThrow(() => {
          httpRequest.run('GET', 'localhost', utilities.noop);
        }, HttpRequestError);
      });

      it('must throw an exception if you pass a wrong an invalid type for the options', () => {
        assert.throws(() => {
          httpRequest.run('GET', 'localhost', utilities.noop, '');
        }, HttpRequestError, 'HttpRequest Error: Invalid options map \'\'');
      });

      it('must open an async xhr get request using the passed url', () => {
        httpRequest.run('GET', 'http://localhost', utilities.noop);
        assert.isTrue(xhr.open.calledOnce);
        assert.isTrue(xhr.open.calledWith('GET', 'http://localhost/', true));
      });

      it('must normalize the url before opening the connection', () => {
        httpRequest.run('GET', '/fake_request', utilities.noop);
        assert.match(xhr.open.lastCall.args[1], /^https?:\/\/[^/]+\/fake_request$/);

        httpRequest.run('GET', 'fake_request', utilities.noop);
        assert.match(xhr.open.lastCall.args[1], /^https?:\/\/[^/]+\/fake_request$/);
      });

      it('must be possible to set the headers of the request', () => {
        httpRequest.run('GET', '/fake_request', utilities.noop, {
          headers: {
            header1: 'val1',
            header2: 'val2'
          }
        });

        assert.isTrue(xhr.setRequestHeader.calledTwice);
        const firstCall = xhr.setRequestHeader.firstCall;
        const secondCall = xhr.setRequestHeader.secondCall;

        assert.deepEqual(firstCall.args, ['header1', 'val1']);
        assert.deepEqual(secondCall.args, ['header2', 'val2']);
      });

      it('must be possible to mark the request \'withCredentials\'', () => {
        httpRequest.run('GET', '/fake_request', utilities.noop, {withCredentials: true});
        assert.isTrue(xhr.withCredentials);
      });

      it('must send the request', () => {
        httpRequest.run('GET', '/fake_request', utilities.noop);
        assert.isTrue(xhr.send.calledOnce);
      });

      describe('with timeout', () => {
        beforeEach(function () {
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function () {
          this.clock.restore();
        });

        it('must call the error callback if the timeout exceed the set time in ms', function () {
          const callback = sinon.spy();

          httpRequest.run('GET', '/fake_request', callback, {timeout: 100});
          this.clock.tick(101);
          assert.isTrue(callback.calledOnce);

          // status
          assert.equal(callback.lastCall.args[0], -1);

          // response
          assert.equal(callback.lastCall.args[1], null);

          // header string
          assert.equal(callback.lastCall.args[2], null);

          // Status Text
          assert.equal(callback.lastCall.args[3], '');
        });

        it('must not call the error callback if the request gets resolved before the timeout', function () {
          const callback = sinon.spy();
          const fakeResponse = {};

          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = '200 OK';
          assert.isFalse(callback.calledOnce);

          httpRequest.run('GET', '/fake_request', callback, {timeout: 100});
          xhr.onload();
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


      describe('onSuccess', () => {
        let callback, fakeResponse;

        beforeEach(() => {
          fakeResponse = {};
          callback = sinon.spy();
          httpRequest.run('GET', '/fake_request', callback);
          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = '200 OK';

          xhr.onload();
        });

        it('must call the callback', () => {
          assert.isTrue(callback.calledOnce);
        });

        it('must pass the status, the response, the responseHeaders and the statusText to the callback', () => {
          const lastCbCall = callback.lastCall;

          assert.isTrue(lastCbCall.calledWithExactly(
            200,
            fakeResponse,
            'ResponseHeaders',
            '200 OK'
          ));
        });
      });

      ['onerror', 'onabort'].forEach((onFail) => {
        describe(onFail, () => {
          let callback, fakeResponse;

          beforeEach(() => {
            fakeResponse = {};
            callback = sinon.spy();
            httpRequest.run('GET', '/fake_request', callback);
            xhr.response = fakeResponse;
            xhr.status = 200;
            xhr.getAllResponseHeaders = function () {
              return 'ResponseHeaders';
            };
            xhr.statusText = '200 OK';

            xhr[onFail]();
          });

          it('must call the callback', () => {
            assert.isTrue(callback.calledOnce);
          });

          it('must pass -1 as the status', () => {
            assert.equal(callback.lastCall.args[0], -1);
          });

          it('must pass null as response', () => {
            assert.equal(callback.lastCall.args[1], null);
          });

          it('must pass null as the response headers', () => {
            assert.equal(callback.lastCall.args[2], null);
          });

          it('must pass an empty string as the responseText', () => {
            assert.equal(callback.lastCall.args[3], '');
          });
        });
      });
    });

    describe('get', () => {
      it('must do a GET request', () => {
        const run = sinon.spy(httpRequest, 'run');
        const options = {};

        httpRequest.get('http://localhost', utilities.noop, options);
        assert.isTrue(run.calledOnce);
        assert.isTrue(run.lastCall.calledWithExactly(
          'GET',
          'http://localhost',
          sinon.match.func,
          options
        ));
      });

      describe('onSuccess', () => {
        let callback, fakeResponse;

        beforeEach(() => {
          fakeResponse = {};
          callback = sinon.spy();
          httpRequest.get('http://localhost', callback);
          xhr.response = fakeResponse;
          xhr.status = 200;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = '200 OK';

          xhr.onload();
        });

        it('must pass null to the callback', () => {
          assert.isTrue(callback.calledOnce);
          sinon.assert.calledWith(callback, null);
        });

        it('must call the success callback with the data that comes from the server, the status, the headersString and the statusText', () => {
          assert.isTrue(callback.calledWithExactly(
            null,
            fakeResponse,
            200,
            'ResponseHeaders',
            '200 OK'
          ));
        });
      });

      describe('onError', () => {
        let callback, fakeResponse;

        beforeEach(() => {
          fakeResponse = {};
          callback = sinon.spy();
          httpRequest.get('http://localhost', callback);
          xhr.response = fakeResponse;
          xhr.status = 404;
          xhr.getAllResponseHeaders = function () {
            return 'ResponseHeaders';
          };
          xhr.statusText = '404 not found';

          xhr.onload();
        });

        it('must pass the error as the first argument of the callback', () => {
          assert.isTrue(callback.calledOnce);
          assert.instanceOf(testUtils.firstArg(callback), HttpRequestError);
          assert.equal(testUtils.firstArg(callback).message, 'HttpRequest Error: 404 not found');
        });

        it('must pass the error and the data that comes from the server, the status, the headersString and the statusText', () => {
          const httpError = testUtils.firstArg(callback);

          assert.isTrue(callback.calledWithExactly(
            httpError,
            fakeResponse,
            404,
            'ResponseHeaders',
            '404 not found'
          ));
        });
      });

      describe('options', () => {
        it('must be used on the actual request', () => {
          httpRequest.get('http://localhost', utilities.noop, {withCredentials: true});
          assert.isTrue(xhr.withCredentials);
        });

        it('must work event if the optional error callback is passed', () => {
          httpRequest.get('http://localhost', utilities.noop, {withCredentials: true});
          assert.isTrue(xhr.withCredentials);
        });
      });
    });
  });
});
