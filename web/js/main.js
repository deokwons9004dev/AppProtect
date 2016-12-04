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
  });
