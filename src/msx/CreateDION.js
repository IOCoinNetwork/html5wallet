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
      //console.log("nameNewQuick " + SendViewModel.recipients[0].name);
      RemoteWallet.client.nameNewQuick(SendViewModel.recipients[0].name);
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
            <div class="dest__entry">
                <a class="tooltip tooltip-n" aria-label="Clear"
                   onclick={ctrl.removeItem.bind(ctrl, recipient.address)}>
                    {icons.close()}
                </a>
                <div class="dest__details">
                    {recipient.name != null ? [
                        <div class="dest__name">{recipient.name}</div>,
                        <div class="dest__address">{recipient.address}</div>
                    ]:[
                        <div class="dest__name">{recipient.address}</div>
                    ]}
                </div>
                <div class="">
                    <input type="text" readonly
                        />
                </div>
            </div>
        );
    }
};

var name_list;

var isPrivate = function(a, l) 
{

}

var RecipientList = {
    controller: function () {
        this.addingRecipient = m.prop(false);

                m.startComputation();
                RemoteWallet.client.listNames__().then(function(r) {
                  name_list = r;
                });
                m.endComputation();

        this.addRecipient = function () {
            if (this.addingRecipient()) {
                document.getElementById('send-new-address-input').focus();
            }
            this.addingRecipient(true);
        }.bind(this);
    

        this.enterRecipient = function (ctrl, event) {
            if (event.which != 13 || event.target.value === '') {
                return;
            }

            inputData = event.target.value;

            RemoteWallet.client.sendToDion(inputData,0.0001)
            .then(function(r) 
            { 
              var mine=false;

              name_list.map(function(e) {
              if(e.alias === inputData.toLowerCase() && e.encrypted === "false" && e.transferred !== "1") 
              {
                mine=true;
              }
              });

              if(mine)
                return window.alert("That alias is already public in your own wallet with address " + r);
              else
              {
                var e1; var stat;
                name_list.map(function(e) {
                if(e.alias === inputData.toLowerCase()) 
                {
                  e1=-1; stat=e.expired;
                }
                });

                if(e1 == -1 && stat != 1)
                {
                  ctrl.addingRecipient(false);
                  return window.alert("This alias is among your secret names already.");
                }

                window.alert("Warning: alias is already public in another wallet with address " + r + " you can register the alias but you will not be able to decrypt it until the currently acive alias expires");
                if(SendViewModel.recipients.length == 0)
                  SendViewModel.recipients.unshift({
                      name: inputData
                  });
                  ctrl.addingRecipient(false);

                return;
              }
            })
            .catch(function(error) {
              var e1; var stat;
              name_list.map(function(e) {
              if(e.alias === inputData.toLowerCase()) 
              {
                e1=-1; stat = e.expired;
              }
              });

              console.log("stat " + stat);
              if(e1 == -1 && stat != 1)
              {
                ctrl.addingRecipient(false);
                return window.alert("This alias is among your secret names already.");
              }
              if(SendViewModel.recipients.length == 0)
                SendViewModel.recipients.unshift({
                  name: inputData
                });

              ctrl.addingRecipient(false);
              return;
            });

        }.bind(this);

        this.cancelAddRecipient = function (event) {
            this.addingRecipient(false);
            event.target.value = '';
        }.bind(this);
    },

    view: function (ctrl) {
        return (
            <div class="dest">
                {SendViewModel.recipients.length > 0 ? [
                <a class="btn btn--white btn--hicon btn--nostretch" >
                    {icons.maximize()}
                    <span>&nbsp;</span></a>
                 ] : [
                <a class="btn btn--blue btn--hicon btn--nostretch" onclick={ctrl.addRecipient}>
                    {icons.maximize()}
                    <span>Choose an alias</span>
                </a> ] }

                {ctrl.addingRecipient() ? [
                    <div class="dest__entry--empty">
                        <div class="dest__details">
                            <input type="text"
                                   id="send-new-address-input"
                                   placeholder="Choose DIONS name"
                                   config={utils.autofocus}
                                   onkeypress={ctrl.enterRecipient.bind(ctrl, ctrl)}/>
                        </div>
                    </div>
                ] : null}

                {SendViewModel.recipients.length > 0 ? [
                    <RecipientListItem key={(SendViewModel.recipients[0]).address} recipient={SendViewModel.recipients[0]}/> ] : null }
            </div>
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
            <div class="send__dialogue">
                <div class="send__row">
                    <div class="send__fee--details">
                        <span>Network fees</span>
                    </div>
                    <div class="send__fee--amount">
                        <span>{SendViewModel.total()}</span>
                    </div>
                </div>

                <div class="send__row">
                    <div class="send__fee--details">
                        <span>Total</span>
                    </div>
                    <div class="send__fee--amount">
                        <span>{SendViewModel.total()}</span>
                    </div>
                </div>

                <div class="send__row">
                    <div class="send__confirmation">
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
                    <a class="btn btn--red" onclick={ctrl.cancel}>
                        <span>Cancel</span>
                    </a>
                    {ctrl.ready() ? [
                    <a class="btn btn--green btn--hicon" onclick={ctrl.sendTransaction}>
                        {icons.send()}<span>Create</span>
                    </a>
                     ] :
                     [
                    <a class="btn btn--grey ">
                        <span>Create</span>
                    </a>
                     ]}
                </div>
            </div>
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
        <main>
            <div class="title title--main">
                <h1>Create DION</h1>

                <div class="send__source__balance">
                    <span>Balance</span>
                    {balanceDecimal !== undefined ? [
                        <div class="send__source__amount">
                            {balanceWhole}<span class="send__source__amount--decimal">.{balanceDecimal}</span>
                        </div>
                    ]:[
                        <div class="send__source__amount">{balanceWhole}</div>
                    ]}
                </div>
            </div>

            <section class="send">
                <RecipientList/>

                {SendViewModel.recipients.length == 0 ? null : (
                    <SendDialogue/>
                )}
            </section>
        </main>
    );
};
