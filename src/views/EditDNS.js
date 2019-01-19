// Electron/Node modules
var assert = require('assert');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    remote = require('remote'),
    path = require('path'),
    fs = require('fs'),
    dialog = remote.require('dialog'),
    utils = require('../utils');

var defaultPathBase = {
    win32: process.env.APPDATA,
    darwin: path.join(process.env.HOME || '', 'Library'),
    linux: process.env.HOME
}[process.platform];
var DEFAULT_PATH = path.join(defaultPathBase, 'IOCoin');
// Models
var LocalWallet = require('../models/LocalWallet'),
    RemoteWallet = require('../models/RemoteWallet'),
    AppViewModel = require('../models/AppViewModel'),
    LightboxModel = require('../models/LightboxModel');

// Views
var icons = require('./icons'),
    MyWallet = require('./MyWallet'),
    Overview = require('./Overview');


var SendViewModel = {
    recipients: [],
    fees: 0,

    init: function () {
        SendViewModel.recipients = [];
        SendViewModel.fees = 0;
    },

    recipientsTotal: function () {
        return SendViewModel.recipients.reduce(function (prev, recipient) {
            return recipient.amount + prev;
        }, 0);
    },

    total: function () {
        return 0.01;
    },

    createRawTransaction: function () {
        var paymentTotal = SendViewModel.recipientsTotal();

        var outputs = {};
        SendViewModel.recipients.forEach(function (recipient) {
            outputs[recipient.address] = recipient.amount;
        });

        var inputs = [],
            inputTotal = 0;

        // Add inputs to the transaction until there's enough to pay coin to pay everyone.
        RemoteWallet.unspentInputs.forEach(function (input) {
            // If there's already enough don't bother adding more.
            if (inputTotal - paymentTotal > -1e-8)
                return;

            inputTotal += input.amount;
            inputs.push({
                txid: input.txid,
                vout: input.vout
            });
        });

        // Not enough to pay everyone, let alone the fees.
        if (inputTotal - paymentTotal < 1e-8) {
            return Promise.reject(new Error("Not enough funds"));
        }

        assert(
            LocalWallet.changeAddress !== null,
            'Should have a change address at this point'
        );

        return new Promise(function (fulfill, reject) {

            RemoteWallet.client.createRawTransaction(inputs, outputs).then(function (rawTransaction) {

                // Add 34 to the length since another output will be added and they are 34 bytes each.
                // http://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending/3011#3011
                var nearestKB = Math.floor((rawTransaction.length + 34) / 1000) + 1;

                var fees = nearestKB * LocalWallet.feePerKB;

                // Add the spare change output.
                outputs[LocalWallet.changeAddress] = inputTotal - paymentTotal - fees;

                return RemoteWallet.client.createRawTransaction(inputs, outputs);

            }).then(fulfill, reject);
        });
    },

    recomputeFees: function () {
        if (SendViewModel.recipientsTotal() > RemoteWallet.availableFunds) {
            SendViewModel.fees = 0;
            // Need to yell at the user for being poor here.
        }

        SendViewModel.createRawTransaction().then(function (rawTransaction) {
            m.startComputation();

            var nearestKB = Math.floor(rawTransaction.length / 1000) + 1;
            SendViewModel.fees = nearestKB * LocalWallet.feePerKB;

            m.endComputation();

        }).catch(function (error) {
            // TODO: Give warning when there isn't enough funds
        });
    },

    sendTransaction: function () {
      //console.log("transferName " + Send.args.name);
      //console.log("transferName " + SendViewModel.recipients[0].name);
      RemoteWallet.client.transferName(Send.args.name, SendViewModel.recipients[0].name);
    }
};


var RecipientListItem = {
    controller: function () {
        this.removeItem = function (address) {
            SendViewModel.recipients = SendViewModel.recipients.filter(function (recipient) {
                return recipient.address != address;
            });
        };

        this.changeAmount = function (recipient, amount) {
            amount = parseFloat(amount);

            if (isNaN(amount)) {
                return;
            }

            recipient.amount = amount;
            SendViewModel.recomputeFees();
        };
    },

    view: function (ctrl, args) {
        var recipient = args.recipient;

        return (
            {tag: "div", attrs: {class:"dest__entry"}, children: [
                {tag: "a", attrs: {class:"tooltip tooltip-n", "aria-label":"Remove Recipient", 
                   onclick:ctrl.removeItem.bind(ctrl, recipient.address)}, children: [
                    icons.close()
                ]}, 
                {tag: "div", attrs: {class:"dest__details"}, children: [
                    recipient.name != null ? [
                        {tag: "div", attrs: {class:"dest__name"}, children: [recipient.name]},
                        {tag: "div", attrs: {class:"dest__address"}, children: [recipient.address]}
                    ]:[
                        {tag: "div", attrs: {class:"dest__name"}, children: [recipient.address]}
                    ]
                ]}
            ]}
        );
    }
};


var RecipientList = {
    controller: function () {
        this.addingRecipient = m.prop(false);

        this.addRecipient = function () {
		dialog.showSaveDialog(remote.getCurrentWindow(), {
		    title: 'Choose wallet directory',
		    defaultPath: DEFAULT_PATH,
		    //properties: ['openDirectory', 'createDirectory']
		    properties: ['saveFile']

		}, 
	function (filePaths) {
		    var walletPath = filePaths ? filePaths[0] : undefined;

                    //console.log(">>> walletPath " + walletPath);

		    if (walletPath === undefined) {
			return;
		    }
      //console.log("save data  " + Send.args.value);
var binaryData  =   new Buffer(Send.args.value, 'base64').toString('binary');

fs.writeFile(walletPath, binaryData, "binary", function (err) {
    //console.log(err); // writes out file without error, but it's not a valid image
});

                    //var i = fs.readFileSync(walletPath); 
                    //  var base64Str = new Buffer(i).toString('base64');
                    //  //console.log(base64Str);
      ////console.log("updateName " + Send.args.name);
                    //RemoteWallet.client.updateName(Send.args.name, base64Str);
                      //var bitmap = fs.readFileSync(file);
                      // convert binary data to base64 encoded string
                      //return new Buffer(bitmap).toString('base64');

		});
        }.bind(this);

        this.enterRecipient = function (event) {
            if (event.which != 13 || event.target.value === '') {
                return;
            }

            var inputData = event.target.value;
        RemoteWallet.client.validateAddress(inputData).then(function (result) {
            if (!result.isvalid) {
                return window.alert('That address is not valid.');
            }

            if (!result.ismine) {
                return window.alert('Warning : that address is not yours.');
            }

            //var contactMatchesAddress = function (contact) {
            //    return contact.address === address;
            //};

            //if (LocalWallet.publicContacts.filter(contactMatchesAddress).length > 0) {
            //    return window.alert('Your contacts already contains that address.');
            //}

            //m.startComputation();

            //LocalWallet.addContact('public', address, name);

            //self.addContactMode(false);

            //ContactListViewModel.selectedAddress(address);

            //m.endComputation();
        });
            var address, name;


                SendViewModel.recipients.unshift({
                    name: inputData
                });

            event.target.value = '';
            this.addingRecipient(false);
        }.bind(this);

        this.cancelAddRecipient = function (event) {
            this.addingRecipient(false);
            event.target.value = '';
        }.bind(this);
    },

    view: function (ctrl) {
        return (
            {tag: "div", attrs: {}, children: [
                {tag: "div", attrs: {class:"entry__left"}, children: [
                    
                            {tag: "div", attrs: {}, children: [Send.args.encrypted == "true" ? [ {tag: "div", attrs: {class:"entry__cap--encrypted"}} ] : [ {tag: "div", attrs: {class:"entry__cap"}} ]]},
                        {tag: "div", attrs: {class:"entry__details"}, children: [
                            {tag: "div", attrs: {class:"entry__address"}, children: [Send.args.value]}
                        ]},
                {tag: "div", attrs: {class:"entry__right"}, children: [
                {tag: "a", attrs: {href:"#", class:"btn btn--outline"
                   }, children: [
                    "Edit"
                ]}
                ]}
                    
                ]}

            ]}
        );
    }
};


var SendDialogue = {
    controller: function () {
        this.ready = m.prop(false);

        this.sendTransaction = function () {
            if (!this.ready()) {
                return;
            }

            SendViewModel.sendTransaction();

                m.startComputation();
                AppViewModel.subview(Overview);
                m.endComputation();

            }.bind(this);
    },

    view: function (ctrl) {
        return (
            {tag: "div", attrs: {class:"send__dialogue"}, children: [
                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["Network fees"]}
                    ]}, 
                    {tag: "div", attrs: {class:"send__fee--amount"}, children: [
                        {tag: "span", attrs: {}, children: [SendViewModel.total()]}
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["Total"]}
                    ]}, 
                    {tag: "div", attrs: {class:"send__fee--amount"}, children: [
                        {tag: "span", attrs: {}, children: [SendViewModel.total()]}
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__confirmation"}, children: [
                        {tag: "div", attrs: {class:"checkbox--default"}, children: [
                            {tag: "input", attrs: {type:"checkbox", id:"check1", name:"check", onchange:m.withAttr('checked', ctrl.ready)}}, 
                            {tag: "label", attrs: {for:"check1"}}
                        ]}, 
                        {tag: "label", attrs: {for:"check1"}, children: [
                            {tag: "span", attrs: {}, children: ["Are you sure ? If the address you entered is not your own, this dion will be sent to someone else."]}
                        ]}
                    ]}, 

                    {tag: "a", attrs: {class:"btn btn--red btn--hicon", onclick:ctrl.sendTransaction}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Transfer"]}
                    ]}
                ]}
            ]}
        );
    }
};


var Send = module.exports;

Send.controller = function () {
    SendViewModel.init();
};

Send.view = function () {
    var balanceParts = RemoteWallet.availableFunds.toString().split('.'),
        balanceWhole = balanceParts[0],
        balanceDecimal = balanceParts[1];

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["DNS configuration for ", Send.args.name]}, 

                {tag: "div", attrs: {class:"send__source__balance"}, children: [
                    {tag: "span", attrs: {}, children: ["Balance"]}, 
                    balanceDecimal !== undefined ? [
                        {tag: "div", attrs: {class:"send__source__amount"}, children: [
                            balanceWhole, {tag: "span", attrs: {class:"send__source__amount--decimal"}, children: [".", balanceDecimal]}
                        ]}
                    ]:[
                        {tag: "div", attrs: {class:"send__source__amount"}, children: [balanceWhole]}
                    ]
                ]}
            ]}, 

            {tag: "section", attrs: {class:"send"}, children: [
                RecipientList, 

                SendViewModel.recipients.length == 0 ? null : (
                    SendDialogue
                )
            ]}
        ]}
    );
};
