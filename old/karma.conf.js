var istanbul = require('browserify-istanbul');
var config = require('./build/config');

module.exports = function (karma) {
  karma.set({
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: './',

    files: config.testFiles(),

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    frameworks: [ 'browserify', 'mocha', 'chai-sinon'],

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },
    browserify: {
      paths: ['src/scripts', 'bower_components'],
      debug: true,
      transform: [ ['babelify', {
        presets: ["es2015"],
        only: /VPAIDFLASHClient/
        }],
        istanbul({
            //NOTE: Once we got full ES6 there is a problem in Karma/Istanbul please look https://github.com/karma-runner/karma-coverage/issues/157#issuecomment-160555004
            ignore: ['**/node_modules/**', '**/test/**', '**/bower_components/**'],
        }) ]
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
      //'Safari',
      'Firefox',
      'Chrome'
    ]
  });
};
