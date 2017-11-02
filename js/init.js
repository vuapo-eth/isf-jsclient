// === download information from spam fund website ===

sendAjaxRequest({mode: 'check_update', version: '0.2'}, onUpdateChecked);

if(window.IOTA === undefined) {
	$('#content').html("<h1>Sorry to interrupt you!</h1><p>We couldn't find 'js/iota.min.js'. Please follow the instructions provided in our 'README.md' file to find out what to do.</p>");
}

//nextPageButtonClicked();
//nextPageButtonClicked();