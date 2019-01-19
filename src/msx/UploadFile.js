// Electron/Node modules
var assert = require('assert');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    path = require('path'),
    remote = require('electron').remote,
    dialog = remote.dialog,
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

state={error:true}; 

var SendViewModel = {
    recipients: [],
    fees: 0,
    walletPath: "",

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
        return this.fees;
    },

    sendTransaction: function () {
      //console.log("upload " + Send.args.alias);
      //console.log("upload " + SendViewModel.walletPath);
      //console.log("upload " + SendViewModel.walletPath);
      //console.log("upload encrypted ? " + Send.args.encrypted);
      if(Send.args.encrypted === "false")
      {
        RemoteWallet.client.updateName(Send.args.alias, SendViewModel.walletPath);
      }
      else
      {
        RemoteWallet.client.updateEncryptedName(Send.args.alias, SendViewModel.walletPath);
      }
      SendViewModel.walletPath = "";
      state.error = "true";
      AppViewModel.subview(Overview);
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
                    {recipient.alias != null ? [
                        <div class="dest__name">{recipient.alias}</div>,
                        <div class="dest__address">{recipient.address}</div>
                    ]:[
                        <div class="dest__name">{recipient.address}</div>
                    ]}
                </div>
            </div>
        );
    }
};


var RecipientList = {
    controller: function () {
        this.addingRecipient = m.prop(false);

        this.addRecipient = function () {
            this.addingRecipient(true);
		dialog.showOpenDialog(remote.getCurrentWindow(), {
		    title: 'Choose wallet directory',
		    defaultPath: DEFAULT_PATH,
		    properties: ['openFile']

		}, 
	function (filePaths) {
		    SendViewModel.walletPath = filePaths ? filePaths[0] : undefined;

		    if (SendViewModel.walletPath === undefined) {
			return;
		    }

                    if(Send.args.encrypted === "true")
                    {
                      RemoteWallet.client.transientStatus__C(Send.args.alias, SendViewModel.walletPath).then(function(result) 
                        { 
                          //console.log(result.status); //console.log(result.fee); 
                        SendViewModel.fees = result.fee; 
                        if(result.status === "error")
                        {
                          state.error = "true";
                          return window.alert("Error : " + result.message);
                        }
                        state.error = "false";
			}
                      );
                    }
                    else
                    {
                      RemoteWallet.client.transientStatus__(Send.args.alias, SendViewModel.walletPath).then(function(result) { //console.log(result.status); //console.log(result.fee); SendViewModel.fees = result.fee;
                        if(result.status === "error") 
                        {
                          state.error = "true";
                          return window.alert("Error : " + result.message);
                        }
                        state.error = "false";
                        }
                        );
                    }
            this.addingRecipient(false);
		});
        }.bind(this);

        this.enterRecipient = function (event) {

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
                    <span>Select file</span>
                </a>
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
            <div class="send__dialogue">
                <div class="send__row">
                    <div class="send__fee--details">
                        <span></span>
                    </div>
                </div>
                <div class="send__row">
                    <div class="send__fee--details">
                        <span>File : {SendViewModel.walletPath}</span>
                    </div>
                </div>
                { state.error === "false" ? [
                <div>
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
                            <span>sure ? Upload tx will be submitted.</span>
                        </label>
                    </div>

                    {ctrl.ready() ? [
                    <a class="btn btn--green btn--hicon" onclick={ctrl.sendTransaction}>
                        {icons.send()}<span>Upload</span>
                    </a>
                     ] :
                     [
                    <a class="btn btn--grey ">
                        <span>Upload</span>
                    </a>
                     ]}
                </div> 
                </div> ] : []}
            </div>
        );
    }
};


var Send = module.exports;

Send.controller = function () {
    SendViewModel.init();
    this.onunload = function(e) {
      SendViewModel.walletPath = "";
      state.error = "true";
    };
};

Send.view = function () {
    var balanceParts = RemoteWallet.availableFunds.toString().split('.'),
        balanceWhole = balanceParts[0],
        balanceDecimal = balanceParts[1];

    return (
        <main>
            <div class="title title--main">
                <h1>Upload file to <b>{Send.args.alias}</b></h1>

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

                    <SendDialogue/>
            </section>
        </main>
    );
};
