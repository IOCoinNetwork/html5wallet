// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var LightboxModel = require('../models/LightboxModel'),
    RemoteWallet = require('../models/RemoteWallet');

// Views
var icons = require('./icons');


var Lightbox = module.exports;

Lightbox.controller = function () {
    var self = this;

    this.invalidPassphrase = false;
    this.pm = m.prop(false);
    this.message = undefined;
    this.ready = m.prop(false);

    this.p = undefined;
    this.c = undefined;

    this.confirm = function () {
        var passphrase = document.getElementById('lightbox-passphrase-input').value;

        LightboxModel.checkPassphrase(passphrase).then(function () {
            m.startComputation();
            var callback = LightboxModel.onSuccess;
            LightboxModel.reset();
            if (callback !== null)
                callback();
            m.endComputation();

        }).catch(function (error) {
            if (error.code != -14) {
                console.dir(error);
                return;
            }

            m.startComputation();
            self.invalidPassphrase = true;
            m.endComputation();

            setTimeout(function () {
                m.startComputation();
                self.invalidPassphrase = false;
                m.endComputation();
            }, 1000);
        });
    };

    this.confirm_new = function () {

        if(self.message === undefined)
            self.message = "Password successfully set ! Wallet will now exit !";

        LightboxModel.setPassphrase(self.p).then(function () {
            m.startComputation();
            var callback = LightboxModel.onSuccess;
            LightboxModel.reset();
            if (callback !== null)
                callback();
            m.endComputation();

        }).catch(function (error) {
            if (error.code != -14) {
                console.dir(error);
                return;
            }

            m.startComputation();
            self.invalidPassphrase = true;
            m.endComputation();

            setTimeout(function () {
                m.startComputation();
                self.invalidPassphrase = false;
                m.endComputation();
            }, 1000);
        });
    }.bind(this);

    this.cancel = function () {
        var callback = LightboxModel.onCancel;
        LightboxModel.reset();
        if (callback !== null)
            callback();
    };

    this.inputKeypressC = function (event) {
        //console.log("char " + event.target.value);

        this.c = event.target.value;

        //console.log("this.c  " + this.c);
        //console.log("this.p  " + this.p);
        if(this.c === this.p && this.p !== '' && this.c !== '')
        {
          this.pm(false);
          this.ready(true);
        }
        else
        {
          this.pm(true);
          this.ready(false);
        }

        if(event.which == 13 && this.ready())
        {
            this.message = "Password successfully set ! Wallet will now exit !";
            this.confirm_new();
        }
    };

    this.test = function() 
    {
      if(this.ready())
      {
        document.getElementById('c').focus();
        return true;
      }
      
      return false;
      
    }.bind(this);

    this.inputKeypress = function (event) {

        this.p = event.target.value;

        if(RemoteWallet.isEncrypted)
        {
          if(event.which == 13)
          {
            this.confirm();
            return;
          }
        }

        if(this.c === this.p && this.p !== '' && this.c !== '')
        { 
          this.ready(true);
        }
        else
        {
          this.ready(false);
          if(this.c !== undefined)
            this.pm(true);
        }

        if(event.which == 13)
        {
          document.getElementById('lightbox-confirm-passphrase-input').focus();
        }
    };
};

Lightbox.view = function (ctrl) {
    return (
        {tag: "div", attrs: {class:"lightbox"}, children: [
                     RemoteWallet.isEncrypted ?  [
            {tag: "div", attrs: {class:"lightbox__container"}, children: [
                {tag: "div", attrs: {class:"lightbox__header"}, children: [
                    {tag: "h2", attrs: {}, children: ["Unlock Wallet"]}, 
                    {tag: "a", attrs: {onclick: ctrl.cancel}, children: [
                        icons.close()
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"lightbox__content"}, children: [
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: ctrl.invalidPassphrase ? "lightbox--error" : "", 
                               id:"lightbox-passphrase-input", type:"password", placeholder:"Your Passphrase", 
                               config: utils.autofocus, 
                               onkeyup: ctrl.inputKeypress.bind(ctrl) }}, 
                        icons.key()
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"lightbox__buttons"}, children: [
                    {tag: "a", attrs: {class:"btn btn--red", onclick: ctrl.cancel}, children: [
                        "Cancel"
                    ]}, 
                    {tag: "a", attrs: {class:"btn btn--green", onclick: ctrl.confirm}, children: [
                        "Confirm"
                    ]}
                ]}
            ]}
        ] :
        [
            {tag: "div", attrs: {class:"lightbox__container"}, children: [
                {tag: "div", attrs: {class:"lightbox__header"}, children: [
                    {tag: "h2", attrs: {}, children: ["Choose a passphrase, on success you must restart your wallet following the automatic shutdown"]}, 
                    {tag: "a", attrs: {onclick: ctrl.cancel}, children: [
                        icons.close()
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"lightbox__content"}, children: [
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: "", 
                               id:"lightbox-passphrase-input", type:"password", placeholder:"Your Passphrase", 
                               config: utils.autofocus, 
                               onkeyup: ctrl.inputKeypress.bind(ctrl) }}, 
                        icons.key()
                    ]}, 
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: "", 
                               id:"lightbox-confirm-passphrase-input", type:"password", placeholder:"Confirm passphrase", 
                               onkeyup: ctrl.inputKeypressC.bind(ctrl) }}, 
                        icons.key()
                    ]}, 

                    ctrl.pm() ? [ {tag: "h2", attrs: {}, children: ["Passwords don't match"]} ] : [], 
                    ctrl.message !== undefined ? [ {tag: "h2", attrs: {}, children: [ctrl.message]} ] : []
                ]}, 

                {tag: "div", attrs: {class:"lightbox__buttons"}, children: [
                    {tag: "a", attrs: {class:"btn btn--red", onclick: ctrl.cancel}, children: [
                        "Cancel"
                    ]}, 
                    ctrl.ready() ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", 
                    onclick:ctrl.confirm_new}, children: [
                        icons.send(), {tag: "span", attrs: {}, children: ["Confirm"]}
                    ]}
                     ] :
                     [
                    {tag: "a", attrs: {class:"btn btn--grey "}, children: [
                        {tag: "span", attrs: {}, children: ["Confirm"]}
                    ]}
                     ]
                ]}
            ]}
        ]
        ]}
    );
};
