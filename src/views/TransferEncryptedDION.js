// Electron/Node modules
var assert = require('assert');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var LocalWallet = require('../models/LocalWallet'),
    RemoteWallet = require('../models/RemoteWallet'),
    AppViewModel = require('../models/AppViewModel'),
    LightboxModel = require('../models/LightboxModel');

// Views
var icons = require('./icons'),
    MyWallet = require('./MyWallet'),
    Overview = require('./Overview');

var s = "0";
var SendViewModel = {
    recipients: [],
    fees: 0,
    set: false,
    defaultAddress: "",

    init: function () {
        SendViewModel.recipients = [];
        SendViewModel.fees = 0;
        SendViewModel.set = false;
        RemoteWallet.client.getNewAddress().then(function(a) 
           { 
             //console.log(" a " + a);
             //console.log(" defaultAddress " + SendViewModel.defaultAddress);
             SendViewModel.defaultAddress = a;
           });

    },

    recipientsTotal: function () {
        return SendViewModel.recipients.reduce(function (prev, recipient) {
            return recipient.amount + prev;
        }, 0);
    },

    total: function () {
      if(SendViewModel.set == true)
        return SendViewModel.fees;

      RemoteWallet.client.primaryCXValidate(Send.args.alias, Send.args.address, SendViewModel.recipients[0].name).then(function(result) 
      { 
        console.log(result.status); console.log(result.fee); 
        SendViewModel.fees = result.fee; 
        SendViewModel.set = true; 
        if(result.status === "error")
        {
          state.error = "true";
          return window.alert("Error : " + result.message);
        }
        state.error = "false";
         }
        );
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
      RemoteWallet.client.transferEncryptedName(Send.args.alias, Send.args.address, SendViewModel.recipients[0].name);
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
                {tag: "a", attrs: {class:"tooltip tooltip-n", "aria-label":"Clear", 
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
                ]}, 
                {tag: "div", attrs: {class:""}, children: [
                    {tag: "input", attrs: {type:"text", readonly:true}
                        }
                ]}
            ]}
        );
    }
};

var RecipientList = {
    controller: function () {

        this.addingRecipient = m.prop(false);
        this.rComplete = m.prop(false);

        this.addRecipient = function (ctrl) {
            if (this.addingRecipient()) {
                document.getElementById('send-new-address-input').focus();
            }
            this.addingRecipient(true);
        }.bind(this);

        this.test = function(event) {
          //console.log(">>> test");
        }.bind(this);

        this.enterRecipient = function (ctrl, event) {
          //console.log("enterRecipient");

            if(event.target.value === '' && event.which == 13)
              event.target.value = event.target.placeholder;
            if (event.which != 13) {
                return;
            }

            var inputData = event.target.value;
            //console.log("inputData " + inputData);
        RemoteWallet.client.validateLocator(inputData).then(function (result) {
            if (!result.isvalid) {
                return window.alert('That address or alias is not valid.');
            }

            if (!result.k__status) {
                return window.alert('Error : alias or address has no public key.');
            }

            if (!result.ismine) {
                window.alert('Warning : that address or alias is not yours. The alias will be transfered to another wallet');
            }
            var address, name;
                if(SendViewModel.recipients.length == 0)
                {
                  SendViewModel.recipients.unshift({
                      name: inputData
                  });
                }

            ctrl.addingRecipient(false);
        });
        }.bind(this);

        this.cancelAddRecipient = function (event) {
            //console.log(">>> cancel");
            this.addingRecipient(false);
            this.rComplete(false);
            //event.target.value = '';
        }.bind(this);
    },

    view: function (ctrl) {
        return (
            {tag: "div", attrs: {class:"dest"}, children: [
                SendViewModel.recipients.length > 0 ? [
                {tag: "a", attrs: {class:"btn btn--white btn--hicon btn--nostretch"}, children: [
                    icons.maximize(), 
                    {tag: "span", attrs: {}, children: [" "]}]}
                 ] : [
                {tag: "a", attrs: {class:"btn btn--blue btn--hicon btn--nostretch", onclick:ctrl.addRecipient}, children: [
                    icons.maximize(), 
                    {tag: "span", attrs: {}, children: ["Enter address"]}
                ]} ], 

                ctrl.addingRecipient() ? [
                    {tag: "div", attrs: {class:"dest__entry--empty"}, children: [
                        {tag: "div", attrs: {class:"dest__details"}, children: [
                            {tag: "input", attrs: {type:"text", 
                                   id:"send-new-address-input", 
                                   placeholder:SendViewModel.defaultAddress, 
                                   config:utils.autofocus, 
                                   onkeypress:ctrl.enterRecipient.bind(ctrl, ctrl)}}
                        ]}
                    ]}
                ] : null, 

                SendViewModel.recipients.length > 0 ? [
                    m.component(RecipientListItem, {key:(SendViewModel.recipients[0]).address, recipient:SendViewModel.recipients[0]}) ] : null
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
        this.cancel = function () {
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


                {tag: "div", attrs: {class:"send__row"}
                }, 

                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__confirmation"}, children: [
                        {tag: "div", attrs: {class:"checkbox--default"}, children: [
                            {tag: "input", attrs: {type:"checkbox", id:"check1", name:"check", onchange:m.withAttr('checked', ctrl.ready)}}, 
                            {tag: "label", attrs: {for:"check1"}}
                        ]}, 
                        {tag: "label", attrs: {for:"check1"}, children: [
                            {tag: "span", attrs: {}, children: ["You sure ? If the address you entered is not your own, this dion will be sent to someone else."]}
                        ]}
                    ]}, 
                    {tag: "a", attrs: {}, children: [
                        {tag: "span", attrs: {}}
                    ]}, 
                    {tag: "a", attrs: {}, children: [
                        {tag: "span", attrs: {}}
                    ]}, 
                    {tag: "a", attrs: {}, children: [
                        {tag: "span", attrs: {}}
                    ]}, 
                    {tag: "a", attrs: {}, children: [
                        {tag: "span", attrs: {}}
                    ]}, 
                    {tag: "a", attrs: {}, children: [
                        {tag: "span", attrs: {}}
                    ]}, 
                    {tag: "a", attrs: {class:"btn btn--red", onclick:ctrl.cancel}, children: [
                        {tag: "span", attrs: {}, children: ["Cancel"]}
                    ]}, 
                    ctrl.ready() ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", onclick:ctrl.sendTransaction}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Encrypted Transfer"]}
                    ]}
                     ] :
                     [
                    {tag: "a", attrs: {class:"btn btn--grey "}, children: [
                        {tag: "span", attrs: {}, children: ["Encrypted Transfer"]}
                    ]}
                     ]
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
                {tag: "h1", attrs: {}, children: ["Transfer encrypted DION ", Send.args.alias]}, 

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
