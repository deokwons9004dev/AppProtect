function changeView (target) {
	switch (target) {
		case 'login':
			$('#log_in_forms').show();        // Show the login form.
			
			$('.logged_in').hide();           // Hide the logged_in container.
			$('#progress').hide();            // Hide Progress GIF.
			$('#cancelButton').hide();        // Hide Cancel Button.
			$('#search_tab').hide();          // Hide Search Tab.
			$('#verified_sites').hide();      // Hide Verified Sites Table.
			$('#vulnerability_table').hide(); // Hide Vulnerability Table.
			$('#result').hide();              // Hide Result DIV.
			$('#backButton').hide();          // Hide Back Button.
			break;
		case 'test':
			$('#progress').show();            // Show Progress GIF.
			$('#cancelButton').show();        // Show Cancel Button.
			
			$('#search_tab').hide();          // Hide Search Tab.
			$('#verified_sites').hide();      // Hide Verified Sites Table.
			$('#vulnerability_table').hide(); // Hide Vulnerability Table.
			$('#result').hide();              // Hide Result DIV.
			$('#backButton').hide();          // Hide Back Button.
			break;
		case 'panel':
			getVerifiedSites();               // Fetch user's verified sites.
			getTopList();                     // Fetch Top 5 Vulnerabilities.
			$('.logged_in').show();           // Show the logged_in container.
			$('#search_tab').show();          // Show Search Tab.
			$('#verified_sites').show();      // Show Verified Sites Table.
			$('#vulnerability_table').show(); // Show Vulnerability Table.
			
			$('#log_in_forms').hide();        // Show the login form.
			$('#progress').hide();            // Hide Progress GIF.
			$('#cancelButton').hide();        // Hide Cancel Button.
			$('#result').hide();              // Hide Result DIV.
			$('#backButton').hide();          // Hide Back Button.
			break;
		case 'result':
			$('#result').empty();             // Empty Result DIV.
		
			$('#result').show();              // Show Result DIV.
			$('#backButton').show();          // Show Back Button.
			
			$('#search_tab').hide();          // Show Search Tab.
			$('#verified_sites').hide();      // Show Verified Sites Table.
			$('#vulnerability_table').hide(); // Show Vulnerability Table.
			$('#progress').hide();            // Hide Progress GIF.
			$('#cancelButton').hide();        // Hide Cancel Button.
			break;		
		default:
			break;
	}
}