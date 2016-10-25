

const baseVideoJsComponent = videojs.Component;

const BlackPoster = require('./black-poster')(baseVideoJsComponent);

videojs.BlackPoster = videojs.Component.extend(BlackPoster);
