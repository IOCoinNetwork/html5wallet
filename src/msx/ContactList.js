// Electron/Node modules

// Libraries
var m = require('mithril'),
    utils = require('../utils');

// Models
var LocalWallet = require('../models/LocalWallet'),
    ContactListViewModel = require('../models/ContactListViewModel'),
    RemoteWallet = require('../models/RemoteWallet');

// Views

var aToD = function(e) {
    var tmp = RemoteWallet.client.addressToDion(e.sender)
    .then(function(r) { 
      //console.log(" tmp r " + r);
      //console.log(" sendder_address " + e.sender);
      m.startComputation();
      e.alias = r;
      m.endComputation();
      //fulfill();
    });
};

var ContactListItem = {
    controller: function () {
        this.editContactEnter = function (contact, event) {
            var newName = event.target.value,
                key = event.which;

            if (key != 13 || newName == '')
                return;

            m.startComputation();
            contact.alias = newName;
            LocalWallet.save();
            ContactListViewModel.editMode(false);
            m.endComputation();
        };
    },

    view: function (ctrl, args) {
        var name = args.contact.alias || 'Unknown',
            sender = args.contact.sender,
            selectedAddress = ContactListViewModel.selectedAddress();

            var senderAddr;
            if(typeof selectedAddress !== "undefined" && selectedAddress != null)
              senderAddr = selectedAddress.sender;

            var active = ( sender === senderAddr) ? '--active' : '';

            var editMode = ContactListViewModel.editMode() && (sender === senderAddress);

        return (
            <a href="#"
               class={ (args.contact.confirmed === "true") ? [ "favorites__list"+active ] : [ "favorites__list" ] }

               onclick={ ContactListViewModel.selectedAddress.bind(null, args.contact) }>

                <div class="favorites__cap"><span>{ name.substr(0, 2) }</span></div>
                <div class="favorites__name">
                    {editMode ? [
                        <input type="text"
                               config={utils.autofocus}
                               onblur={ContactListViewModel.editMode.bind(null, false)}
                               onkeypress={ctrl.editContactEnter.bind(ctrl, args.contact)}
                            />
                    ]:[
                        <span>{ name }</span>
                    ]}

                    <span>{ sender }</span>
                </div>
                {args.counter ? <div class="favorites__tick"><span>{ args.counter }</span></div> : null}
            </a>
        );
    }
};


var ContactList = module.exports;
ContactList.controller = function ()
{
    this.rsafriends = 
        RemoteWallet.rsafriends;
                  this.rsafriends.map(function(e) {
                    aToD(e);
                  });
}

ContactList.view = function (ctrl, args) {
    return (
        <div class="favorites">
            {ctrl.rsafriends.map(function (contact) {
                if(!(contact.confirmed === "true" && contact.status === "imported"))
                {
                  return;
                }

                var counter;
                if (args && args.counterFunction)
                    counter = args.counterFunction(contact.sender);
                
                
                return <ContactListItem key={contact.sender+'-'+contact.sender} contact={contact} counter={counter}/>
            })}
        </div>
    );
};
