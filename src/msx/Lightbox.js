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
        <div class="lightbox">
                    { RemoteWallet.isEncrypted ?  [
            <div class="lightbox__container">
                <div class="lightbox__header">
                    <h2>Unlock Wallet</h2>
                    <a onclick={ ctrl.cancel }>
                        {icons.close()}
                    </a>
                </div>

                <div class="lightbox__content">
                    <label class="lightbox__passphrase">
                        <input class={ ctrl.invalidPassphrase ? "lightbox--error" : ""}
                               id="lightbox-passphrase-input" type="password" placeholder="Your Passphrase"
                               config={ utils.autofocus }
                               onkeyup={ ctrl.inputKeypress.bind(ctrl) }/>
                        {icons.key()}
                    </label>
                </div>

                <div class="lightbox__buttons">
                    <a class="btn btn--red" onclick={ ctrl.cancel }>
                        Cancel
                    </a>
                    <a class="btn btn--green" onclick={ ctrl.confirm }>
                        Confirm
                    </a>
                </div>
            </div>
        ] :
        [
            <div class="lightbox__container">
                <div class="lightbox__header">
                    <h2>Choose a passphrase, on success you must restart your wallet following the automatic shutdown</h2>
                    <a onclick={ ctrl.cancel }>
                        {icons.close()}
                    </a>
                </div>

                <div class="lightbox__content">
                    <label class="lightbox__passphrase">
                        <input class={ ""}
                               id="lightbox-passphrase-input" type="password" placeholder="Your Passphrase"
                               config={ utils.autofocus }
                               onkeyup={ ctrl.inputKeypress.bind(ctrl) }/>
                        {icons.key()}
                    </label>
                    <label class="lightbox__passphrase">
                        <input class={ ""}
                               id="lightbox-confirm-passphrase-input" type="password" placeholder="Confirm passphrase"
                               onkeyup={ ctrl.inputKeypressC.bind(ctrl) }/>
                        {icons.key()}
                    </label>

                    {ctrl.pm() ? [ <h2>Passwords don't match</h2> ] : []} 
                    {ctrl.message !== undefined ? [ <h2>{ctrl.message}</h2> ] : []} 
                </div>

                <div class="lightbox__buttons">
                    <a class="btn btn--red" onclick={ ctrl.cancel }>
                        Cancel
                    </a>
                    {ctrl.ready() ? [
                    <a  class="btn btn--green btn--hicon"
                    onclick={ctrl.confirm_new}>
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
        ]} 
        </div>
    );
};
