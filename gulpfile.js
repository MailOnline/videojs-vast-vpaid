var requireDir = require('require-dir');
var asciify    = require('asciify');
var gulp       = require('gulp');
var async      = require('async');
var Table      = require('cli-table');
var BuildTaskDoc = require('./build/BuildTaskDoc');

//Init colors
require('./build/COLORS');

//We retrieve the build-tasks
var buildTasksMap = requireDir('./build');


gulp.task('default', function (finishTask) {
    async.series([
        printWelcomeMessage,
        printBanner,
        printTasksHelpTable
        ],
        finishTask
    );

    /*** Local functions ***/

    function printWelcomeMessage(done) {
        console.log("Welcome to MailOnline's new".info);
        done();
    }

    function printBanner(done) {
        asciify('Videojs Vast Vpaid', function (err, res) {
            console.log(res.help);
            done();
        });
    }

    function printTasksHelpTable(done) {
        var table = new Table({
            head: ['Name', 'Description'],
            colWidths: [25, 80],
            chars: {
                'top': '═',
                'top-mid': '╤',
                'top-left': '╔',
                'top-right': '╗' ,
                'bottom': '═',
                'bottom-mid': '╧',
                'bottom-left': '╚',
                'bottom-right': '╝' ,
                'left': '║',
                'left-mid': '╟',
                'mid': '─',
                'mid-mid': '┼' ,
                'right': '║',
                'right-mid': '╢',
                'middle': '│'
            }
        });

        var buildTasks = getBuildTasks(buildTasksMap);

        buildTasks.forEach(function (task) {
            table.push([task.name, task.description]);
        });

        console.log('###### Below, you have the list of all the available build tasks ########');
        console.log(table.toString());
        console.log('   ');
        console.log("NOTE: if a task is run with '--env production' it will execute the build task for production. Minifying scripts and so on".green);
        console.log('   ');
        done();
    }

    function getBuildTasks(tasksDir) {

        var tasks = Object.keys(tasksDir)
            .map(function mapTasks(taskName) {
                return tasksDir[taskName];
            })
            .filter(function filterTasks(task) {
                return task instanceof BuildTaskDoc;
            })
            .sort(function compareTasks(a, b) {
                return a.order > b.order ? 1 : -1;
            });

        return tasks;
    }

});