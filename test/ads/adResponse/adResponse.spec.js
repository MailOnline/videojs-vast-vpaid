describe.only("AdResponse", function () {
  function assertAdResponseEmpty(response) {
    assert.deepEqual(response, new AdResponse());
  }

  function getAdChain() {
    var adChain = [];

    [
      fixture.getXmlFixture('wrapper'),
      fixture.getXmlFixture('wrapper2'),
      fixture.getXmlFixture('ad')
    ].forEach(function (adXml) {
        var vastJTree = xml.toJXONTree(adXml);
        adChain.push(new Ad(vastJTree.ad));
    });

    return adChain;
  }

  var adChain, wrapper, wrapper2, ad;

  beforeEach(function () {
    adChain = getAdChain();
    wrapper = adChain[0];
    wrapper2 = adChain[1];
    ad = adChain[2];

  });

  describe("constructor", function () {
    it("must throw an exception if you don't pass a valid ad chain", function () {
      assert.throws(function () {
        new AdResponse();
      }, AdError, 'Ad Error: AdResponse Constructor, the passed ad chain is invalid or empty');

      assert.throws(function () {
        new AdResponse([]);
      }, AdError, 'Ad Error: AdResponse Constructor, the passed ad chain is invalid or empty');
    });
  });

  it("must contain the original adChain", function () {
    var response = new AdResponse(adChain);
    assert.equal(response.adChain, adChain);
  });

  describe("adTitle", function(){
    it("must contain the adTitle", function(){
      var response = new AdResponse(adChain);
      assert.equal(response.adTitle, "Test Video Ad");
    });

    it("must be empty if there is no title", function(){
      ad.inLine.adTitle = undefined;
      var response = new AdResponse(adChain);
      assert.equal(response.adTitle, "");
    });
  });

  describe("errors", function(){
    it("must be an array", function(){
      var response = new AdResponse(adChain);
      assert.isArray(response.errors);
    });

    it("must contain all the errorUrlMacros of the adChain", function(){
      var response = new AdResponse(adChain);

      assert.deepEqual(response.errors, [
        'http://mol.wrapper.error[ERRORCODE]',
        'http://mol.wrapper2.error[ERRORCODE]',
        'http://molads.error.html?label=videoplayfailed[ERRORCODE]'
      ]);
    });

    it("must only add the existing urlMacros", function(){
      wrapper.wrapper.error = undefined;
      var response = new AdResponse(adChain);

      assert.deepEqual(response.errors, [
        'http://mol.wrapper2.error[ERRORCODE]',
        'http://molads.error.html?label=videoplayfailed[ERRORCODE]'
      ]);
    });
  });

  describe("impressions", function () {
    it("must be an array", function () {
      var response = new AdResponse(adChain);
      assert.isArray(response.impressions);
    });

    it("must contain all the impression macros of the adChain", function(){
      var response = new AdResponse(adChain);
      assert.deepEqual(response.impressions, [
        'http://mol.wrapper.impression',
        'http://mol.wrapper2.impression',
        'http://mol.wrapper2.impression2',
        'http://mol.adview?video01'
      ]);
    });
  });

  describe("linear", function(){
    it("must be an obj", function(){
      var response = new AdResponse(adChain);
      assert.isObject(response.linear);
    });

    it("must not be added if the adChain had no Linear", function(){
      var emptyVASTAdXML = '<?xml version="1.0" encoding="UTF-8"?>'+
                          '<VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="3.0">'+
                          '<Ad><InLine><Creatives></Creatives></InLine></Ad></VAST>';
      var emptyAd = new Ad( xml.toJXONTree(emptyVASTAdXML).ad);
      var response = new AdResponse([emptyAd]);
      assert.isUndefined(response.linear);
    });

    it("must contain the duration", function(){
      var response = new AdResponse(adChain);
      assert.equal(response.linear.duration, 19000);
    });

    it("must contain the adChain tracking events", function(){
      var response = new AdResponse(adChain);
      assert.deepEqual(response.linear.trackingEvents, {
          "start":[
            {"name":"start","uri":"http://mol.wrapper.track.start"},
            {"name":"start","uri":"http://mol.wrapper.track.start2"},
            {"name":"start","uri":"http://mol.track.start"},
            {"name":"start","uri":"http://mol.track.start2"}
          ],
          "firstQuartile":[
            {"name":"firstQuartile","uri":"http://mol.wrapper.track.firstquartile"},
            {"name":"firstQuartile","uri":"http://mol.wrapper2.track.firstquartile"},
            {"name":"firstQuartile","uri":"http://mol.track.firstquartile"}
          ],
          "midpoint":[
            {"name":"midpoint","uri":"http://mol.wrapper.track.midpoint"},
            {"name":"midpoint","uri":"http://mol.wrapper2.track.midpoint"},
            {"name":"midpoint","uri":"http://mol.track.midpoint"}
          ],
          "thirdQuartile":[
            {"name":"thirdQuartile","uri":"http://mol.wrapper.track.thirdquartile"},
            {"name":"thirdQuartile","uri":"http://mol.wrapper2.track.thirdquartile"},
            {"name":"thirdQuartile","uri":"http://mol.track.thirdquartile"}
          ],
          "complete":[
            {"name":"complete","uri":"http://mol.wrapper.track.complete"},
            {"name":"complete","uri":"http://mol.wrapper.track.complete2"},
            {"name":"complete","uri":"http://mol.wrapper2.track.complete"},
            {"name":"complete","uri":"http://mol.wrapper2.track.complete2"},
            {"name":"complete","uri":"http://mol.track.complete"},
            {"name":"complete","uri":"http://mol.track.complete2"}
          ],
          "mute":[
            {"name":"mute","uri":"http://mol.wrapper.track.complete"},
            {"name":"mute","uri":"http://mol.wrapper2.track.complete"},
            {"name":"mute","uri":"http://mol.track.complete"}
          ],
          "unmute":[
            {"name":"unmute","uri":"http://mol.wrapper.track.unmute"},
            {"name":"unmute","uri":"http://mol.wrapper2.track.unmute"},
            {"name":"unmute","uri":"http://mol.track.unmute"}
          ],
          "rewind":[
            {"name":"rewind","uri":"http://mol.wrapper.track.rewind"},
            {"name":"rewind","uri":"http://mol.wrapper2.track.rewind"},
            {"name":"rewind","uri":"http://mol.track.rewind"}
          ],
          "pause":[
            {"name":"pause","uri":"http://mol.wrapper.track.pause"},
            {"name":"pause","uri":"http://mol.wrapper2.track.pause"},
            {"name":"pause","uri":"http://mol.track.pause"}
          ],
          "resume":[
            {"name":"resume","uri":"http://mol.wrapper.track.resume"},
            {"name":"resume","uri":"http://mol.wrapper2.track.resume"},
            {"name":"resume","uri":"http://mol.track.resume"}
          ],
          "fullscreen":[
            {"name":"fullscreen","uri":"http://mol.wrapper.track.fullscreen"},
            {"name":"fullscreen","uri":"http://mol.wrapper2.track.fullscreen"},
            {"name":"fullscreen","uri":"http://mol.track.fullscreen"}
          ],
          "creativeView":[
            {"name":"creativeView","uri":"http://mol.wrapper.track.creativeview"},
            {"name":"creativeView","uri":"http://mol.wrapper2.track.creativeview"},
            {"name":"creativeView","uri":"http://mol.track.creativeview"}
          ],
          "exitFullscreen":[
            {"name":"exitFullscreen","uri":"http://mol.wrapper.track.exitfullscreen"},
            {"name":"exitFullscreen","uri":"http://mol.wrapper2.track.exitfullscreen"},
            {"name":"exitFullscreen","uri":"http://mol.track.exitfullscreen"}
          ],
          "acceptInvitationLinear":[
            {"name":"acceptInvitationLinear","uri":"http://mol.wrapper.track.acceptinvitationlinear"},
            {"name":"acceptInvitationLinear","uri":"http://mol.wrapper2.track.acceptinvitationlinear"},
            {"name":"acceptInvitationLinear","uri":"http://mol.track.acceptinvitationlinear"}
          ],
          "closeLinear":[
            {"name":"closeLinear","uri":"http://mol.wrapper.track.closelinear"},{
            "name":"closeLinear","uri":"http://mol.wrapper2.track.closelinear"},
            {"name":"closeLinear","uri":"http://mol.track.closelinear"}
          ]
        });
    });

    it("must contain the clickThrough", function(){
      var response = new AdResponse(adChain);
      assert.equal(response.linear.clickThrough, 'http://mol.clickthrough');
    });

    it("must contain the clickTrackings", function(){
      var response = new AdResponse(adChain);
      assert.deepEqual(response.linear.clickTrackings, [
        'http://mol.wrapper.track.click',
        'http://mol.wrapper.track.click2',
        'http://mol.wrapper2.track.click',
        'http://mol.wrapper2.track.click2',
        'http://mol.track.click'

      ]);
    });
  });


  describe.skip("instance", function () {
    var response;

    beforeEach(function () {
      response = new AdResponse();
    });

    // FIELDS

    describe("customClicks", function () {
      it("must be an array", function () {
        assert.isArray(response.customClicks);
      });
    });

    describe("mediaFiles", function () {
      it("must be an empty array by default", function () {
        assertEmptyArray(response.mediaFiles);
      });
    });

    describe("skipoffset", function () {
      it("must be undefined by default", function () {
        assert.isUndefined(response.skipoffset);
      });
    });

    //HELPER FUNCTIONS

    describe("addAd", function () {
      it("must add the passed ad to the ads array", function () {
        var vastJTree = xml.toJXONTree('<VAST><Ad></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        response.addAd(ad);
        assert.deepEqual([ad], response.ads);
      });

      it("must not add anything if undefined", function () {
        response.addAd();
        assert.deepEqual([], response.ads);
      });

      it("must not add anything if the passed ad is not an instance of Ad", function () {
        response.addAd(xml.toJXONTree('<VAST><Ad></Ad></VAST>'));
        assert.deepEqual([], response.ads);
      });

      it("must add the inline to the response if the passed ad has an Inline", function () {
        var vastJTree = xml.toJXONTree('<VAST><Ad><InLine></InLine></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        sinon.stub(response, '_addInLine');
        response.addAd(ad);
        sinon.assert.calledWithExactly(response._addInLine, ad.inLine);
      });

      it("must add the wrapper to the response if the passed ad has a wrapper", function () {
        var vastJTree = xml.toJXONTree('<VAST><Ad><Wrapper></Wrapper></Ad></VAST>');
        var ad = new Ad(vastJTree.ad);
        sinon.stub(response, '_addWrapper');
        response.addAd(ad);
        sinon.assert.calledWithExactly(response._addWrapper, ad.wrapper);
      });
    });


    describe("_addErrorTrackUrl", function () {
      it("must be possible to pass the error as a string", function () {
        response._addErrorTrackUrl('http://t4.liverail.com/?metric=error&erc=[ERRORCODE]');
        assert.deepEqual(['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]'], response.errorURLMacros);
      });

      it("must add the passed error to the errorURLMacros", function () {
        var vastJTree = xml.toJXONTree('<VAST><Error><![CDATA[http://t4.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></VAST>');
        response._addErrorTrackUrl(vastJTree.error);
        assert.deepEqual(['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]'], response.errorURLMacros);
      });

      it("must not add anything if the error has no URL template", function () {
        var vastJTree = xml.toJXONTree('<VAST><Error><![CDATA[]]></Error></VAST>');
        response._addErrorTrackUrl(vastJTree.error);
        assert.deepEqual([], response.errorURLMacros);
      });

      it("must not add anything if you pass undefined", function () {
        response._addErrorTrackUrl();
        assert.deepEqual([], response.errorURLMacros);
      });
    });

    describe("addClickTrough", function () {
      it("must not add anything if you don't pass a url str", function () {
        response._addClickThrough();
        response._addClickThrough({});
        response._addClickThrough('');
        assert.isUndefined(response.clickThrough);
      });

      it("must add the passed clickthrough to the response ", function () {
        response._addClickThrough('http://wwww.clickThrough.url.com');
        assert.equal('http://wwww.clickThrough.url.com', response.clickThrough);
      });
    });

    describe("_addClickTrackings", function () {
      it("must not add any clickTracking if you don't pass an array of tracking urls", function () {
        response._addClickTrackings();
        response._addClickTrackings({});
        response._addClickTrackings('');
        response._addClickTrackings([]);
        assertEmptyArray(response.clickTrackings);
      });

      it("must add all the passed clickTrackings to the response", function () {
        response._addClickTrackings([
          'http://ClickTracking1',
          'http://ClickTracking2'
        ]);

        assert.deepEqual([
          'http://ClickTracking1',
          'http://ClickTracking2'
        ], response.clickTrackings);
      });
    });

    describe("_addCustomClicks", function () {
      it("must not add any customClick unless you pass an array with them inside", function () {
        response._addCustomClicks();
        response._addCustomClicks({});
        response._addCustomClicks('');
        response._addCustomClicks([]);
        assertEmptyArray(response.customClicks);
      });

      it("must add all the passed customCustom clicks to the response", function () {
        response._addCustomClicks([
          'http://CustomClick1',
          'http://CustomClick2'
        ]);

        assert.deepEqual([
          'http://CustomClick1',
          'http://CustomClick2'
        ], response.customClicks);
      });
    });

    describe("_addVideoClicks", function () {
      it("must not add anything to the response if you don't pass an instace of Inline", function () {
        response._addVideoClicks();
        response._addVideoClicks({});
        response._addVideoClicks([]);
        response._addVideoClicks('');
        assertAdResponseEmpty(response);
      });

      it("must add the clickThrough to the response", function () {
        var videoClicksXML = '<VideoClicks><ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough></VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.equal(response.clickThrough, 'http://www.target.com');
      });

      it("must add the clickTrackings to the response", function () {
        var videoClicksXML = '<VideoClicks>' +
          '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
          '<ClickTracking><![CDATA[ http://www.tracking2.com ]]></ClickTracking>' +
          '</VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.deepEqual(response.clickTrackings,
          [
            'http://www.tracking1.com',
            'http://www.tracking2.com'
          ]);
      });

      it("must add the customClicks to the response", function () {
        var videoClicksXML = '<VideoClicks>' +
          '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
          '<CustomClick><![CDATA[ http://www.tracking2.com ]]></CustomClick>' +
          '</VideoClicks>';
        var videoClicks = new VideoClicks(xml.toJXONTree(videoClicksXML));

        response._addVideoClicks(videoClicks);
        assert.deepEqual(response.customClicks,
          [
            'http://www.tracking1.com',
            'http://www.tracking2.com'
          ]);
      });
    });

    describe("_addMediaFiles", function () {
      it("must not add any mediaFile unless you pass an array with them inside", function () {
        response._addMediaFiles();
        response._addMediaFiles({});
        response._addMediaFiles('');
        response._addMediaFiles([]);
        assertEmptyArray(response.mediaFiles);
      });

      it("must add the passed mediaFiles to the response", function () {
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear>' +
          '<MediaFiles>' +
          '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '<MediaFile id="2" delivery="streaming" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '</MediaFiles>' +
          '</Linear>';
        var linear = Linear(xml.toJXONTree(linearXML));

        response._addMediaFiles(linear.mediaFiles);
        assert.deepEqual(response.mediaFiles, linear.mediaFiles);
      });
    });

    describe("_addLinear", function () {
      it("must not add anything to the response if you don't pass an instace of Inline", function () {
        response._addLinear();
        response._addLinear({});
        response._addLinear([]);
        response._addLinear('');
        assertAdResponseEmpty(response);
      });

      it("must add the duration to the response", function () {
        var linearXML = '<Linear><Duration>00:00:58</Duration></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);
        assert.equal(response.duration, 58000);
      });

      it("must add the trackings to the response", function () {
        var linearXML = '<Linear><TrackingEvents>' +
          '<Tracking event="firstQuartile"><![CDATA[ http://www.tracking1.com ]]></Tracking>' +
          '</TrackingEvents></Linear>';
        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);
        assert.equal(response.trackingEvents.firstQuartile.length, 1);
      });

      it("must add the videoClicks to the response", function () {
        var linearXML = '<Linear><VideoClicks>' +
          '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
          '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
          '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
          '</VideoClicks></Linear>';

        var linear = new Linear(xml.toJXONTree(linearXML));
        response._addLinear(linear);

        assert.deepEqual(response.clickThrough, 'http://www.target.com');
        assert.deepEqual(response.clickTrackings, ['http://www.tracking1.com']);
        assert.deepEqual(response.customClicks, ['http://www.tracking1.com']);
      });

      it("must add the mediaFiles to the response", function () {
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear><MediaFiles>' +
          '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
          '</MediaFile>' +
          '</MediaFiles></Linear>';
        var linear = Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.deepEqual(response.mediaFiles, linear.mediaFiles);
      });

      it("must add the skipoffset to the response", function () {
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear skipoffset="00:00:01.000"></Linear>';
        var linear = Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.equal(response.skipoffset, 1000);
      });

      it("must add the adParameters to the response", function () {
        var linearXML = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Linear>' +
          '<AdParameters xmlEncoded="true"><![CDATA[' + xml.encode('<data>Some Data</data>') + ']]></AdParameters>' +
          '</Linear>';
        var linear = Linear(xml.toJXONTree(linearXML));

        response._addLinear(linear);
        assert.equal(response.adParameters, '<data>Some Data</data>');
      });
    });

    describe("_addInLine", function () {
      it("must not add anything to the response if you don't pass an instance of Inline", function () {
        response._addInLine();
        response._addInLine({});
        response._addInLine([]);
        response._addInLine('');
        assertAdResponseEmpty(response);
      });

      it("must add the title to the response", function () {
        var inLine = new InLine(xml.toJXONTree('<InLine><AdTitle>Foo title</AdTitle></InLine>'));
        response._addInLine(inLine);
        assert.equal(response.adTitle, 'Foo title');
      });

      it("must add the error url macro to the response", function () {
        var inLine = new InLine(xml.toJXONTree('<InLine><Error><![CDATA[http://errorUrl[ERRORCODE]]]></Error></InLine>'));
        response._addInLine(inLine);
        assert.deepEqual(response.errorURLMacros, ['http://errorUrl[ERRORCODE]']);

      });

      it("must add the impressions to the response", function () {
        var impressionXML = '<Inline>' +
          '<Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression>' +
          '<Impression><![CDATA[http://Impression2.url.track.com]]></Impression>' +
          '<Impression id="1111"></Impression>' +
          '</Inline>';
        var inLine = new InLine(xml.toJXONTree(impressionXML));
        response._addInLine(inLine);

        assert.deepEqual([
            "http://Impression.url.track.com",
            "http://Impression2.url.track.com"
          ],
          response.impressions);
      });

      it("must add the linear to the response", function () {
        var inlineXML = '<InLine><Creatives><Creative><Linear><Duration>00:00:58</Duration></Linear></Creative></Creatives></InLine>';
        var inLine = new InLine(xml.toJXONTree(inlineXML));
        response._addInLine(inLine);
        assert.equal(response.duration, 58000);// The duration gets added as part of the linear
      });
    });

    describe("_addWrapper", function () {
      it("must not add anything to the response if you don't pass an instance of Wrapper", function () {
        response._addWrapper();
        response._addWrapper({});
        response._addWrapper([]);
        response._addWrapper('');
        assertAdResponseEmpty(response);
      });

      it("must add the error url macro to the response", function () {
        var wrapper = new Wrapper(xml.toJXONTree('<Wrapper><Error><![CDATA[http://errorUrl[ERRORCODE]]]></Error></Wrapper>'));
        response._addWrapper(wrapper);
        assert.deepEqual(response.errorURLMacros, ['http://errorUrl[ERRORCODE]']);
      });

      it("must add the impressions to the response", function () {
        var wrapperXML = '<Wrapper>' +
          '<Impression id="1234"><![CDATA[http://Impression.url.track.com]]></Impression>' +
          '<Impression><![CDATA[http://Impression2.url.track.com]]></Impression>' +
          '<Impression id="1111"></Impression>' +
          '</Wrapper>';
        var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
        response._addWrapper(wrapper);

        assert.deepEqual([
            "http://Impression.url.track.com",
            "http://Impression2.url.track.com"
          ],
          response.impressions);
      });

      describe("with linear creative", function () {
        it("must add the videoClicks", function () {
          var wrapperXML = '<Wrapper><Creatives><Creative><Linear><VideoClicks>' +
            '<ClickThrough><![CDATA[ http://www.target.com ]]></ClickThrough>' +
            '<CustomClick><![CDATA[ http://www.tracking1.com ]]></CustomClick>' +
            '<ClickTracking><![CDATA[ http://www.tracking1.com ]]></ClickTracking>' +
            '</VideoClicks></Linear></Creative></Creatives></Wrapper>';

          var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
          response._addWrapper(wrapper);

          assert.isUndefined(response.clickThrough);
          assert.deepEqual(response.clickTrackings, ['http://www.tracking1.com']);
          assert.deepEqual(response.customClicks, ['http://www.tracking1.com']);
        });

        it("must add the trackingEvents", function () {
          var wrapperXML = '<Wrapper><Creatives><Creative><Linear><TrackingEvents>' +
            '<Tracking event="firstQuartile"><![CDATA[ http://www.tracking1.com ]]></Tracking>' +
            '</TrackingEvents></Linear></Creative></Creatives></Wrapper>';

          var wrapper = new Wrapper(xml.toJXONTree(wrapperXML));
          response._addWrapper(wrapper);
          assert.equal(response.trackingEvents.firstQuartile.length, 1);
        });
      });

    });
  });
});