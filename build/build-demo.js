'use strict';

var browserify   = require('browserify');
var gulp         = require('gulp');
var mergeStream  = require('merge-stream');
var path         = require('path');
var rename       = require('gulp-rename');
var runSequence  = require('run-sequence');
var sass         = require('gulp-sass');
var source       = require('vinyl-source-stream');
var template     = require('gulp-template');

var BuildTaskDoc = require('./BuildTaskDoc');
var config       = require('./config');

gulp.task('build-demo', function (done) {
  runSequence(
    'build',
    [
      'build-demo-page',
      'build-demo-scripts',
      'build-demo-styles',
      'build-demo-videojs',
      'build-demo-config'
    ],
    function (error) {
      if (error) {
        console.log(error.message.red);
      } else {
        console.log('BUILD DEMO FINISHED SUCCESSFULLY'.green);
      }
      done(error);
    });
});

gulp.task('build-demo-styles', function () {
  var stylesPath = path.join(config.DEV, '/styles');

  return gulp.src(config.demo.styles)
    .pipe(gulp.dest(stylesPath));
});

gulp.task('build-demo-page', function () {

  var demoPage = path.join('demo/templates', 'index.html');
  var buildProcesses = config.versions.map(function(version) {

    return gulp.src(demoPage)
      .pipe(template({
        isDefault: config.versions.indexOf(version) === 0,
        version: version,
        otherVersions: config.versions.filter(function(v) { return v !== version;}),
        demoAds: config.demoAds
      }))
      .pipe(rename('index_' + version + '.html'))
      .pipe(gulp.dest(config.DEV));
  });

  return mergeStream.apply(this, buildProcesses);
});


gulp.task('build-demo-scripts', function () {
  var mainScript = path.join('demo/scripts', 'demo.js');
  var destPath = path.join(config.DEV, '/demo/scripts');

  return browserify({
      entries: mainScript,
      insertGlobals: true,
      debug : true
    }).bundle()
    .pipe(source('demo.js'))
    .pipe(gulp.dest(destPath));
});

gulp.task('build-demo-styles', function () {
  var mainStyle = path.join('demo/styles', 'demo.scss');
  var destPath = path.join(config.DEV, '/demo/styles');

  return gulp.src(mainStyle)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(destPath));

});

gulp.task('build-demo-videojs', function () {
  var assetsDistPath = path.join(config.DEV, '/demo');

  var buildProcesses = config.versions.map(function(version) {
    return gulp.src(config.versionsMap[version] + '**/*')
      .pipe(gulp.dest(path.join(assetsDistPath, '/videojs_' + version + '/')));
  });

  return mergeStream.apply(this, buildProcesses);
});

gulp.task('build-demo-config', function () {
  var configFile = path.join('demo', '_config.yml');
  var destPath = path.join(config.DEV);

  return gulp.src(configFile)
    .pipe(gulp.dest(destPath));

});


module.exports = new BuildTaskDoc('build-demo', 'Builds the demo', 5);