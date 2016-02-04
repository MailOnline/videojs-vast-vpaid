'use strict';

describe("InLine", function () {

  var Creative = require('ads/vast/Creative');
  var InLine = require('ads/vast/InLine');

  var xml = require('utils/xml');

  var inlineXML;

  beforeEach(function () {
    inlineXML = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<InLine>' +
      '<AdSystem>GDFP</AdSystem>' +
      '<AdTitle>41683 Hof Christmas</AdTitle>' +
      '<Impression><![CDATA[]]></Impression>' +
      '<Creatives>' +
      '<Creative id="8454" sequence="1"></Creative>' +
      '</Creatives>' +
      '</InLine>';

  });

  it("must return an instance of InLine", function () {
    assert.instanceOf(new InLine(xml.toJXONTree(inlineXML)), InLine);
  });

  describe("required fields", function () {
    var inline;

    beforeEach(function () {
      inline = new InLine(xml.toJXONTree(inlineXML));
    });

    it("must publish the adTitle", function () {
      assert.equal(inline.adTitle, '41683 Hof Christmas');
    });

    it("must publish the adSystem", function () {
      assert.equal(inline.adSystem, 'GDFP');
    });

    describe("impressions", function () {
      it("must be an array", function () {
        assert.isArray(inline.impressions);
      });

      it("must be empty if there is no real impression", function () {
        inlineXML = '<InLine>' +
          '<Impression><![CDATA[]]></Impression>' +
          '</InLine>';
        inline = new InLine(xml.toJXONTree(inlineXML));
        assert.equal(inline.impressions.length, 0);
      });

      it("must contain the defined impression", function () {
        inlineXML = '<InLine>' +
          '<Impression id="DART">' +
          '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
          '</Impression>' +
          '</InLine>';
        inline = new InLine(xml.toJXONTree(inlineXML));

        assert.deepEqual(inline.impressions, [
          'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif'
        ]);
      });

      it("must be possible to contain more than one impression", function () {
        inlineXML = '<InLine>' +
          '<Impression id="DART">' +
          '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
          '</Impression>' +
          '<Impression id="ThirdParty">' +
          '<![CDATA[http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?]]>' +
          '</Impression>' +
          '<Impression>' +
          '<![CDATA[]]>' +
          '</Impression>' +
          '</InLine>';
        inline = new InLine(xml.toJXONTree(inlineXML));

        assert.deepEqual(inline.impressions, [
          'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif',
          'http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?'
        ]);
      });
    });

    describe("creatives", function () {

      beforeEach(function () {
        inlineXML = '<InLine>' +
          '<Creatives>' +
          '<Creative id="8454" sequence="1"></Creative>' +
          '<Creative id="8455" sequence="2"></Creative>' +
          '</Creatives>' +
          '</InLine>';
        inline = new InLine(xml.toJXONTree(inlineXML));
      });

      it("must be an array or creatives", function () {
        assert.isArray(inline.creatives);
        assert.instanceOf(inline.creatives[0], Creative);
        assert.equal(inline.creatives[0].id, 8454);
        assert.instanceOf(inline.creatives[1], Creative);
        assert.equal(inline.creatives[1].id, 8455);

      });
    });
  });

  describe("optional fields", function () {
    describe("description", function () {
      it("must be undefined if not set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.isUndefined(inline.description);
      });

      it("must contain the description of the ad", function () {
        inlineXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<InLine>' +
          '<Description>41683 Hof Christmas ad</Description>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.equal(inline.description, '41683 Hof Christmas ad');
      });
    });

    describe("advertiser", function () {
      it("must be undefined if not set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.equal(inline.advertiser, undefined);
      });

      it("must contain the name of the advertiser", function () {
        inlineXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<InLine>' +
          '<Advertiser>AdvertiserName</Advertiser>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.equal(inline.advertiser, 'AdvertiserName');
      });
    });

    describe("surveys", function () {
      it("must be an empty array if not surveys are set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.deepEqual(inline.surveys, []);
      });

      it("must contain must array with the survey objects an object with a uri and an optional type attr", function () {
        inlineXML = '<InLine>' +
          '<Survey type="text/javascript">' +
          '<![CDATA[http://pubads.g.doubleclick.net/pagead/survey]]>' +
          '</Survey>' +
          '<Survey>' +
          '<![CDATA[http://pubads.g.doubleclick.net/pagead/survey]]>' +
          '</Survey>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.deepEqual(inline.surveys, [
          {
            uri: 'http://pubads.g.doubleclick.net/pagead/survey',
            type: 'text/javascript'
          },
          {
            uri: 'http://pubads.g.doubleclick.net/pagead/survey',
            type: undefined
          }
        ]);
      });
    });

    describe("pricing", function () {
      it("must be undefined if not set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.isUndefined(inline.pricing);
      });

      it("must contain the price of the ad if set", function () {
        inlineXML = '<InLine>' +
          '<Pricing>price</Pricing>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.equal(inline.pricing, 'price');
      });
    });

    describe("error", function () {
      it("must be undefined if not set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.isUndefined(inline.error);
      });

      /*jshint maxlen: 700 */
      it("must contain the tracking error uri if set", function () {
        inlineXML = '<InLine>' +
          '<Error><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplayfailed[ERRORCODE]]]></Error>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));

        assert.equal(inline.error, 'http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplayfailed[ERRORCODE]');
      });
    });

    describe("extensions", function () {
      it("must be undefined if not set", function () {
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.isUndefined(inline.extensions);
      });

      it("must be contain the JXONTree of the extension element if set", function () {
        inlineXML = '<InLine>' +
          '<Extensions>price</Extensions>' +
          '</InLine>';
        var inline = new InLine(xml.toJXONTree(inlineXML));
        assert.isDefined(inline.extensions);
        assert.deepEqual(inline.extensions, xml.toJXONTree(inlineXML).extensions);
      });
    });
  });

  describe("isSupported", function () {
    var inLine;

    beforeEach(function () {
      inLine = new InLine(xml.toJXONTree(inlineXML));
    });

    it("must return false if the inLine has no creatives", function () {
      inLine.creatives.length = 0;
      assert.isFalse(inLine.isSupported());
    });

    it("must return true if all the creatives of the inline are supported", function () {
      var spy = sinon.spy();
      inLine.creatives = [
        {
          isSupported: function () {
            spy();
            return true;
          }
        },
        {
          isSupported: function () {
            spy();
            return true;
          }
        }
      ];
      assert.isTrue(inLine.isSupported());
      sinon.assert.calledTwice(spy);
    });

    it("must return false if at least one the creatives of the inline is not supported", function () {
      var spy = sinon.spy();
      inLine.creatives = [
        {
          isSupported: function () {
            spy();
            return false;
          }
        },
        {
          isSupported: function () {
            spy();
            return true;
          }
        }
      ];
      assert.isFalse(inLine.isSupported());
      sinon.assert.calledOnce(spy);
    });

  });
});