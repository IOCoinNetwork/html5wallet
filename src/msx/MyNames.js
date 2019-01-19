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
        return ( <section class="wallet"><div>
                <div>
                  {args.encrypted == "true" ? (
                  <div class="entry__alias_0">{args.alias}</div>
                  ):(
                  <div class="entry__alias">{args.alias}</div>
                  )}
                </div>
            <div class={"wallet__primary"+(!args.primary ? '--not' : '')}>
                <div class="entry__left">
                    {
                    [
                            <div>{args.encrypted == "true" ? [ 
                <div class="favorites__cap"><span>{ args.alias.substr(0, 2) }</span></div>
                                  ] : [ 
                <div class="favorites__cap tooltip tooltip-ne" aria-label={"Total received : " + args.xtu}><span>{ args.alias.substr(0, 2) }</span></div>
                              ]}</div>,
                        <div class="entry__details">
                            {args.encrypted == "true" ? [ <div class="btn--red">Secret</div> ] : [ <div class="btn--green">Public</div> ]}
                        </div>,
                <div class="entry__right">
                                <a>
                                  <span></span>
				</a>
                            {args.encrypted == "true" && !(args.ts != undefined && args.ts <= 0) ? [ 
                <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, UploadFile, args)}>
                   Upload File
                </a> 
                             ] : [  
                             ]}
                            {args.xtuVector !== undefined ? [ 
                <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, DownloadFile, args)}>
                    Download File </a>
                             ] : [  
                             ]}
                            {args.ts != undefined && args.ts > 0 ? [
                <a href="#" class="btn btn--outline"
                   onclick={ctrl.update__.bind(ctrl, ctrl)}>
                    expires in {args.ts} blocks, renew it now!</a>
                               ] : []}
                             {args.ts != undefined && args.ts <= 0 ? [
                            <a>Expired</a> 
                                ] : []}  
                 </div>
                    ]}
                </div> 
                { !(args.ts != undefined && args.ts <= 0) ? [
                <div class="entry__right">
                {args.encrypted == "true" ? (
                  args.status == "pending_update" || ctrl.decrypt() ? [
                  <a href="#" class="btn btn--yellow btn--outline">
                    Activating...
                  </a>
                  ] : [
                  <a href="#" class="btn btn--outline" 
                    key={args.alias}
                    onclick={ctrl.decryptName.bind(ctrl, ctrl)}>
                    Decrypt alias
                  </a>,
                  <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, TransferEncryptedDION, args)}>
                   Encrypted Transfer
                  </a> 
                  ]
                ) : (
                <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, TransferDION, args)}>
                    Transfer
                </a>
                    )}
                    <a class="btn btn--icon tooltip tooltip-nw" aria-label="DIONs settings">{icons.cog()}</a>
                </div>
                ] : []}
            </div>
        </div>
        </section>);
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
        <main>
            <div class="title title--main">
                <h1>My Dions</h1>
                <a class="btn btn--outline" onclick={ AppViewModel.subview.bind(AppViewModel, CreateDION)} >Create DION</a>
            </div>
                {ctrl.names.map(function (entry) {
                  //console.log("XXXX alias " + entry.alias);
                  if(entry.alias === undefined)
                    return;
                    if(entry.transferred != "1")
                    {
                        return <WalletEntry key={entry.alias} alias={entry.alias} encrypted={entry.encrypted} address={entry.address} status={entry.status} xtu={entry.xtu} xtuVector={entry.xtuVector} ts={entry.tunnel_switch}/>;
                    }
                })}
        </main>
    );
};
