const utilities = require('../../utils/utilityFunctions');
const xml = require('../../utils/xml');
const vastUtil = require('./vastUtil');
const Creative = require('./Creative');

function InLine (inlineJTree) {
  if (!(this instanceof InLine)) {
    return new InLine(inlineJTree);
  }

  // Required Fields
  this.adTitle = xml.keyValue(inlineJTree.adTitle);
  this.adSystem = xml.keyValue(inlineJTree.adSystem);
  this.impressions = vastUtil.parseImpressions(inlineJTree.impression);
  this.creatives = Creative.parseCreatives(inlineJTree.creatives);

  // Optional Fields
  this.description = xml.keyValue(inlineJTree.description);
  this.advertiser = xml.keyValue(inlineJTree.advertiser);
  this.surveys = parseSurveys(inlineJTree.survey);
  this.error = xml.keyValue(inlineJTree.error);
  this.pricing = xml.keyValue(inlineJTree.pricing);
  this.extensions = inlineJTree.extensions;

  /** * Local Functions ***/
  function parseSurveys (inlineSurveys) {
    if (inlineSurveys) {
      return utilities.transformArray(utilities.isArray(inlineSurveys) ? inlineSurveys : [inlineSurveys], (survey) => {
        if (utilities.isNotEmptyString(survey.keyValue)) {
          return {
            uri: survey.keyValue,
            type: survey.attr('type')
          };
        }

        return undefined;
      });
    }

    return [];
  }
}


/**
 * Returns true if the browser supports all the creatives.
 */
InLine.prototype.isSupported = function () {
  let i, len;

  if (this.creatives.length === 0) {
    return false;
  }

  for (i = 0, len = this.creatives.length; i < len; i += 1) {
    if (!this.creatives[i].isSupported()) {
      return false;
    }
  }

  return true;
};

module.exports = InLine;
