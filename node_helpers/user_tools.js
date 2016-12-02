/** 
 * User Authentication Module.
 * @module node_helpers/user_tools
 *
 * Module for providing authentication features such as login, registration, etc.
 *
 * <MODULES>
 * NPM Modules (3rd party imported):
 *     Request: Redesigned HTTP request client for NodeJS. 
 *              We use this feature to send requests to client websites.
 *              (https://www.npmjs.com/package/request)
 *     Bcrypt: A native Javascript Library for NodeJS.
 *             (https://www.npmjs.com/package/bcrypt-nodejs)
 *     Async: Utility module for programming easily with asynchronous NodeJS.
 *            (https://caolan.github.io/async/index.html)
 *     Node-uuid: Implementation of RFC4122 (v1 & v4) UUID for NodeJS.
 * 				  (https://www.npmjs.com/package/node-uuid)
 *     Colors: Terminal Color Options.
 *             (https://www.npmjs.com/package/colors)
 *
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Native Module Import */
var log = console.log.bind(this);

/* NPM Module Import */
var request = require("request");
var bcp     = require("bcrypt-nodejs");   
var uuid    = require("node-uuid");       
var async   = require("async");
var colors  = require("colors");

/* Custom Module Import */
var dbs = require("./DB_Strings.js"); // Database Query Strings.

/* Checks if a socket has a valid session generated upon login.
 *
 * This can fail either by:
 * 1) Having no session.
 * 2) Containing information not matching the original session data.
 *
 * @param socket  : Current Socket.io Connection.
 * @param callback
 *            1st Arg: error  
 *
 * @return none.
 */
exports.isValidSession = function (socket, callback) {
	if (!socket.session)
		callback({ cause: 'EMPTY_SESSION' });
	else if (socket.session.ip     !== socket.request.connection.remoteAddress ||
		socket.session.uagent !== socket.handshake.headers['user-agent'])
		callback({ cause: 'SESSION_MISMATCH' });
	else callback(null);
}
/* Checks if a user id exists in the database.
 *
 * This can fail either by:
 * 1) DB Query Fail.
 * 2) Having no match of the user id in the DB.
 *
 * @param client  : Current MySQL Connection.
 * @param user    : User ID String.
 * @param callback
 *            1st Arg: error 
 *
 * @return none.
 */
exports.isUserExists = function (client, user, callback) {
	client.query('SELECT * FROM Users WHERE user_id = ?', [user], function (error, result) {
		if (error)                   callback({ cause: 'DB_QUERY_FAIL', cause2: error })
		else if (result.length == 0) callback({ cause: 'ID_NON_EXIST' });
		else                         callback(null);
	});
}
/* Checks if a URL is valid (at least valid domain).
 *
 * This can fail either by:
 * 1) URL not valid at all.
 *
 * @param url     : URL String.
 * @param callback
 *            1st Arg: error 
 *
 * @return none.
 */
exports.isURLValid = function (url, callback) {
	if (!validator.isURL(url, {'require_protocol': true})) 
		callback({ cause: 'INVALID_URL' });
	else callback(null);
}
var isValidSession = exports.isValidSession;
var isUserExists   = exports.isUserExists;
var isURLValid     = exports.isURLValid;

/* Checks new ID for duplicates and inserts a new user record.
 *
 * This can fail either by:
 * 1) ID containing invalid characters.
 * 2) ID already exists.
 * 3) ID or PS over 100 characters.
 * 4) MySQL Query Failure.
 * 5) MySQL Insert Failure.
 * Otherwise it will send a success signal to the user.
 *
 * @param client: Current MySQL Database Connection.
 * @param socket: Current Socket.io Connection.
 * @param form  : Object containing new ID and PS.
 *
 * @return none.
 *
 * @results {Socket Event} register_reject : If any part of the process fails.
 *                         register_success: If the registration completed.
 */
exports.registerUser = function (client, socket, form) {
	async.waterfall([
		/* Check if ID contains unsafe characters. */
		function (callback) {
			if (form.id !== escape(form.id)) 
				callback({ name: 'register_reject', cause: 'INVALID_ID_CHARACTERS' });
			else callback(null);
		},
		/* Check if ID string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (form.id.length > 100 || form.id.length < 1)
				callback({ name: 'register_reject', cause: 'INVALID_ID_LENGTH' });
			else callback(null);
		},
		/* Check if PS string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (form.ps.length > 100 || form.ps.length < 1)
				callback({ name: 'register_reject', cause: 'INVALID_PS_LENGTH' });
			else callback(null);
		},
		/* Check if the given ID already exists in the database. */
		function (callback) {
			client.query(dbs.userExists, [form.id], function (error, result) {
				if (error) 
					callback({ name: 'register_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else if (result.length > 0) 
					callback({ name: 'register_reject', cause: 'ID_ALREADY_EXISTS' });
				else callback(null); 
			});
		},
		/* Insert a new record into the database. 
		 * - The password is hashed with a salt string.
		 * - A UUID is assigned for each user (For test authentication).
		 */
		function (callback) {
			var salt    = bcp.genSaltSync();
			var ps_hash = bcp.hashSync(form.ps, salt);
			var unique  = uuid.v4();
			client.query(dbs.userRegister, [form.id, ps_hash, unique, JSON.stringify([])], function (error) {
				if (error) 
					callback({ name: 'register_reject', cause: 'DATABASE_INSERT_FAIL', cause2: error });
				else callback(null);
			});
		}
	], function (error) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name, error.cause);
		}
		/* If everything went well, notify the client. */
		else {
			log(colors.green('Server (Info): User successfully registered.'));
			socket.emit('register_success');
		}
	});
}


/* Checks for login information in DB and creates a new session.
 *
 * This can fail either by:
 * 1) ID containing invalid characters.
 * 2) ID not existing.
 * 3) ID or PS over 100 characters.
 * 4) MySQL Query Failure.
 * 5) Password Mismatch.
 * Otherwise it will send a success signal to the user.
 *
 * @param client: Current MySQL Database Connection.
 * @param socket: Current Socket.io Connection.
 * @param form  : Object containing new ID and PS.
 *
 * @return none.
 *
 * @results {Socket Event} login_reject : If any part of the process fails.
 *                         login_success: If the user is authenticated.
 */
exports.loginUser = function (client, socket, form) {
	async.waterfall([
		/* Check if ID contains unsafe characters. */
		function (callback) {
			if (form.id !== escape(form.id)) 
				callback({ name: 'login_reject', cause: 'INVALID_ID_CHARACTERS' });
			else callback(null);
		},
		/* Check if ID string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (form.id.length > 100 || form.id.length < 1) 
				callback({ name: 'login_reject', cause: 'INVALID_ID_LENGTH' });
			else callback(null);
		},
		/* Check if PS string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (form.ps.length > 100 || form.ps.length < 1) 
				callback({ name: 'login_reject', cause: 'INVALID_PS_LENGTH' });
			else callback(null);
		},
		/* Check if the given ID exists in the database. */
		function (callback) {
			client.query(dbs.userExists, [form.id], function (error, result) {
				if (error) 
					callback({ name: 'login_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else if (result.length == 0)
					callback({ name: 'login_reject', cause: 'ID_NON_EXIST' });
				else if (!bcp.compareSync(form.ps, result[0].user_ps))
					callback({ name: 'login_reject', cause: 'PS_INCORRECT' });
				else {
					/* Create Server-side Session with Connection Information. */
					socket.session = {
						user    : result[0].user_id,                       // User ID.
						ip      : socket.request.connection.remoteAddress, // Connection IP Address.
						uagent  : socket.handshake.headers['user-agent']   // Connection User Agent String.
					}
					return callback(null);
				}
			});
		}
	], function (error) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name, error.cause);
		}
		/* If everything went well, notify the client. */
		else {
			log(colors.green('Server (Info): User successfully logged in.', socket.session.user));
			socket.emit('login_success', socket.session.user);
		}
	});
}

/* Extracts the user's token and sends it to the client.
 *
 * This can fail either by:
 * 1) ID containing invalid characters.
 * 2) ID not existing.
 * 3) ID or PS over 100 characters.
 * 4) MySQL Query Failure.
 * 5) Password Mismatch.
 * Otherwise it will send a success signal to the user.
 *
 * @param client: Current MySQL Database Connection.
 * @param socket: Current Socket.io Connection.
 *
 * @return none.
 *
 * @results {Socket Event} verify_token_reject : If any part of the process fails.
 *                         verify_token_success: If the token was successfully received.
 */
exports.verify_token = function (client, socket) {
	async.waterfall([
		function (callback) {
			client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
				if (error)
					callback({ name: 'verify_token_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else if (result.length == 0)
					callback({ name: 'verify_token_reject', cause: 'ID_NON_EXIST' });
				else
					callback(null, result[0].user_tok);
			});
		}
	], function (error, token) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name, error.cause);
		}
		/* If everything went well, send the token string to the client. */
		else {
			log(colors.green('Server (Info): User Token Received.'));
			socket.session.token = token;
			socket.emit('verify_token_success', token);
		}
	});
}



/* Verifies a user's website for ownership and adds to site records.
 *
 * This can fail either by:
 * 1) ID containing invalid characters.
 * 2) ID not existing.
 * 3) ID or PS over 100 characters.
 * 4) MySQL Query Failure.
 * 5) Password Mismatch.
 * Otherwise it will send a success signal to the user.
 *
 * @param client: Current MySQL Database Connection.
 * @param socket: Current Socket.io Connection.
 * @param form  : User Form Data.
 *
 * @return none.
 *
 * @results {Socket Event} verify_request_reject : If any part of the process fails.
 *                         verify_request_success: If the site was successfully verified.
 */
exports.verify_request = function (client, socket, form) {
	// Check valid session.
	// Check user existence.
	// Check URL validity.
	async.waterfall([
		function (callback) { isValidSession(socket, callback); },
		function (callback) { isUserExists(client, socket.session.user, callback); },
		function (callback) { isURLValid(form.url, callback); },
		/* Send Test Request to client. */
		function (callback) {
			request(form.url + '/' + socket.session.token, function (error, res, body) {
				if (error) 
					callback({ name: 'verify_request_reject', cause: 'REQUEST_ERROR', cause2: error });
				else if (res.statusCode != 200) 
					callback({ name: 'verify_request_reject', cause: 'REQUEST_BAD_STATUS', cause2: res.statusCode });
				else callback(null);
			});
		},
		/* Check site duplicates and add new site. */
		function (callback) {
			client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
				if (error) 
					callback({ name: 'verify_request_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else {
					var sites = JSON.parse(result[0].user_sites);
					if (sites.indexOf(form.url) != -1)
						callback({ name: 'verify_request_reject', cause: 'SITE_ALREADY_VERIFIED' });
					else {
						sites.push(form.url);
						callback(null, sites);
					}
				}
			});
		},
		/* Update user's site record. */
		function (sites, callback) {
			client.query('UPDATE Users SET user_sites = ? WHERE user_id = ?', [sites, socket.session.user], function (error) {
				if (error) 
					callback({ name: 'verify_request_reject', cause: 'DATABASE_UPDATE_FAIL', cause2: error });
				else callback(null);
			});
		}
	], function (error, token) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name || 'verify_request_reject'));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name || 'verify_request_reject', error.cause);
		}
		/* If everything went well, send the token string to the client. */
		else {
			log(colors.green('Server (Info): User Website Successfully Verified.'));
			socket.emit('verify_request_success');
		}
	});
}

