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
//var request    = require("request");
//var request_db = require("request-debug")(request); 
//var bcp       = require("bcrypt-nodejs");   
//var uuid      = require("node-uuid");       
//var async     = require("async");
//var colors    = require("colors");
//var validator = require("validator");
var jsdom = require("jsdom");

jsdom.env(
        "https://nodejs.love/StudentLogin.html",
        ["/Volumes/1TB/Dropbox/CMU/2016-fall/15-421/git/node_testers/testLogin.js"],
        function (err, window) {
                log(err);
                log(window);
        }
)
//request('http://nodejs.love/StudentLogin.html', function (error, res, body) {
//        if (error) log(error);
//        else if (res.statusCode != 200) log(res);
//        else log(res);
//});

