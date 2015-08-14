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
  var cleanDirs = [config.DEV];
  if(config.env === 'production'){
    cleanDirs.push(config.DIST);
  }
  del(cleanDirs, {force: true}, cb);
});

gulp.task('build-scripts', function () {
  var scriptsDevPath = path.join(config.DEV, '/scripts');
  var scriptsDistPath = path.join(config.DIST, '/');
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
    .pipe(gulpif(config.env === 'production', gulp.dest(scriptsDevPath)))
    .pipe(gulpif(config.env === 'production', gulp.dest(scriptsDistPath)))
    .pipe(gulpif(config.env === 'production', uglify()))
    .pipe(gulpif(config.env === 'production', rename({suffix: ".min"})))
    .pipe(gulp.dest(scriptsDevPath))
    .pipe(gulpif(config.env === 'production', gulp.dest(scriptsDistPath)))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(scriptsDevPath))
    .pipe(gulpif(config.env === 'production', gulp.dest(scriptsDistPath)));
});

gulp.task('build-assets', function () {
  var assetsDevPath = path.join(config.DEV, '/');
  var assetsDistPath = path.join(config.DIST, '/');

  return gulp.src(config.vendor.assets)
    .pipe(gulp.dest(assetsDevPath))
    .pipe(gulpif(config.env === 'production', gulp.dest(assetsDistPath)));
});

gulp.task('build-libraries', function () {
  var assetsDevPath = path.join(config.DEV, '/scripts');
  var assetsDistPath = path.join(config.DIST, '/');

  return gulp.src(config.vendor.libraries)
    .pipe(gulp.dest(assetsDevPath))
    .pipe(gulpif(config.env === 'production', gulp.dest(assetsDistPath)));

});

gulp.task('build-styles', function () {
  var cssDevPath = path.join(config.DEV, 'styles');
  var cssDistPath = path.join(config.DIST, '/');

  return gulp.src(config.plugin.styles)
    .pipe(flatten())
    .pipe(gulpif(config.env === 'production', concat(config.prodfile.styles, {newLine: '\n\n'})))
    .pipe(gulpif(config.env === 'production', gulp.dest(cssDevPath)))
    .pipe(gulpif(config.env === 'production', gulp.dest(cssDistPath)))
    .pipe(gulpif(config.env === 'production', minifyCSS({keepBreaks: false})))
    .pipe(gulpif(config.env === 'production', rename({suffix: ".min"})))
    .pipe(gulp.dest(cssDevPath))
    .pipe(gulpif(config.env === 'production', gulp.dest(cssDistPath)));
});

module.exports = new BuildTaskDoc("build", "This task builds the plugin", 4);