// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views
var TransactionCard = require('./TransactionCard');


var TransactionCardList = {
    view: function (ctrl, args) {
        return (
            <section class="history">
                <section class="column">
                    {args.transactions.filter(function (transaction) {
                        return transaction.category == 'send';

                    }).map(function (transaction) {
                        return <TransactionCard transaction={transaction} compact={args.compact}/>;
                    })}
                </section>

                {!args.compact ? [
                    <section class="column">
                        {args.transactions.filter(function (transaction) {
                            return transaction.category == 'receive';

                        }).map(function (transaction) {
                            return <TransactionCard transaction={transaction}/>;
                        })}
                    </section>
                ] : null}
            </section>
        );
    }
};

module.exports = TransactionCardList;
