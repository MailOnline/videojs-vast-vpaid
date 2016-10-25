

require('./plugin/components/ads-label_4');
require('./plugin/components/black-poster_4');

const videoJsVAST = require('./plugin/videojs.vast.vpaid');

videojs.plugin('vastClient', videoJsVAST);

