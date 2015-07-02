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
    var vpaidTech, testDiv, testVideo;

    beforeEach(function () {
      vpaidTech = new VPAIDHTML5Tech({src: 'http://fake.mediaFile.url'});
      testDiv = document.createElement("div");
      testVideo = document.createElement("video");
      document.body.appendChild(testDiv);
    });

    afterEach(function () {
      dom.remove(testDiv);
      dom.remove(testVideo);
    });

    describe("loadAdUnit", function() {
      it("must throw a VASTError if you don't pass a valid dom Element to contain the ad", function() {
          [undefined, null, {}, [], 123].forEach(function (invalidDOMElement) {
            assert.throws(function (){
              vpaidTech.loadAdUnit(invalidDOMElement);
            }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_DOM_CONTAINER_EL);
          });
      });

      it("must throw a VASTError if you don't pass a valid vide Element to contain the video ad", function() {
          [undefined, null, {}, [], 123].forEach(function (invalidDOMElement) {
            assert.throws(function (){
              vpaidTech.loadAdUnit(testDiv, invalidDOMElement);
            }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.INVALID_DOM_CONTAINER_EL);
          });
      });

      it("must throw a VASTError if you don't pass a callback to call once the ad have been loaded", function () {
        [undefined, null, {}, 123].forEach(function(invalidCallback) {
          assert.throws(function () {
            vpaidTech.loadAdUnit(testDiv, testVideo, invalidCallback);
          }, VASTError, VAST_ERROR_PREFIX + VPAIDHTML5Tech.MISSING_CALLBACK);
        });
      });

      it("must not throw an error if pass valid arguments", function(){
        assert.doesNotThrow(function () {
          vpaidTech.loadAdUnit(testDiv, testVideo, noop);
        });
      });

      it("must set properties into vpaidTech", function () {
        assert.isNull(vpaidTech.containerEl);
        assert.isNull(vpaidTech.vpaidHTMLClient);

        vpaidTech.loadAdUnit(testDiv, testVideo, noop);

        assert.equal(vpaidTech.containerEl, testDiv);
        assert.equal(vpaidTech.videoEl, testVideo);
        assert.instanceOf(vpaidTech.vpaidHTMLClient, VPAIDHTML5Client);
      });

    });

    describe("unloadAdUnit", function() {
      it("must do nothing if there is no loaded adUnit", function() {
        assert.doesNotThrow(function() {
          vpaidTech.unloadAdUnit();
        });
      });

      it("must unload the adUnit", function() {
        vpaidTech.loadAdUnit(testDiv, testVideo, noop);

        var vpaidClient = vpaidTech.vpaidHTMLClient;
        vpaidClient.destroy = sinon.spy();

        vpaidTech.unloadAdUnit();

        assert(vpaidClient.destroy.calledOnce);
      });
    });
  });
});

