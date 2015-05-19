var gulp = require( "gulp" );
var supervisor = require( "gulp-supervisor" );
var BuildTaskDoc = require('./BuildTaskDoc');

gulp.task( "dev-server", ['build-demo'], function() {
    console.log('STARTING DEVELOPMENT SERVER'.blue);
    supervisor( "demo/server/index.js" );
});

module.exports = new BuildTaskDoc("dev-server", "Starts a server pointing to DEV folder", 2);