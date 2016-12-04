var http = require('http');
var express = require("express");

var app = express();
app.set("port_secure",5443);
app.set("port",8000);
app.use(express.cookieParser());
app.use(express.bodyParser({uploadDir: __dirname + '/../Data/temp'}));
app.use(app.router);
app.use("/",express.static(__dirname+"/../Web"));
app.use(function (request,response,next) {
	var proxy = http.createClient(80, request.headers['host'])
	var proxy_request = proxy.request(request.method, request.url, request.headers);
	proxy_request.addListener('response', function (proxy_response) {
		proxy_response.addListener('data', function(chunk) {
//			console.log(chunk.toString());
			response.write(chunk, 'binary');
		});
		proxy_response.addListener('end', function() {
			response.end();
		});
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	request.addListener('data', function(chunk) {
		
		proxy_request.write(chunk, 'binary');
	});
	request.addListener('end', function() {
		proxy_request.end();
	});
	console.log(request);
//	next();
});


http.createServer(app).listen(8000);