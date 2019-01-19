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
        <main>
            <div class="title">
                <h1>Wallet Overview</h1>
           {DIONS.block == -1 || RemoteWallet.currentBlock >= DIONS.block ? [
                <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, CreateDION)}>
                    Create DION
                </a> ] : [ 
                <a href="#" class="btn btn--outline"
                   >
                    Create DION
                  </a>
                 ]}
                <a href="#" class="btn btn--outline"
                   onclick={AppViewModel.subview.bind(AppViewModel, Send)}>
                    Send
                </a>
                {RemoteWallet.isStaking ? [
                    <a href="#" class="btn btn--outline" onclick={ RemoteWallet.lockWallet }>
                        Disable Staking
                    </a>
                ]:[
                    <a href="#" class="btn btn--green tooltip tooltip-s" aria-label="Earn I/O Coins by staking"
                       onclick={ RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: true}) }>
                        Enable Staking
                    </a>
                ]}
            </div>

            <section class="balance">
                <section class="column">
                    <div class="card card--available">
                        {TransactionCard.renderCardAmount(RemoteWallet.availableFunds)}
                        {icons.check()}
                    </div>
                </section>
                <section class="column">
                    <div class="card card--pending">
                        {TransactionCard.renderCardAmount(RemoteWallet.pendingFunds)}
                        {icons.pending()}
                    </div>
                </section>
                {RemoteWallet.stakedFunds > 0 ? [
                <section class="column">
                    <div class="card card--staked">
                        {TransactionCard.renderCardAmount(RemoteWallet.stakedFunds)}
                        {icons.pending()}
                    </div>
                </section> ] : [ ] }
            </section>

            {transactions.length == 0 ? [
                <div class="title title--secondary">
                    <h2>Recent Transactions</h2>
                </div>
            ]:[
                <div class="title title--secondary">
                    <h2>Recent Transactions</h2>
                    <a href="#" aria-label="Table view" class="btn btn--icon tooltip tooltip-n"
                       onclick={ctrl.transactionView.bind(null, 'table')}>
                        {icons.table()}
                    </a>
                    <a href="#" aria-label="Card view" class="btn btn--icon tooltip tooltip-n"
                       onclick={ctrl.transactionView.bind(null, 'cards')}>
                        {icons.cards()}
                    </a>
                </div>,

                m.component(ctrl.transactionView(), {transactions: transactions}),

                <a href="#" class="btn btn--outline btn--center" onclick={AppViewModel.subview.bind(AppViewModel, Transactions)}>Show all transactions</a>
            ]}
        </main>
    );
};
