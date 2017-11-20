

const baseVideoJsComponent = videojs.getComponent('Component');

const AdsLabel = require('./ads-label')(baseVideoJsComponent);

videojs.registerComponent('AdsLabel', videojs.extend(baseVideoJsComponent, AdsLabel));
