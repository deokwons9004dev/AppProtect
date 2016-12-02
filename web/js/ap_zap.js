socket.on('test_result', function (data) {
	$('#testButton').css('display', 'block');
	$('#cancelButton').css('display', 'none');
	$('#progress').empty();
	data.forEach(function (item, i) {
		var output = '';
		output += '<h3>' + item.alert + '</h3>';
		output += '<h5>Risk Level: ' + item.risklevel + '</h5>';
		output += '<h5>Risk Description: ' + item.risktext + '</h5>';
		output += '<h5>Description: ' + jQuery(item.description).text() + '</h5>';
		item.instances.forEach(function (url, j) {
			output += '<h5>Instance: ' + url + '</h5>';
		});
		output += '<h5>Instance Count: ' + item.count + '</h5>';
		output += '<h5>solution: ' + jQuery(item.solution).text() + '</h5>';
		output += '<h5>Info: ' + jQuery(item.info).text() + '</h5>';
		output += '<h5>Ref: ' + jQuery(item.ref).text() + '</h5>';
		$('#result').append(output);
	});
});

socket.on('progress_zap_0_exec', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Initializing Test...</p>');
});
socket.on('progress_zap_1_spider', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Performing Test Part 1... (THIS MAY TAKE A WHILE)</p>');
});
socket.on('progress_zap_2_active', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Performing Test Part 2...</p>');
});
socket.on('progress_zap_3_attack_done', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Finishing Test...</p>');
});
socket.on('progress_zap_4_write_start', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Writing New Report...</p>');
});
socket.on('progress_zap_5_write_done', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Checking Report Status...</p>');
});
socket.on('progress_zap_6_parse_start', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Getting Report Information...</p>');
});
socket.on('progress_zap_6_parse_done', function () {
	$('#progress').children().last().remove();
	$('#progress').append('<p>Finishing up...</p>');
});


socket.on('error_zap_crash', function (err) {
	alert('Error: Zap crashed.\nCause:' + err);
	$('#testButton').css('display', 'block');
	$('#cancelButton').css('display', 'none');
	$('#result').empty();
	$('#progress').empty();
});
socket.on('error_xmlparse_crash', function (err) {
	alert('Error: XML Parse crashed.\nCause:' + err);
	$('#testButton').css('display', 'block');
	$('#cancelButton').css('display', 'none');
	$('#result').empty();
	$('#progress').empty();
});
socket.on('error_invalid_url', function () {
	alert('Error: Invalid URL.');
	$('#testButton').css('display', 'block');
	$('#cancelButton').css('display', 'none');
	$('#result').empty();
	$('#progress').empty();
});

/** 
 * BUTTON HANDLERS
 */
$('#testButton').click(function () {
	$('#testButton').css('display', 'none');
	$('#cancelButton').css('display', 'block');
	
	$('#result').empty();
	
	$('#progress').append('<img style="display:inline;float:left;" src="img/loading.gif" width="30"/>');
	$('#progress').append('<p>Loading...</p>');
	
	socket.emit('test_request', {
		url: $("#site").val()
	});
});
$('#cancelButton').click(function () {
	$('#testButton').css('display', 'block');
	$('#cancelButton').css('display', 'none');
	
	$('#result').empty();
	$('#progress').empty();
	
	socket.emit('test_cancel');
});