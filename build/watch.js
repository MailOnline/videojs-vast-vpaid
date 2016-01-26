'use strict';

var gulp = require('gulp');

var BuildTaskDoc = require('./BuildTaskDoc');

gulp.task('watch', function () {
  gulp.watch('./src/**/*.js', ['build-scripts']);
  gulp.watch('./src/**/*.scss', ['build-styles']);
  gulp.watch('./demo/**/*.html', ['build-demo-page']);
  gulp.watch('./demo/**/*.js', ['build-demo-scripts']);
  gulp.watch('./demo/**/*.scss', ['build-demo-styles']);
});

module.exports = new BuildTaskDoc('watch', 'watches for changes on the plugin files and executes the appropriate tasks', 3);
