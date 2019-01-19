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
var CreateDION = require('./CreateDION');
var TransferDION = require('./TransferDION');
var TransferEncryptedDION = require('./TransferEncryptedDION');
var UploadFile = require('./UploadFile');
var DownloadFile = require('./DownloadFile');
var ShowDNS = require('./ShowDNS');

var    Transactions = require('./Transactions'),
    RSAKeyTable = require('./RSAKeyTable');


var WalletEntry = {
    controller: function (args) {
        this.enterAliasMode = m.prop(false);
        this.decrypt        = m.prop(false);
        this.s = m.prop(args.alias);
        
        this.saveAlias = function (event) {
            RemoteWallet.client.activateName(args.alias, args.address);
        }.bind(this);

        this.updateAlias = function (event) {
            if (event.which != 13)
                return;
            this.enterAliasMode(false);
            RemoteWallet.client.updateName(args.alias, event.srcElement.value, args.address);
        }.bind(this);

        this.update__ = function (ctrl, event) {
            if(args.encrypted === "true")
            {
              RemoteWallet.client.internFrame(args.alias);
            }
            else
            {
              //console.log("XXXX 1");
              RemoteWallet.client.externFrame(args.alias);
            }
        }.bind(this);

        this.decryptName = function (ctrl, event) {
                //console.log("XXXX 0 args.alias " + args.alias);
            RemoteWallet.client.sendToDion(args.alias ,0.0001)
            .then(function(r) { 
                //console.log("XXXX args.alias " + args.alias);
                return window.alert("Denied: That alias is already public with address " + r);
            })
            .catch(function(error) {
              if(!confirm("This name is currently encrypted block chain and you are requesting to decrypt it. The name will be visible to the world in plain text. You sure ?"))
                return;
            
              ctrl.decrypt(true);
              RemoteWallet.client.activateName(args.alias, args.address);
            });

        }.bind(this);
    },

    view: function (ctrl, args) {
        return ( {tag: "section", attrs: {class:"wallet"}, children: [{tag: "div", attrs: {}, children: [
                {tag: "div", attrs: {}, children: [
                  args.encrypted == "true" ? (
                  {tag: "div", attrs: {class:"entry__alias_0"}, children: [args.alias]}
                  ):(
                  {tag: "div", attrs: {class:"entry__alias"}, children: [args.alias]}
                  )
                ]}, 
            {tag: "div", attrs: {class:"wallet__primary"+(!args.primary ? '--not' : '')}, children: [
                {tag: "div", attrs: {class:"entry__left"}, children: [
                    
                    [
                            {tag: "div", attrs: {}, children: [args.encrypted == "true" ? [ 
                {tag: "div", attrs: {class:"favorites__cap"}, children: [{tag: "span", attrs: {}, children: [ args.alias.substr(0, 2) ]}]}
                                  ] : [ 
                {tag: "div", attrs: {class:"favorites__cap tooltip tooltip-ne", "aria-label":"Total received : " + args.xtu}, children: [{tag: "span", attrs: {}, children: [ args.alias.substr(0, 2) ]}]}
                              ]]},
                        {tag: "div", attrs: {class:"entry__details"}, children: [
                            args.encrypted == "true" ? [ {tag: "div", attrs: {class:"btn--red"}, children: ["Secret"]} ] : [ {tag: "div", attrs: {class:"btn--green"}, children: ["Public"]} ]
                        ]},
                {tag: "div", attrs: {class:"entry__right"}, children: [
                                {tag: "a", attrs: {}, children: [
                                  {tag: "span", attrs: {}}
				]}, 
                            args.encrypted == "true" && !(args.ts != undefined && args.ts <= 0) ? [ 
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, UploadFile, args)}, children: [
                   "Upload File"
                ]} 
                             ] : [  
                             ], 
                            args.xtuVector !== undefined ? [ 
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, DownloadFile, args)}, children: [
                    "Download File "]}
                             ] : [  
                             ], 
                            args.ts != undefined && args.ts > 0 ? [
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:ctrl.update__.bind(ctrl, ctrl)}, children: [
                    "expires in ", args.ts, " blocks, renew it now!"]}
                               ] : [], 
                             args.ts != undefined && args.ts <= 0 ? [
                            {tag: "a", attrs: {}, children: ["Expired"]} 
                                ] : []
                 ]}
                    ]
                ]}, 
                 !(args.ts != undefined && args.ts <= 0) ? [
                {tag: "div", attrs: {class:"entry__right"}, children: [
                args.encrypted == "true" ? (
                  args.status == "pending_update" || ctrl.decrypt() ? [
                  {tag: "a", attrs: {href:"#", class:"btn btn--yellow btn--outline"}, children: [
                    "Activating..."
                  ]}
                  ] : [
                  {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                    key:args.alias, 
                    onclick:ctrl.decryptName.bind(ctrl, ctrl)}, children: [
                    "Decrypt alias"
                  ]},
                  {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, TransferEncryptedDION, args)}, children: [
                   "Encrypted Transfer"
                  ]} 
                  ]
                ) : (
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, TransferDION, args)}, children: [
                    "Transfer"
                ]}
                    ), 
                    {tag: "a", attrs: {class:"btn btn--icon tooltip tooltip-nw", "aria-label":"DIONs settings"}, children: [icons.cog()]}
                ]}
                ] : []
            ]}
        ]}
        ]});
    }
};


var MyWallet = module.exports;

var key = 0;

//state={mynames:[]}; 
//trigger={loaded:false}

//m.mount(document.body, MyWallet);
MyWallet.controller = function () {
    this.id = m.prop(-1);
    var self = this;
    this.id ( RemoteWallet.id);
    this.names = [];
    this.rsaView = function() { var view = RSAKeyTable; return view;}; 
    this.s = m.prop(true);

    //RemoteWallet.client.listNames__().then(function(r) {
    //  console.log("MyWallet controller update");
    //  self.names = r;
    //});
};

MyWallet.view = function (ctrl) {
    var defaultContact = null;

    var sevenDaysAgo = moment().subtract(7, 'days');

    RemoteWallet.client.listNames__().then(function(r) {
      ctrl.names = r;
    });
    

    if (LocalWallet.changeAddress) {
        defaultContact = _.find(LocalWallet.personalContacts, function (contact) {
            return contact.address == LocalWallet.changeAddress;
        });
    }

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["My Dions"]}, 
                {tag: "a", attrs: {class:"btn btn--outline", onclick: AppViewModel.subview.bind(AppViewModel, CreateDION)}, children: ["Create DION"]}
            ]}, 
                ctrl.names.map(function (entry) {
                  //console.log("XXXX alias " + entry.alias);
                  if(entry.alias === undefined)
                    return;
                    if(entry.transferred != "1")
                    {
                        return m.component(WalletEntry, {key:entry.alias, alias:entry.alias, encrypted:entry.encrypted, address:entry.address, status:entry.status, xtu:entry.xtu, xtuVector:entry.xtuVector, ts:entry.tunnel_switch});
                    }
                })
        ]}
    );
};
