'use strict';

require('./plugin/components/ads-label-loader');
require('./plugin/components/black-poster-loader');

var videoJsVAST = require('./plugin/videojs.vast.vpaid');

videojs.plugin('vastClient', videoJsVAST);

