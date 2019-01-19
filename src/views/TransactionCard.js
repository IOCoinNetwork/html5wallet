// Electron/Node modules

// Libraries
var m = require('mithril'),
    utils = require('../utils');

// Models

// Views
var icons = require('./icons');


var TransactionCard = {
    renderCardAmount: function (amount) {
        var amountSplit = amount.toString().split('.'),
            amountWhole = amountSplit[0],
            amountDecimal = amountSplit[1];

        if (amountDecimal) {
            return (
                {tag: "div", attrs: {class:"card__amount"}, children: [
                      amountWhole, {tag: "span", attrs: {class:"card__amount--decimal"}, children: [".",   amountDecimal  ]}
                ]}
            );
        }
        else {
            return {tag: "div", attrs: {class:"card__amount"}, children: [  amountWhole  ]};
        }
    },

    view: function (ctrl, args) {
        var transaction = args.transaction,
            isSent = (transaction.category == 'send'),
            spent_or_received = isSent ? 'spent' : 'received',
            confirmed = (transaction.confirmations >= 10),
            available_or_pending = confirmed ? 'available' : 'pending';

        return (
            {tag: "div", attrs: {key:  transaction.key, class:  "card card--"+spent_or_received}, children: [
                {tag: "div", attrs: {class:"card__top"}, children: [
                      TransactionCard.renderCardAmount(transaction.amount), 
                    {tag: "a", attrs: {href:"#", "aria-label":"Remove from favorites", 
                       class:"btn btn--star-remove tooltip tooltip-nw"}, children: [
                          icons.star_remove()  
                    ]}
                ]}, 

                !args.compact ? [
                    {tag: "div", attrs: {class:"card__address"}, children: [
                          transaction.address
                    ]}
                ] : null, 

                {tag: "div", attrs: {class:"card__date"}, children: [
                      utils.simplifyDate(transaction.time)  
                ]}, 

                {tag: "div", attrs: {class:  "card__conf card__conf--"+available_or_pending}, children: [
                    icons.check(), 
                    {tag: "progress", attrs: {max:"10", value:  Math.min(10, transaction.confirmations)  }}, 
                    {tag: "span", attrs: {class:"tick"}, children: [  transaction.confirmations]}
                ]}
            ]}
        );
    }
};

module.exports = TransactionCard;
