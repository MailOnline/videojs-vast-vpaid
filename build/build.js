var gulp = require('gulp');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var config = require('./config');
var path = require('path');
var mergeStream = require('merge-stream');
var gulpif = require('gulp-if');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var uglify = require("gulp-uglify");
var flatten = require('gulp-flatten');
var rename = require('gulp-rename');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var BuildTaskDoc = require('./BuildTaskDoc');

gulp.task('build', function (callback) {
  var tasks = [
    'clean',
    [
      'build-scripts',
      'build-styles',
      'build-libraries',
      'build-assets'
    ]
  ];

  tasks.push(function (error) {
    if (error) {
      console.log(error.message.red);
    }
    console.log('BUILD FINISHED SUCCESSFULLY'.green);
    callback();
  });

  runSequence.apply(this, tasks);
});


gulp.task('clean', function (cb) {
  del([config.DEV], {force: true}, cb);
});

gulp.task('build-scripts', function () {
  var scriptsDistPath = path.join(config.DEV, '/scripts');
  var vendorScriptsStream = gulp.src(config.vendor.scripts);
  var pluginScriptsStream = gulp.src(config.plugin.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));

  return mergeStream(vendorScriptsStream, pluginScriptsStream)
    .pipe(sourcemaps.init())
    .pipe(concat(config.prodfile.scripts, {newLine: '\n;\n'}))
    .pipe(header('(function (window, document, vjs, undefined) {'))
    .pipe(footer('})(window, document, videojs);'))
    .pipe(concat(config.prodfile.scripts, {newLine: '\n;\n'}))
    .pipe(gulpif(config.env === 'production', gulp.dest(scriptsDistPath)))
    .pipe(gulpif(config.env === 'production', uglify()))
    .pipe(gulpif(config.env === 'production', rename({suffix: ".min"})))
    .pipe(gulp.dest(scriptsDistPath))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(scriptsDistPath));
});

gulp.task('build-assets', function () {
  var assetsPath = path.join(config.DEV, '/');

  return gulp.src(config.vendor.assets)
    .pipe(gulp.dest(assetsPath));
});

gulp.task('build-libraries', function () {
  var assetsPath = path.join(config.DEV, '/scripts');

  return gulp.src(config.vendor.libraries)
    .pipe(gulp.dest(assetsPath));
});

gulp.task('build-styles', function () {
  var distCssPath = path.join(config.DEV, 'styles');
  return gulp.src(config.plugin.styles)
    .pipe(flatten())
    .pipe(gulpif(config.env === 'production', concat(config.prodfile.styles, {newLine: '\n\n'})))
    .pipe(gulpif(config.env === 'production', gulp.dest(distCssPath)))
    .pipe(gulpif(config.env === 'production', minifyCSS({keepBreaks: false})))
    .pipe(gulpif(config.env === 'production', rename({suffix: ".min"})))
    .pipe(gulp.dest(distCssPath));
});

module.exports = new BuildTaskDoc("build", "This task builds the plugin", 4);