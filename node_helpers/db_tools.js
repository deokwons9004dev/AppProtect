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

