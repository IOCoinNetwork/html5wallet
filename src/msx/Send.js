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
            <div class="dest__entry">
                <a class="tooltip tooltip-n" aria-label="Remove Recipient"
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
                <div class="send__amount">
                    <input type="text"
                           config={utils.autofocus}
                           onkeyup={m.withAttr('value', ctrl.changeAmount.bind(ctrl, recipient))}
                        />
                </div>
            </div>
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
            <div class="dest">
                <a class="btn btn--blue btn--hicon btn--nostretch" onclick={ctrl.addRecipient}>
                    {icons.maximize()}
                    <span>Add Recipient</span>
                </a>

                {ctrl.addingRecipient() ? [
                    <div class="dest__entry--empty">
                        <a class="tooltip tooltip-n" aria-label="Remove" onclick={ctrl.cancelAddRecipient}>
                            {icons.close()}
                        </a>
                        <div class="dest__details">
                            <input type="text"
                                   id="send-new-address-input"
                                   placeholder="Destination address or DIONS alias"
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
            <div class="send__dialogue">
                <div class="send__row">
                    <div class="send__fee--details">
                        <span>Network fees</span>
                    </div>
                    <div class="send__fee--amount">
                        <span>{SendViewModel.fees}</span>
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
                    {ctrl.sent() == false ? [
                    <a class="btn btn--red" onclick={ctrl.cancel}>
                        <span>Cancel</span>
                    </a> 
                    ] : [ 
                    <a class="btn ">
                        <span></span>
                    </a> 
                    ] }
                    {ctrl.ready() ? [
                <div>{ctrl.sent() == false ? [
                    <a class="btn btn--green btn--hicon" onclick={ctrl.sendTransaction}>
                        {icons.send()}<span>Send I/O Coins</span>
                    </a> 
                     ] : [ 
                    <a class="btn " >
                        <span></span>
                    </a> 
                      ] }</div>
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
        <main>
            <div class="title title--main">
                <h1>Send I/O Coins</h1>

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
