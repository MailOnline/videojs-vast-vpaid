

const baseVideoJsComponent = videojs.getComponent('Component');

const BlackPoster = require('./black-poster')(baseVideoJsComponent);

videojs.registerComponent('BlackPoster', videojs.extend(baseVideoJsComponent, BlackPoster));
