// Electron/Node modules

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils');

// Models
var RemoteWallet = require('../models/RemoteWallet'),
    LocalWallet = require('../models/LocalWallet');

// Views
var TransactionsTable = require('./TransactionsTable'),
    TransactionCardList = require('./TransactionCardList'),
    icons = require('./icons');


var Transactions = module.exports;


Transactions.controller = function () {
    RemoteWallet.newTransactions = 0;

    this.view = utils.transactionViewModeProp('history');

    this.filterStartDate = m.prop(null);
    this.filterEndDate = m.prop(null);

    this.transactionFilter = function (transaction) {
        if (this.filterStartDate() && transaction.time < this.filterStartDate() / 1000)
            return false;

        return !(this.filterEndDate() && transaction.time > this.filterEndDate() / 1000);
    }.bind(this);
};

Transactions.addKeysAndAliasesToTransactions = function (transactions) {
    return transactions.map(function (transaction) {
        // Try to find the contact that corresponds to their transaction's IO address.
        function byAddress(contact) {
            return contact.address === transaction.address;
        }

        var contact = _.find(LocalWallet.publicContacts, byAddress) || _.find(LocalWallet.personalContacts, byAddress);

        var address = (contact !== undefined && contact.alias !== null) ?
            contact.alias :
            transaction.address;

        return _.extend({}, transaction, {
            address: address,
            key: [
                transaction.txid,
                transaction.address,
                transaction.category,
                transaction.confirmations,
                transaction.time
            ].join('-')
        })
    });
};

Transactions.view = function (ctrl) {
    var transactions = Transactions.addKeysAndAliasesToTransactions(
        RemoteWallet.transactions.filter(ctrl.transactionFilter)
    );

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["Transaction History"]}, 

                transactions.length == 0 ? null : [
                    {tag: "div", attrs: {class:"history__filter"}, children: [
                        {tag: "label", attrs: {}, children: [{tag: "span", attrs: {}, children: ["From"]}, 
                            {tag: "input", attrs: {type:"date", name:"date-picker", 
                                   onchange:m.withAttr('valueAsNumber', ctrl.filterStartDate)}}
                        ]}, 
                        {tag: "label", attrs: {}, children: [{tag: "span", attrs: {}, children: ["To"]}, 
                            {tag: "input", attrs: {type:"date", name:"date-picker", 
                                   onchange:m.withAttr('valueAsNumber', ctrl.filterEndDate)}}
                        ]}
                    ]},

                    {tag: "a", attrs: {href:"#", "aria-label":"Table view", class:"btn btn--icon tooltip tooltip-n", 
                       onclick:ctrl.view.bind(null, 'table')}, children: [
                        icons.table()
                    ]},

                    {tag: "a", attrs: {href:"#", "aria-label":"Card view", class:"btn btn--icon tooltip tooltip-n", 
                       onclick:ctrl.view.bind(null, 'cards')}, children: [
                        icons.cards()
                    ]}
                ]
            ]}, 

            transactions.length == 0 ? null : m.component(ctrl.view(), {transactions: transactions})
        ]}
    );
};
