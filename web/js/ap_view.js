var views = [
	$('#log_in_forms'),
	$('.logged_in'),
	$('#progress'),
	$('#cancelButton'),
	$('#search_tab'),
	$('#verified_sites'),
	$('#vulnerability_table'),
	$('#result'),
	$('#backButton')
]

function removeAll () {
	views.forEach(function (view, i) {
		view.hide();
	});
	return;
}

function changeView (target) {
	switch (target) {
		case 'login':
			removeAll();
			$('#log_in_forms').show();        // Show the login form.
			break;
			
		case 'test':
			removeAll();
			$('#spinner').removeClass();
			$('#spinner').addClass('spinner-layer').addClass('spinner-red-only');
			$('#progress').show();            // Show Progress GIF.
			$('#cancelButton').show();        // Show Cancel Button.
			break;
			
		case 'test_sq':
			removeAll();
			$('#spinner').removeClass();
			$('#spinner').addClass('spinner-layer').addClass('spinner-red-only');
			$('#result').empty();             // Empty Result DIV.
			$('#progress').show();            // Show Progress GIF.
			$('#cancelButton').show();        // Show Cancel Button.
			$('#result').show();              // Show Result DIV.
			break;
			
		case 'panel':
			removeAll();
			getVerifiedSites();               // Fetch user's verified sites.
			getTopList();                     // Fetch Top 5 Vulnerabilities.
			$('.logged_in').show();           // Show the logged_in container.
			$('#search_tab').show();          // Show Search Tab.
			$('#verified_sites').show();      // Show Verified Sites Table.
			$('#vulnerability_table').show(); // Show Vulnerability Table.
			break;
			
		case 'result':
			removeAll();
			$('#result').empty();             // Empty Result DIV.
			$('#result').show();              // Show Result DIV.
			$('#backButton').show();          // Show Back Button.
			break;	
			
		case 'result_sq':
			removeAll();
			$('#result').show();              // Show Result DIV.
			$('#backButton').show();          // Show Back Button.
			break;
			
		default:
			break;
	}
}

function changePage (target) {
	switch (target) {
		case 'panel':
			window.location.assign('/');
			break;
		default:
			break;
	}
}




















