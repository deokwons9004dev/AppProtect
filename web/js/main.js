$(document).ready(function() {


	//check if user is logged in cookie
	if (false){
		//not logged in
		$('.logged_in').hide();
		$('#verified_sites').hide();
		$('#vulnerability_table').hide();
	} else {
		//have cookie
		$('.logged_in').show();
		$('#verified_sites').show();
		$('#vulnerability_table').show();
		$('#log_in_forms').hide();
	}


	$('#tokenButton').click(function () {
    	console.log("tokenButton!!");
   });

    $('select').material_select();

    $('#cancelButton').click(function () {
    	console.log("Canceled!!");
    });


    $('#agree_terms_button').click(function () {
    	var test_type;
    	test_type = $( "#type_test" ).val();

    	//check to see which entry it is and if something is entered
    	var search_block = $('#search_block').is(":visible");
    	var two_inputs = $('#testing_inputs').is(":visible");
    	var search_one_input = false;
    	var search_two_input = false;
   		var website_url;
   		var username;
   		var password;

    	if(search_block){
    		search_one_input = true;
    		website_url = $('#search_text').val();
    	}
    	if(two_inputs){
    		search_two_input = true;
    		username = $('#username').val();
    		password = $('#password').val();
    	}

  //   	// error checking

  //   	//correct
  //   	if( (search_one_input && website_url && test_type)){
  //   		//continue to load screen
  //   		$('#tableview').hide();
  //   		$('#progress').show();
  //   		$('#select_boxes').css({"line-height": "","border": "","border-radius": ""});
  //   		$('#search_block').css({"line-height": "","border": "","border-radius": ""});
  //   		$('#cancelButton').show();
  //   		$('#search_text').val("");
  //   		$('#site_name').text("Testing 	" + website_url + "...");
  //   		//make call to backend
  //   	}
  //   	if( (search_two_input && username && password && test_type)){
  //   		//continue to load screen
  //   		$('#tableview').hide();
  //   		$('#progress').show();
  //   		$('#select_boxes').css({"line-height": "","border": "","border-radius": ""});
  //   		$('#search_block').css({"line-height": "","border": "","border-radius": ""});
  //   		$('#cancelButton').show();
  //   		$('#password').val("");
  //   		$('#username').val("");
  //   		$('#site_name').text("Testing Input...");
  //   		//make call to backend
  //   	}

  //   	// throw errors select
  //   		if(!test_type){
  //   				$('#select_boxes').css({"line-height": "1","border": "solid 4px #ff0000","border-radius": "10px"});
  //   		}else{
  //   			$('#select_boxes').css({"line-height": "","border": "","border-radius": ""});
  //   		}

  //   		if(!website_url && search_one_input){
  //   			console.log("one input");
  //   			$('#search_block').css({"line-height": "1","border": "solid 4px #ff0000","border-radius": "10px"});
  //   		}else{
  //   			if(search_one_input){
  //   				$('#search_block').css({"line-height": "","border": "","border-radius": ""});
  //   			}
  //   		}
  //   		if((!password) && search_two_input){
  //   				$('#pass').css({"line-height": "1","border": "solid 4px #ff0000","border-radius": "10px"});
  //   		} else {
  //   			if(search_two_input){
  //   			 	$('#pass').css({"line-height": "","border": "","border-radius": ""});
  //   			 }
  //   		}
  //   		if((!username) && search_two_input){
  //   				$('#user').css({"line-height": "1","border": "solid 4px #ff0000","border-radius": "10px"});
  //   		} else {
  //   			if(search_two_input){
  //   			 	$('#user').css({"line-height": "","border": "","border-radius": ""});
  //   			 }
  //   		}


    });
  //   $('#disagree_terms_button').click(function () {

  //   });
    $( '#type_test' ).change(function() {
    	var x = $( "select option:selected" ).text();
    	if(x=="ZAP"){
    		$("#search_block").show();
    		$("#testing_inputs").hide();
  		}else{
  			$("#testing_inputs").show();
  			// $("#search_block").hide();
  		}
		});

		$('.modal').modal({
      dismissible: false, // Modal can be dismissed by clicking outside of the modal
      opacity: .5, // Opacity of modal background
      in_duration: 300, // Transition in duration
      out_duration: 200, // Transition out duration
      starting_top: '4%', // Starting top style attribute
      ending_top: '10%', // Ending top style attribute
      ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
        console.log(modal, trigger);
      },
      complete: function() { console.log('Closed'); } // Callback for Modal close
    }
  );
  });
