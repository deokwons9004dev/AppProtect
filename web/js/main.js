$(document).ready(function() {
    $('select').material_select();
    $( '#type_test' ).change(function() {
    	var x = $( "select option:selected" ).text();
    	if(x=="Website"){
    		$("#search_block").show();
    		$("#testing_inputs").hide();
  		}else{
  			$("#testing_inputs").show();
  			$("#search_block").hide();
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
