"use strict";

function HttpRequestError(message) {
  this.message = 'HttpRequest Error: ' + (message || '');
}
HttpRequestError.prototype = new Error();
HttpRequestError.prototype.name = "HttpRequest Error";

function HttpRequest(createXhr) {
  if (!isFunction(createXhr)) {
    throw new HttpRequestError('Missing XMLHttpRequest factory method');
  }

  this.createXhr = createXhr;
}

HttpRequest.prototype.run = function (method, url, callback, options) {
  sanityCheck(url, callback, options);
  var timeout, timeoutId;
  var xhr = this.createXhr();
  options = options || {};
  timeout = isNumber(options.timeout)? options.timeout : 0;

  xhr.open(method, urlParts(url).href, true);

  if (options.headers) {
    setHeaders(xhr, options.headers);
  }

  if (options.withCredentials) {
    xhr.withCredentials = true;
  }

  xhr.onload = function () {
    var statusText, response, status;

    if(isDefined(timeoutId)){
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    statusText = xhr.statusText || '';

    // responseText is the old-school way of retrieving response (supported by IE8 & 9)
    // response/responseType properties were introduced in XHR Level2 spec (supported by IE10)
    response = ('response' in xhr) ? xhr.response : xhr.responseText;

    // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
    status = xhr.status === 1223 ? 204 : xhr.status;

    callback(
      status,
      response,
      xhr.getAllResponseHeaders(),
      statusText);
  };

  xhr.onerror = requestError;
  xhr.onabort = requestError;

  xhr.send();

  if(timeout > 0){
    timeoutId = setTimeout(function () {
      xhr && xhr.abort();
    }, timeout);
  }

  function sanityCheck(url, callback, options) {
    if (!isString(url) || isEmptyString(url)) {
      throw new HttpRequestError("Invalid url '" + url + "'");
    }

    if (!isFunction(callback)) {
      throw new HttpRequestError("Invalid handler '" + callback + "' for the http request");
    }

    if (isDefined(options) && !isObject(options)) {
      throw new HttpRequestError("Invalid options map '" + options + "'");
    }
  }

  function setHeaders(xhr, headers) {
    forEach(headers, function (value, key) {
      if (isDefined(value)) {
        xhr.setRequestHeader(key, value);
      }
    });
  }

  function requestError() {
    callback(-1, null, null, '');
  }
};

HttpRequest.prototype.get = function (url, callback, options) {
  this.run('GET', url, processResponse, options);

  function processResponse(status, response, headersString, statusText) {
    if (isSuccess(status)) {
      callback(null, response, status, headersString, statusText);
    } else {
      callback(new HttpRequestError(statusText), response, status, headersString, statusText);
    }
  }

  function isSuccess(status) {
    return 200 <= status && status < 300;
  }
};

HttpRequest.getJSONP = function getJSONP (url, cb, timeout, callback_name){
  var has_callback_called = false;
  timeout = timeout || 3000;
  callback_name = callback_name || ("_cb_" + Math.floor((Math.random()*100000)).toString()); // for jsonp

  setTimeout(function (){
    if (has_callback_called){ // function has timed out
      return;
    }
    cb("JSONP request timed up (or returned an error)");
    delete window[callback_name]; //cleaning up
  }, timeout);

  // I create the callback
  window[callback_name] = function (data){
    has_callback_called = true;
    cb(null, data);
    delete window[callback_name]; //cleaning up
  };

  var s = document.createElement('script');
  s.src = url + "?cb=" + callback_name;
  document.head.appendChild(s);
};

function createXhr() {
  return new window.XMLHttpRequest();
}

var http = new HttpRequest(createXhr);
