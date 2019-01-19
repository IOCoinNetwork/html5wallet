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
        return ( {tag: "section", attrs: {class:"wallet"}, children: [{tag: "div", attrs: {}, children: [
                            args.alias == "NONE" ? (
                            {tag: "div", attrs: {}, children: [
                              {tag: "div", attrs: {class:"entry__address"}, children: [args.address]}
                            ]}
                            ) : (
                            {tag: "div", attrs: {}, children: [
                              {tag: "div", attrs: {class:"entry__alias"}, children: [args.alias]}
                            ]}
                            ), 
            {tag: "div", attrs: {class:"wallet__primary"+(!args.primary ? '--not' : '')}, children: [
                {tag: "div", attrs: {class:"entry__left"}, children: [
                    
                    [
                      {tag: "div", attrs: {}, children: [
                      args.alias == "NONE" ? (
                        {tag: "div", attrs: {class:"favorites__cap_0"}, children: [{tag: "span", attrs: {}}]}
                        ) : (
                {tag: "div", attrs: {class:"favorites__cap"}, children: [{tag: "span", attrs: {}, children: [ args.alias.substr(0, 2) ]}]}
                       )]},
                        {tag: "div", attrs: {class:"entry__details"}, children: [
                            ctrl.enterAliasMode() ? (
                                {tag: "input", attrs: {type:"text", config:utils.autofocus, onblur:ctrl.enterAliasMode.bind(ctrl, false), onkeypress:ctrl.saveAlias}}
                            ):(
                                {tag: "a", attrs: {class:"btn btn--green btn--hicon btn--nostretch", onclick:ctrl.enterAliasMode.bind(ctrl, true)}, children: [
                                    icons.alias(), {tag: "span", attrs: {}, children: ["Invite"]}
                                ]}
                            )
                        ]}
                    ]
                ]}, 

                {tag: "div", attrs: {class:"entry__right"}, children: [
                    {tag: "a", attrs: {class:"btn btn--icon tooltip tooltip-n", "aria-label":"Receive payment"}, children: [icons.receive()]}, 
                    {tag: "a", attrs: {class:"btn btn--icon tooltip tooltip-nw", "aria-label":"DIONs settings"}, children: [icons.cog()]}
                ]}
            ]}
            ]}
        ]});
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
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["My RSA Keys"]}, 
                {tag: "a", attrs: {class:"btn btn--outline", onclick: AppViewModel.subview.bind(AppViewModel, NewRSAKey)}, children: ["New RSA Key"]}
            ]}, 

                rsa_.myrsakeys.map(function (entry) {
                  return m.component(WalletEntry, {key:entry.address, address:entry.address, alias:entry.alias, i:rsa_.rsafriends}) ;
                })
        ]}
    );
};
