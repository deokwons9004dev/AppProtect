// Lecture4_express_fileupload.js

var fs = require("fs");
var http = require("http");
var express = require("express");
var app = express();

//app.use(express.bodyParser());
// Use this to have uploads go to specified folder
/*
* If you get a EXDEV Error, it means that cross-partition uploads are not
* allowed. If so, use the below bodyparser to get the uploads initially to 
* a folder in the same partition, and then perform the rename from there.
*/
app.use(express.bodyParser({uploadDir: __dirname + '/public'}));
// Use this to have file size limit.
//app.use(express.limit('10mb'));

app.get('/', function (req,res){
	fs.readFile("Lecture4_express_fileupload.html", function (err, data) {
		res.send(data.toString());
	});
});

app.post('/login', function (req,res){
	console.log('YAY');
});

http.createServer(app).listen(8000, function () {
	console.log("Server running at port 8000.");
});