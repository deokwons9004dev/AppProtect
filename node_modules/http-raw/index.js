var http = require('http');
var https = require('https');
var createReadStream = require('./lib/read');
var createWriteStream = require('./lib/write');
var through = require('through');

exports = module.exports = fromServer(http.createServer);
exports.http = fromServer(http.createServer);
exports.https = fromServer(https.createServer, 'secureConnection');
exports.fromServer = fromServer;

function fromServer (Server, evName) {
    return function (opts, cb) {
        if (typeof opts === 'function') {
            cb = opts;
            opts = undefined;
        }
        var server = new Server(opts);
        server.on('request', function (req, res) {

            injectRaw(req);

            // clear any previous buffered info
            req.connection._rawBuffers = [];

            res.createRawStream = createWriteStream.bind(null, req);
            if (cb) cb.apply(this, arguments);
        });
        
        server.on(evName || 'connection', onconnection);
        server.on('upgrade', function (req) {

            injectRaw(req);

            // clear any previous buffered info
            req.connection._rawBuffers = [];
        });
        return server;
    };
}

function onconnection (con) {
    con._rawBuffers = [];
    
    var ondata = con.ondata;
    con.ondata = function (buf, start, end) {
        var copy = new Buffer(end - start);
        buf.copy(copy, 0, start, end);

        con._rawBuffers.push(copy);

        if (!con._upgraded) return ondata.apply(this, arguments);
    };
    
    var onend = con.onend;
    con.onend = function () {
        con._rawBuffers = [];
        if (!con._upgraded) return onend.apply(this, arguments);
    };
}

var endings = [ Buffer('\r\n\r\n'), Buffer('\n\n') ];
function indexOf (buf, pattern) {
    for (var i = 0; i < buf.length; i++) {
        for (var j = 0; buf[i+j] === pattern[j] && j < pattern.length; j++);
        if (j === pattern.length) return i;
    }
    return -1;
}

function injectRaw (req) {
    var buffers = req.connection._rawBuffers;
    
    req.createRawStream = function () {
        var s = createReadStream(req.connection, buffers);
        buffers = [];
        return s;
    };
    
    req.createRawBodyStream = function () {
        var pastHeader = false;
        var s = createReadStream(req.connection, buffers);
        buffers = [];
        
        return s.pipe(through(function (buf) {
            if (pastHeader) return this.queue(buf);
            
            var ix;
            if ((ix = indexOf(buf, endings[0])) >= 0) {
                ix += 4;
            }
            else if ((ix = indexOf(buf, endings[1])) >= 0) {
                ix += 2;
            }
            else return;
            
            pastHeader = true;
            if (buf.length > ix) this.queue(buf.slice(ix));
        }));
    };
}
