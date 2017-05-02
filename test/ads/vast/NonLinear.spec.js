var NonLinear = require('ads/vast/NonLinear');

var xml = require('utils/xml');

describe("NonLinear", function () {
  it("must return an instance of NonLinear", function () {
    var nonLinear = new NonLinear(xml.toJXONTree('<NonLinear></NonLinear>'));
    assert.instanceOf(nonLinear, NonLinear);
  });

  var nonLinearXML = '<NonLinear id="GDFP" width="300" height="50" minSuggestedDuration="00:00:15" scalable="true" maintainAspectRatio="true">' +
      '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>' +
      '<NonLinearClickThrough><![CDATA[http://www.example.com]]></NonLinearClickThrough>' +
      '<NonLinearClickTracking><![CDATA[http://www.example.com]]></NonLinearClickTracking>' +
      '</NonLinear>';

  describe("staticResource", function () {
    it("must parse the static resource and mime type", function () {
      var nonLinear = new NonLinear(xml.toJXONTree(nonLinearXML));
      assert.equal(nonLinear.staticResource, "http://www.example.com/image.jpg");
      assert.equal(nonLinear.creativeType, "image/jpeg");
    });
  });

  describe("optionalElements", function () {
    it("must parse dimensions, minSuggestedDuration, scalable, and maintainAspectRatio", function () {
      var nonLinear = new NonLinear(xml.toJXONTree(nonLinearXML));
      assert.equal(nonLinear.width, 300);
      assert.equal(nonLinear.height, 50);
      assert.equal(nonLinear.minSuggestedDuration, "00:00:15");
      assert.equal(nonLinear.scalable, true);
      assert.equal(nonLinear.maintainAspectRatio, true);
      assert.equal(nonLinear.nonLinearClickTracking, "http://www.example.com");
    });
  });

  describe("clickthrough", function(){
    it("must parse clickthrough url", function(){
      var nonLinear = new NonLinear(xml.toJXONTree(nonLinearXML));
      assert.equal(nonLinear.nonLinearClickThrough, "http://www.example.com");
    });
  });
});


