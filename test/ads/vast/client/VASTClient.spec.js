describe("VASTClient", function () {

  function assertError(callback, msg, code) {
    var error = firstArg(callback);
    assert.instanceOf(error, VASTError);
    assert.equal(error.message, "VAST Error: " + msg);
    if (code) {
      assert.equal(error.code, code);
    }
  }

  function assertNoError(callback) {
    assert.isNull(firstArg(callback));
  }

  function assertThrowsVASTError(fn, msg, code) {
    try {
      fn();
    } catch (e) {
      assert.instanceOf(e, VASTError);
      assert.equal(e.message, "VAST Error: " + msg);
      if(code) {
        assert.equal(code, e.code);
      }
      return;
    }
    assert.fail(null, fn, 'Expected passed function to throw a VASTError');
  }

  function vastXML(childNodes) {
    childNodes = childNodes || '';
    return '<?xml version="1.0" encoding="utf-8"?>' +
      '<VAST version="3.0">' + childNodes + '</VAST>';
  }

  function vastAdXML(childNodes) {
    childNodes = childNodes || '';
    return vastXML('<Ad>' + childNodes + '</Ad>');
  }

  function vastInLineXML(childNodes) {
    childNodes = childNodes || '';
    return vastXML('<Ad><InLine>' + childNodes + '</InLine></Ad>');
  }

  function createProgressTrackEvent(uri, offset) {
    var trackingXML = '<Tracking event="progress" offset="' + offset + '">' +
      '<![CDATA[' + uri + ']]>' +
      '</Tracking>';
    return new TrackingEvent(xml.toJXONTree(trackingXML));
  }

  it("must be a constructor", function () {
    assert.isFunction(VASTClient);
  });

  it("must return an instance of VASTClient if you execute the function", function () {
    assert.instanceOf(VASTClient(), VASTClient);
  });

  describe("instance", function () {
    var vast;

    beforeEach(function () {
      vast = new VASTClient();
    });

    describe("getVASTResponse", function(){
      var flushVASTXmlRequest, callback;

      beforeEach(function(){
        this.clock = sinon.useFakeTimers();
        sinon.stub(vast, '_requestVASTXml', noop);
        callback = sinon.spy();

        flushVASTXmlRequest = function (error, vastXML) {
          var cb;
          cb = secondArg(vast._requestVASTXml);
          cb(error, vastXML);
          this.clock.tick(1);
        }.bind(this);
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must pass the VASTResponse to the callback", function() {
        var response;
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick(1);
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>'));

        sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI.com');
        flushVASTXmlRequest(null, vastInLineXML('<Creatives><Creative><Linear>' +
        '<Duration>00:00:58</Duration>' +
        '</Linear></Creative></Creatives>'));

        this.clock.tick(10);
        assertNoError(callback);
        response = secondArg(callback);

        assert.instanceOf(response, VASTResponse);
      });

      it("must track the error if a problem occur while getting the VASTResponse", function(){
        vast.WRAPPER_LIMIT = 1;
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick(1);
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>'));

        assertError(callback, 'on VASTClient._getAd, players wrapper limit reached (the limit is 1)', 302);
      });

      it("must track a 102 error if the VAST version is not 2.0 or 3.0", function(){
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick(1);
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, '<VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="1.0">' +
        '<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>' +
        '</VAST>');

        assertError(callback, 'on VASTClient.buildVastTree, not supported VAST version "1"', 102);
      });
    });

    describe("_sendVASTResponse", function () {
      var sendVASTResponse, callback, sendResponse, error, response, origTrack;

      function assertVASTTrackRequest(URLs, variables) {
        URLs = isArray(URLs) ? URLs : [URLs];
        sinon.assert.calledWithExactly(vastUtil.track, URLs, variables);
      }

      beforeEach(function () {
        vast.errorURLMacros.push('http://t4.liverail.com/?metric=error&erc=[ERRORCODE]');
        sendVASTResponse = VAST.sendVASTResponse;
        callback = sinon.spy();
        sendResponse = vast._sendVASTResponse(callback);
        error = new VASTError('foo error');
        response = new VASTResponse();

        //We stub vastUtil.track
        origTrack = vastUtil.track;
        vastUtil.track = sinon.spy();
      });

      afterEach(function () {
        vastUtil.track = origTrack;
      });

      it("must return a function", function () {
        assert.isFunction(vast._sendVASTResponse(noop));
      });

      describe("with error", function () {
        it("must call the callback passing the error obj and the response", function () {
          sendResponse(error, null);
          sinon.assert.calledWithExactly(callback, error, null);
        });

        it("must try to track the error if there is a response", function () {
          sendResponse(error, response);
          sinon.assert.calledWithExactly(callback, error, response);
          assertVASTTrackRequest("http://t4.liverail.com/?metric=error&erc=[ERRORCODE]", {ERRORCODE: 900});
        });

        it("must use the error code if provided on the error object", function () {
          error = new VASTError('foo error', 101);
          sendResponse(error, response);
          sinon.assert.calledWithExactly(callback, error, response);
          assertVASTTrackRequest("http://t4.liverail.com/?metric=error&erc=[ERRORCODE]", {ERRORCODE: 101});
        });
      });

      describe("with no Error", function () {
        it("must call the callback with null as the error obj and the passed response", function () {
          sendResponse(null, response);
          sinon.assert.calledWithExactly(callback, null, response);
        });

        it("must not track anything", function () {
          sendResponse(null, response);
          sinon.assert.calledWithExactly(callback, null, response);
          sinon.assert.notCalled(vastUtil.track);
        });
      });
    });

    describe("getAd", function () {
      var callback;

      beforeEach(function(){
        this.clock = sinon.useFakeTimers();
        callback = sinon.spy();
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must ensure that the first argument is a URL", function () {
        assert.throws(function () {
          vast._getAd();
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing ad tag URL');

        assert.doesNotThrow(function () {
          vast._getAd('http://foo.bar', noop);
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing ad tag URL');
      });

      it("must call the callback with an explanatory error if the url is missing but the callback is set", function () {
        var callback = sinon.spy();
        vast._getAd(null, callback);
        assertError(callback, 'on VASTClient._getAd, missing ad tag URL');
        assert.isNull(secondArg(callback));
      });

      it("must be possible to pass an options argument as the first parameter that contains the URL", function () {
        assert.throws(function () {
          vast._getAd({});
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing ad tag URL');

        assert.doesNotThrow(function () {
          vast._getAd({adTagUrl: 'http://foo.bar'}, noop);
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing ad tag URL');
      });

      it("must ensure that you pass a callback function", function () {
        assert.throws(function () {
          vast._getAd('http://fake.url');
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing callback function');

        assert.doesNotThrow(function () {
          vast._getAd('http://foo.bar', noop);
        }, VASTError, 'VAST Error: on VASTClient._getAd, missing callback function');
      });

      it("must request the VASTXml", function(){
        sinon.stub(vast, '_requestVASTXml', noop);
        vast._getAd('http://FAKE.URL', callback);
        this.clock.tick(1);
        sinon.assert.calledWith(vast._requestVASTXml, 'http://FAKE.URL');
      });

      it("must call the callback with a VASTError if we reach the WRAPPER_LIMIT on ad requests", function(){
        vast.WRAPPER_LIMIT = 2;
        vast._getAd({
          adTagUrl: 'http://fake.url',
          ads: [
            new Ad(xml.toJXONTree(vastAdXML())),
            new Ad(xml.toJXONTree(vastAdXML()))
          ]
        }, callback);

        assertError(callback, "on VASTClient._getAd, players wrapper limit reached (the limit is " + vast.WRAPPER_LIMIT + ")", 302);
      });

      describe("must return an ad chain array", function(){
        var flushVASTXmlRequest;

        beforeEach(function(){
          sinon.stub(vast, '_requestVASTXml', noop);

          flushVASTXmlRequest = function (error, vastXML) {
            var cb;
            cb = secondArg(vast._requestVASTXml);
            cb(error, vastXML);
            this.clock.tick(1);
          }.bind(this);
        });

        it("with all the ads requested to get the final Inline ad.", function() {
          var adsChain;
          vast._getAd('http://fake.url', callback);
          this.clock.tick(1);
          sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
          flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>'));

          sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI.com');
          flushVASTXmlRequest(null, vastInLineXML('<Creatives><Creative><Linear>' +
          '<Duration>00:00:58</Duration>' +
          '</Linear></Creative></Creatives>'));

          assertNoError(callback);
          adsChain = secondArg(callback);

          assert.isArray(adsChain);
          assert.equal(adsChain.length, 2);
          assert.equal(adsChain[0].wrapper.VASTAdTagURI, 'http://VASTAdTagURI.com');
          assert.equal(adsChain[1].inLine.creatives[0].linear.duration, 58000);
        });

        it("built searching for a possible valid ad on all the ads returned by the VAST response", function(){
          var adsChain;
          vast._getAd('http://fake.url', callback);
          this.clock.tick(1);
          sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
          flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>' +
          '<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI2.com]]></VASTAdTagURI></Wrapper></Ad>' +
          '<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI3.com]]></VASTAdTagURI></Wrapper></Ad>'));

          sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI.com');
          flushVASTXmlRequest(new VASTError('fake error'));

          sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI2.com');
          flushVASTXmlRequest(new VASTError('fake error'));

          sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI3.com');
          flushVASTXmlRequest(null, vastInLineXML('<Creatives><Creative><Linear>' +
          '<Duration>00:00:58</Duration>' +
          '</Linear></Creative></Creatives>'));

          assertNoError(callback);
          adsChain = secondArg(callback);

          assert.isArray(adsChain);
          assert.equal(adsChain.length, 2);
          assert.equal(adsChain[0].wrapper.VASTAdTagURI, 'http://VASTAdTagURI3.com');
          assert.equal(adsChain[1].inLine.creatives[0].linear.duration, 58000);
        });
      });
    });

    describe("_requestVASTXml", function () {
      var xhr, requests, adTagUrl;

      beforeEach(function () {
        adTagUrl = 'http://foo.bar';
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
          requests.push(xhr);
        };
      });

      afterEach(function () {
        xhr.restore();
      });

      it("must request the VAST response using the passed adTagUrl", function () {
        vast._requestVASTXml(adTagUrl, noop);
        assert.equal(1, requests.length);
        assert.equal('http://foo.bar/', requests[0].url);
      });

      it("must pass an error to the callback if http service throws an exception", function(){
        var callback = sinon.spy();
        xhr.onCreate = function() {
          throw new Error('Error creating xhr');
        };

        vast._requestVASTXml(adTagUrl, callback);

        sinon.assert.calledWithExactly(callback, sinon.match(Error));
        assert.equal(firstArg(callback).message, 'Error creating xhr');
      });

      describe("on XHR GET request error", function () {
        it("must call the callback with an explanatory error and the VASTResponse", function () {
          var callback = sinon.spy();
          vast._requestVASTXml(adTagUrl, callback);
          requests[0].respond(404, {"Content-Type": "application/json"}, '404 Not found');

          assertError(callback, "on VASTClient.requestVastXML, HTTP request error with status '404'", 301);
        });
      });

      describe("on XHR GET request success", function () {
        it("must pass the response and the data object to the callback", function () {
          var callback = sinon.spy();
          vast._requestVASTXml(adTagUrl, callback);
          requests[0].respond(200, {"Content-Type": "application/json"}, vastAdXML());
          sinon.assert.calledWithExactly(callback, null, vastAdXML());
        });
      });

      describe("with adTagUrl fn", function(){
        it("must request the XML using the passed adTagUrl function", function(){
          var spy = sinon.spy();
          vast._requestVASTXml(spy, noop);
          assert.equal(0, requests.length);
          sinon.assert.calledWithExactly(spy, sinon.match.func);
        });

        it("on error, must call the callback with an explanatory error and the VASTResponse", function(){
          var callback = sinon.spy();
          var adTagXMLSpy = sinon.spy();
          vast._requestVASTXml(adTagXMLSpy, callback);
          var handler = firstArg(adTagXMLSpy);
          handler(new Error('meeec'), null);
          assertError(callback, "on VASTClient.requestVastXML, Error getting the the VAST XML with he passed adTagXML fn", 301);
        });

        it("must pass the response and the data object to the callback", function(){
          var callback = sinon.spy();
          var adTagXMLSpy = sinon.spy();
          vast._requestVASTXml(adTagXMLSpy, callback);
          var handler = firstArg(adTagXMLSpy);
          handler(null, vastAdXML());
          sinon.assert.calledWithExactly(callback, null, vastAdXML());

        });
      });
    });

    describe("_buildVastTree", function () {
      it("must return the VASTTree of the passed vast XML", function () {
        var vastTree = vast._buildVastTree(vastAdXML());
        var actual = xml.toJXONTree(vastAdXML());
        actual.ads = [actual.ad];
        assert.deepEqual(actual, vastTree);
      });

      it("must throw an explanatory error if there is a problem parsing the xml", function () {
        assertThrowsVASTError(function () {
          vast._buildVastTree('<invalid xml');
        }, 'on VASTClient.buildVastTree, error parsing xml', 100);
      });

      it("must throw an error with 303 errorCode if the VAST tree has no ad/ads", function () {
        assertThrowsVASTError(function () {
          vast._buildVastTree(vastXML());
        }, 'on VASTClient.buildVastTree, no Ad in VAST tree', 303);
      });

      it("must add a convenient ads property containing all the ads of the vastXML", function(){
        var vastTree = vast._buildVastTree(vastAdXML());
        assert.deepEqual(vastTree.ads, [vastTree.ad]);

        vastTree = vast._buildVastTree(vastXML('<Ad></Ad><Ad></Ad>'));
        assert.deepEqual(vastTree.ads, vastTree.ad);
      });

    });

    describe("_buildAd", function(){
      it("must given a valid ad jxon tree return an instance of Ad", function(){
        var adTree = xml.toJXONTree(vastInLineXML('<Creatives><Creative></Creative></Creatives>')).ad;
        assert.instanceOf(vast._buildAd(adTree), Ad);
      });

      it("must throw an error if there was an unexpected error while creating the Ad", function(){
        //We stub Ad constructor
        var AdConstructor = Ad;
        window.Ad = function (){
          throw new Error('there was an unexpected error building the Ad');
        };
        var adTree = xml.toJXONTree(vastInLineXML()).ad;

        assertThrowsVASTError(function () {
          vast._buildAd(adTree);
        }, "on VASTClient._buildAd, there was an unexpected error building the Ad", 900);

        //We restore Ad constructor
        window.Ad = AdConstructor;
      });

      it("must throw an error if the ad does not contain an Inline or a wrapper", function(){
        var adTree = xml.toJXONTree(vastAdXML()).ad;

        assertThrowsVASTError(function () {
          vast._buildAd(adTree);
        }, "on VASTClient._buildAd, nor wrapper nor inline elements found on the Ad", 101);
      });

      it("must throw an error if the ad contain an inline element and a wrapper ", function(){
        var adXml = vastAdXML('<InLine></InLine><Wrapper></Wrapper>');
        var adTree = xml.toJXONTree(adXml).ad;

        assertThrowsVASTError(function () {
          vast._buildAd(adTree);
        }, 'on VASTClient._buildAd, InLine and Wrapper both found on the same Ad', 101);
      });

      it("must throw an error if the inline has no creative element", function(){
        var adTree = xml.toJXONTree(vastInLineXML()).ad;

        assertThrowsVASTError(function () {
          vast._buildAd(adTree);
        }, "on VASTClient._buildAd, missing creative in InLine element", 101);
      });

      it("must throw an error if the wrapper has no VASTAdTagURI", function(){
        var adXml = vastAdXML('<Wrapper></Wrapper>');
        var adTree = xml.toJXONTree(adXml).ad;

        assertThrowsVASTError(function () {
          vast._buildAd(adTree);
        }, "on VASTClient._buildAd, missing 'VASTAdTagURI' in wrapper", 101);
      });

      it("must add the error from the wrapper or the inline to this.errorURLMacros", function(){
        var adTree = xml.toJXONTree(vastInLineXML('<Error><![CDATA[http://t4.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error>' +
        '<Creatives><Creative></Creative></Creatives>')).ad;
        vast._buildAd(adTree);
        assert.deepEqual(vast.errorURLMacros, ['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]']);

        vast.errorURLMacros.length = 0;
        var adXml = vastAdXML('<Wrapper>' +
        '<Error><![CDATA[http://t4.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error>' +
        '<VASTAdTagURI><![CDATA[http://demo.tremormedia.com/proddev/vast/vast_inline_linear.xml]]></VASTAdTagURI>' +
        '</Wrapper>');
        adTree = xml.toJXONTree(adXml).ad;
        vast._buildAd(adTree);
        assert.deepEqual(vast.errorURLMacros, ['http://t4.liverail.com/?metric=error&erc=[ERRORCODE]']);
      });
    });

    describe("_buildVASTResponse", function(){
      var ads, wrapperAd, wrapperAd2, inLineAd;

      beforeEach(function(){
        var wrapperAdTree = xml.toJXONTree(vastAdXML('<Wrapper></Wrapper>')).ad;
        var wrapperAd2Tree = xml.toJXONTree(vastAdXML('<Wrapper></Wrapper>')).ad;
        var inlineAdTree = xml.toJXONTree(vastInLineXML('<Creatives>' +
        '<Creative>' +
        '<Linear>' +
        '<Duration>00:00:58</Duration>' +
        '<MediaFiles>' +
        '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
        '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
        '</MediaFile>' +
        '<MediaFile id="2" delivery="streaming" type="video/x-flv" bitrate="457" width="300" height="225">' +
        '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
        '</MediaFile>' +
        '</MediaFiles>' +
        '</Linear></Creative></Creatives>')).ad;

        ads = [];
        wrapperAd = new Ad(wrapperAdTree);
        wrapperAd2 = new Ad(wrapperAd2Tree);
        inLineAd = new Ad(inlineAdTree);

        ads.push(wrapperAd);
        ads.push(wrapperAd2);
        ads.push(inLineAd);
      });

      it("must given an array of ads, build a vast response", function(){
        assert.instanceOf(vast._buildVASTResponse(ads), VASTResponse);
      });

      it("must ad the ads to the response", function(){
        var response = vast._buildVASTResponse(ads);
        assert.deepEqual(ads, response.ads);
      });

      it("must not fail validation if response duration is 0", function(){
          inLineAd.inLine.creatives[0].linear.duration = 0;
          assert.instanceOf(vast._buildVASTResponse(ads), VASTResponse);
      });

      it("must throw a VASTError if the generated response has no duration", function(){
        inLineAd.inLine.creatives[0].linear.duration = undefined;
        assertThrowsVASTError(function () {
          vast._buildVASTResponse(ads);
        }, "on VASTClient._buildVASTResponse, Missing duration field in VAST response", 101);
      });

      it("must throw an VASTError if one of the progress events have a wrong offset", function(){
        var linear = inLineAd.inLine.creatives[0].linear;
        linear.trackingEvents.push(createProgressTrackEvent('http://foo.url1', '00:00:1'));
        linear.trackingEvents.push(createProgressTrackEvent('http://foo.url2', 'fooo:00:1'));
        assertThrowsVASTError(function () {
          vast._buildVASTResponse(ads);
        }, "on VASTClient._buildVASTResponse, missing or wrong offset attribute on progress tracking event", 101);
      });

      it("must throw a vastError if the progressEvent has an offset that is not a number", function(){
        var linear = inLineAd.inLine.creatives[0].linear;
        linear.trackingEvents.push(createProgressTrackEvent('http://foo.url1', 'wrongOffset'));
        assertThrowsVASTError(function () {
          vast._buildVASTResponse(ads);
        }, "on VASTClient._buildVASTResponse, missing or wrong offset attribute on progress tracking event", 101);
      });

      it("must throw a vastError if response have no mediaFiles", function(){
         inLineAd.inLine.creatives[0].linear = undefined;
        assertThrowsVASTError(function () {
          vast._buildVASTResponse(ads);
        }, "on VASTClient._buildVASTResponse, Received an Ad type that is not supported", 200);
      });
    });
  });
});
