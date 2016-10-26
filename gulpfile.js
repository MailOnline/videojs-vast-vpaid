const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const ghPages = require('gulp-gh-pages');

// eslint-disable-next-line no-process-env
const remoteUrl = process.env.GH_TOKEN ? 'https://' + process.env.GH_TOKEN + '@github.com/MailOnline/videojs-vast-vpaid' : 'origin';

gulp.task('update-gh-pages', () => {
  return gulp.src(path.join('dist', '**/*'))
   .pipe(ghPages({remoteUrl}));
});

gulp.task('prepare-demo-statics', () => {
  return gulp.src([
    'demo/*.html',
    'demo/_config.yml'
  ])
  .pipe(gulp.dest('dist'));
});

gulp.task('deploy-demo', (done) => {
  runSequence(
    'prepare-demo-statics',
    'update-gh-pages',
    (error) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log('BUILD FINISHED SUCCESSFULLY');
      }
      done(error);
    });
});
