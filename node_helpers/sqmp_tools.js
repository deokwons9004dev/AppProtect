/* Native Modules Import. */
var path = require("path");
var cp   = require("child_process");
var fs   = require("fs");
var log  = console.log.bind(this);

/* NPM Module Import */
var colors    = require("colors");

exports.execSQLMAP = function (socket, option, req_path, callback) {
	
	var sqmp_path = __dirname + '/SQLMAP/sqlmap.py';
	var sqmp_http = ' -r ' + req_path;
	var sqmp_dbms = '';
	var sqmp_lv   = '';
	var sqmp_risk = '';
	var sqmp_opt  = ' --batch';
	
	if (option.db    && typeof(option.db)    == 'string') sqmp_dbms += ' --dbms=\'' + option.db + '\'';
	if (option.level && typeof(option.level) == 'number') sqmp_lv   += ' --level='  + option.level;
	if (option.risk  && typeof(option.risk)  == 'number') sqmp_dbms += ' --risk='   + option.risk;
	
	var sqmp_cmd  = 'python ' + sqmp_path + sqmp_http + sqmp_dbms + sqmp_lv + sqmp_risk + sqmp_opt;
	log(colors.cyan('Server (SQMP): Command=',sqmp_cmd));
	var sqmp_init = false;
	
	var sqchild = cp.exec(sqmp_cmd, function (error, stdout, stderr) {
		if (error)  log(colors.red('Server (SQMP): ',error));
		if (stderr) log(colors.yellow('Server (SQMP): ',stderr));
	});
	
	socket.sqchild = sqchild;
	
	/* Parse on STDOUT stream. */
	sqchild.stdout.on('data', function (data) {	
		/* Detect Process Initialization. */
		if (!sqmp_init) {
			sqmp_init = true;
			socket.emit('sqmp_progress_sqlmap_begin');
		}
			
		/* Process Warnings Here. */
		if (data.indexOf('[WARNING]') != -1) {
			/* Non-lethal Warnings */
			if (data.indexOf('does not seem to be injectable')      != -1 ||
				data.indexOf('does not appear to be dynamic')       != -1 ||
				data.indexOf('might not be injectable')             != -1 ||
				data.indexOf('using unescaped version of the test') != -1)
				socket.emit('sqmp_msg_warning_safe', data.split('[WARNING]')[1]);
			/* Lethal Warnings */
			else socket.emit('sqmp_msg_warning_real', data.split('[WARNING]')[1]);
		}
		
		/* Process Critical Messages Here. */	
		else if (data.indexOf('[CRITICAL]') != -1) {
			/* Non-lethal Criticals */
			if (data.indexOf('all tested parameters appear to be not injectable') != -1)
				socket.emit('sqmp_msg_critical_safe');
			/* Lethal Criticals */
			else socket.emit('sqmp_msg_critical_real', data.split('[CRITICAL]')[1]);
		}
	});
	
	/* Detect any error message and terminate. */
	sqchild.stderr.on('data', function (data) {
		sqchild.kill('SIGTERM');
		return callback(data.toString());
	});
	
	/* Detect Process Exit and return. */
	sqchild.on('exit', function (code_num, code_str) {
		socket.emit('sqmp_progress_sqlmap_done');
		return callback(null);
	});
}