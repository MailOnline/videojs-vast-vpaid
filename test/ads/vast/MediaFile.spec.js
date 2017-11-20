

describe('MediaFile', () => {
  const MediaFile = require('../../../src/scripts/ads/vast/MediaFile');

  const xml = require('../../../src/scripts/utils/xml');
  const vastUtil = require('../../../src/scripts/ads/vast/vastUtil');

  let mediaFileXML;

  beforeEach(() => {
    mediaFileXML = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<MediaFile id="1" delivery="progressive" type="video/x-flv" bitrate="457" width="300" height="225">' +
    '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
    '</MediaFile>';
  });

  it('must return an instance of MediaFile', () => {
    assert.instanceOf(new MediaFile(xml.toJXONTree(mediaFileXML)), MediaFile);
  });

  describe('instance', () => {
    let mediaFile;

    beforeEach(() => {
      const mediaFileXML = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<MediaFile id="1" delivery="progressive" type="video/x-flv" codec="video/mpeg-generic" bitrate="457" width="300" height="225">' +
        '<![CDATA[http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv]]>' +
        '</MediaFile>';

      mediaFile = new MediaFile(xml.toJXONTree(mediaFileXML));
    });

    it('must set the src', () => {
      assert.equal('http://gcdn.2mdn.net/MotifFiles/html/2215309/PID_914438_1235753019000_dcrmvideo.flv', mediaFile.src);
    });

    it('must set the delivery', () => {
      assert.equal(mediaFile.delivery, 'progressive');
    });

    it('must set the type', () => {
      assert.equal(mediaFile.type, 'video/x-flv');
    });

    it('must contain the width', () => {
      assert.equal(mediaFile.width, 300);
    });

    it('must set the height', () => {
      assert.equal(mediaFile.height, 225);
    });

    it('must set the codec if passed', () => {
      assert.equal(mediaFile.codec, 'video/mpeg-generic');
    });

    it('must set the id for the media file if set in the xml', () => {
      assert.equal(mediaFile.id, 1);
    });

    it('must set the bitrate if set in the xml', () => {
      assert.equal(mediaFile.bitrate, 457);
    });

    it('must set the minBitrate if set in the xml in the xml', () => {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile minBitrate="457"></MediaFile>'));
      assert.equal(mediaFile.minBitrate, 457);
    });

    it('must set the maxBitrate if set in the xml', () => {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile maxBitrate="457"></MediaFile>'));
      assert.equal(mediaFile.maxBitrate, 457);
    });

    it('must set the scalable attr if set in the xml', () => {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile scalable="true"></MediaFile>'));
      assert.isTrue(mediaFile.scalable);
    });

    it('must set the maintainAspectRatio attr if set in the xml', () => {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile maintainAspectRatio="true"></MediaFile>'));
      assert.isTrue(mediaFile.maintainAspectRatio);
    });

    it('must set the apiFramework if set in the xml', () => {
      mediaFile = new MediaFile(xml.toJXONTree('<MediaFile apiFramework="someApiFramework"></MediaFile>'));
      assert.equal(mediaFile.apiFramework, 'someApiFramework');
    });

    describe('isSupported', () => {
      let mediaFile;

      beforeEach(() => {
        mediaFile = new MediaFile(xml.toJXONTree('<MediaFile apiFramework="someApiFramework"></MediaFile>'));
      });

      it('must be a function', () => {
        assert.isFunction(mediaFile.isSupported);
      });

      describe('VPAID mediafile', () => {
        beforeEach(() => {
          mediaFile.apiFramework = 'VPAID';
        });

        it('must return true if there is a supported VPAIDtech', () => {
          mediaFile.type = 'application/javascript'; // type of VPAIDHTML5Tech
          assert.isTrue(mediaFile.isSupported());
        });

        it('must return false if there is a supported VPAIDtech', () => {
          mediaFile.type = 'application/nonSupported';
          assert.isFalse(mediaFile.isSupported());
        });
      });

      describe('VAST mediafile', () => {
        beforeEach(() => {
          sinon.stub(vastUtil, 'isFlashSupported');
        });

        afterEach(() => {
          vastUtil.isFlashSupported.restore();
        });

        it('must return true if mime type is video/x-flv and flash is supported', () => {
          mediaFile.type = 'video/x-flv';
          vastUtil.isFlashSupported.returns(true);
          assert.isTrue(mediaFile.isSupported());
        });

        it('must return false if mime type is video/x-flv and flash is not supported', () => {
          mediaFile.type = 'video/x-flv';
          vastUtil.isFlashSupported.returns(false);
          assert.isFalse(mediaFile.isSupported());
        });

        it('must return true if mime type is not video/x-flv', () => {
          mediaFile.type = 'video/volkswagen';
          vastUtil.isFlashSupported.returns(false);
          assert.isTrue(mediaFile.isSupported());
        });
      });
    });
  });
});
