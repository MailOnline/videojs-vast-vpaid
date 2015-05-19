var gulp = require("gulp");
var config = require("./config");
var BuildTaskDoc = require('./BuildTaskDoc');

gulp.task("watch", function () {

  var tasks = [];
  if (config.env === 'production'){
    tasks.push('devToDist');
  }

  var scriptsWatcher = gulp.watch(config.plugin.scripts, ['build-scripts'].concat(tasks));
  var demoScriptsWatcher = gulp.watch(config.demo.scripts, ['build-demo-scripts'].concat(tasks));
  var stylesWatcher = gulp.watch(config.plugin.styles, ['build-styles'].concat(tasks));
  var demoPageWatcher = gulp.watch(config.demo.pages, ['build-demo-page'].concat(tasks));
  var assetsWatcher = gulp.watch(config.plugin.assets, ['build-assets'].concat(tasks));

  scriptsWatcher.on('change', logFileChange);
  demoScriptsWatcher.on('change', logFileChange);
  stylesWatcher.on('change', logFileChange);
  demoPageWatcher.on('change', logFileChange);
  assetsWatcher.on('change', logFileChange);


  function logFileChange(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...'.blue);
  }
});

module.exports = new BuildTaskDoc("watch", "watches for changes on the plugin files and executes the appropriate tasks", 3);
