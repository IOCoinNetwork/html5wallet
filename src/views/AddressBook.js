// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var LocalWallet = require('../models/LocalWallet'),
    RemoteWallet = require('../models/RemoteWallet'),
    ContactListViewModel = require('../models/ContactListViewModel'),
    AppViewModel = require('../models/AppViewModel');

// Views
var icons = require('./icons'),
    ContactList = require('./ContactList'),
    ContactControls = require('./ContactControls'),
    TransactionsTable = require('./TransactionsTable'),
    TransactionCardList = require('./TransactionCardList'),
    Messages = require('./Messages');


var AddressBook = module.exports;

var aToD = function(entry) {
    var tmp = RemoteWallet.client.addressToDion(entry.sender)
    .then(function(r) { 
      //console.log(" tmp r " + r);
      //console.log(" e.sender " + entry.sender);
      m.startComputation();
      entry.alias = r;
      m.endComputation();
      //fulfill();
    });
};

AddressBook.controller = function (args) {
    this.transactionView = utils.transactionViewModeProp('addressBook');
};

AddressBook.view = function (ctrl, args) {
    //console.log("AddressBook.view");
    var contact = _.find(LocalWallet.publicContacts, function (contact) {
        return contact.address === ContactListViewModel.selectedAddress();
    });
    rsaContact = ContactListViewModel.selectedAddress();
    //aToD(rsaContact);

    //var contactName = (contact && contact.alias) || 'Unknown';
    var contactName = rsaContact && rsaContact.alias || 'Unknown';

    var transactions = !contact ? [] : RemoteWallet.transactions.filter(function (transaction) {
        return transaction.category == 'send' && transaction.address == contact.address;
    });

    //console.log("rsaContact " + rsaContact);
    return (
        {tag: "main", attrs: {}, children: [
            ContactList, 

            {tag: "div", attrs: {class:"wrapper"}, children: [
                m.component(ContactControls, {actionButton:(
                    {tag: "a", attrs: {class:"btn btn--green btn--hicon tooltip tooltip-s", href:"#", "aria-label":"Send a message", onclick:AppViewModel.subview.bind(null, Messages, args=rsaContact)}, children: [
                        icons.chat(), {tag: "span", attrs: {}, children: ["Chat"]}
                    ]}
                )})

            ]}
        ]}
    );
};
