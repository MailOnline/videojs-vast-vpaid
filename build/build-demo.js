var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var config = require('./config');
var template = require('gulp-template');
var globUtils = require('./globUtils');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var BuildTaskDoc = require('./BuildTaskDoc');


gulp.task('build-demo', function (callback) {
  runSequence(
    'build',
    [
      'build-demo-scripts',
      'build-demo-assets',
      'build-demo-page'
    ],
    function (error) {
      if (error) {
        console.log(error.message.red);
      }
      console.log('BUILD DEMO FINISHED SUCCESSFULLY'.green);
      callback();
    });
});


gulp.task('build-demo-assets', function () {
  var assetsPath = path.join(config.DEV, '/assets');

  return gulp.src(config.demo.assets)
    .pipe(gulp.dest(assetsPath));
});


gulp.task('build-demo-page', function () {
  var scripts, styles;

  if (config.env === 'production') {
    scripts = [
      config.prodfile.scripts
    ];

    scripts = globUtils.flattenFiles(scripts, 'scripts');

  } else {
    scripts = config.vendor.scripts
      .concat(config.plugin.scripts);

    scripts = globUtils.syncGlobArray(scripts, {}, true, 'scripts');
  }

  styles = [
    config.prodfile.styles
  ];

  styles = globUtils.flattenFiles(styles, 'styles');

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