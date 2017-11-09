/**
 * Created by Peter Ryszkiewicz (https://github.com/pRizz) on 9/10/2017.
 * https://github.com/pRizz/iota.transactionSpammer.js
 * 
 * Modified by iotaspam.com (https://github.com/mikrohash)
 */

var stopSpammer = false;
var eventEmitter = new EventEmitter();
var transactionCount = 0;

var httpProviders = null;
var httpsProviders = null;

var validProviders = null;
var currentProvider = null;

var spamSeed = "ERROR9999999999999COULD9NOT9CONNECT9TO9IOTA9SPAM9FUND9WEBSITE9TO9RECEIVE9ADDRESS9";
var message = "999";

var weight = 14;
var tag = "IOTASPAMFUND";

var iotaTransactionSpammer = (function(){
    const iotaLib = window.IOTA
    const curl = window.curl
    const MAX_TIMESTAMP_VALUE = (Math.pow(3,27) - 1) / 2 // from curl.min.js
    curl.init();
    var iota // initialized in initializeIOTA
    var started = false

    // from https://iotasupport.com/providers.json

    var depth = 10
    var numberOfTransfersInBundle = 1

    var confirmationCount = 0
    var averageConfirmationDuration = 0 // milliseconds

    validProviders = getValidProviders();
    currentProvider = getRandomProvider();

    // must be https if the hosting site is served over https; SSL rules
    function getValidProviders() {
        if(isRunningOverHTTPS()) {
            return httpsProviders;
        } else {
            return httpProviders
        }
    }

    // returns a depth in [4, 12] inclusive
    function generateDepth() {
        depth = Math.floor(Math.random() * (12 - 4 + 1)) + 4
        return depth
    }

    function generateSeed() {
        const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9'
        return Array.from(new Array(81), (x, i) => validChars[Math.floor(Math.random() * validChars.length)]).join('')
    }

    function generateTransfers() {
        return Array.from(new Array(numberOfTransfersInBundle), (x, i) => generateTransfer())
    }

    function generateTransfer() {
        return {
            address: spamSeed,
            value: 0,
            message: message,
            tag: tag
        }
    }

	// adapted from https://github.com/iotaledger/wallet/blob/master/ui/js/iota.lightwallet.js
    const localAttachToTangle = function(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
        const ccurlHashing = function(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
            const iotaObj = iota;

            // inputValidator: Check if correct hash
            if (!iotaObj.valid.isHash(trunkTransaction)) {
                return callback(new Error("Invalid trunkTransaction"));
            }

            // inputValidator: Check if correct hash
            if (!iotaObj.valid.isHash(branchTransaction)) {
                return callback(new Error("Invalid branchTransaction"));
            }

            // inputValidator: Check if int
            if (!iotaObj.valid.isValue(minWeightMagnitude)) {
                return callback(new Error("Invalid minWeightMagnitude"));
            }

            var finalBundleTrytes = [];
            var previousTxHash;
            var i = 0;

            function loopTrytes() {
                getBundleTrytes(trytes[i], function(error) {
                    if (error) {
                        return callback(error);
                    } else {
                        i++;
                        if (i < trytes.length) {
                            loopTrytes();
                        } else {
                            // reverse the order so that it's ascending from currentIndex
                            return callback(null, finalBundleTrytes.reverse());
                        }
                    }
                });
            }

            function getBundleTrytes(thisTrytes, callback) {
                // PROCESS LOGIC:
                // Start with last index transaction
                // Assign it the trunk / branch which the user has supplied
                // IF there is a bundle, chain  the bundle transactions via
                // trunkTransaction together

                var txObject = iotaObj.utils.transactionObject(thisTrytes);
                txObject.tag = txObject.obsoleteTag;
                txObject.attachmentTimestamp = Date.now();
                txObject.attachmentTimestampLowerBound = 0;
                txObject.attachmentTimestampUpperBound = MAX_TIMESTAMP_VALUE;
                // If this is the first transaction, to be processed
                // Make sure that it's the last in the bundle and then
                // assign it the supplied trunk and branch transactions
                if (!previousTxHash) {
                    // Check if last transaction in the bundle
                    if (txObject.lastIndex !== txObject.currentIndex) {
                        return callback(new Error("Wrong bundle order. The bundle should be ordered in descending order from currentIndex"));
                    }

                    txObject.trunkTransaction = trunkTransaction;
                    txObject.branchTransaction = branchTransaction;
                } else {
                    // Chain the bundle together via the trunkTransaction (previous tx in the bundle)
                    // Assign the supplied trunkTransaciton as branchTransaction
                    txObject.trunkTransaction = previousTxHash;
                    txObject.branchTransaction = trunkTransaction;
                }

                var newTrytes = iotaObj.utils.transactionTrytes(txObject);

                curl.pow({trytes: newTrytes, minWeight: minWeightMagnitude}).then(function(nonce) {
                    var returnedTrytes = newTrytes.substr(0, 2673-81).concat(nonce);
                    var newTxObject= iotaObj.utils.transactionObject(returnedTrytes);

                    // Assign the previousTxHash to this tx
                    var txHash = newTxObject.hash;
                    previousTxHash = txHash;

                    finalBundleTrytes.push(returnedTrytes);
                    callback(null);
                }).catch(callback);
            }
            loopTrytes()
        }

        ccurlHashing(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, function(error, success) {
            if (error) {
                console.log(error);
            }
            
            if (callback) {
                return callback(error, success);
            } else {
                return success;
            }
        })
    }


    function initializeIOTA() {
        eventEmitter.emitEvent('state', [`Initializing connection to     ${currentProvider}`])
        eventEmitter.emitEvent('nodeChanged', null);
        iota = new iotaLib({'provider': currentProvider})
        //curl.overrideAttachToTangle(iota.api) // broken
        // using this because of bug with using curl.overrideAttachToTangle()
        iota.api.attachToTangle = localAttachToTangle;
    }

    function sendMessages() {
        const transfers = generateTransfers()
        const transferCount = transfers.length
        const localConfirmationCount = transferCount * 2
        const transactionStartDate = Date.now()
        eventEmitter.emitEvent('state', [`Creating transaction`])
        iota.api.sendTransfer(spamSeed, generateDepth(), weight, transfers, function(error, success){
            if (error) {
                eventEmitter.emitEvent('log', ['<span class="warning">Error occurred while sending transactions</span>']);
                setTimeout(changeProviderAndSync, 1000);
                return;
            }
            const transactionEndDate = Date.now()
            const transactionDuration = transactionEndDate - transactionStartDate // milliseconds
            const oldTotalConfirmationDuration = averageConfirmationDuration * confirmationCount

            transactionCount += transferCount
            confirmationCount += localConfirmationCount
            averageConfirmationDuration = (oldTotalConfirmationDuration + transactionDuration) / confirmationCount

            eventEmitter.emitEvent('log', ['<span class="important">Transaction created:</span>           '+success[0].hash]);
            eventEmitter.emitEvent('transactionCountChanged', [transactionCount]);

            eventEmitter.emitEvent('transactionCompleted', [success]);

            if(!stopSpammer)
                checkIfNodeIsSynced()
            stopSpammer = false;
        })
    }

    function getRandomProvider() {
        if(validProviders == null)
            return null;
        return validProviders[Math.floor(Math.random() * validProviders.length)]
    }

    function changeProviderAndSync() {
        eventEmitter.emitEvent('state', ['Randomly changing IOTA nodes'])
        restartSpamming()
    }

    function checkIfNodeIsSynced() {
        eventEmitter.emitEvent('state', ['Checking if node is synced'])

        iota.api.getNodeInfo(function(error, success){
            if(error) {
                eventEmitter.emitEvent('log', ['<span class="warning">Error occurred while checking if node is synced</span>']);
                setTimeout(changeProviderAndSync, 1000);
                return;
            }

            const isNodeUnsynced =
                success.latestMilestone == spamSeed ||
                success.latestSolidSubtangleMilestone == spamSeed ||
                success.latestSolidSubtangleMilestoneIndex < success.latestMilestoneIndex

            const isNodeSynced = !isNodeUnsynced

            if(isNodeSynced) {
                //eventEmitter.emitEvent('state', ['Node is synced'])
                sendMessages()
            } else {
                const secondsBeforeChecking = 3
                eventEmitter.emitEvent('log', [`<span class="warning">Node is not synced. Wait ${secondsBeforeChecking}s.</span>`])
                setTimeout(function(){
                    changeProviderAndSync() // Sometimes the node stays unsynced for a long time, so change provider
                }, secondsBeforeChecking * 1000)
            }
        })
    }

    // Only call if there is an error or there is no current spamming running
    function restartSpamming() {
        validProviders = getValidProviders();
        currentProvider = getRandomProvider();
        
        eventEmitter.emitEvent('log', [`<span class="important">New node:</span>                      ${currentProvider}</span>`])

        if(currentProvider == null) {
            eventEmitter.emitEvent('log', [`<span class="warning">Node list emptry. Check again in 5s.</span>`])
            return setTimeout(restartSpamming, 5000);
        } else {
            initializeIOTA()
            checkIfNodeIsSynced()
        }
    }

    return {
        // View options, or set options if params are specified
        options: function(params) {
            if(!params) {
                return {
                    provider: currentProvider,
                    depth: depth,
                    weight: weight,
                    spamSeed: spamSeed,
                    message: message,
                    tag: tag,
                    numberOfTransfersInBundle: numberOfTransfersInBundle
                }
            }
            if(params.hasOwnProperty("provider")) { currentProvider = params.provider }
            if(params.hasOwnProperty("depth")) { depth = params.depth }
            if(params.hasOwnProperty("weight")) { weight = params.weight }
            if(params.hasOwnProperty("spamSeed")) { spamSeed = params.spamSeed }
            if(params.hasOwnProperty("message")) { message = params.message }
            if(params.hasOwnProperty("tag")) { tag = params.tag }
            if(params.hasOwnProperty("numberOfTransfersInBundle")) { numberOfTransfersInBundle = params.numberOfTransfersInBundle }
        },
        startSpamming: function() {
            if(started) { return }
            started = true;
            transactionCount = 0;
            eventEmitter.emitEvent('log', ['<span class="important">Start spamming</span><br/>']);
            restartSpamming();
        },
        stopSpamming: function() {
            started = false;
            stopSpammer = true;
            eventEmitter.emitEvent('log', ['<span class="important">Stop spamming</span>']);
        },
        eventEmitter: eventEmitter,
        getTransactionCount: () => transactionCount,
        getConfirmationCount: () => confirmationCount,
        getAverageConfirmationDuration: () => averageConfirmationDuration
    }
})();

function isRunningOverHTTPS() {
    switch(window.location.protocol) {
        case 'https:':
            return true
        default:
            return false
    }
}