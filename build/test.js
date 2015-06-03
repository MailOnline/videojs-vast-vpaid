var gulp = require('gulp');
var karma = require('karma').server;
var config = require('./config');
var BuildTaskDoc = require('./BuildTaskDoc');

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
  var files = config.demo.scripts
    .concat(config.vendor.scripts)
    .concat(config.plugin.scripts)
    .concat(config.plugin.tests.unit);

  var autoWatch = !!config.options['watch'];

  karma.start({
    configFile: __dirname + '/../karma.conf.js',
    files: files,
    autoWatch: autoWatch,
    singleRun: !autoWatch,
    // There is an error on karma gulp so we need to wrap done. Please see https://stackoverflow.com/questions/26614738/issue-running-karma-task-from-gulp/26958997#26958997
  }, function (error) {
    done(error);
  });
});

module.exports = new BuildTaskDoc("tests", "Starts karma on 'autowatch' mode with all the libs, \nsources and tests of the player", 6.1);
