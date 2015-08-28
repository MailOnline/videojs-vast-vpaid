var express = require('express');
var app = express();
var PORT = 8086;

app.use(express.static(__dirname + '/../../dev'));

app.listen(PORT);

console.log("Server started Listening on port: " + PORT);
console.log("Serving static files from: ", __dirname + '/../dev');

module.exports = app;
