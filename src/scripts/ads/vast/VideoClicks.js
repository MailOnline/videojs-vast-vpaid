const utilities = require('../../utils/utilityFunctions');
const xml = require('../../utils/xml');

function VideoClicks (videoClickJTree) {
  if (!(this instanceof VideoClicks)) {
    return new VideoClicks(videoClickJTree);
  }

  this.clickThrough = xml.keyValue(videoClickJTree.clickThrough);
  this.clickTrackings = parseClickTrackings(videoClickJTree.clickTracking);
  this.customClicks = parseClickTrackings(videoClickJTree.customClick);

  /** * Local functions ***/
  function parseClickTrackings (trackingData) {
    const clickTrackings = [];

    if (trackingData) {
      trackingData = utilities.isArray(trackingData) ? trackingData : [trackingData];
      trackingData.forEach((clickTrackingData) => {
        clickTrackings.push(xml.keyValue(clickTrackingData));
      });
    }

    return clickTrackings;
  }
}

module.exports = VideoClicks;
