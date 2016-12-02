/* This Javascript is for testing login features. */

/* Socket.io Events */    
socket.on('login_reject', function (error) {
	alert('Login Failed.\n' + error); 
});
socket.on('login_success', function (user) {
	alert('Login Success.\nUser:' + user); 
});

/* Button Handlers */    
$('#loginButton').click(function () {
	socket.emit('login', {
		id: $('#id_login').val(),
		ps: $('#ps_login').val(),
	});
});