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
        <div class="lightbox">
            <div class="lightbox__container">
                <div class="lightbox__header">
                    <h2>Change your passphrase</h2>
                    <a onclick={ ctrl.cancel }>
                        {icons.close()}
                    </a>
                </div>

                <div class="lightbox__content">
                    <label class="lightbox__passphrase">
                        <input class={ ctrl.invalidPassphrase ? "lightbox--error" : ""}
                               id="lightbox-passphrase-input" type="password" placeholder="Your current Passphrase"
                               config={ utils.autofocus }
                               onkeyup={ ctrl.inputKeypress1.bind(ctrl) }/>
                        {icons.key()}
                    </label>
                    <label class="lightbox__passphrase">
                        <input class={ ""}
                               id="lightbox-new-passphrase-input" type="password" placeholder="New passphrase"
                               onkeyup={ ctrl.inputKeypress2.bind(ctrl) }/>
                        {icons.key()}
                    </label>
                    <label class="lightbox__passphrase">
                        <input class={ ""}
                               id="lightbox-confirm-passphrase-input" type="password" placeholder="Confirm new passphrase"
                               onkeyup={ ctrl.inputKeypress3.bind(ctrl) }/>
                        {icons.key()}
                    </label>

                    {ctrl.pm() ? [ <h2>Passwords don't match</h2> ] : []} 
                    {s.message !== undefined ? [ <h2>{s.message}</h2> ] : []} 
                </div>

                <div class="lightbox__buttons">
                    <a class="btn btn--red" onclick={ ctrl.cancel }>
                        Cancel
                    </a>
                    {ctrl.ready() && s.error == 0 ? [
                    <a  class="btn btn--green btn--hicon"
                    onclick={ctrl.confirm}>
                        {icons.send()}<span>Confirm</span>
                    </a>
                     ] :
                     [
                    <a class="btn btn--grey ">
                        <span>Confirm</span>
                    </a>
                     ]}
                </div>
            </div>
        </div>
    );
};
