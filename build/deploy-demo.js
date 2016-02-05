'use strict';

var gulp        = require('gulp');
var path        = require('path');
var runSequence = require('run-sequence');
var ghPages     = require('gulp-gh-pages');

var BuildTaskDoc = require('./BuildTaskDoc');
var config       = require('./config');

gulp.task('update-gh-pages', function() {
  return gulp.src(path.join(config.DEV, '**/*'))
    .pipe(ghPages({
      remoteUrl: config.git.remoteUrl
    }));
});

gulp.task('deploy-demo', function(done) {
  runSequence(
    'build-demo',
    'update-gh-pages',
    function (error) {
      if(error){
        console.log(error.message.red);
      } else {
        console.log('BUILD FINISHED SUCCESSFULLY'.green);
      }
      done(error);
    });
});

module.exports = new BuildTaskDoc('deploy-demo', 'Builds the demo and deploys it to github pages', 1.1);