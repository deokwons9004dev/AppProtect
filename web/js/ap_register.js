/* This Javascript is for testing registration features. */

/* Socket.io Events */    
socket.on('register_reject', function (error) {
	alert('Register Failed.\n' + error); 
});
socket.on('register_success', function () {
	alert('Register Success.'); 
});

/* Button Handlers */    
$('#regButton').click(function () {
	socket.emit('register', {
		id: $('#id_reg').val(),
		ps: $('#ps_reg').val(),
	});
});