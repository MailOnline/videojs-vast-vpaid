var path = require('path');
var glob = require("glob");


function syncGlobArray(patterns, options, flatten, prefix) {
    var fileMatches = [];
    patterns = patterns || [];
    options = options || {};
    prefix = prefix || '';

    patterns.forEach(function (pattern) {
        var patternMatches = glob.sync(pattern, options);

        if (pattern.substr(0, 1) !== '!') {
            fileMatches = fileMatches.concat(patternMatches);
        } else {
            filterNegative(patternMatches, fileMatches);
        }
    });

    if(flatten) {
        fileMatches = flattenFiles(fileMatches, prefix);
    }
    return fileMatches;
}

function filterNegative(negativeMatches, allMatches) {
    negativeMatches.forEach(function (match) {
        var index = allMatches.indexOf(match);

        if (index > -1) {
            allMatches.splice(index, 1);
        }
    })
}

function flattenFiles(files, prefix){
    var flattenedFiles = [];
    files.forEach(function(file){
        var fileName = file.replace(/^.*[\\\/]/, '');
        flattenedFiles.push(path.join(prefix, fileName));
    });
    return flattenedFiles;
}

module.exports = {
    syncGlobArray:syncGlobArray,
    flattenFiles: flattenFiles
};