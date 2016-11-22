/** 
 * ZAP Child Process Module.
 * @module modules/zap_child
 */

/* NPM Modules Import. */
var exist = require("file-exists");
var uuid = require("node-uuid");
var validator = require("validator");

/* Native Modules Import. */
var path = require("path");
var cp = require("child_process");
var fs = require("fs");
var log = console.log.bind(this);

exports.port = 7000;
exports.ports_used = [];

function nextPort () {
	exports.port++;
	while(exports.ports_used.indexOf(exports.port) != -1) {
		exports.port++;
		if (exports.port > 7999)
			exports.port = 7000;
	}
}

/**
 * Creates a Pen Test Report via OWASP ZAP.
 * @param {object} socket - current web socket.
 * @param {string} URL to be tested.
 * @param {function} callback - Args: Error, Path Output.
 */
exports.createReport = function (socket, url, callback) {
	/* Checks if URL is valid. 
	 * ZAP can only take in URLs with a valid protocol (eg. http:// OR https:// OR etc), 
	 * so if we get a valid URL without a protocol, we prepend the "http://" protocol. 
	 * However, if the URL without a protocol is still invalid (eg. google_ly), 
	 * we return a error callback instead. */
	if (!validator.isURL(url, {'require_protocol': true})) {
		if (validator.isURL(url))
			url = 'http://' + url;
		else
			return callback(new Error('Invalid URL'));
	}
	
	/* The report output path name is randomly generated. */
	var output = path.normalize(__dirname + "/../data/reports/" + uuid.v4() + ".xml");

	var port = exports.port;
	socket.port = port;
	exports.ports_used.push(port);
	nextPort();

	log('Port @ ' + port);

	// zap.sh -cmd -quickurl http://nodejs.love -quickout ~/test.xml -quickprogress
	/* OWASP ZAP Child Process Arguments. (Platform Dependent) */
	var zap_path = __dirname + "/ZAP/zap.sh -cmd -quickprogress -port " + port;
	var zap_option = "-quickurl " + url;
	var zap_action = " -quickout " + output;
	var cmd = zap_path + " " + zap_option + " " + zap_action;

	/* Execute a new child process with the given args. */
	var child = cp.exec(cmd, function (error, stdout, stderr) {});
	
	socket.child = child;
	socket.emit('progress_zap_0_exec');
	
	child.stdout.on('data', function (data) {
		if (data.indexOf('Spidering') != -1)
			socket.emit('progress_zap_1_spider');
		if (data.indexOf('Active scanning') != -1)
			socket.emit('progress_zap_2_active');
		if (data.indexOf('Attack complete') != -1)
			socket.emit('progress_zap_3_attack_done');
//		log('STDOUT:' + data);
	});
	child.stderr.on('data', function (data) {
		socket.emit('error_zap_crash');
		
		clearInterval(timer);
		
		exports.ports_used.splice(exports.ports_used.indexOf(port), 1);
		socket.port = null;
		child.kill('SIGTERM');
		
//		log('STDERR:' + data);
	});

	/* Keep checking whether a report file has been written to the file system.
	 * Once generated, SIGTERM the child process, clear the timer,
	 * and return a callback with the report file path.
	 */
	var timer = setInterval(function () {
		if (exist(output)) {
			
			clearInterval(timer);
			socket.emit('progress_zap_4_write_start');
			
			checkReportDone(output, function () {
				socket.emit('progress_zap_5_write_done');
				
				exports.ports_used.splice(exports.ports_used.indexOf(port), 1);
				socket.port = null;
				child.kill('SIGTERM');
				
				return callback(undefined,output);
			});
		}
	}, 1000);
}

function checkReportDone (filepath, callback) {
	var fsize_prev = fs.statSync(filepath).size;
	var fsize = fsize_prev;
	
	const count_done = 4;
	var count = 0;
	var timer_fsize = setInterval(function () {
		fsize = fs.statSync(filepath).size;
		if (fsize == fsize_prev) {
			count++;
			if (count == count_done) {
				clearInterval(timer_fsize);
				return callback();
			}
		}
		else {
			fsize_prev = fsize;
			count = 0;
		}
	}, 1000);
}

