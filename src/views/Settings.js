// Electron/Node modules
var remote = require('electron').remote,
    dialog = remote.dialog,
    utils = require('../utils'),
    path = require('path');

// Libraries
var m = require('mithril');

// Models
var RemoteWallet = require('../models/RemoteWallet'),
    LocalWallet = require('../models/LocalWallet');

var UploadAvatar = require('./UploadAvatar.js');

// Views
var icons = require('./icons');
var Overview = require('./Overview');


var defaultBackupPath = path.join.apply(path, {
    win32: [process.env.USERPROFILE, 'Desktop'],
    darwin: [process.env.HOME, 'Desktop'],
    linux: [process.env.HOME, 'Desktop']
}[process.platform]);

//var defaultAvatarPath =  'views/temp_assets/avatar.jpg';
// The default places where the wallet is stored on each platform.
var defaultPathBase = {
    win32: process.env.APPDATA,
    darwin: path.join(process.env.HOME || '', 'Library'),
    linux: process.env.HOME
}[process.platform];
var DEFAULT_PATH = path.join(defaultPathBase, 'IOCoin');

var Settings = module.exports;

Settings.controller = function () {
    this.enterAliasMode = m.prop(false);

    this.saveAlias = function (event) {
      if (event.which != 13)
        return;

      this.enterAliasMode(false);

      r = event.srcElement.value;
      var t = 1 == 1;
      //console.log("  set reserve " + r + "<");
      RemoteWallet.client.reserveBalance(parseFloat(r)).catch(function(e) {
        //console.log("error.code " + e.code); 
        //console.log("error.message " + e.message); 
      });
    }.bind(this);

    this.setAvatar = function () {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
	    title: 'Choose avatar file',
	    defaultPath: DEFAULT_PATH,
	    properties: ['openFile']
      },
      function (filePath) {
      //console.log("filePath " + filePath);
      if(filePath != null)
      {
        LocalWallet.avatarFile = filePath;
        LocalWallet.save();
      }
      });
    };
    this.backupWallet = function () {
        dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Choose location to save wallet backup',
            defaultPath: path.join(defaultBackupPath, 'wallet.dat')

        }, function (backupPath) {
            if (backupPath === undefined) {
                return;
            }
            RemoteWallet.client.backupWallet(backupPath);
        })
    };

    this.toggleLoadAtStartup = function (event) {
        event.stopPropagation();
        var checked = event.target.checked;

        if (checked) {
            localStorage.defaultWallet = RemoteWallet.walletPath;
        }
        else {
            delete localStorage.defaultWallet;
        }
    };
};

Settings.view = function (ctrl) {
    return (
        {tag: "main", attrs: {}, children: [
        	{tag: "div", attrs: {class:"title title--main"}, children: [
        		{tag: "h1", attrs: {}, children: ["Settings"]}, 
                {tag: "a", attrs: {class:"btn btn--blue", href:"#", onclick: ctrl.backupWallet}, children: ["Backup Wallet"]}
        	]}, 

            {tag: "section", attrs: {class:"settings"}, children: [
                {tag: "div", attrs: {class:"settings__entry"}, children: [
                    {tag: "div", attrs: {class:"settings__profile"}, children: [
                        {tag: "a", attrs: {class:"avatar__image tooltip tooltip-n", href:"#", "aria-label":"Change avatar", 
                   onclick:ctrl.setAvatar}, children: [
                            {tag: "img", attrs: {width:"110px", height:"110px", src:LocalWallet.avatarFile}}
                        ]}, 

                        {tag: "div", attrs: {class:"settings__stats"}, children: [
                            {tag: "div", attrs: {class:"settings__stats--value"}, children: [ RemoteWallet.transactions.length]}, 
                            {tag: "div", attrs: {class:"settings__stats--cat"}, children: ["Transactions"]}
                        ]}, 

                        {tag: "div", attrs: {class:"settings__stats"}, children: [
                            {tag: "div", attrs: {class:"settings__stats--value"}, children: [ LocalWallet.personalContacts.length]}, 
                            {tag: "div", attrs: {class:"settings__stats--cat"}, children: ["Addresses"]}
                        ]}, 

                        {tag: "div", attrs: {class:"settings__stats"}, children: [
                            {tag: "div", attrs: {class:"settings__stats--value"}, children: [ LocalWallet.publicContacts.length]}, 
                            {tag: "div", attrs: {class:"settings__stats--cat"}, children: ["Contacts"]}
                        ]}
                    ]}, 

                    RemoteWallet.isLocked ? (
                        {tag: "a", attrs: {class:"settings__lock tooltip tooltip-n", href:"#", "aria-label":"Wallet is locked", 
                           onclick: RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: false}) }, children: [
                             icons.lock() 
                        ]}
                    ):(
                        {tag: "a", attrs: {class:"settings__lock tooltip tooltip-nw", href:"#", 
                           "aria-label": RemoteWallet.isEncrypted ? "Wallet is unlocked" : "Wallet is unencrypted (click to encrypt it)", 
                           onclick: RemoteWallet.lockWallet.bind(null, {v: Overview}) }, children: [
                             icons.unlock() 
                        ]}
                    )
                ]}
            ]}, 

            {tag: "section", attrs: {class:"settings"}, children: [
                {tag: "h3", attrs: {}, children: ["Blockchain"]}, 

                RemoteWallet.syncing ? [
                    {tag: "h5", attrs: {}, children: ["Syncing in progress (",  RemoteWallet.currentBlock, " / ",  RemoteWallet.highestBlock, " blocks)"]}
                ]:[
                    {tag: "h5", attrs: {}, children: ["Syncing complete"]}
                ], 

                {tag: "div", attrs: {class:"settings__entry"}, children: [
                    {tag: "div", attrs: {class:"settings__sync"}, children: [
                        {tag: "progress", attrs: {max:"100", value: RemoteWallet.syncProgressPercent.toString() }}, 

                        {tag: "div", attrs: {class:"settings__sync--percentage"}, children: [
                            {tag: "span", attrs: {}, children: [ RemoteWallet.syncProgressPercent, "%"]}
                        ]}
                    ]}, 

                    !RemoteWallet.syncing ? null : [
                        {tag: "div", attrs: {class:"settings__sync--spinner"}, children: [ icons.loader() ]}
                    ]
                ]}
            ]}, 

            {tag: "section", attrs: {class:"settings"}, children: [
                {tag: "h3", attrs: {}, children: ["Wallet Settings"]}, 

                {tag: "div", attrs: {class:"settings__entry"}, children: [
                    {tag: "div", attrs: {class:"settings__description"}, children: [
                        {tag: "h4", attrs: {}, children: ["Load At Startup"]}, 
                        {tag: "p", attrs: {}, children: ["Load this wallet on startup, skipping the wallet selection screen."]}
                    ]}, 

                    {tag: "div", attrs: {class:"settings__switch"}, children: [
                        {tag: "input", attrs: {id:"load-at-startup-checkbox", class:"switch", type:"checkbox", 
                               checked: localStorage.defaultWallet !== undefined ? 'checked' : null, 
                               onclick: ctrl.toggleLoadAtStartup}}, 
                        {tag: "label", attrs: {for:"load-at-startup-checkbox"}}
                    ]}
                ]}, 
                {tag: "div", attrs: {class:"settings__entry"}, children: [
                    {tag: "div", attrs: {class:"settings__description"}, children: [
                        {tag: "h4", attrs: {}, children: ["Reserve balance"]}, 
                        {tag: "p", attrs: {}, children: ["Here you can set a reserve balance that will not be used for staking."]}, 
                        {tag: "p", attrs: {}, children: ["Your current reserved balance is ", RemoteWallet.reserveamount, " IOC"]}
                    ]}, 

                    {tag: "div", attrs: {}, children: [
                            ctrl.enterAliasMode() ? (
                                {tag: "input", attrs: {type:"text", config:utils.autofocus, onblur:ctrl.enterAliasMode.bind(ctrl, false), onkeypress:ctrl.saveAlias}}
                            ):(
                                {tag: "a", attrs: {class:"btn btn--green btn--hicon btn--nostretch", onclick:ctrl.enterAliasMode.bind(ctrl, true)}, children: [
                                    icons.alias(), {tag: "span", attrs: {}, children: ["Set reserve"]}
                                ]}
                            )
                    ]}
                ]}, 
                {tag: "div", attrs: {class:"settings__entry"}, children: [
                  RemoteWallet.isEncrypted ? [
                    {tag: "section", attrs: {}, children: [
                    {tag: "div", attrs: {class:"settings__description"}, children: [
                        {tag: "h4", attrs: {}, children: ["Change password"]}, 
                        {tag: "p", attrs: {}, children: ["Click here to change your password."]}
                    ]}, 

                    {tag: "div", attrs: {}, children: [
                      {tag: "a", attrs: {class:"btn btn--blue", href:"#", onclick: RemoteWallet.changePassword}, children: ["Change password"]}
                    ]}
                    ]}
                    ]
                    :
                    [
                    {tag: "div", attrs: {class:"settings__description"}, children: [
                        {tag: "h4", attrs: {}, children: ["Wallet is not encrypted"]}, 
                        {tag: "p", attrs: {}, children: ["Click on the padlock if you want to set a password and encrypt your wallet."]}
                    ]}
                    ]
                ]}
            ]}
        ]}
    );
};
