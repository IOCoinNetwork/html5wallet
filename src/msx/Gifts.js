// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views
var icons = require('./icons');


var TabButton = {
    view: function (ctrl, args) {
        return (
            <a class={ "tab--element__link" + (args.prop() === args.tab ? '--active' : '') }
               onclick={ args.prop.bind(null, args.tab) }>
                { args.label }
            </a>
        );
    }
};


var CreateTab = {
    view: function () {
        return (
            <div class="tab--element__content">
                <p>Enter the amount of IOC to gift.</p>

                <div class="dest__entry">
                    <div class="dest__details">
                        <div class="dest__name">Ophie-IO</div>
                        <div class="dest__address">1Baup4vVMw218kj9XsCeEA7ynC7etQNXE1</div>
                    </div>

                    <div class="send__amount">
                        <input type="text" placeholder="0.00" />
                    </div>
                </div>

                <div class="send__dialogue">
                    <div class="send__row">
                        <div class="send__fee--details">
                            <span>Network fees</span>
                        </div>

                        <div class="send__fee--amount">
                            <span>0.03</span>
                        </div>
                    </div>

                    <div class="send__row">
                        <div class="send__fee--details">
                            <span>Total</span>
                        </div>

                        <div class="send__fee--amount">
                            <span>0.03</span>
                        </div>
                    </div>

                    <div class="send__row">
                        <div class="send__confirmation">
                            <div class="checkbox--default">
                                <input type="checkbox" id="check1" name="check" />
                                <label for="check1"></label>
                            </div>

                            <label for="check1">
                                <span>Everything looks good</span>
                            </label>
                        </div>

                        <a class="btn btn--blue btn--hicon">
                            {icons.heart()}
                            <span>Create Giftcard</span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
};


var RedeemTab = {
    view: function () {
        return (
            <div class="tab--element__content"></div>
        );
    }
};


var BalanceTab = {
    view: function () {
        return (
            <div class="tab--element__content"></div>
        );
    }
};


var StatusTab = {
    view: function () {
        return (
            <div class="tab--element__content"></div>
        );
    }
};


var Gifts = module.exports;

Gifts.controller = function () {
    this.currentTab = m.prop(CreateTab);
};

Gifts.view = function (ctrl) {
    return (
        <main>
            <div class="title title--main">
                <h1>I/O Coin Gifts</h1>
                <div class="send__source__balance">
                    <span>Balance</span>
                    <div class="send__source__amount">129<span class="send__source__amount--decimal">.041548</span></div>
                </div>
            </div>

            <section class="gifts">
                <div class="gifts__hero">
                    <div class="gifts__description">
                        <h3>Share the love</h3>
                        <p>
                            The giftcard system lets you generate a vouchercode.
                            You sent the coins to a specific address and the system will generate an unique vouchercode.
                            The receiving party will be able to redeem the code in his HTML5 wallet or Android wallet.
                            A nice and easy way to give away IOC to the people you know instead of sending it directly.
                        </p>
                    </div>

                    <div class="gifts__icon">
                        {icons.gift()}
                    </div>
                </div>

                <div class="gifts__create">
                    <div class="tab--element">
                        <div class="tab--element__nav">
                            <TabButton tab={CreateTab} label="Create a gift card" prop={ctrl.currentTab} />
                            <TabButton tab={RedeemTab} label="Redeem" prop={ctrl.currentTab} />
                            <TabButton tab={BalanceTab} label="Balance" prop={ctrl.currentTab} />
                            <TabButton tab={StatusTab} label="Status" prop={ctrl.currentTab} />
                        </div>
                    </div>

                    { m.component(ctrl.currentTab()) }
                </div>
            </section>
        </main>
    );
};
