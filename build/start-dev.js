var gulp = require( "gulp" );
var supervisor = require( "gulp-supervisor" );
var BuildTaskDoc = require('./BuildTaskDoc');
var runSequence = require('run-sequence');


gulp.task( "start-dev", function (callback) {
  runSequence(
    'build-demo',
    [
      'dev-server',
      'watch'
    ],
    function (error) {
      if(error){
        console.log(error.message.red);
      }
      console.log('BUILD FINISHED SUCCESSFULLY'.green);
      callback();
    });
});

gulp.task( "dev-server", ['build-demo'], function() {
  console.log('STARTING DEVELOPMENT SERVER'.blue);
  supervisor( "demo/server/index.js" );
});

module.exports = new BuildTaskDoc("start-dev", "Starts dev server and watch task. \nIf you use \"--env production\" everything will be minified \nand the bin folder will be updated accordingly. ", 1);