var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var config = require('./config');
var template = require('gulp-template');
var globUtils = require('./globUtils');
var flatten = require('gulp-flatten');
var BuildTaskDoc = require('./BuildTaskDoc');


gulp.task('build-demo', function (callback) {
  runSequence(
    'build',
    'build-demo-page',
    [
      'build-demo-scripts',
      'build-demo-styles',
      'build-demo-fonts',
      'build-demo-assets'
    ],
  function (error) {
      if (error) {
        console.log(error.message.red);
      }
      console.log('BUILD DEMO FINISHED SUCCESSFULLY'.green);
      callback();
    });
});

gulp.task('build-demo-styles', function () {
  var stylesPath = path.join(config.DEV, '/styles');

  return gulp.src(config.demo.styles)
    .pipe(gulp.dest(stylesPath));
});

gulp.task('build-demo-fonts', function () {
  var fontsPath = path.join(config.DEV, '/styles/font');

  return gulp.src(config.demo.fonts)
    .pipe(gulp.dest(fontsPath));
});

gulp.task('build-demo-assets', function () {
  var assetsPath = path.join(config.DEV, '/assets');

  return gulp.src(config.demo.assets)
    .pipe(gulp.dest(assetsPath));
});

gulp.task('build-demo-page', function () {
  var scripts = [path.join(config.DEV, '/scripts/*.js')];
  var styles =  [path.join(config.DEV, '/styles/*.css')];

  scripts = globUtils.syncGlobArray(scripts, {}, true, 'scripts');

  styles = globUtils.syncGlobArray(styles, {}, true, 'styles');

  return gulp.src(config.demo.pages)
    .pipe(template({
      scripts: scripts,
      styles: styles
    }))
    .pipe(gulp.dest(config.DEV));
});


gulp.task('build-demo-scripts', function () {
  var scriptsDistPath = path.join(config.DEV, '/scripts');

  return gulp.src(config.demo.scripts)
    .pipe(flatten())
    .pipe(gulp.dest(scriptsDistPath));
});

module.exports = new BuildTaskDoc("build-demo", "Builds the demo", 5);