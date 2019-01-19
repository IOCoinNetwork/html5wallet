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
            {tag: "div", attrs: {class:"dest__entry"}, children: [
                {tag: "a", attrs: {class:"tooltip tooltip-n", "aria-label":"Remove Recipient", 
                   onclick:ctrl.removeItem.bind(ctrl, recipient.address)}, children: [
                    icons.close()
                ]}, 
                {tag: "div", attrs: {class:"dest__details"}, children: [
                    recipient.alias != null ? [
                        {tag: "div", attrs: {class:"dest__name"}, children: [recipient.alias]},
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
            {tag: "div", attrs: {class:"dest"}, children: [
                {tag: "a", attrs: {class:"btn btn--blue btn--hicon btn--nostretch", onclick:ctrl.addRecipient}, children: [
                    icons.maximize(), 
                    {tag: "span", attrs: {}, children: ["Select file"]}
                ]}, 
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
                        {tag: "span", attrs: {}}
                    ]}
                ]}, 
                {tag: "div", attrs: {class:"send__row"}, children: [
                    {tag: "div", attrs: {class:"send__fee--details"}, children: [
                        {tag: "span", attrs: {}, children: ["File : ", SendViewModel.walletPath]}
                    ]}
                ]}, 
                 state.error === "false" ? [
                {tag: "div", attrs: {}, children: [
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
                            {tag: "span", attrs: {}, children: ["sure ? Upload tx will be submitted."]}
                        ]}
                    ]}, 

                    ctrl.ready() ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", onclick:ctrl.sendTransaction}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Upload"]}
                    ]}
                     ] :
                     [
                    {tag: "a", attrs: {class:"btn btn--grey "}, children: [
                        {tag: "span", attrs: {}, children: ["Upload"]}
                    ]}
                     ]
                ]}
                ]} ] : []
            ]}
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
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["Upload file to ", {tag: "b", attrs: {}, children: [Send.args.alias]}]}, 

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

                    SendDialogue
            ]}
        ]}
    );
};
