// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');
    var moment = require('moment');

// Models
var LocalWallet = require('../models/LocalWallet'),
    AppViewModel = require('../models/AppViewModel'),
    Messages = require('./Messages'),
    RemoteWallet = require('../models/RemoteWallet');

// Views
var icons = require('./icons');
var NewName = require('./NewName');

var    Transactions = require('./Transactions'),
    RSAKeyTable = require('./RSAKeyTable');

var aToD = function(e) {
    var tmp = RemoteWallet.client.addressToDion(e.sender)
    .then(function(r) { 
      m.startComputation();
      e.alias = r;
      m.endComputation();
    });
};

var WalletEntry = {
    controller: function (args) {
        this.enterAliasMode = m.prop(false);
        this.accept = m.prop(false);

        //console.log("entry ...");


        this.saveAlias = function (event) {
            if (event.which != 13)
                return;

            this.enterAliasMode(false);
            //console.log("  name    " + event.srcElement.value);
            //console.log("  address " + args.sender);
            RemoteWallet.client.messageSend(event.srcElement.value, args.sender);
            //args.contact.alias = event.srcElement.value;
            //LocalWallet.save();
        }.bind(this);

        this.acceptContact = function (event) {
            this.accept(true);
          var found=false;
          
          RemoteWallet.myrsakeys.map(function(e) {
            if(e.address === args.recipient)
            {
              console.log("found e.address " + e.address);
              console.log("found args.recipient " + args.recipient);
              found=true;
            }
          });

          if(!found)
          {
            console.log("  newPublicKey " + args.recipient);
            RemoteWallet.client.newPublicKey(args.recipient);
          }

          console.log("  sendPubKey s" + args.recipient);
          console.log("  sendPubKey r" + args.sender);
          RemoteWallet.client.sendPubKey(args.recipient, args.sender);
        }.bind(this);
    },

    view: function (ctrl, args) {
        return (
            <div class="favorites__list">
                <div class="entry__left">
                    {
                    [
                        <div class="entry__cap--unset"></div>,

                        <div class="entry__details">
                            { args.alias === undefined ? (
                              <div class="entry__address">{args.sender}</div>  
                             ) : (
                              <div class="entry__address">{args.alias}</div>
                            )}
                            { args.confirmed === "false" ?  [ <div class="entry__address">Hi, Please add me as a contact.</div> ] : [ null ] }
                        </div>
                    ]}
                </div>

                <div class="entry__right">
                  { args.pending === "true" || ctrl.accept() == true ? 
                    [ <a class="btn btn--outline">Pending</a> ] 
                    : [ ]
                  }

                  { ctrl.accept() == false && args.pending !== "true" && args.confirmed === "false" ? 
                  
                    [ <a class="btn btn--outline" onclick={ctrl.acceptContact.bind(ctrl, true)}>Accept</a> ]  : [ ]
                  }
                </div>
            </div>
        );
    }
};


var MyWallet = module.exports;

MyWallet.controller = function () {
  //console.log("...");
  this.accepted = m.prop(false);

  RemoteWallet.newInvitations = 0;
    this.rsaView = function() { var view = RSAKeyTable; return view;}; 

    this.rsafriends = 
        RemoteWallet.rsafriends;
                  this.rsafriends.map(function(e) {
                    aToD(e);
                  });
};

MyWallet.view = function (ctrl) {
    var defaultContact = null;
    RemoteWallet.client.rsaFriends().then(function(r) {
      ctrl.rsafriends = r;  
      fullfill(ctrl.rsafriends);
    });

    var sevenDaysAgo = moment().subtract(7, 'days');

    // Make a local copy of the transactions with a unique key added.
    //var rsafriends = 
    //    RemoteWallet.rsafriends;

    if (LocalWallet.changeAddress) {
        defaultContact = _.find(LocalWallet.personalContacts, function (contact) {
            return contact.address == LocalWallet.changeAddress;
        });
    }

    return (
        <main>
            <div class="title title--main">
                <h1>Pending Invitations</h1>
            </div>

            <section class="wallet">
                {ctrl.rsafriends.map(function (entry) {
                    if(entry.status == "exported")
                      return;

                    if(entry.confirmed == "true")
                      return;

                    return <WalletEntry sender={entry.sender} recipient={entry.recipient} status={entry.status} alias={entry.alias} pending={entry.pending} confirmed={entry.confirmed} alias={entry.alias}/>;
                })}
            </section>
        </main>
    );
};
