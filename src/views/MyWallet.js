// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var LocalWallet = require('../models/LocalWallet'),
    RemoteWallet = require('../models/RemoteWallet');

// Views
var icons = require('./icons');


var WalletEntry = {
    controller: function (args) {
        this.enterAliasMode = m.prop(false);

        this.saveAlias = function (event) {
            if (event.which != 13)
                return;

            this.enterAliasMode(false);
            args.contact.alias = event.srcElement.value;
            //XXXX LocalWallet.save();
            console.log("  address " + args.contact.address);
            console.log("  alias   " + args.contact.alias);
            RemoteWallet.client.setaccount(args.contact.address, args.contact.alias);
        }.bind(this);

        this.generateRSAKeys = function(event) {
          //console.log("Entered generateRSAKeys");
          //alert(args.contact.address);
          RemoteWallet.client.newPublicKey(args.contact.address);

        }.bind(this);
    },

    view: function (ctrl, args) {
        return ( {tag: "div", attrs: {}, children: [
                            {tag: "div", attrs: {class:"entry__address"}, children: [args.contact.address]}, 
            {tag: "div", attrs: {class:"wallet__primary"+(!args.primary ? '--not' : '')}, children: [
                {tag: "div", attrs: {class:"entry__left"}, children: [
                    args.contact.alias ? [
                {tag: "div", attrs: {class:"favorites__cap"}, children: [{tag: "span", attrs: {}, children: [ args.contact.alias.substr(0, 2) ]}]},

                        {tag: "div", attrs: {class:"entry__details"}, children: [
                            {tag: "div", attrs: {class:"entry__name_0"}, children: [
                                {tag: "span", attrs: {}, children: [args.contact.alias]}
                            ]}
                        ]},
                        {tag: "div", attrs: {}, children: [" ", args.contact.alias !== "sparechange" ? [ {tag: "div", attrs: {}, children: [
                            ctrl.enterAliasMode() ? (
                                {tag: "input", attrs: {type:"text", config:utils.autofocus, onblur:ctrl.enterAliasMode.bind(ctrl, false), onkeypress:ctrl.saveAlias}}
                            ):(
                                {tag: "a", attrs: {class:"btn btn--green btn--hicon btn--nostretch", onclick:ctrl.enterAliasMode.bind(ctrl, true)}, children: [
                                    icons.alias(), {tag: "span", attrs: {}, children: ["Edit label"]}
                                ]}
                            ), " "]} ] : []
                        ]}
                    ]:[
                       {tag: "div", attrs: {class:"favorites__cap_0"}},

                        {tag: "div", attrs: {class:"entry__details"}, children: [
                            ctrl.enterAliasMode() ? (
                                {tag: "input", attrs: {type:"text", config:utils.autofocus, onblur:ctrl.enterAliasMode.bind(ctrl, false), onkeypress:ctrl.saveAlias}}
                            ):(
                                {tag: "a", attrs: {class:"btn btn--green btn--hicon btn--nostretch", onclick:ctrl.enterAliasMode.bind(ctrl, true)}, children: [
                                    icons.alias(), {tag: "span", attrs: {}, children: ["Set a label"]}
                                ]}
                            )
                        ]}
                    ]
                ]}, 

                {tag: "div", attrs: {class:"entry__right"}, children: [
                    {tag: "a", attrs: {class:"btn btn--icon tooltip tooltip-n", "aria-label":"Receive payment"}, children: [icons.receive()]}, 
                    {tag: "a", attrs: {class:"btn btn--icon tooltip tooltip-nw", "aria-label":"DIONs settings", onclick:ctrl.generateRSAKeys.bind(ctrl)}, children: [icons.cog()]}
                ]}
            ]}, " "]}
        );
    }
};


var MyWallet = module.exports;

MyWallet.controller = function () {
    this.creatingAddress = m.prop(false);

   this.newAddressDialog = function(ctrl) {
     this.creatingAddress(true);
   };

   this.labelError = m.prop(false);

   this.checkLabel = function(ctrl, event) {
     //console.log("XXXX check label " );
     //XXXX if (event.which != 13 || event.target.value === '') {
     //XXXX console.log("XXXX check label event return" );
     //XXXX   return;
     //XXXX }

     var d = event.target.value;
     //console.log("XXXX check label " + d);
     var err = false;
     LocalWallet.personalContacts.map(function (contact) {
       //console.log("XXXX contact.address " + contact.address);
       //console.log("XXXX contact.alias " + contact.alias);
       if(d == contact.alias) 
       {
         //console.log("XXXX label error");
      
         //ctrl.labelError(true);
         err=true;
       }
     });
     if(err == true) ctrl.labelError(true); else ctrl.labelError(false); 
     if (event.which != 13 || event.target.value === '') {
     //console.log("XXXX check label event return" );
     return;
     }
        RemoteWallet.client.getNewAddress(d).then(function (newAddress) {
            m.startComputation();
            LocalWallet.addContact('personal', newAddress, d);
            m.endComputation();
        });
            ctrl.creatingAddress(false);
   };

   this.cancelAddress = function(ctrl) {
     this.creatingAddress(false);
   };

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

MyWallet.view = function (ctrl) {
    var defaultContact = null;
        if (LocalWallet.changeAddress) {
        defaultContact = _.find(LocalWallet.personalContacts, function (contact) {
            return contact.address == LocalWallet.changeAddress;
        });
    }

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["My Wallet"]}, 
                ctrl.creatingAddress() ? [ {tag: "div", attrs: {}, children: [
                        ctrl.labelError() ? [ 
                    {tag: "div", attrs: {class:"btn btn--red"}, children: [
                            {tag: "input", attrs: {type:"text", 
                                   id:"new-address-input", 
                                   placeholder:"set a label", 
                                   config:utils.autofocus, 
                                   onkeyup:ctrl.checkLabel.bind(ctrl, ctrl)}}
                    ]}
                         ] : [
                    {tag: "div", attrs: {class:"btn btn--white"}, children: [
                            {tag: "input", attrs: {type:"text", 
                                   id:"new-address-input", 
                                   placeholder:"set a label", 
                                   config:utils.autofocus, 
                                   onkeyup:ctrl.checkLabel.bind(ctrl, ctrl)}}
                    ]}
                              ], " "]} ] : [], 
                ctrl.creatingAddress() ? [ 
                {tag: "a", attrs: {class:"btn btn--outline", onclick: ctrl.cancelAddress.bind(ctrl) }, children: ["Cancel"]}
                ] : [ 
                {tag: "a", attrs: {class:"btn btn--outline", onclick: ctrl.newAddressDialog.bind(ctrl, ctrl) }, children: ["New Address"]}
                ]
            ]}, 

            {tag: "section", attrs: {class:"wallet"}, children: [
                defaultContact ? [
                    {tag: "h3", attrs: {}, children: ["Spare Change Address"]},
                    m.component(WalletEntry, {contact: defaultContact, primary: true }),

                    {tag: "h3", attrs: {}, children: ["Additional Addresses"]}
                ] : null, 

                LocalWallet.personalContacts.map(function (contact) {
                    if (contact == defaultContact)
                        return null;
                    return m.component(WalletEntry, {key: contact.address, contact: contact });
                })
            ]}
        ]}
    );
};
