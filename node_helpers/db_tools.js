/** 
 * Database Management Module
 * @module node_helpers/db_args
 *
 * Module for providing features such as database initialization.
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30 (YY-MM-DD)
 */

/* Native Module Import */
var cp  = require("child_process");
var log = console.log.bind(this);

/* Import NPM Modules. */
var async     = require("async");
var colors    = require("colors");

/** 
 *Installs Database via script and connects to DB Jchat.
 *
 * The script will skip through components that are already installed.
 * Any errors cause here will result in a process kill.
 *
 * @param mysql_id - ID field for connection.
 * @param mysql_ps - PS field for connection.
 * @param client   - Current MySQL Database Connection.
 * @param db       - Database to connect to.
 * @param callback - [Args] none.
 */
exports.initDB = function (mysql_id, mysql_ps, client, db, callback) {
	var sqlcmd = "mysql -u " + mysql_id + 
				 " --password=" + mysql_ps + 
				 " < " + __dirname + "/../node_data/dbconfig.sql";
	cp.exec(sqlcmd, function (error, stdout, stderr) {
		if(error) {
			log("Error (installDB)_0:", error);
			process.exit(-1);
		}
		else {
			client.query("use " + db, function (error, result, field) {
				if(error) {
					log("Error (installDB)_1:", error);
					process.exit(-1);
				}
				else {
					log("Info (installDB): Ready to use Database.");
					return callback();
				}
			});
		}
	});
}

exports.topList = function (client, socket) {
	async.waterfall([
		function (callback) {
			client.query('SELECT * FROM Toplist ORDER BY vul_count DESC LIMIT 5', function (error, result) {
				if (error)
					callback({ name: 'top_list_reject', cause: 'DATABASE_QUERY_FAIL', cause2: error });
				else callback(null, result);
			});
		}
	], function (error, topResults) {
		if (error) {
			log(colors.red('Server (Error):', error.name));
			log(colors.red('Server (Cause):', error.cause));
			socket.emit(error.name, error.cause);
		}
		else {
			log(colors.green('Server (Info): Top List Successfully Sent.'));
			socket.emit('top_list_success', topResults);
		}
	});
}
