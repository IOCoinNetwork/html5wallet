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
            {tag: "a", attrs: {href:"#", 
               class: (args.contact.confirmed === "true") ? [ "favorites__list"+active ] : [ "favorites__list" ], 

               onclick: ContactListViewModel.selectedAddress.bind(null, args.contact) }, children: [

                {tag: "div", attrs: {class:"favorites__cap"}, children: [{tag: "span", attrs: {}, children: [ name.substr(0, 2) ]}]}, 
                {tag: "div", attrs: {class:"favorites__name"}, children: [
                    editMode ? [
                        {tag: "input", attrs: {type:"text", 
                               config:utils.autofocus, 
                               onblur:ContactListViewModel.editMode.bind(null, false), 
                               onkeypress:ctrl.editContactEnter.bind(ctrl, args.contact)}
                            }
                    ]:[
                        {tag: "span", attrs: {}, children: [ name ]}
                    ], 

                    {tag: "span", attrs: {}, children: [ sender ]}
                ]}, 
                args.counter ? {tag: "div", attrs: {class:"favorites__tick"}, children: [{tag: "span", attrs: {}, children: [ args.counter]}]} : null
            ]}
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
        {tag: "div", attrs: {class:"favorites"}, children: [
            ctrl.rsafriends.map(function (contact) {
                if(!(contact.confirmed === "true" && contact.status === "imported"))
                {
                  return;
                }

                var counter;
                if (args && args.counterFunction)
                    counter = args.counterFunction(contact.sender);
                
                
                return m.component(ContactListItem, {key:contact.sender+'-'+contact.sender, contact:contact, counter:counter})
            })
        ]}
    );
};
