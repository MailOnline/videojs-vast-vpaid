'use strict';

describe("MediaFile", function () {

  var MediaFile = require('ads/vast/MediaFile');

  var xml = require('utils/xml');

  var mediaFileXML;

  beforeEach(function () {
    mediaFileXML = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
    '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
    '</MediaFile>';
  });

  it("must return an instance of MediaFile", function () {
    assert.instanceOf(new MediaFile(xml.toJXONTree(mediaFileXML)), MediaFile);
  });

  describe("instance", function () {
    var mediaFile;

    beforeEach(function () {
      var mediaFileXML = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<MediaFile id="1" delivery="progressive" type="video/x-flv" codec="video/mpeg-generic" bitrate="457" width="300" height="225">' +
        '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
        '</MediaFile>';
      mediaFile = new MediaFile(xml.toJXONTree(mediaFileXML));
    });

    it("must set the src", function(){
      assert.equal('http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv', mediaFile.src);
    });

    it("must set the delivery", function () {
      assert.equal(mediaFile.delivery, "progressive");
    });

    it("must set the type", function () {
      assert.equal(mediaFile.type, 'video/x-flv');
    });

    it("must contain the width", function () {
      assert.equal(mediaFile.width, 300);
    });

    it("must set the height", function () {
      assert.equal(mediaFile.height, 225);
    });

    it("must set the codec if passed", function () {
      assert.equal(mediaFile.codec, "video/mpeg-generic");
    });

    it("must set the id for the media file if set in the xml", function () {
      assert.equal(mediaFile.id, 1);
    });

    it("must set the bitrate if set in the xml", function () {
      assert.equal(mediaFile.bitrate, 457);
    });

    it("must set the minBitrate if set in the xml in the xml", function () {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile minBitrate="457"></MediaFile>'));
      assert.equal(mediaFile.minBitrate, 457);
    });

    it("must set the maxBitrate if set in the xml", function () {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile maxBitrate="457"></MediaFile>'));
      assert.equal(mediaFile.maxBitrate, 457);
    });

    it("must set the scalable attr if set in the xml", function () {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile scalable="true"></MediaFile>'));
      assert.isTrue(mediaFile.scalable);
    });

    it("must set the maintainAspectRatio attr if set in the xml", function () {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile maintainAspectRatio="true"></MediaFile>'));
      assert.isTrue(mediaFile.maintainAspectRatio);
    });

    it("must set the apiFramework if set in the xml", function () {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile apiFramework="someApiFramework"></MediaFile>'));
      assert.equal(mediaFile.apiFramework, 'someApiFramework');
    });

    describe("isSupported", function(){
      var mediaFile;

      beforeEach(function () {
        mediaFile = new MediaFile(xml.toJXONTree('<MediaFile apiFramework="someApiFramework"></MediaFile>'));
      });

      it("must be a function", function(){
        assert.isFunction(mediaFile.isSupported);
      });

      describe("VPAID mediafile", function() {

        beforeEach(function() {
          mediaFile.apiFramework = 'VPAID';
        });

        it("must return true if there is a supported VPAIDtech", function () {
          mediaFile.type = 'application/javascript'; // type of VPAIDHTML5Tech
          assert.isTrue(mediaFile.isSupported());
        });

        it("must return false if there is a supported VPAIDtech", function () {
          mediaFile.type = 'application/nonSupported';
          assert.isFalse(mediaFile.isSupported());
        });
      });
    });
  });

});
