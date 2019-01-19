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
    LightboxModel = require('../models/LightboxModel'),
    AppViewModel = require('../models/AppViewModel');

// Views
var icons = require('./icons'),
    MyWallet = require('./MyWallet'),
    Overview = require('./Overview');

var d__ = 100000000;
var int__ = function(f) {
  return Math.round(f*d__);
};

var SendViewModel = {
    recipients: [],
    fees: 0.001,

    init: function () {
        SendViewModel.recipients = [];
        SendViewModel.fees = 0.001;
    },

    recipientsTotal: function () {
        return SendViewModel.recipients.reduce(function (prev, recipient) {
            return (int__(recipient.amount) + int__(prev))/d__;
        }, 0);
    },

    total: function () {
        if (SendViewModel.recipients.length == 0) {
            return SendViewModel.fees;
        }
        var r = SendViewModel.recipientsTotal();
        var f = SendViewModel.fees;
        r = int__(r);
        f = int__(f);
        var t = r + f;
        return  t / d__;
    },

    createRawTransaction: function () {
        console.log("XXXX SendViewModel::createRawTransaction 1");
        var paymentTotal = SendViewModel.recipientsTotal();

        return new Promise(function (fulfill, reject) {
            var recip = SendViewModel.recipients[0];
            RemoteWallet.client.shadesend(recip.address, recip.amount).catch(function(e) {
              window.alert(e.message);
            }).then(function(r) { 
        console.log("XXXX SendViewModel::createRawTransaction 2");
        console.log("XXXX target " + r.target);
        console.log("XXXX trace " + r.trace);
              //XXXX SendViewModel.fees = 0.001 ;
              fulfill(r);
            });
          });
        console.log("XXXX SendViewModel::createRawTransaction 3");
        },

    recomputeFees: function () {
        if (int__(SendViewModel.recipientsTotal()) + int__(SendViewModel.fees) > int__(RemoteWallet.availableFunds)) 
        {
          SendViewModel.fees = 0.001;
          window.alert("Insufficient funds");
        }
    },

    sendTransaction: function () {
                  console.log("XXXX SendViewModel::sendTransaction" );
        return new Promise(function (fulfill, reject) {
            RemoteWallet.unlockWallet({stayUnlocked: false, stakingOnly: false}).
 then(function() {}).
                then(
                  SendViewModel.createRawTransaction
                ).
                then(function () { console.log("XXXX sent"); AppViewModel.subview(Overview); }).
                then(fullfill, reject);
        });
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

        return ( {tag: "div", attrs: {}, children: [
            {tag: "div", attrs: {class:"tgt__entry"}, children: [
                {tag: "div", attrs: {class:"tgt__details"}, children: [
                    recipient.name != null ? [
                        {tag: "div", attrs: {class:"tgt__name"}, children: [recipient.name]},
                        {tag: "div", attrs: {class:"tgt__address"}, children: [recipient.address]}
                    ]:[
                        {tag: "div", attrs: {class:"tgt__name"}, children: [recipient.address]}
                    ]
                ]}
                ]}, 
            {tag: "div", attrs: {class:"tgt__entry__amount"}, children: [
                {tag: "div", attrs: {class:"shade__amount"}, children: [
                    {tag: "input", attrs: {type:"text", 
                           config:utils.autofocus, 
                           onkeyup:m.withAttr('value', ctrl.changeAmount.bind(ctrl, recipient))}
                        }
                ]}
            ]}, " "]}
        );
    }
};


var RecipientList = {
    controller: function () {
        this.addingRecipient = m.prop(false);

        this.addRecipient = function () {
            if (this.addingRecipient()) {
                document.getElementById('shade-new-address-input').focus();
            }
            this.addingRecipient(true);
        }.bind(this);

        this.enterRecipient = function (event) {
            if (event.which != 13 || event.target.value === '') {
                return;
            }

            var inputData = event.target.value;
            console.log("XXXX inputData " + inputData);
        RemoteWallet.client.subY(inputData).then(function (result) {
            if (!result.stat) {
                return window.alert('That shade address is not valid.');
            }
        });
            
            var address, name;

            var contact = _.find(LocalWallet.publicContacts, function (contact) {
                return contact.alias === inputData;
            });

            if (contact !== undefined) {
                address = contact.address;
                name = contact.alias;
            }
            else {
                address = inputData;

                name = (function () {
                    var contact = _.find(LocalWallet.publicContacts, function (contact) {
                        return contact.address === address;
                    });
                    return contact !== undefined
                        ? contact.alias
                        : null;
                })();
            }

            var alreadyAdded = _.find(SendViewModel.recipients, function (recipient) {
                return recipient.address === address;
            }) !== undefined;

            if (!alreadyAdded) {
                SendViewModel.recipients.unshift({
                    name: name,
                    address: address,
                    amount: 0
                });
            }

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
            {tag: "div", attrs: {class:"tgt"}, children: [
                    {tag: "h2", attrs: {}, children: ["Enter Shade (Stealth) address"]}, 

                SendViewModel.recipients.length == 0 ? [
                    {tag: "div", attrs: {class:"tgt__entry--empty"}, children: [
                        {tag: "div", attrs: {class:"tgt__details"}, children: [
                            {tag: "input", attrs: {type:"text", 
                                   id:"shade-new-address-input", 
                                   placeholder:"Shade (IOC Stealth) address", 
                                   config:utils.autofocus, 
                                   onkeypress:ctrl.enterRecipient}}
                        ]}
                    ]}
                ] : null, 

                SendViewModel.recipients.map(function (recipient) {
                    return m.component(RecipientListItem, {key:recipient.address, recipient:recipient});
                })
            ]}
        );
    }
};


var SendDialogue = {
    controller: function () {
        this.ready = m.prop(false);
        this.sent = m.prop(false);

        this.cancel = function () {
                m.startComputation();
                AppViewModel.subview(Overview);
                m.endComputation();
            }.bind(this);
        this.sendTransaction = function () {

            console.log("XXXX SendDialog::sendTransaction");
            console.log("XXXX this.ready " + this.ready);

            if (!this.ready()) {
                return;
            }
            console.log("XXXX this.ready XXXX ");

            this.sent(true);
            SendViewModel.sendTransaction().then(function () {
            console.log("XXXX returned to SendDialog::sendTransaction");
                m.startComputation();
                AppViewModel.subview(Overview);
                m.endComputation();

            }).catch(function (error) {
                //console.log('Failed to send transaction.');
                //console.dir(error);

            }.bind(this));
        }.bind(this);
    },

    view: function (ctrl) {
        return (
            {tag: "div", attrs: {class:"shade__dialogue"}, children: [
                {tag: "div", attrs: {class:"shade__row"}, children: [
                    {tag: "div", attrs: {class:"shade__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["Network fees"]}
                    ]}, 
                    {tag: "div", attrs: {class:"shade__fee--amount"}, children: [
                        {tag: "span", attrs: {}, children: [SendViewModel.fees]}
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"shade__row"}, children: [
                    {tag: "div", attrs: {class:"shade__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["Total"]}
                    ]}, 
                    {tag: "div", attrs: {class:"shade__fee--amount"}, children: [
                        {tag: "span", attrs: {}, children: [SendViewModel.total()]}
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"shade__row"}, children: [
                    {tag: "div", attrs: {class:"shade__confirmation"}, children: [
                        {tag: "div", attrs: {class:"checkbox--default"}, children: [
                            {tag: "input", attrs: {type:"checkbox", id:"check1", name:"check", onchange:m.withAttr('checked', ctrl.ready)}}, 
                            {tag: "label", attrs: {for:"check1"}}
                        ]}, 
                        {tag: "label", attrs: {for:"check1"}, children: [
                            {tag: "span", attrs: {}, children: ["Everything looks good"]}
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
                ctrl.sent() == false ? [
                    {tag: "a", attrs: {class:"btn btn--red", onclick:ctrl.cancel}, children: [
                        {tag: "span", attrs: {}, children: ["Cancel"]}
                    ]} ] : [
                    {tag: "a", attrs: {class:"btn"}, children: [
                        {tag: "span", attrs: {}}
                    ]} ], 
               
                    ctrl.ready() ? [ 
  {tag: "div", attrs: {}, children: [ ctrl.sent() == false ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", onclick:ctrl.sendTransaction}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Send I/O Coins"]}
                    ]} ] : [ 
                    {tag: "a", attrs: {class:"btn "}, children: [
                        {tag: "span", attrs: {}}
                            ]}]]}
                     ] :
                     [
                    {tag: "a", attrs: {class:"btn btn--grey "}, children: [
                        {tag: "span", attrs: {}, children: ["Send I/O Coins"]}
                    ]}
                     ]

                ]}
            ]}
        );
    }
};


var ShadeSend = module.exports;

ShadeSend.controller = function () {
    SendViewModel.init();
};

ShadeSend.view = function () {
    var balanceParts = RemoteWallet.availableFunds.toString().split('.'),
        balanceWhole = balanceParts[0],
        balanceDecimal = balanceParts[1];

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["Send I/O Coins by Stealth"]}, 

                {tag: "div", attrs: {class:"shade__source__balance"}, children: [
                    {tag: "span", attrs: {}, children: ["Balance"]}, 
                    balanceDecimal !== undefined ? [
                        {tag: "div", attrs: {class:"shade__source__amount"}, children: [
                            balanceWhole, {tag: "span", attrs: {class:"shade__source__amount--decimal"}, children: [".", balanceDecimal]}
                        ]}
                    ]:[
                        {tag: "div", attrs: {class:"shade__source__amount"}, children: [balanceWhole]}
                    ]
                ]}
            ]}, 

            {tag: "section", attrs: {class:"shade"}, children: [
                RecipientList, 

                SendViewModel.recipients.length == 0 ? null : (
                    SendDialogue
                )
            ]}
        ]}
    );
};
