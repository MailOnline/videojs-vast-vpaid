var VASTError = require('ads/vast/VASTError');
var VPAIDHTML5Tech = require('../../../src/scripts/ads/vpaid/VPAIDHTML5Tech');

var dom = require('utils/dom');
var utilities = require('utils/utilityFunctions');

var VAST_ERROR_PREFIX = 'VAST Error: ';

describe("VPAIDHTML5Tech", function() {
  it("must return an instance of itself", function() {
    assert.instanceOf(new VPAIDHTML5Tech({src: 'fakeSource'}), VPAIDHTML5Tech);
  });

  it("must implement supports", function () {
    sinon.stub(utilities, 'isOldIE').returns(false);
    //Must return false for old IE (IE9 and below)
    utilities.isOldIE.returns(9);

    utilities.isOldIE.restore();
  });

  it("must complain if you don't pass a valid media file", function () {
      [undefined, null, {}, []].forEach(function(invalidMediaFile) {
          assert.throws(function () {
            /*jshint unused:false*/
            var vpaidTech = new VPAIDHTML5Tech(invalidMediaFile);
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


    it("must publish the name of the tech", function(){
      assert.equal(vpaidTech.name, 'vpaid-html5');
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
          vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);
        });
      });

      it("must set properties into vpaidTech", function () {
        assert.isNull(vpaidTech.containerEl);
        assert.isNull(vpaidTech.vpaidHTMLClient);

        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        assert.equal(vpaidTech.containerEl, testDiv);
        assert.equal(vpaidTech.videoEl, testVideo);
        assert.instanceOf(vpaidTech.vpaidHTMLClient, VPAIDHTML5Tech.VPAIDHTML5Client);
      });

    });

    describe("unloadAdUnit", function() {
      it("must do nothing if there is no loaded adUnit", function() {
        assert.doesNotThrow(function() {
          vpaidTech.unloadAdUnit();
        });
      });

      it("must unload the adUnit", function() {
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        var vpaidClient = vpaidTech.vpaidHTMLClient;
        vpaidClient.destroy = sinon.spy();

        vpaidTech.unloadAdUnit();

        assert(vpaidClient.destroy.calledOnce);
      });

      it("must remove the containerEl", function() {
        sinon.stub(dom, 'remove');
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        vpaidTech.vpaidHTMLClient.destroy = utilities.noop;
        vpaidTech.unloadAdUnit();

        assert(dom.remove.calledWithExactly(testDiv));
        dom.remove.restore();
      });

      it("must set instance properties: to null", function() {
        vpaidTech.loadAdUnit(testDiv, testVideo, utilities.noop);

        vpaidTech.unloadAdUnit();

        assert.isNull(vpaidTech.vpaidHTMLClient);
        assert.isNull(vpaidTech.containerEl);
      });
    });
  });
});
