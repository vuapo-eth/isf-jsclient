sendAjaxRequest({mode: 'check_update', version: '0.2'}, onUpdateChecked);

if(window.IOTA === undefined) {
	var iotaLibMissingText = "<h1>One last step</h1><p>You have to add 'js/iota.min.js' to the project. Just follow these instructions:</p>"
		+ "<ol><li>visit <a href='https://raw.githubusercontent.com/iotaledger/iota.lib.js/master/dist/iota.min.js' target='_blank'>https://raw.githubusercontent.com/iotaledger/iota.lib.js/master/dist/iota.min.js</a> <sup>1</sup></li>"
		+ "<li>download the shown file (press CTRL+S in Firefox/Chrome) <sup>1</sup> and name it 'iota.min.js'</li>"
		+ "<li>move the downloaded file into the directory '/js/'</li></ol>"
		+ "<hr/><p><sup>1</sup> ... Alternatively, if this is not working for you, you can get the file this way as well:</p>"
		+ "<ol><li>visit <a href='https://github.com/iotaledger/iota.lib.js' target='_blank'>https://github.com/iotaledger/iota.lib.js</a></li>"
		+ "<li>download the whole repository .zip file</li>"
		+ "<li>you will find the 'iota.min.js' in '/dist/'</li>";

	$('#content').html(iotaLibMissingText);
}

if(document.URL === "https://mikrohash.de/iota/spamfund/demo" || document.URL === "https://mikrohash.de/iota/spamfund/demo/" || document.URL === "https://www.mikrohash.de/iota/spamfund/demo" || document.URL === "https://www.mikrohash.de/iota/spamfund/demo/") {
	alert("This is the online demo. Do not use this for regular spamming, since you will only be able to connect to two nodes.");
}

$('#protocol').html(isRunningOverHTTPS()?"<b>https</b> not <s>http</s>":"<b>http</b> not <s>https</s>");