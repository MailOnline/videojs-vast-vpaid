describe("Companion", function(){
  it("must return an instance of Companion", function(){
    var companion = Companion(xml.toJXONTree('<Companion><StaticResource></StaticResource></Companion>'));
    assert.instanceOf(companion, Companion);
  });

  //Required Elements
  describe("staticResource", function(){
    it("must contain the static resource and mime type", function(){
      var companionXML = '<Companion><StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource></Companion>';
      var companion = Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.creativeResource, "http://www.example.com/image.jpg");
      assert.equal(companion.creativeType, "image/jpeg");
    });
  });

  //Optional Elements
  describe("trackingEvents", function(){
    /*jshint maxlen: 500 */
    it("must be filled with all the tracking events that the xml provides", function(){
      var companionXML = '<Companion>' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>'+
        '<TrackingEvents>'+
        '<Tracking event="creativeView">'+
        '<![CDATA[http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=]]>'+
        '</Tracking>'+
        '</TrackingEvents>'+
        '</Companion>';
      var companion = Companion(xml.toJXONTree(companionXML));
      var trackingEvents = companion.trackingEvents;

      //First tracking event
      var tracking = trackingEvents[0];
      assert.instanceOf(tracking, TrackingEvent);
      assert.equal(tracking.name, 'creativeView');
    });
  });

  describe("dimensions", function(){
    it("must contain creative dimensions", function(){
      var companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>'+
        '<TrackingEvents>'+
        '<Tracking event="creativeView">'+
        '<![CDATA[http://t4.liverail.com/?metric=view25&pos=0&coid=135&pid=1331&nid=1331&oid=229&olid=2291331&cid=331&tpcid=&vid=&amid=&cc=default&pp=&vi=0&vv=&sg=&tsg=&pmu=0&pau=0&psz=0&ctx=&tctx=&coty=7&adt=0&did=&buid=&scen=&mca=&mma=&mct=0&url=http%3A%2F%2Fwww.iab.net%2Fguidelines%2F508676%2Fdigitalvideo%2Fvsuite%2Fvast%2Fvast_copy%2Fvast_xml_samples&trid=54afb53ccfddf1.12174006&bidf=0.10000&bids=0.00000&bidt=1&bidh=0&bidlaf=0&sdk=0&cb=8279.195.234.241.9.0&ver=1&w=&wy=&x=&y=&xy=]]>'+
        '</Tracking>'+
        '</TrackingEvents>'+
        '</Companion>';
      var companion = Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.width, 300);
      assert.equal(companion.height, 250);
    });
  });

  describe("clickthrough", function(){
    it("must provide companion impression tracker", function(){
      var companionXML = '<Companion width="300" height="250">' +
        '<StaticResource creativeType="image/jpeg"><![CDATA[http://www.example.com/image.jpg]]></StaticResource>'+
        '<CompanionClickThrough><![CDATA[http://www.example.com/tracker.html]]></CompanionClickThrough>'+
        '</Companion>';
      var companion = Companion(xml.toJXONTree(companionXML));
      assert.equal(companion.companionClickThrough, "http://www.example.com/tracker.html");
    });
  });
});