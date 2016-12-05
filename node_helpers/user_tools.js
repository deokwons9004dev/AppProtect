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
 *     Validator: To ensure that users are sending in valid URLs for pen testing, 
 *                we will incorporate a string module that will check incoming 
 *                strings for URL validity. 
 *                (https://www.npmjs.com/package/validator)
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Native Module Import */
var log = console.log.bind(this);

/* NPM Module Import */
var request   = require("request");
var bcp       = require("bcrypt-nodejs");   
var uuid      = require("node-uuid");       
var async     = require("async");
var colors    = require("colors");
var validator = require("validator");

/* Custom Module Import */
var misctools = require("./misc_tools.js");
var restools  = require("./res_tools.js");  // HTTP Response Tools.
var dbs       = require("./DB_Strings.js"); // Database Query Strings.

/* Checks if a socket has a valid session generated upon login. (WATERFALL)
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
/* Checks if a user id exists in the database. (WATERFALL)
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
/* Checks if a URL is valid (at least valid domain). (WATERFALL)
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
	if (!validator.isURL(url)) callback({ cause: 'INVALID_URL' });
	else                       callback(null);
}
exports.isURLValidStrict = function (url, callback) {
	if (!validator.isURL(url, {'require_protocol' : true})) 
		callback({ cause: 'INVALID_URL_STRICT' });
	else callback(null);
}
var isValidSession   = exports.isValidSession;
var isUserExists     = exports.isUserExists;
var isURLValid       = exports.isURLValid;
var isURLValidStrict = exports.isURLValidStrict;

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
exports.loginUserSession = function (req, res, sc, ss) {
	async.waterfall([
		function (callback) {
			var userAuth = req.cookies.userAuth;
			/* If User Auth Cookie Simply does not exist. */
			if (!userAuth)
				callback({ name: 'login_session_reject', cause: 'UA_COOKIES_NON_EXIST' });
			/* If there is no UA in Socket Sessions. */
			else if (!ss[userAuth])
				callback({ name: 'login_session_reject', cause: 'SS_NO_UA' });
			/* If there is no socket matching the client Socket ID. */
			else if (!sc[req.body.sid])
				callback({ name: 'login_session_reject', cause: 'SC_NO_SOCKET' });
			/* If the IP and Uagent doesn't match. */
			else if (ss[userAuth].ip     != req.connection.remoteAddress ||
					 ss[userAuth].uagent != req.headers['user-agent'])
				callback({ name: 'login_session_reject', cause: 'SS_INVALUD_UA' });
			/* UA successfully identified and user session loaded to socket. */
			else {
				sc[req.body.sid].session = ss[userAuth];
				sc[req.body.sid].session.userAuth = userAuth;
				callback(null);
			}
		}
	], function (error) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			restools.sendResponseSimple(res, error.name, 'fail', error.cause, error.cause);
		}
		/* If everything went well, notify the client. */
		else {
			log(colors.green('Server (Info): User session successfully loaded.'));
			restools.sendResponseSimple(res, 'login_session', 'success');
		}
	});
}       

exports.loginUserPOST = function (client, req, res, ss) {
	async.waterfall([
		/* Check if ID contains unsafe characters. */
		function (callback) {
			if (req.body.id !== escape(req.body.id)) 
				callback({ name: 'login_post_reject', cause: 'INVALID_ID_CHARACTERS' });
			else callback(null);
		},
		/* Check if ID string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (req.body.id.length > 100 || req.body.id.length < 1) 
				callback({ name: 'login_post_reject', cause: 'INVALID_ID_LENGTH' });
			else callback(null);
		},
		/* Check if PS string is not empty AND does not exceed 100 characters. */
		function (callback) {
			if (req.body.ps.length > 100 || req.body.ps.length < 1) 
				callback({ name: 'login_post_reject', cause: 'INVALID_PS_LENGTH' });
			else callback(null);
		},
		/* Check if the given ID exists in the database. */
		function (callback) {
			client.query(dbs.userExists, [req.body.id], function (error, result) {
				if (error) 
					callback({ name: 'login_post_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else if (result.length == 0)
					callback({ name: 'login_post_reject', cause: 'ID_NON_EXIST' });
				else if (!bcp.compareSync(req.body.ps, result[0].user_ps))
					callback({ name: 'login_post_reject', cause: 'PS_INCORRECT' });
				else {
					var authCode = uuid.v4();                   // Generate Auth Code (UUID)
					res.cookie('userAuth', authCode, {          // Add Auth Code to Cookie.
						path    : '/',
						httpOnly: true,
						secure  : false
					});           
					ss[authCode] = {                            
						user    : result[0].user_id,            // User ID.
						token   : result[0].user_tok,           // User Verification Token.
						ip      : req.connection.remoteAddress, // Connection IP Address.
						uagent  : req.headers['user-agent']     // Connection User Agent String.
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
			restools.sendResponseSimple(res, error.name, 'fail', error.cause, error.cause);
		}
		/* If everything went well, notify the client. */
		else {
			log(colors.green('Server (Info): User successfully logged in.'));
			restools.sendResponseSimple(res, 'login_post', 'success');
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
exports.logoutUser = function (client, socket, ss) {
	async.waterfall([
		function (callback) { isValidSession(socket, callback); },
		function (callback) { isUserExists(client, socket.session.user, callback); },
		function (callback) {
			/* If there is no UA in Socket Sessions. */
			if (!socket.session.userAuth)
				callback({ name: 'logout_reject', cause: 'SOCKET_NO_AUTH' });
			/* If there is no UA in Socket Sessions. */
			if (!ss[socket.session.userAuth])
				callback({ name: 'logout_reject', cause: 'SS_NO_UA' });
			else {
				delete ss[socket.session.userAuth]; // Delete session from socket sessions.
				delete socket.session;              // Delete session from socket.
				callback(null);
			}
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
			log(colors.green('Server (Info): User session successfully loaded.'));
			socket.emit('logout_success');
		}
	});
}  

/* Extracts the user's token and sends it to the client.
 *
 * @param socket: Current Socket.io Connection.
 *
 * @return none.
 *
 * @results {Socket Event} verify_token_reject : If any part of the process fails.
 *                         verify_token_success: If the token was successfully received.
 */
exports.verifyToken = function (socket) {
	log(colors.green('Server (Info): User Token Sent.'));
	socket.emit('verify_token_success', socket.session.token);
}

exports.getVerifiedSites = function (client, socket) {
	async.waterfall([
		function (callback) { isValidSession(socket, callback); },
		function (callback) { isUserExists(client, socket.session.user, callback); },
		/* Check site duplicates and add new site. */
		function (callback) {
			client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
				if (error) 
					callback({ name: 'get_verified_sites_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else {
					var sites = JSON.parse(result[0].user_sites);
					callback(null, sites);
				}
			});
		}
	], function (error, sites) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name || 'get_verified_sites_reject'));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name || 'get_verified_sites_reject', error.cause);
		}
		/* If everything went well, send the token string to the client. */
		else {
			log(colors.green('Server (Info): Sent Verified Websites.'));
			socket.emit('get_verified_sites_success', sites);
		}
	});
}

exports.removeVerifiedSite = function (client, socket, site) {
	async.waterfall([
		function (callback) { isValidSession(socket, callback); },
		function (callback) { isUserExists(client, socket.session.user, callback); },
		/* Check site duplicates and add new site. */
		function (callback) {
			client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
				if (error) 
					callback({ name: 'remove_verified_site_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else {
					var sites = JSON.parse(result[0].user_sites);
					var index = sites.indexOf(site);
					if (index == -1) 
						callback({ name: 'remove_verified_site_reject', cause: 'SITE_NON_EXIST' });
					else {
						sites.splice(index, 1);
						callback(null, sites);
					}
				}
			});
		},
		/* Update user's site record. */
		function (sites, callback) {
			client.query('UPDATE Users SET user_sites = ? WHERE user_id = ?', [JSON.stringify(sites), socket.session.user], function (error) {
				if (error) 
					callback({ name: 'remove_verified_site_reject', cause: 'DATABASE_UPDATE_FAIL', cause2: error });
				else callback(null);
			});
		}
	], function (error, sites) {
		/* If there was an error along the way, notify the client. */
		if (error) {
			log(colors.red('Server (Error):', error.name || 'remove_verified_site_reject'));
			log(colors.red('Server (Cause):', error.cause));
			log(colors.red('Server (Cause2):', error.cause2));
			socket.emit(error.name || 'remove_verified_site_reject', error.cause);
		}
		/* If everything went well, send the token string to the client. */
		else {
			log(colors.green('Server (Info): Removed Verified Website.'));
			socket.emit('remove_verified_site_success');
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
exports.verifyRequest = function (client, socket, form) {
	async.waterfall([
		function (callback) { isValidSession(socket, callback); },
		function (callback) { isUserExists(client, socket.session.user, callback); },
		/* Check and modify valid URL to at least be http:// */
		function (callback) {
			if (!validator.isURL(form.url, {'require_protocol' : true})) {
				if (!validator.isURL(form.url)) callback({ cause: 'INVALID_URL', cause2: form.url });
				else {
					form.url = 'http://' + form.url;
					callback(null);
				}
			} 
			else callback(null);
		},
		/* Send Test Request to client. */
		function (callback) {
			request(form.url + '/' + socket.session.token, function (error, res, body) {
				if (error) 
					callback({ name: 'verify_request_reject', cause: 'REQUEST_ERROR', cause2: error });
				else if (res.statusCode != 200) 
					callback({ name: 'verify_request_reject', cause: 'NO_TOKEN_FOUND', cause2: res.statusCode });
				else callback(null);
			});
		},
		/* Check site duplicates and add new site. */
		function (callback) {
			client.query('SELECT * FROM Users WHERE user_id = ?', [socket.session.user], function (error, result) {
				if (error) 
					callback({ name: 'verify_request_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else {
					var sites  = JSON.parse(result[0].user_sites);
					var domain = misctools.extractDomain(form.url)
					if (sites.indexOf(domain) != -1)
						callback({ name: 'verify_request_reject', cause: 'SITE_ALREADY_VERIFIED' });
					else {
						sites.push(domain);
						callback(null, sites);
					}
				}
			});
		},
		/* Update user's site record. */
		function (sites, callback) {
			client.query('UPDATE Users SET user_sites = ? WHERE user_id = ?', [JSON.stringify(sites), socket.session.user], function (error) {
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

