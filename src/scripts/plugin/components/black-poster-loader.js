'use strict';

if (videojs.Component) {
  var baseVideoJsComponent = videojs.Component;
} else {
  var baseVideoJsComponent = videojs.getComponent('Component');
}

var BlackPoster = require('./black-poster')(baseVideoJsComponent);

if (videojs.Component) {
  videojs.BlackPoster = videojs.Component.extend(BlackPoster);
} else {
  videojs.registerComponent('BlackPoster', videojs.extend(baseVideoJsComponent, BlackPoster));
}
