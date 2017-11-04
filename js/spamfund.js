var i = 1;
var color = new Array(
	new Array("#0066BB", "#880044", "#471788", "#008866", "#000", "#FFFFFF", "#FFFFFF", "#000000", ""),
	new Array("#000000", "#000000", "#000000", "#000000", "#444", "#FFFFFF", "#FFFFFF", "#000000", ""),
	new Array("#000000", "#000000", "#000000", "#000000", "#444", "#FFFFFF", "#000000", "#FFFFFF", "_inv"),
	new Array("#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#000", "#000000", "#000000", "#FFFFFF", "_inv"),
	new Array("#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#000", "#000000", "#FFFFFF", "#000000", ""),
);
var isFullscreen = false;
var colorScheme = 0;
var bgColorIndex = 0;


function nextPageButtonClicked() {

	if(i == 2) {

		if(!document.getElementById('use_own_node_list').checked)
			sendAjaxRequest({mode: 'node_list'}, onNodeListReceive);
		else {

			httpProviders = new Array();
			httpsProviders = new Array();

			var own_node_list = $('#own_node_list').val();

			own_node_list = own_node_list.replaceAll(" ", "");
			own_node_list = own_node_list.replaceAll("\n", "");


			nodesArr = own_node_list.split(",");

			for (j = 0; j < nodesArr.length; j++) {
				if(nodesArr[j].split("://")[0] === "http")
					httpProviders.push(nodesArr[j]);
				else if(nodesArr[j].split("://")[0] === "https")
					httpsProviders.push(nodesArr[j]);
			}
		}

	    signin('true');
	    return;
	}

	if(i == 3) {
	    iotaTransactionSpammer.stopSpamming();
	    $("#stopbutton").addClass("hidden");
	    $("#waitmsg,#loader").removeClass("hidden");
	    waitForStopping();
	    return;
	}

	changeToPage(i);
}

function changeToPage(page) {
	$('#page'+page).addClass("hidden");
	$('#page'+(page+1)).removeClass("hidden");
	bgColorIndex = page;
	updateColors();
	i = page+1;
}

function signinSuccessful() {
	$('#rewarded_txs,#reward_earned,#spamcount').html("0");
    updateBalance();
	requestNewSeed();
}

var doNothing = function(result) {}


function waitForStopping() {
    if(stopSpammer) {
        setTimeout(waitForStopping, 200);
        return;
    }

	$('#page'+i).addClass("hidden");
	$('#page'+(i+1)).removeClass("hidden");
	bgColorIndex = i;
	updateColors();

    $("#stopbutton").removeClass("hidden");
    $("#waitmsg,#loader").addClass("hidden");
    
    eventEmitter.emitEvent('state', ['Stopped spamming']);
}

function toggleFullscreen() {
	if(isFullscreen) {
		$('header').css("display", "block");
		$('footer').css("display", "block");
		$('#pattern').css("display", "block");
		$('#pattern_reverse').css("display", "block");
		$('#content').css("min-height", "auto");
		isFullscreen = false;
	} else {
		$('header').css("display", "none");
		$('footer').css("display", "none");
		$('#pattern').css("display", "none");
		$('#pattern_reverse').css("display", "none");
		$('#content').css("min-height", "100vh");
		isFullscreen = true;
	}
}

function toggleColorScheme() {

	colorScheme = (colorScheme+1)%5;

	if(isFullscreen && colorScheme == 2)
		colorScheme = 3;
	if(isFullscreen && colorScheme == 4)
		colorScheme = 0;

	updateColors();
}

function updateColors() {
	$('#content,#pattern,#pattern_reverse').css("background-color", color[colorScheme][bgColorIndex]);

	//$('#content .button').css("background-color", color[colorScheme][4]);
	$('header,footer').css("background-color", color[colorScheme][6]);
	$('header,footer, footer a').css("color", color[colorScheme][7]);
	$('footer hr').css("border-color", color[colorScheme][7]);

	$('#pattern').css("background-image", "url('./imgs/pattern"+color[colorScheme][8]+".png')");
	$('#pattern_reverse').css("background-image", "url('./imgs/pattern_reverse"+color[colorScheme][8]+".png')");
	$('header img').attr("src", "./imgs/iota"+color[colorScheme][8]+".png");

	$('#content, #content a').css("color", color[colorScheme][5]);
}