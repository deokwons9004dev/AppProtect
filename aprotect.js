/** 
 * App Protect Server
 *
 * This file provides the main functionality for our App Protect Service.
 * <MODULES>
 * NPM Modules (3rd party imported):
 *     Express: A Web Application Framework to accelerate development in NodeJS.
 *              We use this framework to provide various front-end usabilities 
 *              such as web cookies, static file serving, and HTTP requests. 
 *              A NodeJS server will use this Express App to host a dynamic 
 *              web application.
 *              (http://expressjs.com)
 *     Socket.IO: After the server spawns using our Express App, we will then 
 *                attach a NodeJS Websocket framework, Socket.IO, on top of it. 
 *                This will enable bidirectional real time event driven 
 *                communication between the server and web client, and we will 
 *                use Socket.io extensively for sending and receiving pen test data.
 *                (http://socket.io)
 *     MySQL: A NodeJS Driver for MySQL. We use this module along with a normal 
 *            binary distribution of a MySQL Server to manage all user generated data.
 *            (https://www.npmjs.com/package/mysql)
 *     Colors: Terminal Color Options.
 *             (https://www.npmjs.com/package/colors)
 *
 * Custom Modules:
 *     Usertools: This module contains user login, registration, 
 *                and basic authentication features.
 *     Testtools: This module contains the main pen test features 
 *                such as ZAP testing, SQLMap Injections, etc.
 *     Args: This module parses the server command line arguments.
 *           Admins must pass in valid MySQL credentials in order 
 *           to connect to the local MySQL Server.
 *     DBtools: This module contains custom features for the MySQL database.
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Import Native Modules. */
var fs   = require("fs");          // Basic FileSystem Module.
var path = require("path");        // FileSystem Path String Parsing.
var http = require("http");        // Basic HTTP Server Module.
var log  = console.log.bind(this); // Bind print function for easier typing.

/* Import Custom Modules */
var usertools = require("./node_helpers/user_tools.js");
var testtools = require("./node_helpers/test_tools.js");
var args      = require("./node_helpers/db_args.js");
var dbtools   = require("./node_helpers/db_tools.js"); 
var misctools = require("./node_helpers/misc_tools.js");

/* Import NPM Modules. */
var express   = require("express");
var sio       = require("socket.io");
var mysql     = require("mysql");
var colors    = require("colors");

/* MySQL Login Data. */
var MYSQL_ID;        // ID
var MYSQL_PS;        // Password
var client;          // Current MySQL Connection.
var db = 'Aprotect'; // Database Name.

/* Initialize Express App. */
var app = express();
app.set('port', 5001);
var server = http.createServer(app).listen(5001, function () {
    log("Server: Initializing at port %d.", app.get('port'));
    args.processAppLogin(function (login) {
        MYSQL_ID = login.mysql_id;
        MYSQL_PS = login.mysql_ps;
        client   = mysql.createConnection({
            user    : MYSQL_ID,
            password: MYSQL_PS
        });
        dbtools.initDB(MYSQL_ID, MYSQL_PS, client, db, function () {
            log('Server: Ready!');
        });
    });
});

/* Import Express Middle-wares. */
app.use(express.favicon(path.join(__dirname, 'web', 'img','favicon.ico')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'web')));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.multipart());
//app.use(express.cookieSession());
//app.use(express.logger('dev'));

/* GET Requests */
app.get('/', function (req,res) {
    log(colors.grey('Server (GET): Main Page Access'));
    fs.readFile("web/index.html", function (err, data) {
        res.send(data.toString());
    });
});
/* POST Requests */
app.post('/loginPost', function (req,res) {
    log(colors.grey('Server (POST): User Login POST.'));
    req.body = JSON.parse(req.body.data);
    usertools.loginUserPOST(client, req, res, ss);
});
app.post('/loginSession', function (req,res) {
    log(colors.grey('Server (POST): User Login Session.'));
    req.body = JSON.parse(req.body.data);
    usertools.loginUserSession(req, res, sc, ss);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.send(err);
//    next(err);
});
// error handler
//app.use(function(err, req, res, next) {
//    // set locals, only providing error in development
//    res.locals.message = err.message;
//    res.locals.error = req.app.get('env') === 'development' ? err : {};
//    // render the error page
//    res.status(err.status || 500);
//    res.render('error');
//});


/* Initialize Socket.io */
var io = sio.listen(server);
var ss = {}; // Socket Sessions.
var sc = {}; // Socket Clients.
/* Install socket event listeners upon connection. */
io.sockets.on("connection", function (socket) {
    
    /* User Authentication Features */
    socket.on('session_login', function (form) {
        log('Server (Info): Socket Login Request In.');
        usertools.loginUserSession(client, socket, sc, form);
    });
    socket.on('register', function (form) {
        log('Server (Info): Socket Register Request In.');
        usertools.registerUser(client, socket, form);
    });
    socket.on('logout', function () {
        log('Server (Info): Socket Logout Request In.');
        usertools.logoutUser(client, socket, ss);
    });
    
    /* User Web Server Verification */
    socket.on('verify_token', function () {
        usertools.verifyToken(socket);
    });
    socket.on('get_verified_sites', function () {
        usertools.getVerifiedSites(client, socket);
    });
    socket.on('remove_verified_site', function (site) {
        usertools.removeVerifiedSite(client, socket, site);
    });
    socket.on('verify_request', function (form) {
        usertools.verifyRequest(client, socket, form);
    });

    /* Pen Test Features */
    socket.on("test_zap", function (option) {
        log('Server (Info): Socket ZAP Test request In.');
        testtools.testzap(client, socket, io, option);
    });
    socket.on("test_sqlmap", function (option) {
        testtools.testsqlmap(client, socket, io, option);
    });
    socket.on("test_cancel", function () {
        testtools.canceltest(socket);
    });
    
    /* Data Fetch Features */
    socket.on("top_list", function () {
        log('Server (Info): Socket Top List Request In.');
        dbtools.topList(client, socket);
    });

    /* Receives a notification that a client socket left.
     *
     * @param none.
     *
     * @results none.
     */
    socket.on("disconnect", function () {
        log("Server (Info): Client (%s) left.", socket.id);
        delete sc[socket.id]; // Remove the socket from the Socket Client Dictionary.
    });

    socket.leave(socket.id);
    sc[socket.id] = socket; // Add every socket connection to the Socket Client Dictionary.

    log("SIO: New Client:", misctools.parseCookies(socket.handshake.headers.cookie));
});
