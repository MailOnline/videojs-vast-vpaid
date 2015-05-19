var path = require('path');
var pkg = require('../package.json');
var parseArgs = require('minimist');

var knownOptions = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'development'}
};

var options = parseArgs(process.argv.slice(2), knownOptions);
module.exports = {
  env: options.env,

  //Files needed to build the demo
  demo: {
    pages: [
      'demo/tpls/demo.html'
    ],
    styles: [
      'bower_components/video.js/dist/video-js/video-js.css',
      'demo/styles/*.less'
    ],

    assets: [
      'demo/assets/*'
    ],

    scripts: [
      'node_modules/es5-shim/es5-shim.js', //Required for the player to work on old browsers
      'bower_components/video.js/dist/video-js/video.dev.js',
      'demo/scripts/**/*.js'
    ]
  },

  //Vendor files
  vendor: {
    scripts: [
      'bower_components/videojs-contrib-ads/src/videojs.ads.js'
    ],
    styles: [
      //Empty for the moment
    ],
    assets: [
      //Empty for the moment
    ],
    fonts: [
      //Empty for the moment
    ]
  },

  plugin: {
    scripts: [
      'src/utils/pollyfill.js',
      'src/utils/utilityFunctions.js',
      'src/utils/**/*.js',
      'src/**/*.js'
    ],
    styles: [
      'src/**/*.css'
    ],
    tests: {
      unit: [
        'test/test-utils.js',
        'test/**/*.js'
      ]
    }
  },

  //App files for production
  prodfile: {
    scripts: pkg.name + '.js',
    styles: pkg.name + '.css'
  },

  //Dist folder
  DIST: path.normalize('__dirname/../dist'),
  DEV: path.normalize('__dirname/../dev')
};