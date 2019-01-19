// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views
var TransactionCard = require('./TransactionCard');


var TransactionCardList = {
    view: function (ctrl, args) {
        return (
            {tag: "section", attrs: {class:"history"}, children: [
                {tag: "section", attrs: {class:"column"}, children: [
                    args.transactions.filter(function (transaction) {
                        return transaction.category == 'send';

                    }).map(function (transaction) {
                        return m.component(TransactionCard, {transaction:transaction, compact:args.compact});
                    })
                ]}, 

                !args.compact ? [
                    {tag: "section", attrs: {class:"column"}, children: [
                        args.transactions.filter(function (transaction) {
                            return transaction.category == 'receive';

                        }).map(function (transaction) {
                            return m.component(TransactionCard, {transaction:transaction});
                        })
                    ]}
                ] : null
            ]}
        );
    }
};

module.exports = TransactionCardList;
