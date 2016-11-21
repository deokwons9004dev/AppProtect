/** 
 * XML Parse Module.
 * @module modules/xml_parse
 */

/* NPM Module Import */
var xmljs = require("xml2js");

/* Native Module Import */
var fs = require("fs");

/* Log Bind */
var log = console.log.bind(this);

///**
// * Parses a XML Report to a JSON Array.
// * @param {object} socket - current web socket.
// * @param {string} xmlpath - The XML file path.
// * @param {function} callback - Args: Error, Result Array
// */
//exports.parseXML_v1 = function (socket, xmlpath, callback) {
//	var xmlfile = fs.readFileSync(xmlpath, "utf8");
//	var scan = [];
//	xmljs.to_json(xmlfile, function (error, result) {
//		if (error) 
//			return callback(new Error(error));
//		else {
//			socket.emit('progress_report_parse');
//			Object.keys(result.OWASPZAPReport.site).forEach(function (s_id, i) {
//				if (result.OWASPZAPReport.site[s_id] != undefined) {
//					Object.keys(result.OWASPZAPReport.site[s_id].alerts.alertitem).forEach(function (a_id, j) {
//						if (result.OWASPZAPReport.site[s_id].alerts.alertitem[a_id] != undefined) {
//							var report = result.OWASPZAPReport.site[s_id].alerts.alertitem[a_id];
////							log("Report:\n",report);
////							log("\n\n");
//							var vul = {};
//							vul.alert = report.alert;
//							vul.risklevel = report.riskcode;
//							vul.risktext = report.riskdesc;
//							vul.description = report.desc;
//							vul.instances = [];
//							vul.count = report.count;
//							Object.keys(report.instances.instance).forEach(function (elt, i) {
//								if (report.instances.instance[elt] != undefined)
//									vul.instances.push(report.instances.instance[elt].uri);
//							});
//							vul.solution = report.solution;
//							vul.info = report.otherinfo;
//							vul.ref = report.reference;
//							scan.push(vul);
//						}
//					});
//				}
//			});
//			socket.emit('progress_report_done');
////			fs.unlinkSync(xmlpath);
//			return callback(undefined, scan);
//		}
//	});
//}

/**
 * Parses a XML Report to a JSON Array.
 * @param {object} socket - current web socket.
 * @param {string} xmlpath - The XML file path.
 * @param {function} callback - Args: Error, Result Array
 */
exports.parseXML = function (socket, xmlpath, callback) {
	var xmlfile = fs.readFileSync(xmlpath, "utf8");
	var scan = [];
	var parser = new xmljs.Parser();
	
	parser.parseString(xmlfile, function (error, result) {
		if (error) 
			return callback(new Error(error));
		else {
			socket.emit('progress_report_parse');			
			result.OWASPZAPReport.site.forEach(function (site, site_id) { // Multiple site crawls.
				if (site.alerts[0].alertitem != undefined) {
					site.alerts[0].alertitem.forEach(function (item, item_id) { // The actual alert items.
						
						var vul = {};
						
						vul.alert = item.alert[0];
						vul.risklevel = item.riskcode[0];
						vul.risktext = item.riskdesc[0];
						
						vul.instances = [];
						vul.count = item.count[0];
						item.instances[0].instance.forEach(function (url, i) {
							vul.instances.push(url.uri[0]);
						});
						
						vul.description = (item.desc != undefined ? item.desc[0] : '');
						vul.solution = (item.solution != undefined ? item.solution[0] : '');
						vul.info = (item.otherinfo != undefined ? item.otherinfo[0] : '');
						vul.ref = (item.reference != undefined ? item.reference[0] : '');
						
						scan.push(vul);
					});
				}
			});
			socket.emit('progress_report_done');
			fs.unlinkSync(xmlpath);
			return callback(undefined, scan);
		}
	});
}

