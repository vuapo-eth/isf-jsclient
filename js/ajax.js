var accountId = -1;
var sessionKey = null; // hash used to hash sign communication with spam fund api
var sessionTime = null; // determines sessionKey, therefore allows api to easily verify sessionKey creation date




// ===== Process Ajax Answer =====

var doNothing = function(result) {}

var onSignin = function(result) {
    if(result.success) {
        sessionKey = result.session_key;
        sessionTime = result.session_time;
        accountId = result.account_id;

        if(result.feedback) {
            signinSuccessful();
        }
        eventEmitter.emitEvent('state', ['Session initialized']);

        var timestamp = Math.round((new Date()).getTime() / 1000);
        setTimeout(signin, (sessionTime-timestamp)*0.4*1000);
    } else {
        if(result.feedback) {
            alert("[ERROR] Sign in failed: '" + result.error + "'.");
        } else {
            eventEmitter.emitEvent('state', ['<span class="warning">Sign in failed: ' + result.error + '. Try again in 10s.</span>']);
            setTimeout(signin, 10000);
        }
    }
}

var onBalanceUpdated = function(result) {
    if(result.success) {
        $('#rewarded_txs').html(result.confirmed_txs);
        $('#confirmed_balance').html(result.balance/1000);
        $('#current_reward').html(result.current_reward);
    } else {
        eventEmitter.emitEvent('state', ['<span class="warning">Could not update balances: '+result.error+'</span>']);
    }
}

var onReceivingSeed = function(result) {
    if(result.success) {
        if(result.seed != spamSeed)
            eventEmitter.emitEvent('state', ['<span class="important">New spam seed:</span>                 ' + result.seed]);
        spamSeed = result.seed;
        if(i == 2) {
            resetStartMilliseconds();
            iotaTransactionSpammer.startSpamming();
            changeToPage(2);
        }
    } else {
        eventEmitter.emitEvent('state', ['<label class="warning">Could not receive spam codes: '+result.error+'</label>']);
    }
}

var onNodeListReceive = function(result) {
    httpProviders = result.http_providers;
    httpsProviders = result.https_providers;
    eventEmitter.emitEvent('state', ['Node list initialized']);
}

var onUpdateChecked = function(result) {
    if(result.update) {

        $('#news_box h1').html(result.title);
        $('#news_box p').html(result.description);
        $('#news').removeClass('hidden');
        eventEmitter.emitEvent('state', ['<span class="important">News available.</span>']);
    } else
        eventEmitter.emitEvent('state', ['No news available']);
}




// ===== Send Ajax Request =====

function requestNewSeed() {
    sendAjaxRequest({mode: 'request_seed', account_id: accountId, session_key: sessionKey, session_time: sessionTime}, onReceivingSeed);
    eventEmitter.emitEvent('state', ['Updating spam seed']);
}

function updateBalance() {
    sendAjaxRequest({mode: 'update_balance', email: $('#email').val(), account_id: accountId, session_key: sessionKey, session_time: sessionTime}, onBalanceUpdated);
    setTimeout(updateBalance, 20000);
}

function signin(receiveFeedback) {
    var timestamp = Math.round((new Date()).getTime() / 1000);
    var hashSign = md5('Jy68dnhE8ZUgs26C-'+$('#password').val()+"-"+timestamp);
    sendAjaxRequest({mode: 'signin', email: $('#email').val(), hash: hashSign, time: timestamp, receive_feedback: receiveFeedback}, onSignin);
    eventEmitter.emitEvent('state', ['Initializing new session']);
}

function sendAjaxRequest(data, resultProcessor) {

    $.ajax({
        url: "https://mikrohash.de/iota/spamfund/api/index.php",
        data: data,
        type: 'GET',
        crossDomain: true,
        dataType: 'text',
        success: function(result) { resultProcessor(JSON.parse(result.replaceAll("<", "&lt;").replaceAll(">", "&gt;"))); }, // replacing '<' and '>' to avoid insection of javascript code
        error: function() { },
        beforeSend: null
    });
}