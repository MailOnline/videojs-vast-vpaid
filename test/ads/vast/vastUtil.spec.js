var vastUtil = require('ads/vast/vastUtil');

var xml = require('utils/xml');

var testUtils = require('../../test-utils');

describe("vastUtil", function () {
  it("must be an object", function () {
    assert.isObject(vastUtil);
  });

  describe("_parseURLMacro", function () {
    var _parseURLMacro;

    beforeEach(function () {
      _parseURLMacro = vastUtil._parseURLMacro;
    });

    it("must parse the passed macro using the passed variables", function () {
      assert.equal('http://foo.bar/BLA', _parseURLMacro('http://foo.bar/[CODE]', {CODE: 'BLA'}));
      assert.equal('http://foo.bar/BLA/123', _parseURLMacro('http://foo.bar/[CODE]/[END]', {CODE: 'BLA', END: 123}));
    });
  });

  describe("parseURLMacro", function () {
    var parseURLMacro;

    beforeEach(function () {
      parseURLMacro = vastUtil.parseURLMacro;
    });

    it("must parse the passed macro and return the parsed url", function () {
      assert.equal(
        parseURLMacro('http://foo.bar/[CODE]/[END]', {CODE: 'BLA', END: 123}),
        'http://foo.bar/BLA/123'
      );
    });

    it("must auto generate CACHEBUSTING variable if not passed  ", function () {
      assert.match(parseURLMacro('http://foo.bar/[CACHEBUSTING]'), /http:\/\/foo\.bar\/\d+/);
      assert.equal(parseURLMacro('http://foo.bar/[CACHEBUSTING]/[CACHEBUSTING]', {CACHEBUSTING: 123}), 'http://foo.bar/123/123');
    });

  });

  describe("parseURLMacros", function () {
    var parseURLMacros;

    beforeEach(function () {
      parseURLMacros = vastUtil.parseURLMacros;
    });

    it("must be function", function () {
      assert.isFunction(vastUtil.parseURLMacros);
    });

    it("must parse an array of macros and return an array with the parsed urls", function () {
      var macros = [
        'http://foo.bar/[CODE]',
        'http://foo.bar/[CODE]/[END]'
      ];

      assert.deepEqual(parseURLMacros(macros, {CODE: 'BLA', END: 123}), [
        'http://foo.bar/BLA',
        'http://foo.bar/BLA/123'
      ]);
    });

    it("must auto generate CACHEBUSTING variable if not passed  ", function () {
      var macros = ['http://foo.bar/[CACHEBUSTING]'];
      assert.match(parseURLMacros(macros), /http:\/\/foo\.bar\/\d+/);
      assert.deepEqual(parseURLMacros(macros, {CACHEBUSTING: 123}), ['http://foo.bar/123']);
    });
  });

  describe("track", function () {
    var track;

    beforeEach(function () {
      track = vastUtil.track;
    });

    it("must return an array with the created track images", function () {
      var macros = [
        'http://foo.bar/[CODE]',
        'http://foo.bar/[CODE]/[END]'
      ];
      var trackImgs = track(macros, {CODE: 'BLA', END: 123});

      assert.equal(trackImgs.length, 2);
      assert.instanceOf(trackImgs[0], Image);
      assert.equal(trackImgs[0].src, "http://foo.bar/BLA");
      assert.instanceOf(trackImgs[1], Image);
      assert.equal(trackImgs[1].src, "http://foo.bar/BLA/123");
    });
  });

  describe("parseDuration", function () {
    var parseDuration;

    beforeEach(function () {
      parseDuration = vastUtil.parseDuration;
    });

    it("must return null if the duration is not an string with the format HH:MM:SS[.mmm]", function () {
      assert.isNull(parseDuration());
      assert.isNull(parseDuration(123));
      assert.isNull(parseDuration('23:444:23'));
      assert.isNull(parseDuration('foo'));
    });

    it("must return the duration in milliseconds", function () {
      assert.equal(parseDuration('00:00:00.001'), 1);
      assert.equal(parseDuration('00:00:01'), 1000);
      assert.equal(parseDuration('00:01:00'), 60000);
      assert.equal(parseDuration('01:00:00'), 3600000);
      assert.equal(parseDuration('01:11:09:456'), 4269000);
    });
  });

  describe("parseImpressions", function () {
    var parseImpressions;

    beforeEach(function () {
      parseImpressions = vastUtil.parseImpressions;
    });

    it("must return an empty array if you pass no impressions", function () {
      testUtils.assertEmptyArray(parseImpressions());
    });

    it("must return an empty array if there is no real impression", function () {
      var inlineXML = '<InLine>' +
        '<Impression><![CDATA[]]></Impression>' +
        '</InLine>';
      testUtils.assertEmptyArray(parseImpressions(xml.toJXONTree(inlineXML).impression));
    });

    it("must return an array with the passed impressions formatted", function () {
      var inlineXML = '<InLine>' +
        '<Impression id="DART">' +
        '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
        '</Impression>' +
        '</InLine>';
      var impressionJTree = xml.toJXONTree(inlineXML).impression;

      assert.deepEqual(parseImpressions(impressionJTree), [
        'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif'
      ]);
    });

    it("must add all the passed impressions to the returned array", function () {
      var inlineXML = '<InLine>' +
        '<Impression id="DART">' +
        '<![CDATA[http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif]]>' +
        '</Impression>' +
        '<Impression id="ThirdParty"><![CDATA[http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?]]></Impression>' +
        '<Impression><![CDATA[]]></Impression>' +
        '</InLine>';
      var impressionJTree = xml.toJXONTree(inlineXML).impression;

      assert.deepEqual(parseImpressions(impressionJTree), [
        'http://ad.doubleclick.net/imp;v7;x;223626102;0-0;0;47414672;0/0;30477563/30495440/1;;~aopt=0/0/ff/0;~cs=j%3fhttp://s0.2mdn.net/dot.gif',
        'http://ad.doubleclick.net/ad/N270.Process_Other/B3473145;sz=1x1;ord=6212269?'
      ]);
    });
  });

  describe("formatProgress", function () {
    it("must return the formatted progress", function () {
      assert.equal(vastUtil.formatProgress(12345000), "03:25:45.000");
      assert.equal(vastUtil.formatProgress(123000), "00:02:03.000");
      assert.equal(vastUtil.formatProgress(123545978), "34:19:05.978");
    });
  });

  describe("parseOffset", function () {
    var parseOffset;

    beforeEach(function () {
      parseOffset = vastUtil.parseOffset;
    });

    it("must return the passed offset string in ms", function () {
      assert.equal(parseOffset('00:00:05.000'), 5000);
    });

    it("must be possible pass the offset as a percentage", function () {
      assert.equal(parseOffset('10%', 1000), 100);
      assert.equal(parseOffset('10.5%', 1000), 105);
    });

    it("with a percentage offset and no duration must return null", function () {
      assert.isNull(parseOffset('10.5%'));
    });

    it("must return null if you don't pass an offset", function () {
      assert.isNull(parseOffset());
      assert.isNull(parseOffset(undefined, 123));
    });
  });

  describe("isVPAID", function () {
    it("must return true if the passed mediaFile apiFramework attr is VPAID and false otherwiser", function () {
      assert.isFunction(vastUtil.isVPAID);
      [undefined, false, '', {}, []].forEach(function (wrongMediaFile) {
        assert.isFalse(vastUtil.isVPAID(wrongMediaFile));
      });

      assert.isFalse(vastUtil.isVPAID({apiFramework: 'JS'}));
      assert.isTrue(vastUtil.isVPAID({apiFramework: 'VPAID'}));
    });
  });

});
