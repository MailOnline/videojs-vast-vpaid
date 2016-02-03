'use strict';

var gulp        = require('gulp');
var Server      = require('karma').Server;
var runSequence = require('run-sequence');

var config       = require('./config');
var BuildTaskDoc = require('./BuildTaskDoc');

/**
 * Run test once and exit
 */

var testTasks = [];
config.versions.forEach(function(version) {

  var testTask = 'test-videojs_' + version;

  gulp.task(testTask, function (done) {

    var autoWatch = !!config.options['watch'];

    new Server({
      configFile: __dirname + '/../karma.conf.js',
      files: config.testFiles(version),
      autoWatch: autoWatch,
      singleRun: !autoWatch
    }, function (error) {
      done(error);
    }).start();
  });
  testTasks.push(testTask);
});

gulp.task('test', function(done) {

  testTasks.push(function (error) {
      if(error){
        console.log(error.message.red);
      } else{
        console.log('TEST FINISHED SUCCESSFULLY'.green);
      }
      done(error);
    });

  runSequence.apply(this,testTasks);

});

module.exports = new BuildTaskDoc('test', 'Starts karma and test the player', 6.1);
