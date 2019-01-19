// Electron/Node modules
var util = require('util');

// Libraries
var m = require('mithril'),
    _ = require('underscore'),
    utils = require('../utils'),
    moment = require('moment');

// Models
var RemoteWallet = require('../models/RemoteWallet'),
    AppViewModel = require('../models/AppViewModel'),
    LightboxModel = require('../models/LightboxModel');

// Views
var Send = require('./Send'),
    CreateDION = require('./CreateDION'),
    Transactions = require('./Transactions'),
    TransactionsTable = require('./TransactionsTable'),
    TransactionCard = require('./TransactionCard'),
    TransactionCardList = require('./TransactionCardList'),
    icons = require('./icons');


var Overview = module.exports;

Overview.controller = function () {
    this.transactionView = utils.transactionViewModeProp('overview');
};

Overview.view = function (ctrl) {
    var sevenDaysAgo = moment().subtract(7, 'days');

    // Make a local copy of the transactions with a unique key added.
    var transactions = Transactions.addKeysAndAliasesToTransactions(
        RemoteWallet.transactions.filter(function (transaction) {
            return transaction.time >= sevenDaysAgo.unix();
        }).slice(0, 5)
    );

    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title"}, children: [
                {tag: "h1", attrs: {}, children: ["Wallet Overview"]}, 
           DIONS.block == -1 || RemoteWallet.currentBlock >= DIONS.block ? [
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, CreateDION)}, children: [
                    "Create DION"
                ]} ] : [ 
                {tag: "a", attrs: {href:"#", class:"btn btn--outline"
                   }, children: [
                    "Create DION"
                  ]}
                 ], 
                {tag: "a", attrs: {href:"#", class:"btn btn--outline", 
                   onclick:AppViewModel.subview.bind(AppViewModel, Send)}, children: [
                    "Send"
                ]}, 
                RemoteWallet.isStaking ? [
                    {tag: "a", attrs: {href:"#", class:"btn btn--outline", onclick: RemoteWallet.lockWallet}, children: [
                        "Disable Staking"
                    ]}
                ]:[
                    {tag: "a", attrs: {href:"#", class:"btn btn--green tooltip tooltip-s", "aria-label":"Earn I/O Coins by staking", 
                       onclick: RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: true}) }, children: [
                        "Enable Staking"
                    ]}
                ]
            ]}, 

            {tag: "section", attrs: {class:"balance"}, children: [
                {tag: "section", attrs: {class:"column"}, children: [
                    {tag: "div", attrs: {class:"card card--available"}, children: [
                        TransactionCard.renderCardAmount(RemoteWallet.availableFunds), 
                        icons.check()
                    ]}
                ]}, 
                {tag: "section", attrs: {class:"column"}, children: [
                    {tag: "div", attrs: {class:"card card--pending"}, children: [
                        TransactionCard.renderCardAmount(RemoteWallet.pendingFunds), 
                        icons.pending()
                    ]}
                ]}, 
                RemoteWallet.stakedFunds > 0 ? [
                {tag: "section", attrs: {class:"column"}, children: [
                    {tag: "div", attrs: {class:"card card--staked"}, children: [
                        TransactionCard.renderCardAmount(RemoteWallet.stakedFunds), 
                        icons.pending()
                    ]}
                ]} ] : [ ]
            ]}, 

            transactions.length == 0 ? [
                {tag: "div", attrs: {class:"title title--secondary"}, children: [
                    {tag: "h2", attrs: {}, children: ["Recent Transactions"]}
                ]}
            ]:[
                {tag: "div", attrs: {class:"title title--secondary"}, children: [
                    {tag: "h2", attrs: {}, children: ["Recent Transactions"]}, 
                    {tag: "a", attrs: {href:"#", "aria-label":"Table view", class:"btn btn--icon tooltip tooltip-n", 
                       onclick:ctrl.transactionView.bind(null, 'table')}, children: [
                        icons.table()
                    ]}, 
                    {tag: "a", attrs: {href:"#", "aria-label":"Card view", class:"btn btn--icon tooltip tooltip-n", 
                       onclick:ctrl.transactionView.bind(null, 'cards')}, children: [
                        icons.cards()
                    ]}
                ]},

                m.component(ctrl.transactionView(), {transactions: transactions}),

                {tag: "a", attrs: {href:"#", class:"btn btn--outline btn--center", onclick:AppViewModel.subview.bind(AppViewModel, Transactions)}, children: ["Show all transactions"]}
            ]
        ]}
    );
};
