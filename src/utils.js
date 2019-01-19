var util = require('util');

var TransactionTable = require('./views/TransactionsTable');
var TransactionCardList = require('./views/TransactionCardList');

var LocalWallet = require('./models/LocalWallet');

/*
 * Various useful functions.
 *
 * ONLY PUT CODE IN HERE IF IT'S USED BY MULTIPLE FILES.
 */
var utils = module.exports;


utils.simplifyDate = function (timestamp) {
    var currentTime = Math.floor((new Date()).getTime() / 1000),
        delta = currentTime - timestamp;

    var s, unit;

    do {
        if (delta < 60) {
            s = (delta != 1) ? 's' : '';
            unit = 'second';
            break;
        }

        // Convert seconds to minutes
        delta = Math.floor(delta / 60);

        if (delta < 60) {
            s = (delta != 1) ? 's' : '';
            unit = 'minute';
            break;
        }

        // Convent minutes to hours
        delta = Math.floor(delta / 60);

        if (delta < 24) {
            s = (delta != 1) ? 's' : '';
            unit = 'hour';
            break;
        }

        // Convert hours to days
        delta = Math.floor(delta / 24);

        if (delta <= 7) {
            s = (delta != 1) ? 's' : '';
            unit = 'day';
            break;
        }

        return (new Date(timestamp * 1000)).toDateString().substr(3);

    } while (false);

    return util.format('%s %s%s ago', delta, unit, s);
};


utils.autofocus = function (element, isInitialized) {
    if (!isInitialized)
        element.focus();
};

utils.setfocus = function (element, isInitialized) {
    if (!isInitialized)
        element.focus();
};

utils.transactionViewModeProp = function (key) {
    // Make sure `key` is valid.
    if (!(key in LocalWallet.transactionViewModes)) {
        var keys = JSON.stringify(Object.keys(LocalWallet.transactionViewModes));
        throw Error('Got "' + key + '", expected one of ' + keys);
    }

    var view = LocalWallet.transactionViewModes[key] == 'table'
        ? TransactionTable
        : TransactionCardList;

    return function (value) {
        if (arguments.length == 0) {
            return view;
        }
        else if (value == 'table') {
            view = TransactionTable;
            LocalWallet.transactionViewModes[key] = 'table';
            LocalWallet.save();
        }
        else if (value == 'cards') {
            view = TransactionCardList;
            LocalWallet.transactionViewModes[key] = 'cards';
            LocalWallet.save();
        }
        else {
            throw Error('Got "' + value + '", expected one of ["table", "cards"]')
        }
	    }
};
