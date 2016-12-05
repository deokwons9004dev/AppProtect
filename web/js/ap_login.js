/* This Javascript is for testing login / logout features. */

/** 
 * Onload Initializer
 */
$(window).ready(function () {
	/* Restore Session After Client Socket Initializes. */
	var socketReadyTimer = 
	setInterval(function () {
		if (socket) {
			clearInterval(socketReadyTimer);
			userLoginSession();
		}
	}, 100);
});

/** 
 * Socket Events
 */
socket.on('logout_reject', function (error) {
	alert('Logout Failed.\n' + error); 
});
socket.on('logout_success', function () {
	changeView('login');
});

/** 
 * Button Handlers
 */
/* Login Button Handler */
$('#loginButton').click(function () {
	userLoginPost();
});
$('#logoutButton').click(function () {
	socket.emit('logout');
});

/** 
 * External Functions 
 */
//function loadUserPanel() {
//	var loc_str = window.location.href;
//	var loc = window.location.href.split('/').pop();
//	console.log('Current Location: ' + loc);
//	
//	/* Load User Panels
//	 * 
//	 * This event is sent to the client after the 
//	 * socket session has successfully loaded all 
//	 * user data, so it will change the UI to the 
//	 * logged in user panel view.
//	 */
//	changeView('panel');
//	getVerifiedSites();               // Fetch user's verified sites.
//	getTopList();                     // Fetch Top 5 Vulnerabilities.
//}


/** 
 * AJAX Requests 
 */
/* Send a POST request to process the initial login
 *
 * There are TWO login processes:
 * 1) userLoginPost   : The initial login to obtain a Auth Cookies. (This Request)
 * 2) userLoginSession: The secondary login to load user session to this socket connection.
 * 
 * This may feel redundant, but it is necessary because the Server's 
 * Request handlers (GET, POST, etc) and SocketIO handlers are different 
 * listeners that do not share data between each other. Most of our user 
 * tasks will be delivered and received via SocketIO, but SocketIO cannot 
 * persist throughout page changes, so we need to install cookies, which 
 * is something that only the traditional request handlers can do. After 
 * the user goes through this POST login request, assuming the credentials 
 * are correct, the client will receive a User Authentication Cookie (UAC). 
 * The client will then call the function 'userLoginSession', which 
 * will identify the UAC we just installed, and finally attach all user data 
 * to the socket connection.
 */
function userLoginPost() {
	var id_login = document.getElementById("id_login").value;
	var ps_login = document.getElementById("ps_login").value;
	
	if (id_login == "" || ps_login == ""){
		alert("Please enter in user information.");
	}
	else{
		var dict = {
			id: id_login,
			ps: ps_login
		}
		sendPost(ap_url, "/loginPost", dict, function (res) {
			if (res.result == "fail"){
				alert("Error while logging in.\n" + 
				res.reason + "\n" +
				res.reason_detail);
			}
			else userLoginSession();
		});
	}
}

/* Attach Socket Session to this Socket connection.
 *
 * This function will send a POST request containing the client socket's ID, 
 * along with the UAC that was installed previously. Once this completes, 
 * then for the duration of the current page, the client can communicate 
 * securely using the easy SocketIO events. 
 *
 * When a page change occurs, this function will be called automatically 
 * upon window load to quickly restore the user session to the new socket 
 * connection. This is inefficient, but its the best solution we've got so far. 
 */
function userLoginSession() {
	var dict = {
		sid: socket.id
	}
	sendPost(ap_url, "/loginSession", dict, function (res) {
		if (res.result == "fail"){
			alert("Error while logging in.\n" + 
			res.reason + "\n" +
			res.reason_detail);
		}
		else changeView('panel');
	});
}

