'use strict';

/*jslint maxlen: 700 */
describe("VASTClient", function () {

  var Ad = require('ads/vast/Ad');
  var TrackingEvent = require('ads/vast/TrackingEvent');
  var VASTClient = require('ads/vast/VASTClient');
  var VASTError = require('ads/vast/VASTError');
  var VASTResponse = require('ads/vast/VASTResponse');
  var vastUtil = require('ads/vast/vastUtil');

  var utilities = require('utils/utilityFunctions');
  var xml = require('utils/xml');

  var testUtils = require('../../test-utils');

  function assertError(callback, msg, code) {
    var error = testUtils.firstArg(callback);
    assert.instanceOf(error, VASTError);
    assert.equal(error.message, "VAST Error: " + msg);
    if (code) {
      assert.equal(error.code, code);
    }
  }

  function assertNoError(callback) {
    assert.isNull(testUtils.firstArg(callback));
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
    assert.instanceOf(new VASTClient(), VASTClient);
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
        sinon.stub(vast, '_requestVASTXml', utilities.noop);
        callback = sinon.spy();

        flushVASTXmlRequest = function (error, vastXML) {
          var cb;
          cb = testUtils.secondArg(vast._requestVASTXml);
          cb(error, vastXML);
          this.clock.tick();
        }.bind(this);
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must pass the VASTResponse to the callback", function() {
        var response;
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick();
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>'));

        sinon.assert.calledWith(vast._requestVASTXml, 'http://VASTAdTagURI.com');
        flushVASTXmlRequest(null, vastInLineXML('<Creatives><Creative><Linear>' +
        '<Duration>00:00:58</Duration>' +
        '<MediaFiles>' +
          '<MediaFile id="1" delivery="progressive" type="video/mp4" codec="video/mpeg-generic" bitrate="457" width="300" height="225">' +
          '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.mp4]]>' +
          '</MediaFile>'+
          '</MediaFiles>' +
        '</Linear></Creative></Creatives>'));

        this.clock.tick(10);
        assertNoError(callback);
        response = testUtils.secondArg(callback);

        assert.instanceOf(response, VASTResponse);
      });

      it("must track the error if a problem occur while getting the VASTResponse", function(){
        vast.WRAPPER_LIMIT = 1;
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick();
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>'));

        assertError(callback, 'on VASTClient.getVASTAd.getAd, players wrapper limit reached (the limit is 1)', 302);
      });

      it("must track a 102 error if the VAST version is not 2.0 or 3.0", function(){
        vast.getVASTResponse('http://fake.url', callback);
        this.clock.tick();
        sinon.assert.calledWith(vast._requestVASTXml, 'http://fake.url');
        flushVASTXmlRequest(null, '<VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="1.0">' +
        '<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI></Wrapper></Ad>' +
        '</VAST>');

        assertError(callback, 'on VASTClient.getVASTAd.validateVASTTree, not supported VAST version "1"', 102);
      });

      it("must complain if you don't pass a proper adTagUrl", function(){
        assert.throws(function () {
          vast.getVASTResponse();
        }, VASTError, 'on VASTClient.getVASTResponse, missing ad tag URL');
      });

      it("must pass an error to the callback if there was a callback and not adUrlTag", function(){
        vast.getVASTResponse(null, callback);
        this.clock.tick();
        var error = testUtils.firstArg(callback);
        assert.instanceOf(error, VASTError);
        assert.equal(error.message, 'VAST Error: on VASTClient.getVASTResponse, missing ad tag URL');
        sinon.assert.notCalled(vast._requestVASTXml);
      });

      it("must complain if you don't pass a callback", function(){
        assert.throws(function () {
          vast.getVASTResponse('http://testUrlTag');
        }, VASTError, 'on VASTClient.getVASTResponse, missing callback function');
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
        vast._requestVASTXml(adTagUrl, utilities.noop);
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
        assert.equal(testUtils.firstArg(callback).message, 'Error creating xhr');
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
          vast._requestVASTXml(spy, utilities.noop);
          assert.equal(0, requests.length);
          sinon.assert.calledWithExactly(spy, sinon.match.func);
        });

        it("on error, must call the callback with an explanatory error and the VASTResponse", function(){
          var callback = sinon.spy();
          var adTagXMLSpy = sinon.spy();
          vast._requestVASTXml(adTagXMLSpy, callback);
          var handler = testUtils.firstArg(adTagXMLSpy);
          handler(new Error('meeec'), null);
          assertError(callback, "on VASTClient.requestVastXML, Error getting the the VAST XML with he passed adTagXML fn", 301);
        });

        it("must pass the response and the data object to the callback", function(){
          var callback = sinon.spy();
          var adTagXMLSpy = sinon.spy();
          vast._requestVASTXml(adTagXMLSpy, callback);
          var handler = testUtils.firstArg(adTagXMLSpy);
          handler(null, vastAdXML());
          sinon.assert.calledWithExactly(callback, null, vastAdXML());

        });
      });
    });

    describe("_getVASTAd", function(){
      var xhr, requests, callback;

      function assertErrorTrack(msg, code, adChainIds){
        var adChain = testUtils.secondArg(vast._trackError);

        assertError(vast._trackError, msg, code);

        adChainIds.forEach(function(adId, index) {
          assert.equal(adId, adChain[index].id);
        });
      }

      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
        callback = sinon.spy();
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
          requests.push(xhr);
        };
        sinon.stub(vast, '_trackError');
      });

      afterEach(function () {
        xhr.restore();
        this.clock.restore();
        vast._trackError.restore();
      });

      it("must request the ad tree with passed adTagUrl", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, utilities.noop);
        this.clock.tick();
        assert.equal(1, requests.length);
        assert.equal(adTagUrl, requests[0].url);
      });

      it("must pass a 301 error to the callback if there was an error with the request", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();
        requests[0].respond(404, {"Content-Type": "text"}, '404 Not found');
        this.clock.tick();
        assertError(callback, "on VASTClient.requestVastXML, HTTP request error with status '404'", 301);

      });

      it("must pass a 100 error to the callback if there was an error parsing the XML", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();
        requests[0].respond(200, {"Content-Type": "application/xml"}, 'wrong xml');
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.buildVastWaterfall, error parsing xml", 100);
      });

      it("must pass a 303 error to the callback if there was no ad on the returned VAST XML", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();
        requests[0].respond(200, {"Content-Type": "application/xml"}, vastXML());
        this.clock.tick();

        assertError(callback, 'on VASTClient.getVASTAd.validateVASTTree, no Ad in VAST tree', 303);
      });

      it("must pass a 102 error to the callback and track it if the returned vast ad version is not supported", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();
        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="1.0"><Ad></Ad></VAST>');
        this.clock.tick();

        assertError(callback, 'on VASTClient.getVASTAd.validateVASTTree, not supported VAST version "1"', 102);
      });

      it("must request the next ad if the adTree returned a wrapper", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();
        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();
        assert.equal(2, requests.length);
        assert.equal(requests[1].url, 'http://vastadtaguri.com/');
      });

      it("must pass a 301 error to the callback and track it if there was an error with the request of the next ad in the chain", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(404, {"Content-Type": "text"}, '404 Not found');
        this.clock.tick(2);

        assertError(callback, "on VASTClient.requestVastXML, HTTP request error with status '404'", 301);
        assertErrorTrack("on VASTClient.requestVastXML, HTTP request error with status '404'", 301, ['firstAd']);
      });

      it("must pass a a 100 error to the callback and track it if there was an error parsing the next ad in the chain", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, 'wrong xml');
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.requestVASTAd, error parsing xml", 100);
        assertErrorTrack("on VASTClient.getVASTAd.requestVASTAd, error parsing xml", 100, ['firstAd']);
      });

      it("must pass a a 100 error to the callback and track it if there was an error building the next ad in the chain", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"></Ad></VAST>');
        sinon.stub(Ad.prototype, 'initialize').throws(new Error('CUSTOM ERROR'));
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.buildAd, error parsing xml", 100);
        assertErrorTrack("on VASTClient.getVASTAd.buildAd, error parsing xml", 100, ['firstAd']);
        Ad.prototype.initialize.restore();
      });

      it("must pass a 302 error to the callback and track it if the adChain reached the configured WRAPPER_LIMIT", function(){
        vast.WRAPPER_LIMIT = 3;
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri2.com]]></VASTAdTagURI><Error><![CDATA[http://t2.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[2].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="thirdAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri3.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.getAd, players wrapper limit reached (the limit is 3)", 302);
        assertErrorTrack("on VASTClient.getVASTAd.getAd, players wrapper limit reached (the limit is 3)", 302, ['firstAd', 'secondAd', 'thirdAd']);
      });

      it("must pass a 101 error to the callback and track it if one of the ads on the adChain returned an inline and a wrapper on the same ad", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"><InLine></InLine><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri2.com]]></VASTAdTagURI><Error><![CDATA[http://t2.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        assertError(callback, 'on VASTClient.getVASTAd.validateAd, InLine and Wrapper both found on the same Ad', 101);
        assertErrorTrack('on VASTClient.getVASTAd.validateAd, InLine and Wrapper both found on the same Ad', 101, ['firstAd', 'secondAd']);
      });

      it("must pass a 101 error to the callback and track it if the ad in the chain had neither a wrapper nor an inline", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"></Ad></VAST>');
        this.clock.tick();

        assertError(callback, 'on VASTClient.getVASTAd.validateAd, nor wrapper nor inline elements found on the Ad', 101);
        assertErrorTrack('on VASTClient.getVASTAd.validateAd, nor wrapper nor inline elements found on the Ad', 101, ['firstAd', 'secondAd']);
      });

      it("must return a 101 error to the callback and track it if one of the ads in the chain contains an inline with no creative", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"><InLine></InLine></Ad></VAST>');
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.validateAd, could not find MediaFile that is supported by this video player", 403);
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, could not find MediaFile that is supported by this video player", 403, ['firstAd', 'secondAd']);
      });

      it("must return a 101 error to the callback and track it if one of the ads in the chain is a wrapper with no VASTAdTagURI", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="firstAd"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();

        requests[1].respond(200, {"Content-Type": "text"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="secondAd"><Wrapper></Wrapper></Ad></VAST>');
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.validateAd, missing 'VASTAdTagURI' in wrapper", 101);
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, missing 'VASTAdTagURI' in wrapper", 101, ['firstAd', 'secondAd']);
      });

      it("must request the next ad in the waterfall if the previous ad chain returned an error", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="adChain1"></Ad><Ad id="adChain2"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();
        //It must track the failed first error
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, nor wrapper nor inline elements found on the Ad", 101, ['adChain1']);

        requests[1].respond(200, {"Content-Type": "text"}, vastXML('<Ad id="adChain2.1"><InLine><Creatives><Creative><Companion>' +
          '<Duration>00:00:58</Duration>' +
          '</Companion></Creative></Creatives></InLine></Ad>'));
        this.clock.tick();

        assert.isNull(testUtils.firstArg(callback));
        var adChain = testUtils.secondArg(callback);
        assert.isArray(adChain);
        assert.equal(adChain.length, 2);
        assert.equal(adChain[0].id, 'adChain2');
        assert.equal(adChain[1].id, 'adChain2.1');
      });

      it("must pass the latest error from the adChain to the callback but it must track all the errors from all the adchains in the VAST waterfall", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="adChain1"></Ad><Ad id="adChain2"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();
        //It must track the failed first error
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, nor wrapper nor inline elements found on the Ad", 101, ['adChain1']);

        requests[1].respond(200, {"Content-Type": "text"}, vastXML('<Ad id="adChain2"><InLine><Creatives></Creatives></InLine></Ad>'));
        this.clock.tick();

        assertError(callback, "on VASTClient.getVASTAd.validateAd, could not find MediaFile that is supported by this video player", 403);
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, could not find MediaFile that is supported by this video player", 403, ['adChain2', 'adChain2']);
      });

      it("must not pass an error to the callback if one of the adChains in the VAST waterfall returned a valid ad", function(){
        var adTagUrl = 'http://foo.bar/';
        vast._getVASTAd(adTagUrl, callback);
        this.clock.tick();

        requests[0].respond(200, {"Content-Type": "application/xml"}, '<?xml version="1.0" encoding="utf-8"?>' +
          '<VAST version="2.0"><Ad id="adChain1"></Ad><Ad id="adChain2"><Wrapper><VASTAdTagURI><![CDATA[http://vastadtaguri.com]]></VASTAdTagURI><Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad></VAST>');
        this.clock.tick();
        //It must track the failed first error
        assertErrorTrack("on VASTClient.getVASTAd.validateAd, nor wrapper nor inline elements found on the Ad", 101, ['adChain1']);

        requests[1].respond(200, {"Content-Type": "text"}, vastXML('<Ad id="adChain2.1"><InLine><Creatives><Creative><Companion>' +
          '<Duration>00:00:58</Duration>' +
          '</Companion></Creative></Creatives></InLine></Ad>'));
        this.clock.tick();

        assert.isNull(testUtils.firstArg(callback));
        var adChain = testUtils.secondArg(callback);
        assert.isArray(adChain);
        assert.equal(adChain.length, 2);
        assert.equal(adChain[0].id, 'adChain2');
        assert.equal(adChain[1].id, 'adChain2.1');
      });
    });

    describe("_trackError", function(){
      var adChain;

      beforeEach(function(){
        sinon.stub(vastUtil, 'track');

        var adTree = xml.toJXONTree(vastInLineXML('<Error><![CDATA[http://t1.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error>' +
          '<Creatives><Creative></Creative></Creatives>')).ad;
        var adTree2 = xml.toJXONTree(vastInLineXML('<Error><![CDATA[http://t2.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error>' +
          '<Creatives><Creative></Creative></Creatives>')).ad;
        var adTree3 = xml.toJXONTree(vastXML('<Ad><Wrapper><VASTAdTagURI><![CDATA[http://VASTAdTagURI.com]]></VASTAdTagURI><Error><![CDATA[http://t3.liverail.com/?metric=error&erc=[ERRORCODE]]]></Error></Wrapper></Ad>')).ad;

        adChain = [
          new Ad(adTree),
          new Ad(adTree2),
          new Ad(adTree3)
        ];
      });

      afterEach(function(){
        vastUtil.track.restore();
      });

      it("must track the passed error to all the error macros in the passed adChain", function(){
        var error = new VASTError("on VASTClient._buildVASTResponse, Received an Ad type that is not supported", 200);
        vast._trackError(error, adChain);
        sinon.assert.calledOnce(vastUtil.track);

        assert.deepEqual(testUtils.firstArg(vastUtil.track), [
          'http://t1.liverail.com/?metric=error&erc=[ERRORCODE]',
          'http://t2.liverail.com/?metric=error&erc=[ERRORCODE]',
          'http://t3.liverail.com/?metric=error&erc=[ERRORCODE]'
        ]);
        assert.deepEqual(testUtils.secondArg(vastUtil.track), {ERRORCODE: 200});
      });

      it("must track the error code 900 if the passed error does not have a code", function(){
        var error = new VASTError("custom error");
        vast._trackError(error, adChain);
        sinon.assert.calledOnce(vastUtil.track);

        assert.deepEqual(testUtils.firstArg(vastUtil.track), [
          'http://t1.liverail.com/?metric=error&erc=[ERRORCODE]',
          'http://t2.liverail.com/?metric=error&erc=[ERRORCODE]',
          'http://t3.liverail.com/?metric=error&erc=[ERRORCODE]'
        ]);
        assert.deepEqual(testUtils.secondArg(vastUtil.track), {ERRORCODE: 900});
      });
    });
  });
});
