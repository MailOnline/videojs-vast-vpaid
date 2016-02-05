var _ = require('./utils');
var dom = {};

dom.addClass = function (el, cssClass) {
  var classes;

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
  var classes;

  if (_.isNotEmptyString(cssClass)) {
    if (el.classList) {
      return el.classList.remove(cssClass);
    }

    classes = _.isString(el.getAttribute('class')) ? el.getAttribute('class').split(/\s+/) : [];
    var newClasses = [];
    var i, len;
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
  if(_.isArray(el)){
    _.forEach(el, function(e) {
      dom.addEventListener(e, type, handler);
    });
    return;
  }

  if(_.isArray(type)){
    _.forEach(type, function(t) {
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
    el.attachEvent("on" + type, handler);
  }
};

dom.removeEventListener = function removeEventListener(el, type, handler) {
  if(_.isArray(el)){
    _.forEach(el, function(e) {
      dom.removeEventListener(e, type, handler);
    });
    return;
  }

  if(_.isArray(type)){
    _.forEach(type, function(t) {
      dom.removeEventListener(el, t, handler);
    });
    return;
  }

  if (el.removeEventListener) {
    el.removeEventListener(type, handler, false);
  } else if (el.detachEvent) {
    el.detachEvent("on" + type, handler);
  } else {
    el["on" + type] = null;
  }
};

dom.onReady = (function () {
  var readyHandlers = [];
  var readyFired = false;

  // if document already ready to go, schedule the ready function to run
  // IE only safe when readyState is "complete", others safe when readyState is "interactive"
  if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
    setTimeout(ready, 0);
  } else {
    // otherwise if we don't have event handlers installed, install them
    if (document.addEventListener) {
      // first choice is DOMContentLoaded event
      document.addEventListener("DOMContentLoaded", ready, false);
      // backup is window load event
      window.addEventListener("load", ready, false);
    } else {
      // must be IE
      document.attachEvent("onreadystatechange", readyStateChange);
      window.attachEvent("onload", ready);
    }
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

  /*** Local functions ****/
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
    if (document.readyState === "complete") {
      ready();
    }
  }
})();

dom.prependChild = function prependChild(parent, child) {
  if(child.parentNode){
    child.parentNode.removeChild(child);
  }
  return parent.insertBefore(child, parent.firstChild);
};

dom.remove = function removeNode(node){
  if(node && node.parentNode){
    node.parentNode.removeChild(node);
  }
};

module.exports = dom;