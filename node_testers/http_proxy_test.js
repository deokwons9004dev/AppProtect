var http = require('http');
var express = require("express");
var request = require("request");

var app = express();
app.set("port_secure",5443);
app.set("port",8000);
app.use(express.cookieParser());
app.use(express.bodyParser({uploadDir: __dirname + '/../Data/temp'}));
app.use(app.router);
app.use("/",express.static(__dirname+"/../Web"));
app.use(function (req,res,next) {
//	var proxy = http.createClient(80, request.headers['host'])
//	var proxy_request = proxy.request(request.method, request.url, request.headers);
//	proxy_request.addListener('response', function (proxy_response) {
//		proxy_response.addListener('data', function(chunk) {
////			console.log(chunk.toString());
//			response.write(chunk, 'binary');
//		});
//		proxy_response.addListener('end', function() {
//			response.end();
//		});
//		response.writeHead(proxy_response.statusCode, proxy_response.headers);
//	});
//	request.addListener('data', function(chunk) {
//		
//		proxy_request.write(chunk, 'binary');
//	});
//	request.addListener('end', function() {
//		proxy_request.end();
//	});
	console.log(req.url);
//	console.log(response);
//	response.send('<h1>Hi!</h1>');
	var options = {
		url   : req.url,
		method: req.method,
		headers: req.headers,
		
		json: true,
		body: req.body,
	}
	request(options, function (error, resp, body) {
		if (error) console.log(error);
		else {
			console.log(body);
			
			res.send(body);
		}
	});
//	next();
});


http.createServer(app).listen(8000);