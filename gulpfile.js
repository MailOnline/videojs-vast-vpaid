const path = require('path');
const gulp = require('gulp');
const ghPages = require('gulp-gh-pages');

// eslint-disable-next-line no-process-env
const remoteUrl = process.env.GH_TOKEN ? 'https://' + process.env.GH_TOKEN + '@github.com/MailOnline/videojs-vast-vpaid' : 'origin';

gulp.task('update-gh-pages', () => {
  return gulp.src(path.join('dist', '**/*'))
   .pipe(ghPages({remoteUrl}));
});

gulp.task('prepare-demo-statics', () => {
  return gulp.src([
    'bower_components/videojs_4/dist/video-js/video-js.css',
    'bower_components/videojs_4/dist/video-js/video.js',
    'demo/*.html',
    'demo/_config.yml'
  ])
  .pipe(gulp.dest('dist'));
});
