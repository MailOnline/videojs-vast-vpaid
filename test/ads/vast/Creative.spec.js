'use strict';
var testUtils = require('../../test-utils');

describe("Creative", function(){

  var Creative = require('ads/vast/Creative');
  var Linear = require('ads/vast/Linear');
  var NonLinear = require('ads/vast/NonLinear');

  var xml = require('utils/xml');

  it("must return an instance of Creative", function(){
    assert.instanceOf(new Creative(xml.toJXONTree('<Creative id="8455"></Creative>')), Creative);
  });

  it("must set the id if passed", function(){
    var creativeXML = '<Creative id="8455"></Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.id, '8455');
  });

  it("must set the sequence if set", function(){
    var creativeXML = '<Creative id="8455" sequence="1"></Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.sequence, 1);
  });

  it("must set the the ad id if set", function(){
    var creativeXML = '<Creative adId="8455"></Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.adId, 8455);
  });

  it("must set the the apiFramework if set", function(){
    var creativeXML = '<Creative apiFramework="fooFramework"></Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.apiFramework, "fooFramework");
  });

  it("must set the linear if passed as part of the jxonTreeData", function(){
    var creativeXML = '<Creative apiFramework="fooFramework">' +
      '<Linear>' +
      '<Duration>00:00:58</Duration>' +
      '<MediaFiles></MediaFiles>' +
      '</Linear>'+
      '</Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    assert.instanceOf(creative.linear, Linear);
  });

  it("must set nonLinearAds if passed as part of the jxonTreeData", function(){
    var creativeXML = '<Creative apiFramework="fooFramework">' +
        '<NonLinearAds>' +
        '<NonLinear>' +
        '</NonLinear>'+
        '</NonLinearAds>' +
        '</Creative>';
    var creative = new Creative(xml.toJXONTree(creativeXML));
    creative.nonLinearAds.forEach(function(nonLinear) {
      assert.instanceOf(nonLinear, NonLinear);
    });
  });

  describe("companionAds", function() {
    var creativeXML = '<Creative sequence="1">' +
      '<CompanionAds>' +
      '</CompanionAds>' +
      '</Creative>';

    it('must handle when no companionAds', function() {
      function newCreative() {
        return new Creative(xml.toJXONTree(creativeXML));
      }
      assert.doesNotThrow(newCreative);
    });
  });

  describe("isSupported", function(){
    var creative;

    beforeEach(function(){
      var creativeXML = '<Creative apiFramework="fooFramework">' +
        '<Linear>' +
        '<Duration>00:00:58</Duration>' +
        '<MediaFiles></MediaFiles>' +
        '</Linear>'+
        '</Creative>';
      creative = new Creative(xml.toJXONTree(creativeXML));
    });

    it("must return true if the creative does not contain a linear", function(){
      delete creative.linear;
      assert.isTrue(creative.isSupported());
    });

    it("must returns false if it contains a non supported linear", function(){
      creative.linear = {
        isSupported: function(){
          return false;
        }
      };
      assert.isFalse(creative.isSupported());
    });

    it("must returns true if it contains a supported linear", function(){
      creative.linear = {
        isSupported: function(){
          return true;
        }
      };
      assert.isTrue(creative.isSupported());
    });


  });

  describe("parseCreatives", function () {
    var parseCreatives;

    beforeEach(function () {
      parseCreatives = Creative.parseCreatives;
    });

    it("must return an empty array if you pass no creativesJTree", function () {
      testUtils.assertEmptyArray(parseCreatives());
    });

    it("must return an empty array if there is no real creatives", function () {
      var inlineXML = '<InLine><Creatives></Creatives></InLine>';
      testUtils.assertEmptyArray(parseCreatives(xml.toJXONTree(inlineXML).creatives));
    });

    it("must be an array or creatives", function () {
      var inlineXML = '<InLine>' +
        '<Creatives>' +
          '<Creative id="8454" sequence="1"></Creative>' +
            '<Creative id="8455" sequence="2"></Creative>' +
              '</Creatives>' +
                '</InLine>';
                var creativesJTree = xml.toJXONTree(inlineXML).creatives;
                var creatives = parseCreatives(creativesJTree);
                assert.isArray(creatives);
                assert.instanceOf(creatives[0], Creative);
                assert.equal(creatives[0].id, 8454);
                assert.instanceOf(creatives[1], Creative);
                assert.equal(creatives[1].id, 8455);
    });
  });
});
