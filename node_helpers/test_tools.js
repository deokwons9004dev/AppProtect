/** 
 * Penetration Test Module
 * @module modules/test_tools
 *
 * This file provides main functionality for penetration test suites.
 * <MODULES>
 * NPM Modules (3rd party imported):
 *     Validator: To ensure that users are sending in valid URLs for pen testing, 
 *                we will incorporate a string module that will check incoming 
 *                strings for URL validity.
 *                (https://www.npmjs.com/package/validator)
 *     Async: Utility module for programming easily with asynchronous NodeJS.
 *            (https://caolan.github.io/async/index.html)
 *     Colors: Terminal Color Options.
 *             (https://www.npmjs.com/package/colors)
 *
 * Custom Modules:
 *     Xmlparse: This module will parse XML formatted output files and convert 
 *               results into an array of javascript friendly JSON data for 
 *               better compatibility.
 *     Zapchild: This module will create a report on some basic vulnerability 
 *               issues of the given URL using a portable version of OWASP ZAP.  
 *
 * Author : David Song (deokwons9004dev@gmail.com)
 *
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Import Native Modules. */
var log  = console.log.bind(this); // Bind print function for easier typing.

/* Import Custom Modules */
var xmlparse  = require("./xml_parse.js");
var zapchild  = require("./zap_child.js");

/* Import NPM Modules. */
var validator = require("validator");
var async     = require("async");
var colors    = require("colors");

/* Receives a request for a pentest and proceeds with the following.
 *
 * Step 1)  Check if the URL is valid. 
 *          If the URL does not contain a protocol (http://, https://, etc),
 *          then it re-checks to see if its at least a valid domain format.
 *          If so, then it concatenates 'http://' to the front of the URL.
 *          If not, then reject URL and pass the error code.
 * Step 2)  Load up a CMD version of ZAP and get a XML output file.
 *          Wait until file write is complete.
 * Step 3)  Converts the XML formatted test results into a JSON Array.
 * Step 4a) If an error occured along the way, send the error status 
 *          back to the client.
 * Step 4b) If all went well, this data will be sent back to the client.
 *
 * @param {object} options - Define all test settings.
 *                 options.url: The url string passed in.
 *
 * One of the following socket events will occur.
 * @results {Socket Event} error_zap_crash  : If the ZAP process fails.
 *                                 2nd Arg  : The error message.
 *                         error_xml_crash  : If XML parsing fails.
 *                                 2nd Arg  : The error message.
 *                         error_invalid_url: If the URL is not valid.
 *                                 2nd Arg  : none.
 *         `               test_result      : If the test succeeded.
 *                                 2nd Arg  : Array of vulnerabilities.
 */
exports.testzap = function (client, socket, option) {
	async.waterfall([
		/* Step 1 */
		function (callback) {
			if (!validator.isURL(option.url, {'require_protocol': true})) {
				if (validator.isURL(option.url)) {
					option.url = 'http://' + option.url;
					callback(null);
				}
				else callback({ name: 'error_invalid_url' });
			}
			else callback(null);
		},
		/* Step 2 */ 
		function (callback) {
			zapchild.createReport(socket, option.url, function (error, path) {
				if (error) callback({ name: 'error_zap_crash', cause: error.toString() });
				else       callback(null, path);
			});
		},
		/* Step 3 */
		function (path, callback) {
			xmlparse.parseXML(socket, path, function (error, result) {
				if (error) callback({ name: 'error_xmlparse_crash', cause: error.toString() });
				else       callback(null, result);
			});
		}
	], function (error, result) {
		/* Step 4a */
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			socket.emit(error.name, error.cause);
		}
		/* Step 4b */
		else {
			log(colors.green('Server (Info): Report Successfully Sent.'));
			socket.emit('test_result', result);
		}
		socket.child = null;
	});
}

/* Receives a request for a cancelling any current test.
 *
 * Step 1)  Check if the socket has a child process running on its behalf.
 *          If not, then simply ignore.
 *          Otherwise, release the process's port assignment 
 *          and SIGTERM the background process.
 *          Notify the user that the test has been cancelled.
 *
 * @param none.
 *
 * @results {Socket Event} test_cancel_res  : If a test has been cancelled.
 *                                 2nd Arg  : none.
 */
exports.cancelzap = function (socket) {
	/* Step 1 */
	if (socket.child != null || socket.child != undefined) {
		
		zapchild.ports_used.splice(zapchild.ports_used.indexOf(socket.port), 1);
		socket.child.kill('SIGTERM');
		socket.port = null;
		socket.child = null;
		
		log(colors.green('Server (Info): ZAP test cancelled.'));
		
		socket.emit('test_cancel_success');
	}
}