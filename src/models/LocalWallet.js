// Electron/Node modules
var path = require('path');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
	    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    storage = require('node-persist'),
    Promise = require('promise');

// Models
var ContactListViewModel = require('./ContactListViewModel');

// Views


var LocalWallet = {
    /*
    publicContacts: [],
    personalContacts: [],

    changeAddress: null,
    feePerKB: 0.001,

    transactionViewModes: {overview: 'table', history: 'table', addressBook: 'table'}
     */

    save: function () {
        try {
            [
                'avatarFile'
            ].forEach(function (key) {
                storage.setItemSync(key, LocalWallet[key]);
            });
        }
        catch (error) {
            alert('Failed to save data: ' + error.message);
        }
    },

    f1: function(p) 
    {

    },
    addContact: function (type, address, alias) {
        if (typeof alias != 'string' && typeof alias != 'undefined') {
            throw Error('alias should be a string (if supplied)');
        }
        if (typeof address != 'string') {
            throw Error('address should be a string');
        }
        if (!LocalWallet.save) {
            throw Error('Tried to call addContact before initialize');
        }

        var destination;
        if (type === 'public') {
            destination = LocalWallet.publicContacts;
        }
        else if (type === 'personal') {
            destination = LocalWallet.personalContacts;

            if(alias === "sparechange")
            {
              if(LocalWallet.changeAddress != null)
              {
                console.log("XXXX set change address");
                destination.map(function(e) {
                  console.log("XXXX e.alias " + e.alias);
                  if(e.alias === "sparechange")
                    e.alias = null;
                });
              }
              LocalWallet.changeAddress = address;
            }
        }
        else
            throw Error('Expected type to be "public" or "personal"');

        destination.unshift({
            address: address,
            alias: alias || null
        });

        LocalWallet.save();
    }
};


LocalWallet.initialize = function (walletPath) {
    return new Promise(function (fulfill, reject) {
        try {
    m.startComputation();
    config_file_path = path.join(walletPath, 'iocoin.conf');
    if(!fs.existsSync(config_file_path))
    {
    console.log("creating conf");
    rpc_username = 'iocoinrpc';
    rpc_password = crypto.randomBytes(16).toString('hex');

    var data = ['', 'rpcuser=' + rpc_username, 
                'rpcpassword=' + rpc_password,
                'addnode=amer.supernode.iocoin.io',
                'addnode=emea.supernode.iocoin.io',
                'addnode=apac.supernode.iocoin.io'].join('\n');
    var config_file = fs.openSync(config_file_path, 'a');
    fs.writeSync(config_file, data);
    fs.closeSync(config_file);
    }
    m.endComputation();
            storage.initSync({
                dir: path.join(walletPath, 'html5wallet_data')
            });
        }
        catch (error) {
            reject(error);
        }

        LocalWallet.publicContacts = [];
        LocalWallet.personalContacts = [];

        LocalWallet.changeAddress = null;
        LocalWallet.feePerKB = 0.001;

        LocalWallet.transactionViewModes = 
            {overview: 'table', history: 'table', addressBook: 'table'};

        // If a change address isn't set, just use the first personal address (if one exists).
        if (LocalWallet.changeAddress == null && LocalWallet.personalContacts.length > 0) {
            LocalWallet.changeAddress = LocalWallet.personalContacts[0].address;
        }

        LocalWallet.avatarFile = storage.getItemSync('avatarFile') || 'views/temp_assets/avatar.jpg'

        ContactListViewModel.init(LocalWallet.publicContacts);
        fulfill();
    });
};


module.exports = LocalWallet;
