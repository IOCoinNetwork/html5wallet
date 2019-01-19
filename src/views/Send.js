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
        console.log("XXXX c1");
        var paymentTotal = SendViewModel.recipientsTotal();

        var outputs = {};
        SendViewModel.recipients.forEach(function (recipient) {
            if(int__(recipient.amount)/d__ == 0) return;

            outputs[recipient.address] = int__(recipient.amount)/d__;
        });

        assert(
            LocalWallet.changeAddress !== null,
            'Should have a change address at this point'
        );

        SendViewModel.recipients.map(function(r) { 
          if(r.address === LocalWallet.changeAddress)
            return window.alert("Cannot send to change address");
        });

        var t0 = 0;
        for(var o in outputs)
        {
          var v = parseFloat(outputs[o]);
          console.log("XXXX k " + o);
          console.log("XXXX o " + v);
          t0 += v;
        }


        console.log("XXXX paymentTotal " + paymentTotal);
        console.log("XXXX t0 " + t0);
        if(paymentTotal - t0 > 0.999)
        {
          console.log("XXXX fee " + (paymentTotal - t0));
          window.alert("UI fee limit exceeed, rejecting transaction");
          return;
        }

        return new Promise(function (fulfill, reject) {
          RemoteWallet.client.crawgen(paymentTotal, outputs, LocalWallet.changeAddress).catch(function(e) {
            window.alert(e.message);
          }).then(function(r) { 
              console.log("XXXX hex " + r.hex);
              console.log("XXXX fee " + r.fee);
              SendViewModel.fees = r.fee ;
              return r;
          }).then(function(r) 
                  { 
                    console.log("XXXX f");
                    fulfill(r); 
                  });
          });
        },

    recomputeFees: function () {
        if (int__(SendViewModel.recipientsTotal()) + int__(SendViewModel.fees) > int__(RemoteWallet.availableFunds)) 
        {
          SendViewModel.fees = 0.001;
          window.alert("Insufficient funds");
        }

        SendViewModel.createRawTransaction().then(function (rawTransaction) {
        }).catch(function (error) {
            // TODO: Give warning when there isn't enough funds
            window.alert(error.message);
            return error;
        });
    },

    sendTransaction: function () {
                  console.log("XXXX sendTransaction" );
        return new Promise(function (fulfill, reject) {
            RemoteWallet.unlockWallet({stayUnlocked: false, stakingOnly: false}).
 then(function() {}).
                then(
                  SendViewModel.createRawTransaction
                ).
                then(function(r) {
                  console.log("XXXX SEND r.hex " + r.hex);
                  console.log("XXXX SEND r.fee " + r.fee);
                  return RemoteWallet.client.signRawTransaction(r.hex);
                }).
                then(function (signedRawTransaction) {
                    console.log("XXXX signed " + signedRawTransaction);
                    return RemoteWallet.client.sendRawTransaction(signedRawTransaction.hex);
    
                }).then(function () { console.log("XXXX sent"); AppViewModel.subview(Overview); }).
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
                ]}, 
                {tag: "div", attrs: {class:"send__amount"}, children: [
                    {tag: "input", attrs: {type:"text", 
                           config:utils.autofocus, 
                           onkeyup:m.withAttr('value', ctrl.changeAmount.bind(ctrl, recipient))}
                        }
                ]}
            ]}
        );
    }
};


var RecipientList = {
    controller: function () {
        this.addingRecipient = m.prop(false);

        this.addRecipient = function () {
            if (this.addingRecipient()) {
                document.getElementById('send-new-address-input').focus();
            }
            this.addingRecipient(true);
        }.bind(this);

        this.enterRecipient = function (event) {
            if (event.which != 13 || event.target.value === '') {
                return;
            }

            var inputData = event.target.value;
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
            {tag: "div", attrs: {class:"dest"}, children: [
                {tag: "a", attrs: {class:"btn btn--blue btn--hicon btn--nostretch", onclick:ctrl.addRecipient}, children: [
                    icons.maximize(), 
                    {tag: "span", attrs: {}, children: ["Add Recipient"]}
                ]}, 

                ctrl.addingRecipient() ? [
                    {tag: "div", attrs: {class:"dest__entry--empty"}, children: [
                        {tag: "a", attrs: {class:"tooltip tooltip-n", "aria-label":"Remove", onclick:ctrl.cancelAddRecipient}, children: [
                            icons.close()
                        ]}, 
                        {tag: "div", attrs: {class:"dest__details"}, children: [
                            {tag: "input", attrs: {type:"text", 
                                   id:"send-new-address-input", 
                                   placeholder:"Destination address or DIONS alias", 
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

            console.log("XXXX this.ready " + this.ready);
            
            if (!this.ready()) {
                return;
            }
            
            console.log("XXXX this.ready XXXX ");
            this.sent(true);
            SendViewModel.sendTransaction().then(function () {
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
            {tag: "div", attrs: {class:"send__dialogue"}, children: [
                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["Network fees"]}
                    ]}, 
                    {tag: "div", attrs: {class:"send__fee--amount"}, children: [
                        {tag: "span", attrs: {}, children: [SendViewModel.fees]}
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
                    ]} 
                    ] : [ 
                    {tag: "a", attrs: {class:"btn "}, children: [
                        {tag: "span", attrs: {}}
                    ]} 
                    ], 
                    ctrl.ready() ? [
                {tag: "div", attrs: {}, children: [ctrl.sent() == false ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", onclick:ctrl.sendTransaction}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Send I/O Coins"]}
                    ]} 
                     ] : [ 
                    {tag: "a", attrs: {class:"btn "}, children: [
                        {tag: "span", attrs: {}}
                    ]} 
                      ]]}
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


var Send = module.exports;

Send.controller = function () {
    SendViewModel.init();

   if(LocalWallet.changeAddress == null)
   {
     RemoteWallet.client.ydwiWhldw_base_diff().then(function(r) {
      for(var i=0; i<r.length; i++)
      {
        var e = r[i];
        for(o in e)
        {
          LocalWallet.addContact('personal', e[o], o);
        }
      }
     });
   }
};

Send.view = function () {
    var balanceParts = RemoteWallet.availableFunds.toString().split('.'),
        balanceWhole = balanceParts[0],
        balanceDecimal = balanceParts[1];

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["Send I/O Coins"]}, 

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
