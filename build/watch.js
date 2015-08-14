var gulp = require("gulp");
var config = require("./config");
var BuildTaskDoc = require('./BuildTaskDoc');

gulp.task("watch", function () {

  var tasks = [];
  //Plugin files
  var scriptsWatcher = gulp.watch(config.plugin.scripts, ['build-scripts']);
  var stylesWatcher = gulp.watch(config.plugin.styles, ['build-styles']);
  var assetsWatcher = gulp.watch(config.plugin.assets, ['build-assets']);

  //Demo files
  var demoScriptsWatcher = gulp.watch(config.demo.scripts.concat(['./demo/scripts/**/*.js']), ['build-demo-scripts']);
  var demoStylesWatcher = gulp.watch(config.demo.styles, ['build-demo-styles']);
  var demoPageWatcher = gulp.watch(config.demo.pages, ['build-demo-page']);

  scriptsWatcher.on('change', logFileChange);
  stylesWatcher.on('change', logFileChange);
  assetsWatcher.on('change', logFileChange);

  demoScriptsWatcher.on('change', logFileChange);
  demoPageWatcher.on('change', logFileChange);
  demoStylesWatcher.on('change', logFileChange);


  function logFileChange(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...'.blue);
  }
});

module.exports = new BuildTaskDoc("watch", "watches for changes on the plugin files and executes the appropriate tasks", 3);
