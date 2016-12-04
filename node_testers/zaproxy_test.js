var options = { proxy: 'http://localhost:8080' };
var ZapClient = require('zaproxy');
var log = console.log.bind(this);

var zaproxy = new ZapClient(options);
log(zaproxy);
//zaproxy.core.sites(function (err, resp) {
//	resp.sites.forEach(function (site) {
//		// do something with the site 
//	});  
//});