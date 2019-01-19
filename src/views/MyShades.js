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
            LocalWallet.save();
        }.bind(this);

        this.generateRSAKeys = function(event) {
          //console.log("Entered generateRSAKeys");
          //alert(args.contact.address);
          RemoteWallet.client.newPublicKey(args.contact.address);

        }.bind(this);
    },

    view: function (ctrl, args) {
        return ( {tag: "div", attrs: {}, children: [
                            {tag: "div", attrs: {class:"sentry__address"}, children: [args.key]}
                ]}
        );
    }
};


var MyShades = module.exports;

MyShades.controller = function () {
    this.shades = [];
    this.generateNewAddress = function () {
        RemoteWallet.client.shade().then(function (r) {
            console.log("XXXX generated shade " + r.ref); 
            //XXXX m.startComputation();
            //XXXX LocalWallet.addContact('personal', newAddress);
            //XXXX m.endComputation();
        });
    };


};

MyShades.view = function (ctrl) {
    RemoteWallet.client.sr71().then(function(r) {
      ctrl.shades = r;
    });
    var defaultContact = null;
        if (LocalWallet.changeAddress) {
        defaultContact = _.find(LocalWallet.personalContacts, function (contact) {
            return contact.address == LocalWallet.changeAddress;
        });
    }

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["My Shades"]}, 
                {tag: "a", attrs: {class:"btn btn--outline", onclick: ctrl.generateNewAddress.bind(ctrl) }, children: ["New Shade"]}
            ]}, 

            {tag: "section", attrs: {class:"myshades"}, children: [
                ctrl.shades.map(function (shadeinfo) {
                    return m.component(WalletEntry, {key: shadeinfo.ref});
                })
            ]}
        ]}
    );
};
