'use strict';

var bump  = require('gulp-bump');
var gulp  = require('gulp');
var gutil = require('gulp-util');

var config = require('./config');

gulp.task('bump', function () {

  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({
      version: config.options.version
      }).on('error', gutil.log))
    .pipe(bump({
      type: config.options.type
      }).on('error', gutil.log))
    .pipe(gulp.dest('./'));

});
