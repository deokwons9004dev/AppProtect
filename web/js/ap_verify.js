/* This Javascript is for testing User site verfication features. */

/* Socket.io Events */  
socket.on('verify_token_reject', function (error) {
	alert('Verification Token Fetch Failed.\n' + error); 
});
socket.on('verify_token_success', function (token) {
	alert('Verification Token successfully fetched.');
	saveAs(new Blob(['']), token);
});

socket.on('get_verified_sites_reject', function (error) {
	alert('Verified Sites Fetch Failed.\n' + error); 
});
socket.on('get_verified_sites_success', function (sites) {
	alert('Verified Sites successfully fetched.');
	$('#vsiteTable').css('display', 'table');
	sites.forEach(function (site) {
		var row       = $('<tr></tr>');
		var row_site  = $('<td></td>').text(site);
		var row_del   = $('<td></td>');
		row_del.css('text-align', 'center');
		
		var row_del_a = $('<a></a>');
		row_del_a.attr('href', '#');
		row_del_a.attr('onclick', 'removeSite("'+site+'")');
		row_del_a.text('REMOVE');
		
		row_del.append(row_del_a);
		row.append(row_site);
		row.append(row_del);
		
		$('#vsiteTable').append(row);
	});
});  

socket.on('remove_verified_site_reject', function (error) {
	alert('Failed to remove verified site.\n' + error); 
});
socket.on('remove_verified_site_success', function () {
	alert('Successfully removed verified site.');
	getVerifiedSites();
});

socket.on('verify_request_reject', function (error) {
	alert('Verification Failed.\n' + error); 
});
socket.on('verify_request_success', function () {
	alert('Website was successfully verified.'); 
	getVerifiedSites();
});



/* Button Handlers */
$('#tokenButton').click(function () {
	socket.emit('verify_token');
});    
$('#verifyButton').click(function () {
	console.log($('#ver_site').val());
	socket.emit('verify_request', {
		url: $('#ver_site').val()
	});
});



/* External Functions */
function getVerifiedSites () {
	$('#vsiteTable tbody tr').remove();
	socket.emit('get_verified_sites');
}
function removeSite(site) {
	socket.emit('remove_verified_site', site);
}



/* Check Compatibility */
if (is.safari()) alert('Safari is not supported.');