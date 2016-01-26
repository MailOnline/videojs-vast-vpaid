'use strict';

describe("Ad", function () {

  var Ad = require('ads/vast/Ad');
  var InLine = require('ads/vast/InLine');
  var Wrapper = require('ads/vast/Wrapper');

  var xml = require('utils/xml');

  it("must be a constructor function", function () {
    assert.isFunction(Ad);
  });

  it("must return an instance of Ad", function () {
    assert.instanceOf(new Ad(xml.toJXONTree('<ad></ad>')), Ad);
  });

  it("must set the id of the ad", function () {
    var ad = new Ad(xml.toJXONTree('<Ad id="107195552"></Ad>'));
    assert.equal(ad.id, '107195552');
  });

  it("must not set the id if not defined in the xml", function () {
    var ad = new Ad(xml.toJXONTree('<Ad></Ad>'));
    assert.isUndefined(ad.id);
  });

  it("must not set the sequence number if not defined", function () {
    var ad = new Ad(xml.toJXONTree('<ad></ad>'));
    assert.isUndefined(ad.sequence);
  });

  it("must set the sequence number if defined as attr", function () {
    var ad = new Ad(xml.toJXONTree('<Ad sequence="1"></Ad>'));
    assert.strictEqual(ad.sequence, 1);
  });

  it("must set the inline as an InLine instance object if set", function () {
    var adXML = '<Ad id="107195552"><InLine></InLine></Ad>';
    var ad = new Ad(xml.toJXONTree(adXML));
    assert.instanceOf(ad.inLine, InLine);
  });

  it("must set the wrapper as a Wrapper instance object if set", function(){
    var adXML = '<Ad id="107195552"><Wrapper></Wrapper></Ad>';
    var ad = new Ad(xml.toJXONTree(adXML));
    assert.instanceOf(ad.wrapper, Wrapper);
  });

});