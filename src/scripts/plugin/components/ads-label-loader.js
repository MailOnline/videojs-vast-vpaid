'use strict';

if (videojs.Component) {
  var baseVideoJsComponent = videojs.Component;
} else {
  var baseVideoJsComponent = videojs.getComponent('Component');
}

var AdsLabel = require('./ads-label')(baseVideoJsComponent);

if (videojs.Component) {
  videojs.AdsLabel = videojs.Component.extend(AdsLabel);
} else {
  videojs.registerComponent('AdsLabel', videojs.extend(baseVideoJsComponent, AdsLabel));
}
