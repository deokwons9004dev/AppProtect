/* Native Modules Import. */
var path = require("path");
var cp   = require("child_process");
var fs   = require("fs");
var log  = console.log.bind(this);

/* NPM Module Import */
var uuid   = require("node-uuid");       
var colors = require("colors");
var fsx    = require("fs.extra");

exports.hosts     = [];                // Array of listening hosts.
exports.posts     = {};                // Dictionary Object to store arrays of POST requests.
exports.proxyport = 7999;              // Internal Port for Proxy Server.
var hosts         = exports.hosts;     // Binding exports.hosts.
var posts         = exports.posts;     // Binding exports.posts.
var proxyport     = exports.proxyport; // Binding exports.proxyport.
var req_time      = 30;                // Timeout for each POST Request.
var proxy         = null;              // Proxy Server Child Object.

exports.initProxy = function () {
	/* Recoreder Data Initialization. */
	var recorder = {
		toggle       : 'stop', // stop, ready, cmd, headers, body
		data_host    : '',
		data_cmd     : '',
		data_headers : '',
		data_body    : '',
		data_all     : ''
	}
	
	/* MITMDUMP Command Composition. */
	var mitm_script = ' -s ' + __dirname + '/../python_modules/proxyscript_ubuntu.py';
	var mitm_port   = ' -p 7999';
	var mitm_cmd    = 'mitmdump' + mitm_script + mitm_port;
	
	/* MITMDUMP Proxy Process Spawn. */
	proxy = cp.exec(mitm_cmd, function (error, stdout, stderr) {});
	
	log('Server (Proxy): Proxy Child Spawned at port 7999');
	
	proxy.stdout.on('data', function (chunk) {
		data_arr = chunk.split('\n');
		data_arr.forEach(function (data) {
			/* Recorder: Ready */
			if (data.indexOf('----POST_FETCH_BEGIN----') != -1) {
				log(colors.cyan('Server (Proxy): Started fetching a new POST!'));
				log(colors.grey('Server (BEGIN):',data));
				initRecorder(recorder);
				recorder.toggle = 'ready';
			}
			
			/* Recorder: Change Read Type. */	
			else if (data.indexOf('----POST_FETCH_CMD_BEGIN----') != -1) {
				log(colors.grey('Server (CMD_BEGIN):',data));
				recorder.toggle = 'cmd';
			}
			else if (data.indexOf('----POST_FETCH_HEADERS_BEGIN----') != -1) {
				log(colors.grey('Server (HEADERS_BEGIN):',data));
				recorder.toggle = 'headers';
			}
			else if (data.indexOf('----POST_FETCH_BODY_BEGIN----') != -1) {
				log(colors.grey('Server (BODY_BEGIN):',data));
				recorder.toggle = 'body';
			}
			
			/* Recorder: Rest for a while. */
			else if (data.indexOf('----POST_FETCH_CMD_END----') != -1) {
				log(colors.grey('Server (CMD_END):',data));
				recorder.toggle = 'ready';
			}
			else if (data.indexOf('----POST_FETCH_HEADERS_END----') != -1) {
				log(colors.grey('Server (HEADER_END):',data));
				recorder.toggle = 'ready';
			}
			else if (data.indexOf('----POST_FETCH_BODY_END----') != -1) {
				log(colors.grey('Server (BODY_END):',data));
				recorder.toggle = 'ready';
			}
				
			/* Recorder: Request all fetched. Pack data and push. */	
			else if (data.indexOf('----POST_FETCH_END----') != -1) {
				log(colors.cyan('Server (Proxy): Finished fetching new POST.'));
				log(colors.grey('Server (END):',data));
				recorder.toggle = 'stop';
				
				/* If POST Request is from a listening host. */
				if (hosts.indexOf(recorder.data_host) != -1) {
					log(colors.cyan('Server (Proxy): POST is part of host array.', recorder.data_host));
					/* Create a new array for post requests from that host. */
					if (!posts[recorder.data_host]) posts[recorder.data_host] = [];
					/* Push a new record into array. */
					posts[recorder.data_host].push({
						original: recorder.data_all,
						parsed  : {
							cmd    : recorder.data_cmd,
							headers: recorder.data_headers,
							body   : recorder.data_body
						},
						birth   : new Date()
					});
				}
			}
			
			/* Record data by toggle type. */
			else {
				switch (recorder.toggle) {
					case 'cmd':
						recorder.data_cmd += data + '\n';
						recorder.data_all += data + '\n';
						break;
					case 'headers':
						if (data.indexOf('Host:') != -1) {
							recorder.data_host = data.substr(data.indexOf('Host:') + 'Host:'.length);
						}
						recorder.data_headers += data + '\n';
						recorder.data_all += data + '\n';
						break;
					case 'body':
						recorder.data_body += data + '\n';
						recorder.data_all += data + '\n';
						break;
					default:
						break;
				}
			}
		});
	});
	
	/* Detect Error and terminate. */
	proxy.stderr.on('data', function (data) {
		log(colors.red(   'Server (Proxy): Proxy Crashed.'));
		log(colors.red(   'Server (Proxy): ',data));
		proxy.kill('SIGTERM');
	});
	
	/* Detect Exit. */
	proxy.on('exit', function (exit_code, exit_str) {
		log(colors.yellow('Server (Proxy): Program Exit.'));
		proxy = null;
	});
	
	setInterval(function () {
		/* Any unfetched POST requests will expire in 30 seconds.
		 * Also, nullify hosts that do not have any post requests.
		 */
		Object.keys(posts).forEach(function (host) {
			log(colors.magenta('Server (ProxyPurge): host       =',host));
			log(colors.magenta('Server (ProxyPurge): posts[host]=',posts[host]));
			var temp = [];
			posts[host].forEach(function (req) {
				if ((new Date() - req.birth) / 1000 <= req_time)
					temp.push(req);
			});
			posts[host] = temp.slice();
			if (posts[host].length < 1)
				delete posts[host];
		});
	}, 10000);
}

exports.ProxyManager = function () {
	setInterval(function () {
		if (!proxy) exports.initProxy();
	}, 3000);
}

exports.listenPOST = function (socket, host, callback) {
	/* Add host to hosts array. */
	if (hosts.indexOf(host) == -1) {
		hosts.push(host);
	}
	
	socket.emit('sqmp_progress_proxy_begin');
	
	/* Wait until user sends POST request with the fillers. */	
	var proxyTimer = setInterval(function () {
		if (posts[host]) {
			/* Search through each request of our host. */
			posts[host].forEach(function (req, i) {
				/* Find the POST request where the body contains filler string. */
				if (req.parsed.body.indexOf(socket.filler) != -1) {
					
					/* Stop Timer. */
					clearInterval(proxyTimer);
					
					/* Replace filler with Star Sign and rebuild original request. */
					req.parsed.body.replace(new RegExp(socket.filler, 'g'), '*');
					rebuildReq(req);
					
					/* Write the original request text into a file. */
					var request_dir  = path.normalize(__dirname + '/../user_data/requests');
					var request_file = path.normalize(request_dir + '/' + uuid.v4() + '.txt'); 
					fsx.mkdirpSync(request_dir);
					fs.writeFileSync(request_file, req.original);
					
					/* Emit Socket Event and return. */
					socket.emit('sqmp_progress_proxy_done');
					return callback(null, req, request_file);
				}
			});
		}
	}, 1000);
}

/* Save Changes to the parsed req to the original http text. */
function rebuildReq (req) {
	req.original = req.parsed.cmd + req.parsed.headers + req.parsed.body;
}
/* Re-initialize proxy recorder. */
function initRecorder (rec) {
	rec.toggle = 'stop';
	rec.data_host = '';
	rec.data_cmd = '';
	rec.data_headers = '';
	rec.data_body = '';
	rec.data_all = '';
	return;
}






















