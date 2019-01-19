// Electron/Node modules
var assert = require('assert');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    remote = require('electron').remote,
    path = require('path'),
    fs = require('fs'),
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
            </div>
        );
    }
};

window.onbeforeunload = function(e) {
  //console.log("onbeforeunload");
};

var RecipientList = {
    controller: function () {
    this.r = m.route();
         
        this.addingRecipient = m.prop(false);
        this.enterAliasMode = m.prop(false);
        this.saveAlias = function (event) {
            state.disable=true;
            //console.log("event.srcElement.value " + event.srcElement.value);
            //console.log("  name    " + args.name);
            //console.log("  address " + args.address);
            RemoteWallet.client.activateName(args.name, args.address);
            //args.contact.alias = event.srcElement.value;
            //LocalWallet.save();
        }.bind(this);
        this.updateAlias = function (event) {
            //console.log("updateAlias");
      //console.log("r " + m.route());
     
            m.route();
            state.disable=false;
            //document.getElementById("edittext").readOnly=false;
            document.getElementById("edittext").value=window.atob(Send.args.value);
            document.getElementById("save_button").className='btn--blue';
            //console.log("  event.which " + event.which);
            //if(event.which != 13 || event.target.value === '')
            //    return;

            ////console.log("  updating    " + document.geElementById("edittext").value);
            ////console.log("  data    " + event.srcElement.value);
            ////console.log("  address " + args.address);
            //RemoteWallet.client.updateName(args.name, event.srcElement.value, args.address);
            //args.contact.alias = event.srcElement.value;
            //LocalWallet.save();
        }.bind(this);

        this.getCType = function(c)
        {
          var d = window.atob(c);
          if(typeof d === 'string' || d instanceof String)
            return "TEXT";
          else
            return "DATA";
        }.bind(this);

        this.saveDNSEdit = function (event) {
            //console.log("saveDNSEdit");
            //if(document.getElementById("edittext").readOnly == true)
            if(state.disable == true)
              return;

            //console.log("  saving edit    ");
            document.getElementById("edittext").readOnly=true;
            document.getElementById("save_button").className='btn btn--outline';
            //console.log("  event.which " + event.which);
            //if(event.which != 13 || event.target.value === '')
            //    return;

            ////console.log("  updating    " + document.geElementById("edittext").value);
            ////console.log("  data    " + event.srcElement.value);
            ////console.log("  address " + args.address);
            if(Send.args.encrypted === "true")
            {
              //console.log("  encrypted name    " + Send.args.name);
              //console.log("            value   " + document.getElementById("edittext").value);
              //console.log("            address " + Send.args.address);
              RemoteWallet.client.updateEncryptedName(Send.args.name, window.btoa(document.getElementById("edittext").value), Send.args.address);
            }
            else
            {
              //console.log("  plain text name    " + Send.args.name);
              //console.log("             value   " + document.getElementById("edittext").value);
              //console.log("             address " + Send.args.address);
              RemoteWallet.client.updateName(Send.args.name, window.btoa(document.getElementById("edittext").value), Send.args.address);
            }
            //RemoteWallet.client.updateName(args.name, event.srcElement.value, args.address);
            //args.contact.alias = event.srcElement.value;
            //LocalWallet.save();
          state.disable=true;
        }.bind(this);

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
            <div>
                <div class="entry__left">
                    {
                            <div>{Send.args.encrypted == "true" ? [ <div class="entry__cap--encrypted"></div> ] : [ <div class="entry__cap"></div> ]}</div>,
                        <div class="entry__details">
                            {ctrl.getCType(Send.args.value) === "DATA" ? (
                            <input type="text" id="edittext" class="btn btn--outline" disabled={state.disable} placeholder={Send.args.value}></input>
                              ) : (
                            <input type="text" id="edittext" class="btn btn--outline" disabled={state.disable} placeholder={window.atob(Send.args.value)}></input>
                              )}
                        </div>,
                 <div>
                 {ctrl.getCType(Send.args.value) === "DATA" ? (
                <div class="btn btn--grey btn--outline"> 
                  Edit
                </div>
                 ) : (
                <div class="btn btn--outline" onclick={ctrl.updateAlias.bind(ctrl)}> 
                  Edit
                </div>
                 )}
                </div>,
                <div id="save_button" class="btn btn--outline" onclick={ctrl.saveDNSEdit.bind(ctrl)}>
                  Save
                </div>
                    }
                </div>

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
                            <span>Are you sure ? If the address you entered is not your own, this dion will be sent to someone else.</span>
                        </label>
                    </div>

                    <a class="btn btn--red btn--hicon" onclick={ctrl.sendTransaction}>
                        {icons.send()}<span>Transfer</span>
                    </a>
                </div>
            </div>
        );
    }
};


var Send = module.exports;

Send.controller = function () {
    SendViewModel.init();
    this.onunload = function(e) {
      //console.log("onunload");
      ////console.log("r " + m.route());
     
      if(state.disable == false)
      {
        //if(!confirm("You have unsaved changes, leaving will discard them. You sure ?"))
        {
          //console.log("preventDefault");
          //AppViewModel.subview(this, this.args);
          //m.component(AppViewModel.subview());
          //e.preventDefault();
          //m.route("/");
          //m.route();
          //m.redraw();
          //return;
        }
      }

      state.disable = true;
    };
};

Send.view = function () {
    var balanceParts = RemoteWallet.availableFunds.toString().split('.'),
        balanceWhole = balanceParts[0],
        balanceDecimal = balanceParts[1];

    return (
        <main>
            <div class="title title--main">
                <h1>DNS configuration for {Send.args.name}</h1>

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

//define a route
//m.route(document.body, "/showdns", {
//    "/showdns": RecipientList
//});

//setup routes to start w/ the `#` symbol
//m.route.mode = "hash";
