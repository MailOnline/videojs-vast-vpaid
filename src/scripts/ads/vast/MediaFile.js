

const xml = require('../../utils/xml');
const urlUtils = require('../../utils/urlUtils');
const vastUtil = require('./vastUtil');

const attributesList = [
  // Required attributes
  'delivery',
  'type',
  'width',
  'height',

  // Optional attributes
  'codec',
  'id',
  'bitrate',
  'minBitrate',
  'maxBitrate',
  'scalable',
  'maintainAspectRatio',
  'apiFramework'
];

const pageProtocol = window.location && urlUtils.urlParts(window.location.href).protocol;

function MediaFile (mediaFileJTree) {
  if (!(this instanceof MediaFile)) {
    return new MediaFile(mediaFileJTree);
  }

  // Required attributes
  this.src = xml.keyValue(mediaFileJTree);

  for (let x = 0; x < attributesList.length; x++) {
    const attribute = attributesList[x];

    this[attribute] = mediaFileJTree.attr(attribute);
  }
}

MediaFile.prototype.isSupported = function () {
  if (vastUtil.isVPAID(this)) {
    return Boolean(vastUtil.findSupportedVPAIDTech(this.type));
  }

  if (this.type === 'video/x-flv') {
    return vastUtil.isFlashSupported();
  }

  if (pageProtocol === 'https') {
    return urlUtils.urlParts(this.src).protocol === pageProtocol;
  }

  return true;
};

module.exports = MediaFile;
