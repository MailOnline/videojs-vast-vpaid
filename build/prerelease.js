var gulp = require('gulp');
var path = require('path');
var runSequence = require('run-sequence');
var BuildTaskDoc = require('./BuildTaskDoc');
var config = require('./config');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var git = require('gulp-git');
var del = require('del');

gulp.task('bump', function () {
  var bumpType = config.bump || "patch";
  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({type: bumpType}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('commit-build', function () {
  return gulp.src('.')
    .pipe(git.commit('[Prerelease] Build and bump new version', {args: '-a'}));
});

gulp.task('push-to-release', function (cb) {
  git.push(config.git.remoteUrl, 'RELEASE', {quiet: true}, cb);
});


gulp.task('prerelease', function (callback) {
  config.env = 'production';
  runSequence(
    'build',
    'bump',
    'commit-build',
    'push-to-release',
    function (error) {
      if (error) {
        console.log(error.message.red);
      } else {
        console.log('PRERELEASE SUCCESSFUL'.green);
      }
      callback(error);
    });
});

module.exports = new BuildTaskDoc("release", "Creates a new version of the player and releases it. \n" +
"Increasing version, creating new tag and so on (--bump [patch(default)/minor/major])", 1.1);