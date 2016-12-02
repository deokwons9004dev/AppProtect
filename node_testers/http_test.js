var http = require("http");
//var http = require("stream-http");

//http.get('http://nodejs.love/index.html', function (res) {
//	var result = '';
////	var div = document.getElementById('result');
////	div.innerHTML += 'GET /beep<br>';
//	
//	res.on('data', function (buf) {
////		div.innerHTML += buf;
//		result += buf;
//	});
//	
//	res.on('end', function () {
////		div.innerHTML += '<br>__END__';
//		result += '';
//	});
//})

http.get('http://nodejs.org/dist/index.json', (res) => {
	const statusCode = res.statusCode;
	const contentType = res.headers['content-type'];

	var error;
	if (statusCode !== 200) {
		error = new Error(`Request Failed.\n` +
											`Status Code: ${statusCode}`);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error(`Invalid content-type.\n` +
											`Expected application/json but received ${contentType}`);
	}
	if (error) {
		console.log(error.message);
		// consume response data to free up memory
		res.resume();
		return;
	}

	res.setEncoding('utf8');
	var rawData = '';
	res.on('data', (chunk) => rawData += chunk);
	res.on('end', () => {
		try {
			var parsedData = JSON.parse(rawData);
			console.log(parsedData);
		} catch (e) {
			console.log(e.message);
		}
	});
}).on('error', (e) => {
	console.log(`Got error: ${e.message}`);
});