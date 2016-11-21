/* Import Custom Modules */
var xmlparse = require("./modules/xml_parse.js");
var zapchild = require("./modules/zap_child.js");

/* Import NPM Modules. */
var express = require('express');
var zaproxy = require("zaproxy");
var sio = require("socket.io");
var validator = require("validator");
var exist = require("file-exists");
//var xml2js = require("xml2js");

/* Import Native Modules. */
var fs = require("fs");
var path = require('path');
var http = require("http");
var log = console.log.bind(this);

/* Start Express App. */
var app = express();
var server = http.createServer(app).listen(8000, function () {
  log("server @ 8000");
});
var io = sio.listen(server);

/* Import Express Middle-wares. */
app.use(express.favicon(path.join(__dirname, 'web', 'img','favicon.ico')));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
//app.use(express.cookieSession());
app.use(express.static(path.join(__dirname, 'web')));

/* GET Requests */
app.get('/', function (req,res,next) {
//  log(req._parsedUrl);
  fs.readFile("web/index.html", function (err, data) {
    res.send(data.toString());
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//module.exports = app;


io.sockets.on("connection", function (socket) {
  
  socket.on("test_request", function (option) {
    // VALID URL
    if (validator.isURL(option.url)) {
      zapchild.createReport(socket, option.url, function (error, path) {
        if (error) {
          log("SIO(ERR):",error);
          socket.emit('error_zap_crash', error.toString());
        }
        else {
          xmlparse.parseXML(socket, path, function (error, arr) {
            if (error) {
              log("SIO(ERR):",error);
              socket.emit('error_xmlparse_crash', error.toString());
            }
            else {
              log("SIO: Report Successfully Sent!");
              socket.emit('test_result', arr);
            }
          });
        }
      });
    }
    // INVALID URL
    else {
      socket.emit('error_invalid_url');
    }
  });
  
  socket.on("disconnect", function () {
    log("SIO: Client Leave: " + socket.id);
    log(io.sockets.adapter.rooms);
  });
  
  log("SIO: New Client: " + socket.id);
});

