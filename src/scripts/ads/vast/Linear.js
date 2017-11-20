const utilities = require('../../utils/utilityFunctions');
const xml = require('../../utils/xml');
const parsers = require('./parsers');
const TrackingEvent = require('./TrackingEvent');
const VideoClicks = require('./VideoClicks');
const MediaFile = require('./MediaFile');

function Linear (linearJTree) {
  if (!(this instanceof Linear)) {
    return new Linear(linearJTree);
  }

  // Required Elements
  this.duration = parsers.duration(xml.keyValue(linearJTree.duration));
  this.mediaFiles = parseMediaFiles(linearJTree.mediaFiles && linearJTree.mediaFiles.mediaFile);

  // Optional fields
  this.trackingEvents = parseTrackingEvents(linearJTree.trackingEvents && linearJTree.trackingEvents.tracking, this.duration);
  this.skipoffset = parsers.offset(xml.attr(linearJTree, 'skipoffset'), this.duration);

  if (linearJTree.videoClicks) {
    this.videoClicks = new VideoClicks(linearJTree.videoClicks);
  }

  if (linearJTree.adParameters) {
    this.adParameters = xml.keyValue(linearJTree.adParameters);

    if (xml.attr(linearJTree.adParameters, 'xmlEncoded')) {
      this.adParameters = xml.decode(this.adParameters);
    }
  }

  /** * Local functions ***/
  function parseTrackingEvents (trackingEvents, duration) {
    const trackings = [];

    if (utilities.isDefined(trackingEvents)) {
      trackingEvents = utilities.isArray(trackingEvents) ? trackingEvents : [trackingEvents];
      trackingEvents.forEach((trackingData) => {
        trackings.push(new TrackingEvent(trackingData, duration));
      });
    }

    return trackings;
  }

  function parseMediaFiles (mediaFilesJxonTree) {
    const mediaFiles = [];

    if (utilities.isDefined(mediaFilesJxonTree)) {
      mediaFilesJxonTree = utilities.isArray(mediaFilesJxonTree) ? mediaFilesJxonTree : [mediaFilesJxonTree];

      mediaFilesJxonTree.forEach((mfData) => {
        mediaFiles.push(new MediaFile(mfData));
      });
    }

    return mediaFiles;
  }
}

/**
 * Must return true if at least one of the MediaFiles' type is supported
 */
Linear.prototype.isSupported = function () {
  let i, len;

  for (i = 0, len = this.mediaFiles.length; i < len; i += 1) {
    if (this.mediaFiles[i].isSupported()) {
      return true;
    }
  }

  return false;
};

module.exports = Linear;
