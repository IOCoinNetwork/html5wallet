// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');
    var moment = require('moment');

// Models
var LocalWallet = require('../models/LocalWallet'),
    AppViewModel = require('../models/AppViewModel'),
    RemoteWallet = require('../models/RemoteWallet');

// Views
var icons = require('./icons');
var NewRSAKey = require('./NewRSAKey');

var    Transactions = require('./Transactions'),
    RSAKeyTable = require('./RSAKeyTable');

window.onload = function(e) {
  //console.log("onload");
};

invite_list={l:[]}; 


var aToD = function(entry) {
    var tmp = RemoteWallet.client.addressToDion(entry.recipient)
    .then(function(r) { 
      //console.log(" tmp r >" + r + "<");
      m.startComputation();
      if(r != "" )
        entry.alias = r;
      m.endComputation();
    });
};

var MyWallet = module.exports;

var WalletEntry = {
    controller: function (args) {
        this.enterAliasMode = m.prop(false);
    

    // Make a local copy of the transactions with a unique key added.

        this.saveAlias = function (event) {
            if (event.which != 13)
                return;

            this.enterAliasMode(false);

            var found = false;
            args.i.map(function(e) {
              if(e.recipient === event.srcElement.value)
              {
                  found = true;
              } 
              else if(e.alias === event.srcElement.value)
              {
                  found = true;
              }
            });

            
            invite_list.l.map(function(e) {
              if(e === event.srcElement.value)
                found=true;
            });

            if(found == true)
              return window.alert("This contact is already invited!");

            invite_list.l.push(event.srcElement.value);

            RemoteWallet.client.sendPubKey(args.address, event.srcElement.value);
            
            //args.contact.alias = event.srcElement.value;
            //LocalWallet.save();
        }.bind(this);

    },

    view: function (ctrl, args) {
        return ( <section class="wallet"><div>
                            {args.alias == "NONE" ? (
                            <div>
                              <div class="entry__address">{args.address}</div>
                            </div>
                            ) : (
                            <div>
                              <div class="entry__alias">{args.alias}</div>
                            </div>
                            )}
            <div class={"wallet__primary"+(!args.primary ? '--not' : '')}>
                <div class="entry__left">
                    {
                    [
                      <div>
                      {args.alias == "NONE" ? (
                        <div class="favorites__cap_0"><span></span></div>
                        ) : (
                <div class="favorites__cap"><span>{ args.alias.substr(0, 2) }</span></div>
                       )}</div>,
                        <div class="entry__details">
                            {ctrl.enterAliasMode() ? (
                                <input type="text" config={utils.autofocus} onblur={ctrl.enterAliasMode.bind(ctrl, false)} onkeypress={ctrl.saveAlias}/>
                            ):(
                                <a class="btn btn--green btn--hicon btn--nostretch" onclick={ctrl.enterAliasMode.bind(ctrl, true)}>
                                    {icons.alias()}<span>Invite</span>
                                </a>
                            )}
                        </div>
                    ]}
                </div>

                <div class="entry__right">
                    <a class="btn btn--icon tooltip tooltip-n" aria-label="Receive payment">{icons.receive()}</a>
                    <a class="btn btn--icon tooltip tooltip-nw" aria-label="DIONs settings">{icons.cog()}</a>
                </div>
            </div>
            </div>
        </section>);
    }
};

rsa_={myrsakeys:undefined, rsafriends:undefined}; 

MyWallet.controller = function () {

    this.rsaView = function() { var view = RSAKeyTable; return view;}; 

RemoteWallet.client.myRSAKeys().then(function(r) {
  rsa_.myrsakeys = r;
});
RemoteWallet.client.rsaFriends().then(function(r) {
  rsa_.rsafriends = r;
  rsa_.rsafriends.map(function(e) {
  aToD(e);
  });
});

    //XXXX this.rsafriends = RemoteWallet.rsafriends;
    //XXXX this.rsafriends.map(function(e) {
    //XXXX   aToD(e);
    //XXXX });
};

MyWallet.view = function (ctrl) {
    var defaultContact = null;

    var sevenDaysAgo = moment().subtract(7, 'days');

    m.startComputation();   
    m.endComputation();   
    
    if (LocalWallet.changeAddress) {
        defaultContact = _.find(LocalWallet.personalContacts, function (contact) {
            return contact.address == LocalWallet.changeAddress;
        });
    }

    return (
        <main>
            <div class="title title--main">
                <h1>My RSA Keys</h1>
                <a class="btn btn--outline" onclick={ AppViewModel.subview.bind(AppViewModel, NewRSAKey)}>New RSA Key</a>
            </div>

                {rsa_.myrsakeys.map(function (entry) {
                  return <WalletEntry key={entry.address} address={entry.address} alias={entry.alias} i={rsa_.rsafriends}/> ;
                })}
        </main>
    );
};
