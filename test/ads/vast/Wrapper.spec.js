var Wrapper = require('ads/vast/Wrapper');
var Creative = require('ads/vast/Creative');

var xml = require('utils/xml');

describe("Wrapper", function () {
  it("must return an instance of Wrapper", function () {
    assert.instanceOf(new Wrapper(xml.toJXONTree('<Wrapper></Wrapper>')), Wrapper);
  });

  it("must set the adSystem", function () {
    var wrapperXML = '<Wrapper><AdSystem>GDFP</AdSystem></Wrapper>';
    var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
    assert.equal('GDFP', wrapper.adSystem);
  });

  describe("impressions", function () {
    it("must be an array", function () {
      var wrapper = new Wrapper(xml.toJXONTree('<Wrapper></Wrapper>'));
      assert.isArray(wrapper.impressions);
    });

    it("must be empty if there is no real impression", function () {
      var wrapperXML = '<Wrapper><Impression id="DART"></Impression></Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
      assert.equal(wrapper.impressions.length, 0);
    });

    it("must contain the defined impression", function () {
      var wrapperXML = '<Wrapper>' +
        '<Impression id="DART">' +
        '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
        '</Impression>' +
        '</Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));

      assert.deepEqual(wrapper.impressions, [
        'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif'
        ]);
    });

    it("must be possible to contain more than one impression", function () {
      var wrapperXML = '<Wrapper>' +
        '<Impression id="DART">' +
        '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
        '</Impression>' +
        '<Impression id="ThirdParty">' +
        '<![CDATA[http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?]]>' +
        '</Impression>' +
        '<Impression>' +
        '<![CDATA[]]>' +
        '</Impression>' +
        '</Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));

      assert.deepEqual(wrapper.impressions, [
        'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif',
       'http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?'
        ]);
    });
  });

  it("must set the VASTAdTagURI", function () {
    var wrapperXML = '<Wrapper>' +
      '<VASTAdTagURI><![CDATA[http://demo.tremormedia.com/proddev/vast/vast_inline_linear.xml]]></VASTAdTagURI>' +
      '</Wrapper>';
    var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
    assert.equal('http://demo.tremormedia.com/proddev/vast/vast_inline_linear.xml', wrapper.VASTAdTagURI);
  });

  it("must set the tracking error uri", function () {
    var wrapperXML = '<Wrapper>' +
      '<Error><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/[ERRORCODE]]]></Error>' +
      '</Wrapper>';
    var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
    assert.equal(wrapper.error, 'http://pubads.g.doubleclick.net/pagead/conversion/[ERRORCODE]');
  });

  describe("extensions", function () {
    it("must be undefined if not set", function () {
      var wrapper = new Wrapper(xml.toJXONTree('<Wrapper></Wrapper>'));
      assert.isUndefined(wrapper.extensions);
    });

    it("must be contain the JXONTree of the extension element if set", function () {
      var wrapperXML = '<Wrapper><Extensions>price</Extensions></Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));

      assert.isDefined(wrapper.extensions);
      assert.deepEqual(wrapper.extensions, xml.toJXONTree(wrapperXML).extensions);
    });
  });

  describe("creatives", function () {
    it("must be an array or creatives", function () {
      var wrapperXML = '<Wrapper>' +
      '<Creatives>' +
      '<Creative id="8454" sequence="1"></Creative>' +
      '<Creative id="8455" sequence="2"></Creative>' +
      '</Creatives>' +
      '</Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));

      assert.isArray(wrapper.creatives);
      assert.instanceOf(wrapper.creatives[0], Creative);
      assert.equal(wrapper.creatives[0].id, 8454);
      assert.instanceOf(wrapper.creatives[1], Creative);
      assert.equal(wrapper.creatives[1].id, 8455);
    });
  });

  describe("followAdditionalWrappers", function () {
    it("must be true by default", function () {
      var wrapper = new Wrapper(xml.toJXONTree('<Wrapper></Wrapper>'));
      assert.isTrue(wrapper.followAdditionalWrappers);
    });

    it("must contain whatever the followAdditionalWrappers attr from the wrapper tag contain on the xml", function () {
      var wrapperXML = '<Wrapper followAdditionalWrappers="false"></Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
      assert.isFalse(wrapper.followAdditionalWrappers);
    });
  });

  describe("allowMultipleAds", function () {
    it("must be set if the attr is present on the wrapper tag", function () {
      var wrapperXML = '<Wrapper allowMultipleAds="false"></Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
      assert.isFalse(wrapper.allowMultipleAds);
    });
  });

  describe("fallbackOnNoAd", function () {
    it("must be set if the attr is present on the wrapper tag", function () {
      var wrapperXML = '<Wrapper fallbackOnNoAd="false"></Wrapper>';
      var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
      assert.isFalse(wrapper.fallbackOnNoAd);
    });
  });
});