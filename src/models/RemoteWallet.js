// Electron/Node modules
var os = require('os'),
    child_process = require('child_process'),
    fs = require('fs'),
    crypto = require('crypto'),
    path = require('path'),
    remote = require('electron').remote,
    app = remote.require('electron').app,
    ipc = require('electron').ipcRenderer,
    assert = require('assert');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    Promise = require('promise');

// Models
var LocalWallet = require('./LocalWallet'),
    LightboxPModel = require('./LightboxPModel'),
    AppViewModel = require('./AppViewModel'),
    LightboxModel = require('./LightboxModel');

var RPC_Client = require('../iocoin/client').Client;


var RemoteWallet = {
    client: null,
    walletPath: null,
    invitations: 0,
    newInvitations: 0,
    /*
    availableFunds: 0,
    pendingFunds: 0,

    transactions: [],
    names: [],
    myrsakeys: [],
    rsafriends: [],
    msg_len: -1,
    newTransactions: 0,
    invitations: 0,

    currentBlock: 0,
    highestBlock: 0,
    syncProgressPercent: 0,
    syncing: true,
    connections: 0,

    isEncrypted: false,
    isLocked: false,
    isStaking: false,
    stakingEnabled: false,

    unspentInputs: []
    */

    unlockWallet__: function (options) {
        var stayUnlocked = options.stayUnlocked,
        subView = options.v,
            stakingOnly = options.stakingOnly;

        assert(typeof stayUnlocked == 'boolean');
        assert(typeof stakingOnly == 'boolean');

        return new Promise(function (fulfill, reject) {
            if (!RemoteWallet.isEncrypted || !RemoteWallet.isLocked) {
                return fulfill();
            }

            LightboxModel.checkPassphrase = function (passphrase) {
                return RemoteWallet.client.walletPassphrase(passphrase, stayUnlocked ? 31536000 : 1, stakingOnly);
            };

            LightboxModel.onSuccess = fulfill;
            LightboxModel.onCancel = reject;
            LightboxModel.active(true);
        }).then(function() {
                m.startComputation();
      AppViewModel.subview(subView);
                m.endComputation();
            });


    },
    unlockWallet: function (options) {
        var stayUnlocked = options.stayUnlocked,
            stakingOnly = options.stakingOnly;

        assert(typeof stayUnlocked == 'boolean');
        assert(typeof stakingOnly == 'boolean');

        return new Promise(function (fulfill, reject) {
            if (!RemoteWallet.isEncrypted || !RemoteWallet.isLocked) {
                return fulfill();
            }

            LightboxModel.checkPassphrase = function (passphrase) {
                return RemoteWallet.client.walletPassphrase(passphrase, stayUnlocked ? 31536000 : 1, stakingOnly);
            };

            LightboxModel.onSuccess = fulfill;
            LightboxModel.onCancel = reject;
            LightboxModel.active(true);
        });
    },
    changePassword: function () {
        return new Promise(function (fulfill, reject) {
          LightboxPModel.changePassphrase = function (oldpassphrase, newpassphrase) {
            return RemoteWallet.client.walletPassphraseChange(oldpassphrase, newpassphrase);
          };
          LightboxPModel.onSuccess = fulfill;
          LightboxPModel.onCancel = reject;
          LightboxPModel.active(true);
        });
    },

    lockWallet: function (options) {

        //console.log("lockWallet");
        return new Promise(function (fulfill, reject) {
            if (RemoteWallet.isLocked) {
                return fulfill();
            }

            if (RemoteWallet.isEncrypted) {
                //console.log("lockWallet isEncrypted true");
                return RemoteWallet.client.walletLock().then(function() {
                   m.startComputation();
                   AppViewModel.subview(options.v);
                   m.endComputation(); }
                   ).then(fulfill, reject);
            }
            else
            {
              //console.log("wallet is not encrypted");
              LightboxModel.setPassphrase = function (passphrase) {
                //console.log("SETTING PASSWORD, ENCRYPTING WALLET");
                return RemoteWallet.client.encryptWallet(passphrase);
              };
            //exit_state.enc=true;
            LightboxModel.onSuccess = fulfill;
            LightboxModel.onCancel = reject;
            LightboxModel.active(true);
              return fullfill(); 
            }

            LightboxModel.checkPassphrase = function (passphrase) {
                //console.log("lockWallet isEncrypted false");
                //console.log("lockWallet encryptwallet");
                return RemoteWallet.client.encryptWallet(passphrase);
            };

            LightboxModel.onSuccess = fulfill;
            LightboxModel.onCancel = reject;
            LightboxModel.active(true);
        });
    },
   receivedInfoString: function(alias) {
     m.startComputation();
     var i;
     return new Promise(function(fulfill, reject) {
       RemoteWallet.client.receivedByURL(alias).then(function(r) 
     {
       i = "Total received " + r;
       return fulfill(i);
     }); });
     m.endComputation();

    },
   stakingInfoString: function() {
     var i =  "Your weight is " + RemoteWallet.stakingWeight + " \n" +
            "Network weight is " + RemoteWallet.stakingNetstakeweight + " \n" + 
            "Expected time to earn reward is " + RemoteWallet.stakingExpectedtime + " ";
      return i;
    }
};


/*
 * Searches `transactions` for any local addresses that were not already known,
 *   and adds them to the list of local addresses.
 */
function checkForMissingAddresses(transactions) {
    var unknownAddresses = [],
        knownPersonalAddresses = _.pluck(LocalWallet.personalContacts, 'address'),
        knownPublicAddresses = _.pluck(LocalWallet.publicContacts, 'address');

    transactions.forEach(function (transaction) {
        var address = transaction.address;

        if (transaction.category == 'send') {
            if (!_.contains(knownPublicAddresses, address) && !_.contains(unknownAddresses, address))
                unknownAddresses.push(address);
        }
        else {
            if (!_.contains(knownPersonalAddresses, address) && !_.contains(unknownAddresses, address))
                unknownAddresses.push(address);
        }
    });

}


/*
 * Filters out any change transactions from the transaction log.
 *
 * These would usually be hidden, but aren't due to the use of the raw transaction API methods.
 */
function filterChangeTransactions(transactions) {
    var personalAddresses = _.pluck(LocalWallet.personalContacts, 'address');

    var changeReceivedTransactions = [];

    // Filter out the 'send' side of the change transactions.
    transactions = transactions.filter(function (transaction_1) {
        //if (transaction_1.category == 'send__' || transaction_1.category == 'receive__')
        if (transaction_1.category == 'send__')
        {
          transaction_1.category = 'send';
          transaction_1.amount = transaction_1.fee;
        }

        if (transaction_1.category == 'receive__')
          return false;

        // First we look for a 'send' transaction to one of our own addresses.
        if (transaction_1.category != 'send' || !_.contains(personalAddresses, transaction_1.address))
            return true;

        // OK, this might be a change transaction.
        // Next, find the corresponding 'receive' transaction for the same amount to the same address.
        var transaction_2 = _.find(transactions, function (transaction_2) {
            return (transaction_2.category == 'receive'
                && transaction_2.address === transaction_1.address
                && Math.abs(transaction_2.amount + transaction_1.amount) < 1e-8);
        });

        // If there's no corresponding 'receive' transaction, this isn't a change transaction.
        if (transaction_2 === undefined)
            return true;

        changeReceivedTransactions.push(transaction_2);
        return false;
    });

    // Then, filter out the 'receive' side of the same transactions.
    return transactions.filter(function (transaction) {
        return !_.contains(changeReceivedTransactions, transaction);
    });
}

var u__ = {n:0};

function updateModel() {
    return new Promise(function (fulfill, reject) {
        var client = RemoteWallet.client;

        if (!client) {
            return reject(Error("RemoteWallet.client is not set."));
        }

        console.log("updateModel 0");
        m.sync([
            client.getInfo(),                   // 0
            client.listTransactions('*', 10),   // 1
            client.getBlockCount(),             // 2
            client.getNumBlocksOfPeers(),       // 3
            client.walletLockStatus(),          // 4
            client.getStakingInfo(),            // 5
            client.rsaFriends(),                // 6 
            client.myRSAKeys()                  // 7 
            //XXXX client.ydwiWhldw_base_diff() // 8 
        ]).then(function (results) {
        console.log("updateModel 1");
            var model = RemoteWallet;

            var transactions = filterChangeTransactions(results[1]),
                newTransactions = 0;

        console.log("updateModel 2");
            if ('newTransactions' in model) {
                newTransactions = model.newTransactions + (transactions.length - model.transactions.length);
            }

            // Flip them so the most recent transaction is first, and the oldest last.
            transactions.reverse();

            // Look through the transactions for any unknown addresses that belong to this wallet.
            checkForMissingAddresses(transactions);

            var n=-1;
            var newInvitations=-1;
            if('rsafriends' in model)
            {
            n=0;
            model.rsafriends.map(function(e) {
            if(e.status === "imported" && e.confirmed === "false")
            n = n + 1; 
            });
              
            if ('newInvitations' in model) {
            newInvitations = model.newInvitations + n - model.invitations; 
            }
            }

            m.startComputation();
            model.id = u__.n;
            u__.n++;
            model.isLocked = results[4].isLocked;
            model.isEncrypted = results[4].isEncrypted;
            console.log("  model.isLocked " + model.isLocked);
            console.log("  results[8] " + results[8]);

            model.availableFunds = results[0].balance;
            model.pendingFunds = results[0].pending;
            model.stakedFunds = results[0].stake;
            model.version = results[0].walletversion;
            model.transactions = transactions;
            model.newTransactions = newTransactions;
            if(n != -1)
              model.invitations = n;

            if(newInvitations != -1)
              model.newInvitations = newInvitations;

            model.currentBlock = results[2];
            model.highestBlock = Math.max(results[2], results[3]);
            model.syncProgressPercent = Math.min(100, Math.floor(model.currentBlock / model.highestBlock * 100));
            model.syncing = model.syncProgressPercent < 100;
            model.connections = results[0].connections;


            model.stakeAmount = results[0].stake;
            model.testnet = results[0].testnet;
            model.isStaking = results[5].staking;
            model.stakingEnabled = results[5].enabled;
            model.stakingErrors = results[5].errors;
            model.stakingCurrentblocksize = results[5].currentblocksize;
            model.stakingCurrentblocktx = results[5].currentblocktx;
            model.stakingPooledtx = results[5].pooledtx;
            model.stakingDifficulty = results[5].difficulty;
            //model.stakingSearch_interval = results[6].search-interval;
            model.stakingWeight= results[5].weight;
            model.stakingNetstakeweight= results[5].netstakeweight;
            model.stakingExpectedtime= results[5].expectedtime;

            model.rsafriends = results[6];
            //XXXX model.waddr = results[8];
            //XXXX if(LocalWallet.changeAddress == null)
            //XXXX { 
            //XXXX   var r = results[8];
            //XXXX   for(var i=0; i<r.length; i++)
            //XXXX   {
            //XXXX     var e = r[i];
            //XXXX     for(o in e)
            //XXXX     {
            //XXXX       LocalWallet.addContact('personal', e[o], o);
            //XXXX     }
            //XXXX   }
            //XXXX }

            //XXXX assert(LocalWallet.changeAddress != null);

            model.myrsakeys = results[7];
            m.endComputation();

            fulfill();

        }, function (errors) {
            // ECONNREFUSED just means it's not connected yet,
            //   so if all the errors are that, just return.
            if (_.every(errors, function (e) { return e.code == 'ECONNREFUSED'; }))
                return;

            // Otherwise, select the first error that *isn't* ECONNREFUSED.
            var error = _.find(errors, function (e) { return e.code != 'ECONNREFUSED'; });
            reject(error);
        });
    });
}

function getDaemonCredentials(walletPath) {
    var rpc_username, rpc_password, rpc_port,
        config_file_path = path.join(walletPath, 'iocoin.conf');

    // Read the contents of the config file.
    var config_data = fs.readFileSync(config_file_path).toString('ascii'),
    // Remove Windows newlines and split the lines in the config up.
        config_lines = config_data.replace('\r', '').split('\n'),
        config_options = {},
        config_regex = /(.+)=(.+)/;

    // Parse each line.
    config_lines.map(function (line) {
        var match = config_regex.exec(line),
            key = null,
            value = null;

        if (match) {
            key = match[1];
            value = match[2];
        }

        if (key && value) {
            config_options[key] = value;
        }
    });

    if (config_options['rpcuser'] && config_options['rpcpassword']) {
        rpc_username = config_options['rpcuser'];
        rpc_password = config_options['rpcpassword'];
        rpc_port = config_options['rpcport'] || 33765;  // Use the default port if it's not in the config.

        return {
            username: rpc_username,
            password: rpc_password,
            port: rpc_port
        };
    }
}


RemoteWallet.initialize = function (walletPath) {
    console.log("RemoteWallet.initialise 1");
    return new Promise(function (fulfill, reject) {
        //ipc.on('spawn-daemon', function (error) {
        ipc.on('spawn-daemon', function (event, arg) {
    console.log("RemoteWallet.initialise 2");

            try {
                var credentials = getDaemonCredentials(walletPath);
            }
            catch (error) {
                return reject(error);
            }
    console.log("RemoteWallet.initialise 3");

            RemoteWallet.walletPath = walletPath;

            console.log("init create client");
            RemoteWallet.client = new RPC_Client({
                host: 'localhost',
                port: credentials.port,
                user: credentials.username,
                pass: credentials.password,
                timeout: 30000
            });
            console.log("init create client 2");

            // Check if the wallet is connected every 0.5 seconds.
            var cancel = setInterval(function () {
                updateModel().then(function () {
                    // Yay, it's connected now.
                    // Stop checking every 0.5 seconds.
                    clearInterval(cancel);

                    // Start updating it every 2 seconds.
                    setInterval(updateModel, 4000);

                    fulfill();

                }, reject);
            }, 5000);
        });

    console.log("RemoteWallet.initialise 4");
        ipc.send('spawn-daemon', walletPath);
    });
};


module.exports = RemoteWallet;
