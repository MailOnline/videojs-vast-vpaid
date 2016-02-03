'use strict';

describe("Creative", function(){

  var Creative = require('ads/vast/Creative');
  var Linear = require('ads/vast/Linear');

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
});