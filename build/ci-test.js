var gulp = require('gulp');
var karma = require('karma').server;
var config = require('./config');
var BuildTaskDoc = require('./BuildTaskDoc');

/**
 * Run test once and exit
 */
gulp.task('ci-test', function (done) {
  var files = config.demo.scripts
    .concat(config.vendor.scripts)
    .concat(config.plugin.scripts)
    .concat(config.plugin.tests.unit);

  karma.start({
    configFile: __dirname + '/../karma.conf.js',
    files: files,
    autoWatch: false,
    singleRun: true,
    browsers: ['Chrome_travis_ci'],
    reporters: ['dots', 'coverage'],
    //browsers: ['Firefox', 'Chrome_travis_ci'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'src/**/*.js': ['coverage']
    },

    // The HTML reporter seems to be busted right now, so we're just using text in the meantime
    // along with the summary after the test run.
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
    // There is an error on karma gulp so we need to wrap done. Please see https://stackoverflow.com/questions/26614738/issue-running-karma-task-from-gulp/26958997#26958997
  }, function (error) {
    done(error);
  });
});

module.exports = new BuildTaskDoc("tests", "Starts karma on 'autowatch' mode with all the libs, \nsources and tests of the player", 6.1);
