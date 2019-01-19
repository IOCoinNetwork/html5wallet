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
        return ( <div>
                            <div class="entry__address">{args.contact.address}</div>
            <div class={"wallet__primary"+(!args.primary ? '--not' : '')}>
                <div class="entry__left">
                    {args.contact.alias ? [
                <div class="favorites__cap"><span>{ args.contact.alias.substr(0, 2) }</span></div>,

                        <div class="entry__details">
                            <div class="entry__name_0">
                                <span>{args.contact.alias}</span>
                            </div>
                        </div>,
                        <div> {args.contact.alias !== "sparechange" ? [ <div>
                            {ctrl.enterAliasMode() ? (
                                <input type="text" config={utils.autofocus} onblur={ctrl.enterAliasMode.bind(ctrl, false)} onkeypress={ctrl.saveAlias}/>
                            ):(
                                <a class="btn btn--green btn--hicon btn--nostretch" onclick={ctrl.enterAliasMode.bind(ctrl, true)}>
                                    {icons.alias()}<span>Edit label</span>
                                </a>
                            )} </div> ] : [] }
                        </div>
                    ]:[
                       <div class="favorites__cap_0"></div>,

                        <div class="entry__details">
                            {ctrl.enterAliasMode() ? (
                                <input type="text" config={utils.autofocus} onblur={ctrl.enterAliasMode.bind(ctrl, false)} onkeypress={ctrl.saveAlias}/>
                            ):(
                                <a class="btn btn--green btn--hicon btn--nostretch" onclick={ctrl.enterAliasMode.bind(ctrl, true)}>
                                    {icons.alias()}<span>Set a label</span>
                                </a>
                            )}
                        </div>
                    ]}
                </div>

                <div class="entry__right">
                    <a class="btn btn--icon tooltip tooltip-n" aria-label="Receive payment">{icons.receive()}</a>
                    <a class="btn btn--icon tooltip tooltip-nw" aria-label="DIONs settings" onclick={ctrl.generateRSAKeys.bind(ctrl)}>{icons.cog()}</a>
                </div>
            </div> </div>
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
        <main>
            <div class="title title--main">
                <h1>My Wallet</h1>
                {ctrl.creatingAddress() ? [ <div>
                        {ctrl.labelError() ? [ 
                    <div class="btn btn--red">
                            <input type="text"
                                   id="new-address-input"
                                   placeholder="set a label"
                                   config={utils.autofocus}
                                   onkeyup={ctrl.checkLabel.bind(ctrl, ctrl)}/>
                    </div>
                         ] : [
                    <div class="btn btn--white">
                            <input type="text"
                                   id="new-address-input"
                                   placeholder="set a label"
                                   config={utils.autofocus}
                                   onkeyup={ctrl.checkLabel.bind(ctrl, ctrl)}/>
                    </div>
                              ]} </div> ] : [] } 
                {ctrl.creatingAddress() ? [ 
                <a class="btn btn--outline" onclick={ ctrl.cancelAddress.bind(ctrl) }>Cancel</a>
                ] : [ 
                <a class="btn btn--outline" onclick={ ctrl.newAddressDialog.bind(ctrl, ctrl) }>New Address</a>
                ]}
            </div>

            <section class="wallet">
                {defaultContact ? [
                    <h3>Spare Change Address</h3>,
                    <WalletEntry contact={ defaultContact } primary={ true }/>,

                    <h3>Additional Addresses</h3>
                ] : null}

                {LocalWallet.personalContacts.map(function (contact) {
                    if (contact == defaultContact)
                        return null;
                    return <WalletEntry key={ contact.address } contact={ contact }/>;
                })}
            </section>
        </main>
    );
};
