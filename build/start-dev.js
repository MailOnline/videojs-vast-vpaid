// Gulpfile.js
var gulp = require( "gulp" );
var BuildTaskDoc = require('./BuildTaskDoc');
var runSequence = require('run-sequence');


gulp.task( "start-dev", function (callback) {
  runSequence(
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

module.exports = new BuildTaskDoc("start-dev", "Starts dev server and watch task. \nIf you use \"--env production\" everything will be minified \nand the dist folder will be updated accordingly. ", 1);