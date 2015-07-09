var gulp = require('gulp');
var path = require('path');
var flatten = require('gulp-flatten');
var runSequence = require('run-sequence');
var BuildTaskDoc = require('./BuildTaskDoc');
var config = require('./config');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var ghPages = require('gulp-gh-pages');
var git = require('gulp-git');
var del = require('del');
var fs = require('fs');

var getPackageJsonVersion = function () {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
};

gulp.task('clean-DIST', function (cb) {
  del([config.DIST], {force: true}, cb);
});

gulp.task('bump', function () {
  var bumpType = config.bump || "patch";
  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({type: bumpType}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('DEV-to-DIST', function () {
  var devFiles = path.join(config.DEV, '/**/*');
  return gulp.src(devFiles)
    .pipe(flatten())
    .pipe(gulp.dest(config.DIST));
});

gulp.task('commit-build-to-git', function () {
  return gulp.src('.')
    .pipe(git.commit('[Prerelease] Build and release new version', {args: '-a'}));
});

gulp.task('push-to-master', function (cb) {
  git.push('origin', 'master', cb);
});

gulp.task('create-new-tag-version', function (cb) {
  var version = getPackageJsonVersion();
  git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if(error) {
      return cb(error);
    }
    git.push('origin', 'master', {args: '--tags'}, cb);
  });
});

gulp.task('update-gh-pages', function() {
  return gulp.src(path.join(config.DEV, '**/*'))
    .pipe(ghPages());
});

gulp.task('deploy-demo-page', function(callback) {
  runSequence(
    'build-demo',
    'update-gh-pages',
    function (error) {
      if(error){
        console.log(error.message.red);
      }
      console.log('BUILD FINISHED SUCCESSFULLY'.green);
      callback();
    });
});

gulp.task('release', function (callback) {
  config.env = 'production';
  runSequence(
    'clean-DIST',
    'build',
    'DEV-to-DIST',
    'bump',
    'commit-build-to-git',
    'push-to-master',
    'create-new-tag-version',
    'deploy-demo-page',
    function (error) {
      if (error) {
        console.log(error.message.red);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY'.green);
      }
      callback(error);
    });
});

module.exports = new BuildTaskDoc("release", "Creates a new version of the player and releases it. \n" +
"Increasing version, creating new tag and so on (--bump [patch(default)/minor/major])", 1.1);