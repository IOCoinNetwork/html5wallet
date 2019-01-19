// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var LightboxPModel = require('../models/LightboxPModel'),
    RemoteWallet = require('../models/RemoteWallet');

// Views
var icons = require('./icons');


var LightboxP = module.exports;

s={message:undefined, error:0}; 


LightboxP.controller = function () {
    var self = this;

    this.invalidPassphrase = false;
    //this.message = undefined;
    this.s__ = m.prop(false);
    this.pm = m.prop(false);
    this.ready = m.prop(false);

    this.pc = undefined;
    this.p = undefined;
    this.c = undefined;

    this.onunload = function(e) {
      s.message = undefined;
      s.error = 0;
    };

    this.confirm = function (ctrl) {
        LightboxPModel.changePassphrase(this.pc, this.p).then(function () {

            //console.log("Successful");
            s.message = "Success!";
            s.error = 0;
    


        }).catch(function (error) {
            //console.log(" error.code " + error.code);
            //console.log(" error.message " + error.message);
            s.message = error.message;
            s.error = error.code;
            if (error.code != -14) {
              s.error = error.code;
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
            setTimeout(function () {
              m.startComputation();
              var callback = LightboxPModel.onSuccess;
              LightboxPModel.reset();
              if (callback !== null)
                callback();
              m.endComputation();
            }, 1000);
    }.bind(this);

    this.cancel = function () {
        var callback = LightboxPModel.onCancel;
        LightboxPModel.reset();
        if (callback !== null)
            callback();
    };

    this.inputKeypress1 = function (event) {
        this.pc = event.target.value;

        if(event.which == 13)
        {
          document.getElementById('lightbox-new-passphrase-input').focus();
          //console.log("current " + this.pc);
        }
    };
    this.inputKeypress2 = function (event) {
        this.p = event.target.value;
        if(this.p == this.c && this.p != undefined && this.c != undefined)
        {
          this.ready(true);
          this.pm(false);
        }
        else if(this.p != this.c && this.p != undefined && this.c != undefined)
        {
          this.ready(false);
          this.pm(true);
        }

        if(event.which == 13)
        {
          document.getElementById('lightbox-confirm-passphrase-input').focus();
          //console.log("new " + this.p);
        }
    };
    this.inputKeypress3 = function (event) {
        this.c = event.target.value;

        if(this.p == this.c && this.p != undefined && this.c != undefined)
        {
          this.ready(true);
          this.pm(false);
        }
        else if(this.p != this.c && this.p != undefined && this.c != undefined)
        {
          this.ready(false);
          this.pm(true);
        }

        if(event.which == 13 && this.ready())
        {
          self.confirm(this);
        }
    };
};

LightboxP.view = function (ctrl) {
    return (
        {tag: "div", attrs: {class:"lightbox"}, children: [
            {tag: "div", attrs: {class:"lightbox__container"}, children: [
                {tag: "div", attrs: {class:"lightbox__header"}, children: [
                    {tag: "h2", attrs: {}, children: ["Change your passphrase"]}, 
                    {tag: "a", attrs: {onclick: ctrl.cancel}, children: [
                        icons.close()
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"lightbox__content"}, children: [
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: ctrl.invalidPassphrase ? "lightbox--error" : "", 
                               id:"lightbox-passphrase-input", type:"password", placeholder:"Your current Passphrase", 
                               config: utils.autofocus, 
                               onkeyup: ctrl.inputKeypress1.bind(ctrl) }}, 
                        icons.key()
                    ]}, 
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: "", 
                               id:"lightbox-new-passphrase-input", type:"password", placeholder:"New passphrase", 
                               onkeyup: ctrl.inputKeypress2.bind(ctrl) }}, 
                        icons.key()
                    ]}, 
                    {tag: "label", attrs: {class:"lightbox__passphrase"}, children: [
                        {tag: "input", attrs: {class: "", 
                               id:"lightbox-confirm-passphrase-input", type:"password", placeholder:"Confirm new passphrase", 
                               onkeyup: ctrl.inputKeypress3.bind(ctrl) }}, 
                        icons.key()
                    ]}, 

                    ctrl.pm() ? [ {tag: "h2", attrs: {}, children: ["Passwords don't match"]} ] : [], 
                    s.message !== undefined ? [ {tag: "h2", attrs: {}, children: [s.message]} ] : []
                ]}, 

                {tag: "div", attrs: {class:"lightbox__buttons"}, children: [
                    {tag: "a", attrs: {class:"btn btn--red", onclick: ctrl.cancel}, children: [
                        "Cancel"
                    ]}, 
                    ctrl.ready() && s.error == 0 ? [
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon", 
                    onclick:ctrl.confirm}, children: [
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
        ]}
    );
};
