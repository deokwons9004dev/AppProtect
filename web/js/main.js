$(document).ready(function() {
    $('select').material_select();
    $( '#type_test' ).change(function() {
    	var x = $( "select option:selected" ).text();
  		console.log(x);
		});
  });
