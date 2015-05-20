var express = require('express');
var app = express();

app.use(express.static(__dirname + '/../../dev'));

app.listen(8085);

console.log("Server started Listening on port: 8085");
console.log("Serving static files from: ", __dirname + '/../dev');

module.exports = app;
