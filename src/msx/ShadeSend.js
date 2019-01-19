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

        return ( <div>
            <div class="tgt__entry">
                <div class="tgt__details">
                    {recipient.name != null ? [
                        <div class="tgt__name">{recipient.name}</div>,
                        <div class="tgt__address">{recipient.address}</div>
                    ]:[
                        <div class="tgt__name">{recipient.address}</div>
                    ]}
                </div>
                </div>
            <div class="tgt__entry__amount">
                <div class="shade__amount">
                    <input type="text"
                           config={utils.autofocus}
                           onkeyup={m.withAttr('value', ctrl.changeAmount.bind(ctrl, recipient))}
                        />
                </div>
            </div> </div>
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
            <div class="tgt">
                    <h2>Enter Shade (Stealth) address</h2>

                {SendViewModel.recipients.length == 0 ? [
                    <div class="tgt__entry--empty">
                        <div class="tgt__details">
                            <input type="text"
                                   id="shade-new-address-input"
                                   placeholder="Shade (IOC Stealth) address"
                                   config={utils.autofocus}
                                   onkeypress={ctrl.enterRecipient}/>
                        </div>
                    </div>
                ] : null}

                {SendViewModel.recipients.map(function (recipient) {
                    return <RecipientListItem key={recipient.address} recipient={recipient}/>;
                })}
            </div>
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
            <div class="shade__dialogue">
                <div class="shade__row">
                    <div class="shade__fee--details">
                        <span>Network fees</span>
                    </div>
                    <div class="shade__fee--amount">
                        <span>{SendViewModel.fees}</span>
                    </div>
                </div>

                <div class="shade__row">
                    <div class="shade__fee--details">
                        <span>Total</span>
                    </div>
                    <div class="shade__fee--amount">
                        <span>{SendViewModel.total()}</span>
                    </div>
                </div>

                <div class="shade__row">
                    <div class="shade__confirmation">
                        <div class="checkbox--default">
                            <input type="checkbox" id="check1" name="check" onchange={m.withAttr('checked', ctrl.ready)}/>
                            <label for="check1"></label>
                        </div>
                        <label for="check1">
                            <span>Everything looks good</span>
                        </label>
                    </div>
                    <a>
                        <span></span>
                    </a>
                    <a>
                        <span></span>
                    </a>
                    <a>
                        <span></span>
                    </a>
                    <a>
                        <span></span>
                    </a>
                    <a>
                        <span></span>
                    </a>
               { ctrl.sent() == false ? [
                    <a class="btn btn--red" onclick={ctrl.cancel}>
                        <span>Cancel</span>
                    </a> ] : [
                    <a class="btn">
                        <span></span>
                    </a> ] 
               }
                    {ctrl.ready() ? [ 
  <div>{ ctrl.sent() == false ? [
                    <a class="btn btn--green btn--hicon" onclick={ctrl.sendTransaction}>
                        {icons.send()}<span>Send I/O Coins</span>
                    </a> ] : [ 
                    <a class="btn " >
                        <span></span>
                            </a>] }</div>
                     ] :
                     [
                    <a class="btn btn--grey ">
                        <span>Send I/O Coins</span>
                    </a>
                     ]}

                </div>
            </div>
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
        <main>
            <div class="title title--main">
                <h1>Send I/O Coins by Stealth</h1>

                <div class="shade__source__balance">
                    <span>Balance</span>
                    {balanceDecimal !== undefined ? [
                        <div class="shade__source__amount">
                            {balanceWhole}<span class="shade__source__amount--decimal">.{balanceDecimal}</span>
                        </div>
                    ]:[
                        <div class="shade__source__amount">{balanceWhole}</div>
                    ]}
                </div>
            </div>

            <section class="shade">
                <RecipientList/>

                {SendViewModel.recipients.length == 0 ? null : (
                    <SendDialogue/>
                )}
            </section>
        </main>
    );
};
