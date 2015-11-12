describe("Creative", function(){
  it("must return an instance of Creative", function(){
    assert.instanceOf(Creative(xml.toJXONTree('<Creative id="8455"></Creative>')), Creative);
  });

  it("must set the id if passed", function(){
    var creativeXML = '<Creative id="8455"></Creative>';
    var creative = Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.id, '8455');
  });

  it("must set the sequence if set", function(){
    var creativeXML = '<Creative id="8455" sequence="1"></Creative>';
    var creative = Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.sequence, 1);
  });

  it("must set the the ad id if set", function(){
    var creativeXML = '<Creative adId="8455"></Creative>';
    var creative = Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.adId, 8455);
  });

  it("must set the the apiFramework if set", function(){
    var creativeXML = '<Creative apiFramework="fooFramework"></Creative>';
    var creative = Creative(xml.toJXONTree(creativeXML));
    assert.equal(creative.apiFramework, "fooFramework");
  });

  it("must set the linear if passed as part of the jxonTreeData", function(){
    var creativeXML = '<Creative apiFramework="fooFramework">' +
      '<Linear>' +
      '<Duration>00:00:58</Duration>' +
      '<MediaFiles></MediaFiles>' +
      '</Linear>'+
      '</Creative>';
    var creative = Creative(xml.toJXONTree(creativeXML));
    assert.instanceOf(creative.linear, Linear);
  });
});