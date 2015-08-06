(function () {
    function isOldIE() {
       var version = getInternetExplorerVersion();
       if (version === -1) {
         return false;
       }

       return version < 9;
    }

    /**
     * Returns the version of Internet Explorer or a -1 (indicating the use of another browser).
     * Source: https://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
     * @returns {number} the version of Internet Explorer or a -1 (indicating the use of another browser).
     */
    function getInternetExplorerVersion() {
        var rv = -1;

        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            var res = re.exec(ua);
            if (res !== null){
            rv = parseFloat(res[1]);
            }
        }

        return rv;
    }

    function isDom (obj) {
        return (typeof obj==="object") &&
            (obj.nodeType===1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument ==="object");
    }

    if (isOldIE()) {
        if (Object.videoVastMonkeyPatched) {
            return;
        }

        var original = Object.defineProperty;

        Object.defineProperty = function(obj, prop, description) {
            if (isDom(obj)) {
                return original(obj, prop, description);
            }
            if (description.get || description.set) {
                throw new Error('browser doesn\'t support getters and setters');
            }
            obj[prop] = description.value;
        };

        Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
          var buffer = [];
          var key;

          // Non-enumerable properties cannot be discovered but can be checked for by name.
          // Define those used internally by JS to allow an incomplete solution
          var commonProps = ['length', "name", "arguments", "caller", "prototype", "observe", "unobserve"];

          if (typeof object === 'undefined' || object === null) {
            throw new TypeError('Cannot convert undefined or null to object');
          }

          object = Object(object);

          // Enumerable properties only
          for (key in object) {
            if (object.hasOwnProperty(key)) {
              buffer.push(key);
            }
          }

          // Check for and add the common non-enumerable properties
          for (var i=0, s=commonProps.length; i<s; i++) {
            if (commonProps[i] in object) buffer.push(commonProps[i]);
          }

          return buffer;
      };

      Object.videoVastMonkeyPatched = true;
    }

})();

