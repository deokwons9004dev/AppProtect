/** 
 * Database Login Argument Parsing Module
 * @module node_helpers/db_args
 *
 * Module for parsing login credentials for database connection.
 * If not provided, present prompts to enter them.
 * <MODULES>
 * NPM Modules (3rd party imported):
 *     Prompt: A customizable command-line prompt for NodeJS.
 *             (https://www.npmjs.com/package/prompt)
 *     Async: Utility module for programming easily with asynchronous NodeJS.
 *            (https://caolan.github.io/async/index.html)
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Native Module Import */
var log   = console.log.bind(this);

/* NPM Module Import */
var pt    = require("prompt");
var async = require("async");

/** 
 * Processes Command Line Args.
 *
 * If -u AND -p are both provided, then it will pass them directly to the server.
 * Otherwise, it will either ask for a password (If username is provided),
 * or it will ask for both username and password.
 *
 * @param callback
 *            1st Arg: mysql_id
 *            2nd Arg: mysql_ps
 * @return callback
 */
exports.processAppLogin = function (callback) {
	var args       = process.argv; // Argument String Array.
	var arg_list   = ['-u', '-p']; // Available Argument Identifiers.
	var isUsername = false;        // Whether Username was provided in CMD.
	var isPassword = false;        // Whether Password was provided in CMD.
	var username   = null;         // Username extracted from Args.
	var password   = null;         // Password extracted from Args.

	/* Prompt function for Username */
	var getUsername = function (cb) {
		log('\nEnter MySQL Login Credentials (OR use -u and -p).');
		if (!pt.started) pt.start();
		pt.message = "";
		var schema = {
			properties: {
				username: {
					description: 'Username'
				}
			}
		}
		pt.get(schema, function (err, result) {
			if (err) cb(err);
			else     cb(null, result.username);
		});
	}
	/* Prompt function for Password */
	var getPassword = function (cb) {
		if (!pt.started) pt.start();
		pt.message = "";
		var schema = {
			properties: {
				password: {
					description: 'Password',
					hidden     : true,
					replace    : '*'
				}
			}
		}
		pt.get(schema, function (err, result) {
			if (err) cb(err);
			else     cb(null, result.password);
		});
	}

	/* Parses the arg array to extract login credentials. */
	args.forEach(function (arg, i) {
		switch (arg) {
			case '-u':
				if (i + 1 < args.length && arg_list.indexOf(args[i+1]) < 0) {
					isUsername = true;
					username = args[i+1];
				} 
				else {
					log('Error(Args): Invalid User Name.');
					process.exit(0);
				}
				break;
				
			case '-p':
				if (i + 1 < args.length && arg_list.indexOf(args[i+1]) < 0) {
					isPassword = true;
					password = args[i+1];
				}
				break;
				
			default:
				break;
		}
	});

	/* If Username is not present, then ask for Username, Password. */
	if (!isUsername) {
		async.series([getUsername, getPassword], function (err, data) {
			if (err) {
				log('Error(Args):',err);
				process.exit(-1);
			}
			else 
				return callback({
					mysql_id: data[0],
					mysql_ps: data[1]
				});
		});
	}
	/* If Password is not present, then ask for Password. */
	else if (!isPassword) {
		async.series([getPassword], function (err, data) {
			if (err) {
				log('Error(Args):',err);
				process.exit(-1);
			}
			else 
				return callback({
					mysql_id: username,
					mysql_ps: data[0]
				});
		});
	}
	/* If both were already given via CMD arguments, return callback. */
	else 
		return callback({
			mysql_id: username,
			mysql_ps: password
		});
}
 

