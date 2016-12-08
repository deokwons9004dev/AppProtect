/* AJAX URL Properties */
var ap_url_public       = 'http://aprotect.org';
var ap_url_local        = 'http://localhost:5001';
var ap_url_secure       = 'https://aprotect.org';
var ap_url_secure_local = 'https://localhost:5002';
var ap_url              = ap_url_secure;

/* AJAX Request Functions */
function sendPost(host,path,dict,callback) {
	var data = new FormData();
	data.append('data', JSON.stringify(dict));
	var xhr = new XMLHttpRequest();
	xhr.open('POST', host+path, true);
	xhr.onload = function () {
		return callback(JSON.parse(this.responseText));
	};
	xhr.onerror = function(error){
		alert("Error with upload.\n", error);
	}
	xhr.send(data);
}