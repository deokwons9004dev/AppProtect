/** 
 * ZAP Child Process Module
 * @module modules/zap_child
 *
 * This file provides the feature to run OWASP ZAP and obtain its scan results.
 * <MODULES>
 * NPM Modules (3rd party imported):
 *     File-Exists: This is a simple module that checks whether a given file path 
 *                  exists in the filesystem. We use this to check whether our test
 *                  data has been successfully outputted to a file for future use.
 *                  (https://www.npmjs.com/package/file-exists) 
 *     Node-uuid: Implementation of RFC4122 (v1 & v4) UUID for NodeJS.
 * 				  (https://www.npmjs.com/package/node-uuid)
 *     Colors: Terminal Color Options.
 *             (https://www.npmjs.com/package/colors)
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Native Modules Import. */
var path = require("path");
var cp   = require("child_process");
var fs   = require("fs");
var log  = console.log.bind(this);

/* NPM Modules Import. */
var exist  = require("file-exists");
var uuid   = require("node-uuid");
var colors = require("colors");

/* Static Module variables. */
const minPort = 7000;    // Lowest port number available to sockets. 
const maxPort = 7999;    // Highest port number available to sockets. 

/* Export Variables. */
exports.port       = minPort; // Starting port available to sockets.
exports.ports_used = [];      // Array for storing port numbers in use.

/**
 * Finds the next available port for a socket to use in testing. 
 *
 * Each ZAP process requires an open port to use for testing.
 * Once a ZAP process is spawned with the port assigned to it,
 * other processes will not be able to use that port while in use.
 *
 * This function will increment the global port counter so that the 
 * next socket can ube assigned to a new open port.
 * Once the counter hits the maxPort limit, 
 * it will roll back down to lowPort.
 *
 * @param none.
 * @return none.
 */
function nextPort () {
	exports.port++;
	while(exports.ports_used.indexOf(exports.port) != -1) {
		exports.port++;
		if (exports.port > maxPort)
			exports.port = minPort;
	}
}

/**
 * Checks if a file write is completed by another process. 
 *
 * This function will fire up a repeating timer, and check 
 * if the file size hasn't changed during the interval. 
 * If this test passes 4 consecutive times, then it stops 
 * the timer, and returns a callback.
 *
 * @param none.
 * @return none.
 */
function checkReportDone (filepath, callback) {
	var fsize_prev   = fs.statSync(filepath).size;
	var fsize        = fsize_prev;
	
	const count_done = 4;
	var count        = 0;
	
	var timer_fsize = 
	setInterval(function () {
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

/**
 * Creates a Pen Test Report via OWASP ZAP.
 * @param {object} socket    : Current web socket.
 * @param {string} URL       : URL string to be tested.
 * @param {function} callback
 *                   	1st Arg: error
 * 						2nd Arg: Path to test result file.
 */
exports.createReport = function (socket, url, callback) {
	
	/* The report output path name is randomly generated. */
	var output = path.normalize(__dirname + "/../user_data/reports/" + uuid.v4() + ".xml");
	
	/* Obtains a free port and adds it to the array of busy ports. */
	var port    = exports.port;
	socket.port = port;
	exports.ports_used.push(port);
	nextPort();

	/* OWASP ZAP Child Process Arguments.
	 * Basic CMD Usage: zap.sh -cmd -quickurl <URL> -quickout <PATH> -quickprogress
	 * Create a command string based on the options supplied by the client.
	 */
	var zap_path   = __dirname + "/ZAP/zap.sh -cmd -quickprogress -port " + port;
	var zap_option = "-quickurl " + url;
	var zap_action = "-quickout " + output;
	var cmd        = zap_path + " " + zap_option + " " + zap_action;

	/* Execute a new child process with the given args. */
	var child = cp.exec(cmd, function (error, stdout, stderr) {});
	
	log(colors.cyan('Server (Info): Zap Child Process Spawned at port %d', port));
		
	/* Assign the child object to the sockets attribute. */
	socket.child = child;
	socket.emit('progress_zap_0_exec');
	
	/* For each line of STDOUT, search for the matching 
	 * strings to get status updates. 
	 */
	child.stdout.on('data', function (data) {
		if (data.indexOf('Spidering') != -1)
			socket.emit('progress_zap_1_spider');
		if (data.indexOf('Active scanning') != -1)
			socket.emit('progress_zap_2_active');
		if (data.indexOf('Attack complete') != -1)
			socket.emit('progress_zap_3_attack_done');
	});
	/* For ANY line of STDERR output,
	 * 1) Clear the post processing timer.
	 * 2) Remove the port number from the port array.
	 * 3) Clear the port attribute of the socket.
	 * 4) Kill the remaining ZAP process.
	 * 5) Return callback with erro string.
	 */
	child.stderr.on('data', function (data) {
		clearInterval(timer);
		exports.ports_used.splice(exports.ports_used.indexOf(port), 1);
		socket.port = null;
		child.kill('SIGTERM');
		return callback(data.toString());
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



