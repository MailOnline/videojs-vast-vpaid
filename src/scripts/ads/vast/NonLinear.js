'use strict';

var xml = require('../../utils/xml');

function NonLinear(nonLinearJTree) {
  if (!(this instanceof NonLinear)) {
    return new NonLinear(nonLinearJTree);
  }

  // required
  this.creativeType = xml.attr(nonLinearJTree.staticResource, 'creativeType');
  this.staticResource = xml.keyValue(nonLinearJTree.staticResource);
  this.nonLinearClickThrough = xml.keyValue(nonLinearJTree.nonLinearClickThrough);

  // optional
  this.id = xml.attr(nonLinearJTree, 'id');
  this.width = xml.attr(nonLinearJTree, 'width');
  this.height = xml.attr(nonLinearJTree, 'height');
  this.maintainAspectRatio = xml.attr(nonLinearJTree, 'maintainAspectRatio');
  this.scalable = xml.attr(nonLinearJTree, 'scalable');
  this.minSuggestedDuration = xml.attr(nonLinearJTree, 'minSuggestedDuration');
  this.nonLinearClickTracking = xml.keyValue(nonLinearJTree.nonLinearClickTracking);
}

NonLinear.prototype.isSupported = function () {
  return true;
};

module.exports = NonLinear;