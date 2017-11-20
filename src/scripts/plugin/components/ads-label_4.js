

const baseVideoJsComponent = videojs.Component;

const AdsLabel = require('./ads-label')(baseVideoJsComponent);

videojs.AdsLabel = videojs.Component.extend(AdsLabel);
