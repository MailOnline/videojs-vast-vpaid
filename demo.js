(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

"use strict";
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var NODE_TYPE_ELEMENT = 1;

function extend(obj) {
  var arg = void 0,
      i = void 0,
      k = void 0;

  for (i = 1; i < arguments.length; i++) {
    arg = arguments[i];
    for (k in arg) {
      if (arg.hasOwnProperty(k)) {
        if (isObject(obj[k]) && !isNull(obj[k]) && isObject(arg[k])) {
          obj[k] = extend({}, obj[k], arg[k]);
        } else {
          obj[k] = arg[k];
        }
      }
    }
  }

  return obj;
}

function isString(str) {
  return typeof str === 'string';
}

function isNotEmptyString(str) {
  return isString(str) && str.length !== 0;
}

function isNull(o) {
  return o === null;
}

function isObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
}

function isFunction(str) {
  return typeof str === 'function';
}

function forEach(obj, iterator, context) {
  var key = void 0,
      length = void 0;

  if (obj) {
    if (isFunction(obj)) {
      for (key in obj) {
        // Need to check if hasOwnProperty exists,
        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
        if (key !== 'prototype' && key !== 'length' && key !== 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (isArray(obj)) {
      var isPrimitive = (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object';

      for (key = 0, length = obj.length; key < length; key++) {
        if (isPrimitive || key in obj) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context, obj);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    }
  }

  return obj;
}

function isArray(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
}

function isWindow(obj) {
  return isObject(obj) && obj.window === obj;
}

function isUndefined(o) {
  return o === undefined;
}

function isArrayLike(obj) {
  if (obj === null || isWindow(obj) || isFunction(obj) || isUndefined(obj)) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === NODE_TYPE_ELEMENT && length) {
    return true;
  }

  return isString(obj) || isArray(obj) || length === 0 || typeof length === 'number' && length > 0 && length - 1 in obj;
}

function arrayLikeObjToArray(args) {
  return Array.prototype.slice.call(args);
}

module.exports = {
  extend: extend,
  isString: isString,
  isFunction: isFunction,
  isArray: isArray,
  isArrayLike: isArrayLike,
  arrayLikeObjToArray: arrayLikeObjToArray,
  forEach: forEach,
  isNotEmptyString: isNotEmptyString,
  isNull: isNull,
  isObject: isObject
};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

var timeoutId = void 0;
var dom = __webpack_require__(2);
var _ = __webpack_require__(0);

var MESSAGE_DURATION = 3500;
var MSG_TYPE = {
  SUCCESS: 'msg-success',
  ERROR: 'msg-error'
};
var messageContainer = document.createElement('div');

timeoutId = null;

dom.onReady(function () {
  document.body.appendChild(messageContainer);
});

dom.addClass(messageContainer, 'messages');

function showMessage(type, msg) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  dom.addClass(messageContainer, MSG_TYPE[type]);
  messageContainer.innerHTML = msg;

  timeoutId = setTimeout(resetMessageContainer, MESSAGE_DURATION);
}

function resetMessageContainer() {
  _.forEach(MSG_TYPE, function (className) {
    dom.removeClass(messageContainer, className);
  });
  messageContainer.innerHTML = '';
  timeoutId = null;
}

function showSuccessMessage(msg) {
  showMessage('SUCCESS', msg);
}

function showErrorMessage(msg) {
  showMessage('ERROR', msg);
}

module.exports = {
  success: showSuccessMessage,
  error: showErrorMessage
};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

var _ = __webpack_require__(0);

var dom = {};

dom.addClass = function (el, cssClass) {
  var classes = void 0;

  if (_.isNotEmptyString(cssClass)) {
    if (el.classList) {
      return el.classList.add(cssClass);
    }

    classes = _.isString(el.getAttribute('class')) ? el.getAttribute('class').split(/\s+/) : [];
    if (_.isString(cssClass) && _.isNotEmptyString(cssClass.replace(/\s+/, ''))) {
      classes.push(cssClass);
      el.setAttribute('class', classes.join(' '));
    }
  }
};

dom.removeClass = function (el, cssClass) {
  var classes = void 0;

  if (_.isNotEmptyString(cssClass)) {
    if (el.classList) {
      return el.classList.remove(cssClass);
    }

    classes = _.isString(el.getAttribute('class')) ? el.getAttribute('class').split(/\s+/) : [];
    var newClasses = [];
    var i = void 0,
        len = void 0;

    if (_.isString(cssClass) && _.isNotEmptyString(cssClass.replace(/\s+/, ''))) {
      for (i = 0, len = classes.length; i < len; i += 1) {
        if (cssClass !== classes[i]) {
          newClasses.push(classes[i]);
        }
      }
      el.setAttribute('class', newClasses.join(' '));
    }
  }
};

dom.addEventListener = function addEventListener(el, type, handler) {
  if (_.isArray(el)) {
    _.forEach(el, function (e) {
      dom.addEventListener(e, type, handler);
    });

    return;
  }

  if (_.isArray(type)) {
    _.forEach(type, function (t) {
      dom.addEventListener(el, t, handler);
    });

    return;
  }

  if (el.addEventListener) {
    el.addEventListener(type, handler, false);
  } else if (el.attachEvent) {
    // WARNING!!! this is a very naive implementation !
    // the event object that should be passed to the handler
    // would not be there for IE8
    // we should use "window.event" and then "event.srcElement"
    // instead of "event.target"
    el.attachEvent('on' + type, handler);
  }
};

dom.removeEventListener = function removeEventListener(el, type, handler) {
  if (_.isArray(el)) {
    _.forEach(el, function (e) {
      dom.removeEventListener(e, type, handler);
    });

    return;
  }

  if (_.isArray(type)) {
    _.forEach(type, function (t) {
      dom.removeEventListener(el, t, handler);
    });

    return;
  }

  if (el.removeEventListener) {
    el.removeEventListener(type, handler, false);
  } else if (el.detachEvent) {
    el.detachEvent('on' + type, handler);
  } else {
    el['on' + type] = null;
  }
};

dom.onReady = function () {
  var readyHandlers = [];
  var readyFired = false;

  // if document already ready to go, schedule the ready function to run
  // IE only safe when readyState is "complete", others safe when readyState is "interactive"
  if (document.readyState === 'complete' || !document.attachEvent && document.readyState === 'interactive') {
    setTimeout(ready, 0);
  } else if (document.addEventListener) {
    // first choice is DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', ready, false);

    // backup is window load event
    window.addEventListener('load', ready, false);
  } else {
    // must be IE
    document.attachEvent('onreadystatechange', readyStateChange);
    window.attachEvent('onload', ready);
  }

  return function documentOnReady(handler, context) {
    context = context || window;

    if (_.isFunction(handler)) {
      if (readyFired) {
        setTimeout(function () {
          handler.bind(context);
        }, 0);
      } else {
        readyHandlers.push(handler.bind(context));
      }
    }
  };

  /** * Local functions ****/
  function ready() {
    if (!readyFired) {
      readyFired = true;
      _.forEach(readyHandlers, function (handler) {
        handler();
      });
      readyHandlers = [];
    }
  }

  function readyStateChange() {
    if (document.readyState === 'complete') {
      ready();
    }
  }
}();

dom.prependChild = function prependChild(parent, child) {
  if (child.parentNode) {
    child.parentNode.removeChild(child);
  }

  return parent.insertBefore(child, parent.firstChild);
};

dom.remove = function removeNode(node) {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
};

module.exports = dom;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

var _ = __webpack_require__(0);
var messages = __webpack_require__(1);

module.exports = function molVastSetup(opts) {
  var pluginSettings = void 0;
  var player = this;
  var options = _.extend({}, this.options_, opts);

  pluginSettings = {
    playAdAlways: true,
    adCancelTimeout: options.adCancelTimeout || 3000,
    adsEnabled: Boolean(options.adsEnabled),
    vpaidFlashLoaderPath: '/VPAIDFlash.swf'
  };

  if (options.adTag) {
    pluginSettings.adTag = options.adTag;
  }

  if (options.adTagXML) {
    pluginSettings.adTagXML = options.adTagXML;
  }

  var vastAd = player.vastClient(pluginSettings);

  player.on('reset', function () {
    if (player.options().plugins['ads-setup'].adsEnabled) {
      vastAd.enable();
    } else {
      vastAd.disable();
    }
  });

  player.on('vast.aderror', function (evt) {
    var error = evt.error;

    if (error && error.message) {
      messages.error(error.message);
    }
  });
};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(5);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(7)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!./../../node_modules/css-loader/index.js?{\"modules\":false,\"importLoaders\":1,\"minimize\":false}!./../../node_modules/autoprefixer-loader/index.js?{\"browsers\":[\"> 1%\",\"last 3 versions\",\"iOS > 6\",\"ie > 9\"],\"cascade\":false}!./../../node_modules/resolve-url-loader/index.js!./../../node_modules/sass-loader/index.js!./demo.scss", function() {
			var newContent = require("!!./../../node_modules/css-loader/index.js?{\"modules\":false,\"importLoaders\":1,\"minimize\":false}!./../../node_modules/autoprefixer-loader/index.js?{\"browsers\":[\"> 1%\",\"last 3 versions\",\"iOS > 6\",\"ie > 9\"],\"cascade\":false}!./../../node_modules/resolve-url-loader/index.js!./../../node_modules/sass-loader/index.js!./demo.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(6)();
// imports


// module
exports.push([module.i, "@charset \"UTF-8\";\n\ndiv.messages {\n  display: block;\n  opacity: 0;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  margin-top: 10px;\n  margin-right: auto;\n  margin-left: auto;\n  padding: 10px 15px;\n  width: 200px;\n  text-align: center;\n  border-radius: 10px;\n  -webkit-transition: opacity 0.5s ease-in-out;\n  transition: opacity 0.5s ease-in-out;\n}\n\ndiv.messages.msg-success,\ndiv.messages.msg-error {\n  opacity: 1;\n}\n\ndiv.messages.msg-success {\n  color: #3c763d;\n  background-color: #dff0d8;\n  border-color: #d6e9c6;\n}\n\ndiv.messages.msg-error {\n  color: #a94442;\n  background-color: #f2dede;\n  border-color: #ebccd1;\n}\n\n/*! normalize.css v3.0.2 | MIT License | git.io/normalize */\n\n/**\n * 1. Set default font family to sans-serif.\n * 2. Prevent iOS text size adjust after orientation change, without disabling\n *    user zoom.\n */\n\nhtml {\n  font-family: sans-serif;\n  /* 1 */\n  -ms-text-size-adjust: 100%;\n  /* 2 */\n  -webkit-text-size-adjust: 100%;\n  /* 2 */\n}\n\n/**\n * Remove default margin.\n */\n\nbody {\n  margin: 0;\n}\n\n/* HTML5 display definitions\n   ========================================================================== */\n\n/**\n * Correct `block` display not defined for any HTML5 element in IE 8/9.\n * Correct `block` display not defined for `details` or `summary` in IE 10/11\n * and Firefox.\n * Correct `block` display not defined for `main` in IE 11.\n */\n\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary {\n  display: block;\n}\n\n/**\n * 1. Correct `inline-block` display not defined in IE 8/9.\n * 2. Normalize vertical alignment of `progress` in Chrome, Firefox, and Opera.\n */\n\naudio,\ncanvas,\nprogress,\nvideo {\n  display: inline-block;\n  /* 1 */\n  vertical-align: baseline;\n  /* 2 */\n}\n\n/**\n * Prevent modern browsers from displaying `audio` without controls.\n * Remove excess height in iOS 5 devices.\n */\n\naudio:not([controls]) {\n  display: none;\n  height: 0;\n}\n\n/**\n * Address `[hidden]` styling not present in IE 8/9/10.\n * Hide the `template` element in IE 8/9/11, Safari, and Firefox < 22.\n */\n\n[hidden],\ntemplate {\n  display: none;\n}\n\n/* Links\n   ========================================================================== */\n\n/**\n * Remove the gray background color from active links in IE 10.\n */\n\na {\n  background-color: transparent;\n}\n\n/**\n * Improve readability when focused and also mouse hovered in all browsers.\n */\n\na:active,\na:hover {\n  outline: 0;\n}\n\n/* Text-level semantics\n   ========================================================================== */\n\n/**\n * Address styling not present in IE 8/9/10/11, Safari, and Chrome.\n */\n\nabbr[title] {\n  border-bottom: 1px dotted;\n}\n\n/**\n * Address style set to `bolder` in Firefox 4+, Safari, and Chrome.\n */\n\nb,\nstrong {\n  font-weight: bold;\n}\n\n/**\n * Address styling not present in Safari and Chrome.\n */\n\ndfn {\n  font-style: italic;\n}\n\n/**\n * Address variable `h1` font-size and margin within `section` and `article`\n * contexts in Firefox 4+, Safari, and Chrome.\n */\n\nh1 {\n  font-size: 2em;\n  margin: 0.67em 0;\n}\n\n/**\n * Address styling not present in IE 8/9.\n */\n\nmark {\n  background: #ff0;\n  color: #000;\n}\n\n/**\n * Address inconsistent and variable font size in all browsers.\n */\n\nsmall {\n  font-size: 80%;\n}\n\n/**\n * Prevent `sub` and `sup` affecting `line-height` in all browsers.\n */\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsup {\n  top: -0.5em;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\n/* Embedded content\n   ========================================================================== */\n\n/**\n * Remove border when inside `a` element in IE 8/9/10.\n */\n\nimg {\n  border: 0;\n}\n\n/**\n * Correct overflow not hidden in IE 9/10/11.\n */\n\nsvg:not(:root) {\n  overflow: hidden;\n}\n\n/* Grouping content\n   ========================================================================== */\n\n/**\n * Address margin not present in IE 8/9 and Safari.\n */\n\nfigure {\n  margin: 1em 40px;\n}\n\n/**\n * Address differences between Firefox and other browsers.\n */\n\nhr {\n  box-sizing: content-box;\n  height: 0;\n}\n\n/**\n * Contain overflow in all browsers.\n */\n\npre {\n  overflow: auto;\n}\n\n/**\n * Address odd `em`-unit font size rendering in all browsers.\n */\n\ncode,\nkbd,\npre,\nsamp {\n  font-family: monospace, monospace;\n  font-size: 1em;\n}\n\n/* Forms\n   ========================================================================== */\n\n/**\n * Known limitation: by default, Chrome and Safari on OS X allow very limited\n * styling of `select`, unless a `border` property is set.\n */\n\n/**\n * 1. Correct color not being inherited.\n *    Known issue: affects color of disabled elements.\n * 2. Correct font properties not being inherited.\n * 3. Address margins set differently in Firefox 4+, Safari, and Chrome.\n */\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  color: inherit;\n  /* 1 */\n  font: inherit;\n  /* 2 */\n  margin: 0;\n  /* 3 */\n}\n\n/**\n * Address `overflow` set to `hidden` in IE 8/9/10/11.\n */\n\nbutton {\n  overflow: visible;\n}\n\n/**\n * Address inconsistent `text-transform` inheritance for `button` and `select`.\n * All other form control elements do not inherit `text-transform` values.\n * Correct `button` style inheritance in Firefox, IE 8/9/10/11, and Opera.\n * Correct `select` style inheritance in Firefox.\n */\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/**\n * 1. Avoid the WebKit bug in Android 4.0.* where (2) destroys native `audio`\n *    and `video` controls.\n * 2. Correct inability to style clickable `input` types in iOS.\n * 3. Improve usability and consistency of cursor style between image-type\n *    `input` and others.\n */\n\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"] {\n  -webkit-appearance: button;\n  /* 2 */\n  cursor: pointer;\n  /* 3 */\n}\n\n/**\n * Re-set default cursor for disabled elements.\n */\n\nbutton[disabled],\nhtml input[disabled] {\n  cursor: default;\n}\n\n/**\n * Remove inner padding and border in Firefox 4+.\n */\n\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner {\n  border: 0;\n  padding: 0;\n}\n\n/**\n * Address Firefox 4+ setting `line-height` on `input` using `!important` in\n * the UA stylesheet.\n */\n\ninput {\n  line-height: normal;\n}\n\n/**\n * It's recommended that you don't attempt to style these elements.\n * Firefox's implementation doesn't respect box-sizing, padding, or width.\n *\n * 1. Address box sizing set to `content-box` in IE 8/9/10.\n * 2. Remove excess padding in IE 8/9/10.\n */\n\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  box-sizing: border-box;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n\n/**\n * Fix the cursor style for Chrome's increment/decrement buttons. For certain\n * `font-size` values of the `input`, it causes the cursor style of the\n * decrement button to change from `default` to `text`.\n */\n\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/**\n * 1. Address `appearance` set to `searchfield` in Safari and Chrome.\n * 2. Address `box-sizing` set to `border-box` in Safari and Chrome\n *    (include `-moz` to future-proof).\n */\n\ninput[type=\"search\"] {\n  -webkit-appearance: textfield;\n  /* 1 */\n  /* 2 */\n  box-sizing: content-box;\n}\n\n/**\n * Remove inner padding and search cancel button in Safari and Chrome on OS X.\n * Safari (but not Chrome) clips the cancel button when the search input has\n * padding (and `textfield` appearance).\n */\n\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/**\n * Define consistent border, margin, and padding.\n */\n\nfieldset {\n  border: 1px solid #c0c0c0;\n  margin: 0 2px;\n  padding: 0.35em 0.625em 0.75em;\n}\n\n/**\n * 1. Correct `color` not being inherited in IE 8/9/10/11.\n * 2. Remove padding so people aren't caught out if they zero out fieldsets.\n */\n\nlegend {\n  border: 0;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n\n/**\n * Remove default vertical scrollbar in IE 8/9/10/11.\n */\n\ntextarea {\n  overflow: auto;\n}\n\n/**\n * Don't inherit the `font-weight` (applied by a rule above).\n * NOTE: the default cannot safely be changed in Chrome and Safari on OS X.\n */\n\noptgroup {\n  font-weight: bold;\n}\n\n/* Tables\n   ========================================================================== */\n\n/**\n * Remove most spacing between table cells.\n */\n\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\n\ntd,\nth {\n  padding: 0;\n}\n\n/*\n* Skeleton V2.0.4\n* Copyright 2014, Dave Gamache\n* www.getskeleton.com\n* Free to use under the MIT license.\n* http://www.opensource.org/licenses/mit-license.php\n* 12/29/2014\n*/\n\n/* Table of contents\n––––––––––––––––––––––––––––––––––––––––––––––––––\n- Grid\n- Base Styles\n- Typography\n- Links\n- Buttons\n- Forms\n- Lists\n- Code\n- Tables\n- Spacing\n- Utilities\n- Clearing\n- Media Queries\n*/\n\n/* Grid\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n.container {\n  position: relative;\n  width: 100%;\n  max-width: 960px;\n  margin: 0 auto;\n  padding: 0 20px;\n  box-sizing: border-box;\n}\n\n.column,\n.columns {\n  width: 100%;\n  float: left;\n  box-sizing: border-box;\n}\n\n/* For devices larger than 400px */\n\n@media (min-width: 400px) {\n  .container {\n    width: 85%;\n    padding: 0;\n  }\n}\n\n/* For devices larger than 550px */\n\n@media (min-width: 550px) {\n  .container {\n    width: 80%;\n  }\n\n  .column,\n  .columns {\n    margin-left: 4%;\n  }\n\n  .column:first-child,\n  .columns:first-child {\n    margin-left: 0;\n  }\n\n  .one.column,\n  .one.columns {\n    width: 4.66666666667%;\n  }\n\n  .two.columns {\n    width: 13.3333333333%;\n  }\n\n  .three.columns {\n    width: 22%;\n  }\n\n  .four.columns {\n    width: 30.6666666667%;\n  }\n\n  .five.columns {\n    width: 39.3333333333%;\n  }\n\n  .six.columns {\n    width: 48%;\n  }\n\n  .seven.columns {\n    width: 56.6666666667%;\n  }\n\n  .eight.columns {\n    width: 65.3333333333%;\n  }\n\n  .nine.columns {\n    width: 74.0%;\n  }\n\n  .ten.columns {\n    width: 82.6666666667%;\n  }\n\n  .eleven.columns {\n    width: 91.3333333333%;\n  }\n\n  .twelve.columns {\n    width: 100%;\n    margin-left: 0;\n  }\n\n  .one-third.column {\n    width: 30.6666666667%;\n  }\n\n  .two-thirds.column {\n    width: 65.3333333333%;\n  }\n\n  .one-half.column {\n    width: 48%;\n  }\n\n  /* Offsets */\n\n  .offset-by-one.column,\n  .offset-by-one.columns {\n    margin-left: 8.66666666667%;\n  }\n\n  .offset-by-two.column,\n  .offset-by-two.columns {\n    margin-left: 17.3333333333%;\n  }\n\n  .offset-by-three.column,\n  .offset-by-three.columns {\n    margin-left: 26%;\n  }\n\n  .offset-by-four.column,\n  .offset-by-four.columns {\n    margin-left: 34.6666666667%;\n  }\n\n  .offset-by-five.column,\n  .offset-by-five.columns {\n    margin-left: 43.3333333333%;\n  }\n\n  .offset-by-six.column,\n  .offset-by-six.columns {\n    margin-left: 52%;\n  }\n\n  .offset-by-seven.column,\n  .offset-by-seven.columns {\n    margin-left: 60.6666666667%;\n  }\n\n  .offset-by-eight.column,\n  .offset-by-eight.columns {\n    margin-left: 69.3333333333%;\n  }\n\n  .offset-by-nine.column,\n  .offset-by-nine.columns {\n    margin-left: 78.0%;\n  }\n\n  .offset-by-ten.column,\n  .offset-by-ten.columns {\n    margin-left: 86.6666666667%;\n  }\n\n  .offset-by-eleven.column,\n  .offset-by-eleven.columns {\n    margin-left: 95.3333333333%;\n  }\n\n  .offset-by-one-third.column,\n  .offset-by-one-third.columns {\n    margin-left: 34.6666666667%;\n  }\n\n  .offset-by-two-thirds.column,\n  .offset-by-two-thirds.columns {\n    margin-left: 69.3333333333%;\n  }\n\n  .offset-by-one-half.column,\n  .offset-by-one-half.columns {\n    margin-left: 52%;\n  }\n}\n\n/* Base Styles\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n/* NOTE\nhtml is set to 62.5% so that all the REM measurements throughout Skeleton\nare based on 10px sizing. So basically 1.5rem = 15px :) */\n\nhtml {\n  font-size: 62.5%;\n}\n\nbody {\n  font-size: 1.5em;\n  /* currently ems cause chrome bug misinterpreting rems on body element */\n  line-height: 1.6;\n  font-weight: 400;\n  font-family: \"Raleway\", \"HelveticaNeue\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  color: #222;\n}\n\n/* Typography\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  margin-top: 0;\n  margin-bottom: 2rem;\n  font-weight: 300;\n}\n\nh1 {\n  font-size: 4.0rem;\n  line-height: 1.2;\n  letter-spacing: -.1rem;\n}\n\nh2 {\n  font-size: 3.6rem;\n  line-height: 1.25;\n  letter-spacing: -.1rem;\n}\n\nh3 {\n  font-size: 3.0rem;\n  line-height: 1.3;\n  letter-spacing: -.1rem;\n}\n\nh4 {\n  font-size: 2.4rem;\n  line-height: 1.35;\n  letter-spacing: -.08rem;\n}\n\nh5 {\n  font-size: 1.8rem;\n  line-height: 1.5;\n  letter-spacing: -.05rem;\n}\n\nh6 {\n  font-size: 1.5rem;\n  line-height: 1.6;\n  letter-spacing: 0;\n}\n\n/* Larger than phablet */\n\n@media (min-width: 550px) {\n  h1 {\n    font-size: 5.0rem;\n  }\n\n  h2 {\n    font-size: 4.2rem;\n  }\n\n  h3 {\n    font-size: 3.6rem;\n  }\n\n  h4 {\n    font-size: 3.0rem;\n  }\n\n  h5 {\n    font-size: 2.4rem;\n  }\n\n  h6 {\n    font-size: 1.5rem;\n  }\n}\n\np {\n  margin-top: 0;\n}\n\n/* Links\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\na {\n  color: #1EAEDB;\n}\n\na:hover {\n  color: #0FA0CE;\n}\n\n/* Buttons\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n.button,\nbutton,\ninput[type=\"submit\"],\ninput[type=\"reset\"],\ninput[type=\"button\"] {\n  display: inline-block;\n  height: 38px;\n  padding: 0 30px;\n  color: #555;\n  text-align: center;\n  font-size: 11px;\n  font-weight: 600;\n  line-height: 38px;\n  letter-spacing: .1rem;\n  text-transform: uppercase;\n  text-decoration: none;\n  white-space: nowrap;\n  background-color: transparent;\n  border-radius: 4px;\n  border: 1px solid #bbb;\n  cursor: pointer;\n  box-sizing: border-box;\n}\n\n.button:hover,\nbutton:hover,\ninput[type=\"submit\"]:hover,\ninput[type=\"reset\"]:hover,\ninput[type=\"button\"]:hover,\n.button:focus,\nbutton:focus,\ninput[type=\"submit\"]:focus,\ninput[type=\"reset\"]:focus,\ninput[type=\"button\"]:focus {\n  color: #333;\n  border-color: #888;\n  outline: 0;\n}\n\n.button.button-primary,\nbutton.button-primary,\ninput[type=\"submit\"].button-primary,\ninput[type=\"reset\"].button-primary,\ninput[type=\"button\"].button-primary {\n  color: #FFF;\n  background-color: #33C3F0;\n  border-color: #33C3F0;\n}\n\n.button.button-primary:hover,\nbutton.button-primary:hover,\ninput[type=\"submit\"].button-primary:hover,\ninput[type=\"reset\"].button-primary:hover,\ninput[type=\"button\"].button-primary:hover,\n.button.button-primary:focus,\nbutton.button-primary:focus,\ninput[type=\"submit\"].button-primary:focus,\ninput[type=\"reset\"].button-primary:focus,\ninput[type=\"button\"].button-primary:focus {\n  color: #FFF;\n  background-color: #1EAEDB;\n  border-color: #1EAEDB;\n}\n\n/* Forms\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\ninput[type=\"email\"],\ninput[type=\"number\"],\ninput[type=\"search\"],\ninput[type=\"text\"],\ninput[type=\"tel\"],\ninput[type=\"url\"],\ninput[type=\"password\"],\ntextarea,\nselect {\n  height: 38px;\n  padding: 6px 10px;\n  /* The 6px vertically centers text on FF, ignored by Webkit */\n  background-color: #fff;\n  border: 1px solid #D1D1D1;\n  border-radius: 4px;\n  box-shadow: none;\n  box-sizing: border-box;\n}\n\n/* Removes awkward default styles on some inputs for iOS */\n\ninput[type=\"email\"],\ninput[type=\"number\"],\ninput[type=\"search\"],\ninput[type=\"text\"],\ninput[type=\"tel\"],\ninput[type=\"url\"],\ninput[type=\"password\"],\ntextarea {\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n}\n\ntextarea {\n  min-height: 65px;\n  padding-top: 6px;\n  padding-bottom: 6px;\n}\n\ninput[type=\"email\"]:focus,\ninput[type=\"number\"]:focus,\ninput[type=\"search\"]:focus,\ninput[type=\"text\"]:focus,\ninput[type=\"tel\"]:focus,\ninput[type=\"url\"]:focus,\ninput[type=\"password\"]:focus,\ntextarea:focus,\nselect:focus {\n  border: 1px solid #33C3F0;\n  outline: 0;\n}\n\nlabel,\nlegend {\n  display: block;\n  margin-bottom: .5rem;\n  font-weight: 600;\n}\n\nfieldset {\n  padding: 0;\n  border-width: 0;\n}\n\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  display: inline;\n}\n\nlabel > .label-body {\n  display: inline-block;\n  margin-left: .5rem;\n  font-weight: normal;\n}\n\n/* Lists\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\nul {\n  list-style: circle inside;\n}\n\nol {\n  list-style: decimal inside;\n}\n\nol,\nul {\n  padding-left: 0;\n  margin-top: 0;\n}\n\nul ul,\nul ol,\nol ol,\nol ul {\n  margin: 1.5rem 0 1.5rem 3rem;\n  font-size: 90%;\n}\n\nli {\n  margin-bottom: 1rem;\n}\n\n/* Code\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\ncode {\n  padding: .2rem .5rem;\n  margin: 0 .2rem;\n  font-size: 90%;\n  white-space: nowrap;\n  background: #F1F1F1;\n  border: 1px solid #E1E1E1;\n  border-radius: 4px;\n}\n\npre > code {\n  display: block;\n  padding: 1rem 1.5rem;\n  white-space: pre;\n}\n\n/* Tables\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\nth,\ntd {\n  padding: 12px 15px;\n  text-align: left;\n  border-bottom: 1px solid #E1E1E1;\n}\n\nth:first-child,\ntd:first-child {\n  padding-left: 0;\n}\n\nth:last-child,\ntd:last-child {\n  padding-right: 0;\n}\n\n/* Spacing\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\nbutton,\n.button {\n  margin-bottom: 1rem;\n}\n\ninput,\ntextarea,\nselect,\nfieldset {\n  margin-bottom: 1.5rem;\n}\n\npre,\nblockquote,\ndl,\nfigure,\ntable,\np,\nul,\nol,\nform {\n  margin-bottom: 2.5rem;\n}\n\n/* Utilities\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n.u-full-width {\n  width: 100%;\n  box-sizing: border-box;\n}\n\n.u-max-full-width {\n  max-width: 100%;\n  box-sizing: border-box;\n}\n\n.u-pull-right {\n  float: right;\n}\n\n.u-pull-left {\n  float: left;\n}\n\n/* Misc\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\nhr {\n  margin-top: 3rem;\n  margin-bottom: 3.5rem;\n  border-width: 0;\n  border-top: 1px solid #E1E1E1;\n}\n\n/* Clearing\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n/* Self Clearing Goodness */\n\n.container:after,\n.row:after,\n.u-cf {\n  content: \"\";\n  display: table;\n  clear: both;\n}\n\n/* Media Queries\n–––––––––––––––––––––––––––––––––––––––––––––––––– */\n\n/*\nNote: The best way to structure the use of media queries is to create the queries\nnear the relevant code. For example, if you wanted to change the styles for buttons\non small devices, paste the mobile query code up in the buttons section and style it\nthere.\n*/\n\n/* Larger than mobile */\n\n/* Larger than phablet (also point when grid becomes active) */\n\n/* Larger than tablet */\n\n/* Larger than desktop */\n\n/* Larger than Desktop HD */\n\nbody label {\n  display: inline-block;\n  font-size: 0.9em;\n  line-height: 1.6;\n  font-weight: normal;\n}\n\n.label {\n  margin-bottom: .5rem;\n  font-weight: 400;\n}\n\n.row textarea {\n  min-height: 59px;\n}\n\n.title.main {\n  text-align: center;\n  font-weight: 400;\n}\n\n.vjs-video-container {\n  position: relative;\n  width: 100%;\n  /* desired width */\n  overflow: hidden;\n}\n\n.vjs-video-container:before {\n  content: \"\";\n  display: block;\n  padding-top: 56.2%;\n  /* initial ratio of 16:9*/\n}\n\n.vjs-poster {\n  /*centering the poster in the canvas*/\n  background-position: 50% 50%;\n  /*ie8*/\n}\n\n.vjs-video-container > * {\n  position: absolute !important;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n  width: 100% !important;\n  height: 100% !important;\n}\n\n.vjs-video-container .vjs-tech {\n  height: 100%;\n  /*ie9+*/\n  top: 0;\n  bottom: 0;\n  position: absolute;\n  margin: auto;\n}\n\n/* Fonts */\n\nh1 {\n  font-size: 5.6vw;\n}\n\nh3 {\n  font-size: 3vw;\n}\n\n/* demo styles */\n\nform.TAG .tag-type {\n  display: block;\n}\n\nform.TAG .xml-type {\n  display: none;\n}\n\nform.TAG .custom-type {\n  display: none;\n}\n\nform.XML .tag-type {\n  display: none;\n}\n\nform.XML .xml-type {\n  display: block;\n}\n\nform.XML .custom-type {\n  display: none;\n}\n\nform.CUSTOM .tag-type {\n  display: none;\n}\n\nform.CUSTOM .xml-type {\n  display: none;\n}\n\nform.CUSTOM .custom-type {\n  display: block;\n}\n\n.lte-ie9 .vjs-video-container,\n.lte-ie9 .vjs-video-container .video-js,\n.lte-ie9 .vjs-video-container .video-js .vjs-tech {\n  width: 400px !important;\n  height: 250px !important;\n}", ""]);

// exports


/***/ },
/* 6 */
/***/ function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ },
/* 7 */
/***/ function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
	}),
	getHeadElement = memoize(function () {
		return document.head || document.getElementsByTagName("head")[0];
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [];

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the bottom of <head>.
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
}

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var head = getHeadElement();
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			head.insertBefore(styleElement, head.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			head.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		head.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	styleElement.type = "text/css";
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	insertStyleElement(options, linkElement);
	return linkElement;
}

function addStyle(obj, options) {
	var styleElement, update, remove;

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

__webpack_require__(4);
var dom = __webpack_require__(2);
var adsSetupPlugin = __webpack_require__(3);
var messages = __webpack_require__(1);

videojs.plugin('ads-setup', adsSetupPlugin);

dom.onReady(function () {
  var vastForm = document.querySelector('form#vast-vpaid-form');

  initForm(vastForm);

  /* Local functions ***/
  function initForm(formEl) {
    var tagTypeEl = formEl.querySelector('input.tag-type-radio');
    var xmlTypeEl = formEl.querySelector('input.xml-type-radio');
    var customTypeEl = formEl.querySelector('input.custom-type-radio');
    var updateBtn = formEl.querySelector('.button.button-primary');
    var pauseBtn = formEl.querySelector('.pause');
    var resumeBtn = formEl.querySelector('.resume');
    var tagEl = formEl.querySelector('input.tag-el');
    var xmlEl = formEl.querySelector('select.xml-el');
    var customEl = formEl.querySelector('textarea.custom-el');
    var videoContainer = formEl.querySelector('div.vjs-video-container');
    var player = void 0;

    updateVisibility();
    dom.addEventListener(tagTypeEl, 'change', updateVisibility);
    dom.addEventListener(xmlTypeEl, 'change', updateVisibility);
    dom.addEventListener(customTypeEl, 'change', updateVisibility);
    dom.addEventListener(updateBtn, 'click', function () {
      updateDemo();
      messages.success('Demo updated!!!');
    });

    if (pauseBtn && resumeBtn) {
      dom.addEventListener(pauseBtn, 'click', function () {
        pauseAd();
        messages.success('ad paused');
      });

      dom.addEventListener(resumeBtn, 'click', function () {
        resumeAd();
        messages.success('ad resumed');
      });
    }

    updateDemo();

    /* Local functions ***/
    function updateVisibility() {
      dom.removeClass(formEl, 'TAG');
      dom.removeClass(formEl, 'XML');
      dom.removeClass(formEl, 'CUSTOM');
      dom.addClass(formEl, activeMode());
    }

    function pauseAd() {
      if (player) {
        player.vast.adUnit.pauseAd();
        showResumeBtn();
      }
    }

    function resumeAd() {
      if (player) {
        player.vast.adUnit.resumeAd();
        showPauseBtn();
      }
    }

    function showResumeBtn() {
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'inline-block';
    }

    function showPauseBtn() {
      pauseBtn.style.display = 'inline-block';
      resumeBtn.style.display = 'none';
    }

    function updateDemo() {
      createVideoEl(videoContainer, function (videoEl) {
        var mode = activeMode();
        var adPluginOpts = {
          plugins: {
            'ads-setup': {
              adCancelTimeout: 20000,
              adsEnabled: true
            }
          }
        };

        if (mode === 'TAG') {
          adPluginOpts.plugins['ads-setup'].adTag = tagEl.value;
        } else if (mode === 'XML') {
          adPluginOpts.plugins['ads-setup'].adTag = xmlEl.value;
        } else {
          adPluginOpts.plugins['ads-setup'].adTagXML = function (done) {
            setTimeout(function () {
              done(null, customEl.value);
            }, 0);
          };
        }

        player = videojs(videoEl, adPluginOpts);

        if (pauseBtn) {
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'none';
        }

        if (player) {
          player.on('vast.adStart', function () {
            showPauseBtn();
            player.on('play', showPauseBtn);
            player.on('pause', showResumeBtn);
            player.one('vast.adEnd', function () {
              pauseBtn.style.display = 'none';
              resumeBtn.style.display = 'none';

              player.off('play', showPauseBtn);
              player.off('pause', showResumeBtn);
            });
          });
        }
      });
    }

    function activeMode() {
      if (tagTypeEl.checked) {
        return 'TAG';
      }

      if (xmlTypeEl.checked) {
        return 'XML';
      }

      return 'CUSTOM';
    }

    function createVideoEl(container, cb) {
      var videoTag = '<video class="video-js vjs-default-skin" controls preload=auto poster=http://vjs.zencdn.net/v/oceans.png >' + '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' + '<source src=http://vjs.zencdn.net/v/oceans.webm type=video/webm/>' + '<source src=http://vjs.zencdn.net/v/oceans.ogv type=video/ogg/>' + '<p class=vjs-no-js>To view this video please enable JavaScript, and consider upgrading to a web browser that ' + '<a href=http://videojs.com/html5-video-support/ target=_blank>supports HTML5 video</a>' + '</p>' + '</video>';

      container.innerHTML = videoTag;

      // We do this asynchronously to give time for the dom to be updated
      setTimeout(function () {
        var videoEl = container.querySelector('.video-js');

        cb(videoEl);
      }, 0);
    }
  }
});

/***/ }
/******/ ])
});
;
//# sourceMappingURL=demo.js.map