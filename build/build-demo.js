var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var config = require('./config');
var template = require('gulp-template');
var globUtils = require('./globUtils');
var flatten = require('gulp-flatten');
var BuildTaskDoc = require('./BuildTaskDoc');
var source     = require('vinyl-source-stream');
var browserify = require('browserify');
var rename = require('gulp-rename');
var mergeStream = require('merge-stream');

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
  var mainScript = path.join('demo/scripts', 'main.js');
  var scriptsDistPath = path.join(config.DEV, '/scripts');

  var dependencies_stream = gulp.src(config.demo.scripts)
    .pipe(flatten());

  var bundle_stream = browserify({
      entries: mainScript,
      insertGlobals : true,
      debug : true
    }).bundle()
    .pipe(source(mainScript))
    .pipe(rename('demo_bundle.js'));

  return mergeStream(dependencies_stream, bundle_stream)
    .pipe(gulp.dest(scriptsDistPath));
});

module.exports = new BuildTaskDoc("build-demo", "Builds the demo", 5);