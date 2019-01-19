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
        <main>
            <div class="title title--main">
                <h1>Transaction History</h1>

                {transactions.length == 0 ? null : [
                    <div class="history__filter">
                        <label><span>From</span>
                            <input type="date" name="date-picker"
                                   onchange={m.withAttr('valueAsNumber', ctrl.filterStartDate)}/>
                        </label>
                        <label><span>To</span>
                            <input type="date" name="date-picker"
                                   onchange={m.withAttr('valueAsNumber', ctrl.filterEndDate)}/>
                        </label>
                    </div>,

                    <a href="#" aria-label="Table view" class="btn btn--icon tooltip tooltip-n"
                       onclick={ctrl.view.bind(null, 'table')}>
                        {icons.table()}
                    </a>,

                    <a href="#" aria-label="Card view" class="btn btn--icon tooltip tooltip-n"
                       onclick={ctrl.view.bind(null, 'cards')}>
                        {icons.cards()}
                    </a>
                ]}
            </div>

            {transactions.length == 0 ? null : m.component(ctrl.view(), {transactions: transactions})}
        </main>
    );
};
