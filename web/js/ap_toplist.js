/* This Javascript is for managing / updating Top Vulnerabilities features. */

/** 
 * Onload Initializer
 */


/** 
 * Socket Events
 */
socket.on('top_list_updated', function () {
	getTopList();
});
socket.on('top_list_reject', function (error) {
	alert('Failed to fetch top list.\n' + error); 
});
socket.on('top_list_success', function (results) {
	console.log(results);
	results.forEach(function (item, index) {
		var row       = $('<tr></tr>');
		var row_index = $('<td></td>').text(index + 1);
		var row_name  = $('<td></td>').text(item.vul_name);
		var row_count = $('<td></td>').text(item.vul_count);
//		row_name.css('text-align', 'center');
		
//		var row_del_a = $('<a></a>');
//		row_del_a.attr('href', '#');
//		row_del_a.attr('onclick', 'removeSite("'+site+'")');
//		row_del_a.text('REMOVE');
		
//		row_del.append(row_del_a);
		row.append(row_index);
		row.append(row_name);
		row.append(row_count);
		
		$('#toplistTable').append(row);
	});
});


/** 
 * Button Handlers
 */


/** 
 * External Functions 
 */
function getTopList () {
	$('#toplistTable tbody tr').remove();
	socket.emit('top_list');
}

/** 
 * AJAX Requests 
 */


