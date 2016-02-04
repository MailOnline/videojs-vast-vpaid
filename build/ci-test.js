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

  var testTask = 'ci-test-videojs_' + version;

  gulp.task(testTask, function (done) {

    new Server({
      configFile: __dirname + '/../karma.conf.js',
      files: config.testFiles(version),
      autoWatch: false,
      singleRun: true,
      browsers: ['Chrome_travis_ci'],
      reporters: ['spec', 'coverage'],
      customLaunchers: {
        Chrome_travis_ci: {
          base: 'Chrome',
          flags: ['--no-sandbox']
        }
      },
      coverageReporter: {
      reporters: [
        {
          type: 'text',
          dir: 'coverage/',
          file: 'coverage.txt'
        },
        {
          type: 'html',
          dir: 'coverage/'
        },
        {
          type: 'lcovonly',
          dir: 'coverage/',
          subdir: '.'
        },
        {type: 'text-summary'}
      ]
    }
    }, function (error) {
      done(error);
    }).start();
  });
  testTasks.push(testTask);
});


gulp.task('ci-test', function(done) {

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

module.exports = new BuildTaskDoc('ci-test', 'Starts karma test and generates test code coverage, to be used by CI Server', 6.1);
