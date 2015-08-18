var gulp = require('gulp');
var path = require('path');
var config = require('./config');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var git = require('gulp-git');
var del = require('del');

gulp.task('bump', function () {
  var bumpType = config.options.type;

  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({version: config.options.version}).on('error', gutil.log))
    .pipe(bump({type: bumpType}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});
