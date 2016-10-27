require('babel-core/register');

const webpack = require('./webpackfile.babel').default;

function karmaconf (karma) {
  const config = {
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: './',

    files: [
      'bower_components/videojs_4/dist/video-js/video.js',
      'test/test-utils.css',
      'test/**/*.spec.js'
    ],

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    frameworks: [ 'mocha', 'chai-sinon'],

    preprocessors: {
      'test/**/*.spec.js': [ 'webpack' ]
    },

    webpack,

    webpackMiddleware: {
      stats: 'errors-only'
    },

    logLevel: 'ERROR',

    /**
     * How to report, by default.
     */
    reporters: ['progress'],

    /**
     * On which port should the browser connect, on which port is the test runner
     * operating, and what is the URL path for the browser to use.
     */
    port: 9018,
    runnerPort: 9100,
    urlRoot: '/',

    /**
     * Enable file watching by default.
     */
    autoWatch: true,
    singleRun: false,

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    /**
     * The list of browsers to launch to test on. This includes only "Firefox" by
     * default, but other browser names include:
     * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
     *
     * Note that you can also use the executable name of the browser, like "chromium"
     * or "firefox", but that these vary based on your operating system.
     *
     * You may also leave this blank and manually navigate your browser to
     * http://localhost:9018/ when you're running tests. The window/tab can be left
     * open and the tests will automatically occur there during the build. This has
     * the aesthetic advantage of not launching a browser every time you save.
     */
    browsers: [
      'Chrome'
    ]
  };

  // eslint-disable-next-line no-process-env
  if (process.env.TRAVIS) {
    config.browsers = ['Chrome_travis_ci'];
  }

  karma.set(config);
}

module.exports = karmaconf;
