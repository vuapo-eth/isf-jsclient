/**
 * Created by Peter Ryszkiewicz (https://github.com/pRizz) on 9/10/2017.
 * https://github.com/pRizz/iota-transaction-spammer-webap
 *
 * Edited by MikroHash (https://github.com/mikrohash)
 */

var txmsg;
const significantFigures = 3
var startMilliseconds = Date.now();

var state = "", log = "";

function millisecondsToHHMMSSms(milliseconds) {
    var sec_num = parseInt(`${milliseconds / 1000}`, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return `${hours}:${minutes}:${seconds}`
}

function resetStartMilliseconds() {
    startMilliseconds = Date.now();
}


$(function(){
    iotaTransactionSpammer.options({
        message: txmsg
    })

    eventEmitter.on('state', function(msg) {
        state = formatDate(new Date()) + ": " + msg;
        $('#log').html("Current state: " + state + "<br/><br/>" + log);
    })

    eventEmitter.on('log', function(msg) {
        var entry = formatDate(new Date()) + ": " + msg + "<br/>";
        console.log(entry);
        log = entry + log;
        $('#log').html("Current state: " + state + "<br/><br/>" + log);
    })

    eventEmitter.on('transactionCountChanged', function(transactionCount) {
        $('#spamcount')[0].innerText = transactionCount
    })

    eventEmitter.on('nodeChanged', function() {
        updateTxMsg();
    })

    eventEmitter.on('transactionCompleted', function(success) {
        success.forEach((element) => {
            $('#txlog').html($('#txlog').html() + element.hash + "\n");
        })
    })

    function durationInMinutes() {
        return durationInSeconds() / 60
    }

    function durationInSeconds() {
        return durationInMilliseconds() / 1000
    }

    function durationInMilliseconds() {
        return Date.now() - startMilliseconds
    }

    function updateTransactionsPerMinute() {
        $('#transactionsPerMinuteCount')[0].innerText = (iotaTransactionSpammer.getTransactionCount() / durationInMinutes()).toFixed(significantFigures)
    }
    function updateTimer() {
        $('#timeSpentSpamming')[0].innerText = millisecondsToHHMMSSms(durationInMilliseconds())
    }

    setInterval(function(){
        updateTransactionsPerMinute()
        updateTimer()
    }, 400)

    setInterval(function(){
        requestNewSeed()
    }, 180000)
})

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function createBase27String(str) {
    if(str == null)
        return "NULL";
    str = str.toUpperCase();
    str = str.replaceAll("9", "9NINE9");
    str = str.replaceAll("\\/", "9SLASH9");
    str = str.replaceAll("\\.", "9DOT9");
    str = str.replaceAll("\\:", "9COLON9");
    str = str.replaceAll("0", "9ZERO9");
    str = str.replaceAll("1", "9ONE9");
    str = str.replaceAll("2", "9TWO9");
    str = str.replaceAll("3", "9THREE9");
    str = str.replaceAll("4", "9FOUR9");
    str = str.replaceAll("5", "9FIVE9");
    str = str.replaceAll("6", "9SIX9");
    str = str.replaceAll("7", "9SEVEN9");
    str = str.replaceAll("8", "9EIGHT9");
    str = str.replaceAll("99", "9");
    return str;
}

function formatDate(date) {

  var h = date.getHours();
  var m = date.getMinutes();
  var s = date.getSeconds();
  h=h<10?"0"+h:h;
  m=m<10?"0"+m:m;
  s=s<10?"0"+s:s;

  return h + ':' + m + ':' + s;
}

function updateTxMsg() {
    txmsg = "I9SPAM9FOR9IOTAS9ON99999IOTASPAM9DOT9COM";
    txmsg += "999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999";
    txmsg += "TRANSACTION9CREATED9USING9FULL9NODE99999"+createBase27String(currentProvider);

    iotaTransactionSpammer.options({
        message: txmsg
    });
}