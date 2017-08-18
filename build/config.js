'use strict';

var path = require('path');
var parseArgs = require('minimist');

var knownOptions = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'development'}
};
var options = parseArgs(process.argv.slice(2), knownOptions);

var videoJsVersionsMap = {
  '6': 'bower_components/videojs_6/dist/'
};

var demoAds = [
  {
  url:'http://servedby.flashtalking.com/imp/1/31714;812030;208;xml;DailyMail;640x360VASTHTML5/?cachebuster=%%CACHEBUSTER%%',
  label:'VAST flashtalking Preroll Linear'
  },
  {
  url:'http://search.spotxchange.com/vast/2.00/79391?VPAID=1&content_page_url=test.com&cb=3202405928168446&player_width=300&player_height=250',
  label:'VPAID Flash spotX Preroll Test Tag'
  },
  {
  url:'http://vast.bp3863356.btrll.com/vast/3863356?n=1426410433&br_w=300&br_h=250&br_pageurl=blah',
  label:'VPAID Flash Brightroll Preroll test tag'
  },
  {
  url:'https://ad3.liverail.com/?LR_PUBLISHER_ID=1331&LR_CAMPAIGN_ID=229&LR_SCHEMA=vast2-vpaid',
  label:'VPAID Flash LiveRail Preroll test tag'
  },
  {
  url:'http://cdn-tags.brainient.com/1228/cba8794a-38a5-448b-ad31-e3f6169645c1/vast.xml?platform=vpaid&v=v6&proto=http',
  label:'VPAID Flash Brainient Preroll Linear Expand'
  },
  {
  url:'http://cdn-tags.brainient.com/1228/34f8e4e6-e83c-46da-8bf6-a37ae9ed5134/vast.xml?platform=vpaid&v=v6&proto=http',
  label:'VPAID Flash Brainient Preroll Linear Button'
  },
  {
  url:'http://asv.tubemogul.com/vast/CK6HN2uZ3ULMo7rOR4rE?ad_id=eVQayxudgvnI1TJGXf5X',
  label:'VPAID Flash Tubemogul Preroll Linear'
  },
  {
  url:'http://rtr.innovid.com/r1.5554946ab01d97.36996823;cb=%25%CACHEBUSTER%25%25',
  label:'VPAID Html5 Innovid test tag'
  }
];

module.exports = {

  versions: Object.keys(videoJsVersionsMap),
  versionsMap: videoJsVersionsMap,

  options: options,
  env: options.env,
  git: {
    remoteUrl: process.env.GH_TOKEN ? 'https://'+process.env.GH_TOKEN+'@github.com/MailOnline/videojs-vast-vpaid' : 'origin'
  },

  DIST: path.normalize('__dirname/../bin'),
  DEV: path.normalize('__dirname/../dev'),

  vendor: [

  ],

  testFiles: function testFiles (videojsVersion){
    var dependencies = [];
    videojsVersion = videojsVersion || this.versions[0];

    this.vendor.forEach(function(bundle){
      dependencies.push({
        pattern: bundle,
        included: /\.js$/.test(bundle)
      });
    });
    //We add videojs
    dependencies.push(videoJsVersionsMap[videojsVersion] + 'video.js');
    return dependencies.concat([
      'test/test-utils.css',
      'test/**/*.spec.js'
    ]);
  },

  demoAds: demoAds
};


