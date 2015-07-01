var VAST_ERROR_PREFIX = 'VAST Error: ';

describe("VPAIDHTML5Tech", function() {
  it("must be a function", function () {
    assert.isFunction(VPAIDHTML5Tech);
  });

  it("must return an instance of itself", function() {
    assert.instanceOf(VPAIDHTML5Tech({src: 'fakeSource'}), VPAIDHTML5Tech);
  });

  it("must complain if you don't pass a valid media file", function () {
      [undefined, null, {}, []].forEach(function(invalidMediaFile) {
          assert.throws(function () {
              new VPAIDHTML5Tech(invalidMediaFile);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_MEDIA_FILE);
      });
  });

  describe("instance", function() {
    var vpaidTech, testDiv;

    beforeEach(function () {
      vpaidTech = new VPAIDHTML5Tech({src: 'http://fake.mediaFile.url'});
      testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
    });

    afterEach(function () {
      dom.remove(testDiv);
    });

    describe("loadAdUnit", function() {
      it("must throw a VASTError if you don't pass a valid dom Element to contain the ad", function() {
          [undefined, null, {}, [], 123].forEach(function (invalidDOMElement) {
            assert.throws(function (){
              vpaidTech.loadAdUnit(invalidDOMElement);
            }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_DOM_CONTAINER_EL);
          });
      });

      it("must throw a VASTError if you don't pass a callback to call once the ad have been loaded", function () {
        [undefined, null, {}, 123].forEach(function(invalidCallback) {
          assert.throws(function () {
            vpaidTech.loadAdUnit(testDiv, invalidCallback);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.MISSING_CALLBACK);
        });
      })
    });
  })
});

