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
            {tag: "div", attrs: {class:"history__col"}, children: [
                {tag: "a", attrs: {href:"#", class:active ? "sort--active" : "sort", onclick:args.sortProp.bind(null, args.name)}, children: [
                    {tag: "span", attrs: {}, children: [ args.label]}, 
                     active
                        ? (descending ? icons.sort_down() : icons.sort_up())
                        : icons.sort()
                    
                ]}
            ]}
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
                    {tag: "span", attrs: {class:  "amount--"+sent_or_received}, children: [
                      amountWhole, {tag: "span", attrs: {class:"amount__decimal"}, children: [".",   amountDecimal  ]}
                ]}
                );
            }
            else {
                return {tag: "span", attrs: {class:  "amount--"+sent_or_received}, children: [  amountWhole  ]};
            }
        }

        var transaction = args.transaction,
            isSent = (transaction.category == 'send'),
            sent_or_received = isSent ? 'sent' : 'received',
            received_or_pending = (transaction.confirmations >= 10) ? 'received' : 'pending',
            arrow = isSent ? icons.send_arrow() : icons.receive_arrow();


        return (
            {tag: "div", attrs: {key:  transaction.key, class:  "history__row--"+sent_or_received}, children: [
                !args.compact ? [
                    {tag: "div", attrs: {class:"history__col"}, children: [
                        {tag: "a", attrs: {href:"#", "aria-label":"Add to favorites", class:"btn btn--star-add tooltip tooltip-n"}, children: [
                              icons.star_add()  
                        ]}, 
                        {tag: "span", attrs: {class:"address"}, children: [  transaction.address]}, 
                          arrow  
                    ]}
                ] : null, 
                {tag: "div", attrs: {class:"history__col"}, children: [
                    {tag: "span", attrs: {class:"date"}, children: [  utils.simplifyDate(transaction.time)  ]}
                ]}, 
                {tag: "div", attrs: {class:"history__col"}, children: [
                    {tag: "span", attrs: {class:  "conf--"+received_or_pending}, children: [  transaction.confirmations]}
                ]}, 
                {tag: "div", attrs: {class:"history__col"}, children: [
                      _renderAmount(transaction.amount), 

                    !args.compact ? [
                        {tag: "a", attrs: {href:"#", "aria-label":"Transaction details", class:"tooltip tooltip-n"}, children: [
                              icons.down_arrow()  
                        ]}
                    ] : null
                ]}
            ]}
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
            {tag: "section", attrs: {class:"history"}, children: [
                {tag: "div", attrs: {class:"history__table"}, children: [
                    {tag: "div", attrs: {class:"history__row--header"}, children: [
                        !args.compact ? [
                            m.component(TableColumnHeader, {name:"address", label:"Address", 
                                               sortProp:ctrl.sortColumn, descendingProp:ctrl.sortDescending})
                        ] : null, 

                        m.component(TableColumnHeader, {name:"time", label:"Date", 
                                           sortProp:ctrl.sortColumn, descendingProp:ctrl.sortDescending}), 

                        m.component(TableColumnHeader, {name:"confirmations", label:args.compact ? 'Confirms' : 'Confirmations', 
                                           sortProp:ctrl.sortColumn, descendingProp:ctrl.sortDescending}), 

                        m.component(TableColumnHeader, {name:"amount", label:"Amount", 
                                           sortProp:ctrl.sortColumn, descendingProp:ctrl.sortDescending})
                    ]}, 

                    args.transactions.map(function (transaction) {
                        return m.component(TableRow, {transaction:transaction, compact:args.compact});
                    })
                ]}
            ]}
        );
    }
};

module.exports = TransactionsTable;
