// Electron/Node modules

// Libraries
var m = require('mithril'),
    utils = require('../utils');

// Models

// Views
var icons = require('./icons');


var TableColumnHeader = {
    view: function (ctrl, args) {
        var active = args.sortProp() === args.name,
            descending = args.descendingProp();
        return (
            <div class="history__col">
                <a href="#" class={active ? "sort--active" : "sort"} onclick={args.sortProp.bind(null, args.name)}>
                    <span>{ args.label }</span>
                    { active
                        ? (descending ? icons.sort_down() : icons.sort_up())
                        : icons.sort()
                    }
                </a>
            </div>
        );
    }
};


var TableRow = {
    view: function (ctrl, args) {
        function _renderAmount(amount) {
            var amountSplit = amount.toString().split('.'),
                amountWhole = amountSplit[0],
                amountDecimal = amountSplit[1];

            if (amountDecimal) {
                return (
                    <span class={  "amount--"+sent_or_received  }>
                    {  amountWhole  }<span class="amount__decimal">.{  amountDecimal  }</span>
                </span>
                );
            }
            else {
                return <span class={  "amount--"+sent_or_received  }>{  amountWhole  }</span>;
            }
        }

        var transaction = args.transaction,
            isSent = (transaction.category == 'send'),
            sent_or_received = isSent ? 'sent' : 'received',
            received_or_pending = (transaction.confirmations >= 10) ? 'received' : 'pending',
            arrow = isSent ? icons.send_arrow() : icons.receive_arrow();


        return (
            <div key={  transaction.key  } class={  "history__row--"+sent_or_received  }>
                {!args.compact ? [
                    <div class="history__col">
                        <a href="#" aria-label="Add to favorites" class="btn btn--star-add tooltip tooltip-n">
                            {  icons.star_add()  }
                        </a>
                        <span class="address">{  transaction.address  }</span>
                        {  arrow  }
                    </div>
                ] : null}
                <div class="history__col">
                    <span class="date">{  utils.simplifyDate(transaction.time)  }</span>
                </div>
                <div class="history__col">
                    <span class={  "conf--"+received_or_pending  }>{  transaction.confirmations  }</span>
                </div>
                <div class="history__col">
                    {  _renderAmount(transaction.amount)  }

                    {!args.compact ? [
                        <a href="#" aria-label="Transaction details" class="tooltip tooltip-n">
                            {  icons.down_arrow()  }
                        </a>
                    ] : null}
                </div>
            </div>
        );
    }
};


var TransactionsTable = {
    controller: function () {
        this.sortColumn = (function () {
            var _sortColumn = m.prop('time');

            return function (value) {
                if (value == undefined)
                    return _sortColumn();

                // If the same value as before, just flip the order.
                if (value == _sortColumn()) {
                    this.sortDescending(!this.sortDescending());
                }
                else {
                    // Otherwise, update it and set the order to descending.
                    _sortColumn(value);
                    this.sortDescending(true);
                }
            }.bind(this);
        }).call(this);

        this.sortDescending = m.prop(true);

        this.sortTransactions = function (a, b) {
            var field = this.sortColumn(),
                order = (this.sortDescending() ? 1 : -1),
                ret;

            if (a[field] < b[field])
                ret = 1;
            else if (a[field] > b[field])
                ret = -1;
            else
                ret = 0;

            return ret * order;
        }.bind(this);
    },

    view: function (ctrl, args) {
        args.transactions.sort(ctrl.sortTransactions);

        return (
            <section class="history">
                <div class="history__table">
                    <div class="history__row--header">
                        {!args.compact ? [
                            <TableColumnHeader name="address" label="Address"
                                               sortProp={ctrl.sortColumn} descendingProp={ctrl.sortDescending}/>
                        ] : null}

                        <TableColumnHeader name="time" label="Date"
                                           sortProp={ctrl.sortColumn} descendingProp={ctrl.sortDescending}/>

                        <TableColumnHeader name="confirmations" label={args.compact ? 'Confirms' : 'Confirmations'}
                                           sortProp={ctrl.sortColumn} descendingProp={ctrl.sortDescending}/>

                        <TableColumnHeader name="amount" label="Amount"
                                           sortProp={ctrl.sortColumn} descendingProp={ctrl.sortDescending}/>
                    </div>

                    {args.transactions.map(function (transaction) {
                        return <TableRow transaction={transaction} compact={args.compact}/>;
                    })}
                </div>
            </section>
        );
    }
};

module.exports = TransactionsTable;
