/* This Javascript is for testing login features. */

/* Socket.io Events */
socket.on('login_reject', function (error) {
	alert('Login Failed.\n' + error);
});
socket.on('login_success', function (user) {
	alert('Login Success.\nUser:' + user);
	$('#tokenButton').css('display', 'block');
	$('#ver_site').css('display', 'block');
	$('#verifyButton').css('display', 'block');
	getVerifiedSites();
});

/* Button Handlers */
$('#agree_terms_button').click(function () {
	socket.emit('login', {
		id: $('#username').val(),
		ps: $('#password').val(),
	});
});