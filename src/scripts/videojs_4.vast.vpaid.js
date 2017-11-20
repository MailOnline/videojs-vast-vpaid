

require('./plugin/components/ads-label_4');
require('./plugin/components/black-poster_4');
require('../styles/videojs.vast.vpaid.scss');

const videoJsVAST = require('./plugin/videojs.vast.vpaid');

videojs.plugin('vastClient', videoJsVAST);

