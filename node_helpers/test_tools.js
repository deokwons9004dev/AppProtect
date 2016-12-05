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
var misctools = require("./misc_tools.js");

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
exports.testzap = function (client, socket, io, option) {
	async.waterfall([
		/* Step 1 */
		function (callback) {
			if (!validator.isURL(option.url, {'require_protocol': true})) {
				if (validator.isURL(option.url)) {
					option.url = 'http://' + option.url;
					callback(null);
				}
				else callback({ name: 'test_zap_reject', cause: 'INVALID_URL' });
			}
			else callback(null);
		},
        /* Check if site is verified for testing. */
        function (callback) {
            client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
                if (error) 
                    callback({ name: 'test_zap_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
                else {
                    var sites  = JSON.parse(result[0].user_sites);
                    var domain = misctools.extractDomain(option.url)
                    if (sites.indexOf(domain) == -1)
                        callback({ name: 'test_zap_reject', cause: 'SITE_NOT_VERIFIED' });
                    else callback(null);
                }
            });
        },
		/* Step 2 */ 
		function (callback) {
			zapchild.createReport(socket, option.url, function (error, path) {
				if (error) callback({ name: 'test_zap_reject', cause: 'ZAP_CRASH', cause2: error.toString() });
				else       callback(null, path);
			});
		},
		/* Step 3 */
		function (path, callback) {
			xmlparse.parseXML(socket, path, function (error, testResult) {
				if (error) callback({ name: 'test_zap_reject', cause: 'XMLPARSE_CRASH', cause2: error.toString() });
				else       callback(null, testResult);
			});
		},
        /* Insert test data into database if not already inserted. (Non update-able) */
        function (testResult, callback) {
            var domain = misctools.extractDomain(option.url);
            client.query('SELECT * FROM Results WHERE test_domain = ?', [domain], function (error, result) {
                if (error)
                    callback({ name: 'test_zap_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
                else if (result.length > 1)
                    callback({ name: 'test_zap_reject', cause: 'DUPLICATE_DOMAINS' });
                else if (result.length > 0)
                    callback(null, testResult);
                else {
                    client.query('INSERT INTO Results VALUES (?,?)', [domain, JSON.stringify(testResult)], function (error) {
                        if (error)
                            callback({ name: 'test_zap_reject', cause: 'DATABASE_INSERT_FAIL', cause2: error });
                        else callback(null, testResult);
                    })
                }
            });
        },
        /* Take all the data from Results table to re-calculate the top 5 vulnerabilities. */
        function (testResult, callback) {
            client.query('SELECT * FROM Results', function (error, results) {
                if (error)
                    callback({ name: 'test_zap_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
                else {
                    var alerts     = {};
                    var alerts_arr = [];
                    var alerts_top = [];
                    results.forEach(function (result) {
                        JSON.parse(result.test_result).forEach(function (item) {
                            if (!alerts[item.alert]) alerts[item.alert] = 1;
                            else                     alerts[item.alert]++;
                        });
                    });
                    Object.keys(alerts).forEach(function (item, i) {
                        alerts_arr.push({ name: item, count: alerts[item] });
                    });
                    alerts_arr.sort(function (a, b) { a.count - b.count });
                    alerts_top = alerts_arr.slice(0,5);
                    callback(null, testResult, alerts_top);
                }
            });
        },
        function (testResult, topResults, callback) {
            client.query('DELETE FROM Toplist', function (error) {
                if (error)
                    callback({ name: 'test_zap_reject', cause: 'DATABASE_DELETE_FAIL', cause2: error });
                else {
                    topResults.forEach(function (item) {
                        client.query('INSERT INTO Toplist VALUES (?,?)', [item.name, item.count], function (error) {
                            if (error)
                                callback({ name: 'test_zap_reject', cause: 'DATABASE_INSERT_FAIL', cause2: error });
                        });
                    });
                    callback(null, testResult);
                }
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
			socket.emit('test_zap_success', result);
            io.sockets.emit('top_list_updated');
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
exports.canceltest = function (socket) {
	/* Step 1 */
	if (socket.child != null || socket.child != undefined) {
		
		zapchild.ports_used.splice(zapchild.ports_used.indexOf(socket.port), 1);
		socket.child.kill('SIGTERM');
		socket.port = null;
		socket.child = null;
		clearInterval(socket.timer_zap);
		clearInterval(socket.timer_zap_file);
		
		log(colors.green('Server (Info): ZAP test cancelled.'));
		
		socket.emit('test_cancel_success');
	}
}