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
                <div class="card__amount">
                    {  amountWhole  }<span class="card__amount--decimal">.{  amountDecimal  }</span>
                </div>
            );
        }
        else {
            return <div class="card__amount">{  amountWhole  }</div>;
        }
    },

    view: function (ctrl, args) {
        var transaction = args.transaction,
            isSent = (transaction.category == 'send'),
            spent_or_received = isSent ? 'spent' : 'received',
            confirmed = (transaction.confirmations >= 10),
            available_or_pending = confirmed ? 'available' : 'pending';

        return (
            <div key={  transaction.key  } class={  "card card--"+spent_or_received  }>
                <div class="card__top">
                    {  TransactionCard.renderCardAmount(transaction.amount)  }
                    <a href="#" aria-label="Remove from favorites"
                       class="btn btn--star-remove tooltip tooltip-nw">
                        {  icons.star_remove()  }
                    </a>
                </div>

                {!args.compact ? [
                    <div class="card__address">
                        {  transaction.address  }
                    </div>
                ] : null}

                <div class="card__date">
                    {  utils.simplifyDate(transaction.time)  }
                </div>

                <div class={  "card__conf card__conf--"+available_or_pending  }>
                    {icons.check()}
                    <progress max="10" value={  Math.min(10, transaction.confirmations)  }></progress>
                    <span class="tick">{  transaction.confirmations  }</span>
                </div>
            </div>
        );
    }
};

module.exports = TransactionCard;
