// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views
var icons = require('./icons');


var TabButton = {
    view: function (ctrl, args) {
        return (
            {tag: "a", attrs: {class: "tab--element__link" + (args.prop() === args.tab ? '--active' : ''), 
               onclick: args.prop.bind(null, args.tab) }, children: [
                 args.label
            ]}
        );
    }
};


var CreateTab = {
    view: function () {
        return (
            {tag: "div", attrs: {class:"tab--element__content"}, children: [
                {tag: "p", attrs: {}, children: ["Enter the amount of IOC to gift."]}, 

                {tag: "div", attrs: {class:"dest__entry"}, children: [
                    {tag: "div", attrs: {class:"dest__details"}, children: [
                        {tag: "div", attrs: {class:"dest__name"}, children: ["Ophie-IO"]}, 
                        {tag: "div", attrs: {class:"dest__address"}, children: ["1Baup4vVMw218kj9XsCeEA7ynC7etQNXE1"]}
                    ]}, 

                    {tag: "div", attrs: {class:"send__amount"}, children: [
                        {tag: "input", attrs: {type:"text", placeholder:"0.00"}}
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"send__dialogue"}, children: [
                    {tag: "div", attrs: {class:"send__row"}, children: [
                        {tag: "div", attrs: {class:"send__fee--details"}, children: [
                            {tag: "span", attrs: {}, children: ["Network fees"]}
                        ]}, 

                        {tag: "div", attrs: {class:"send__fee--amount"}, children: [
                            {tag: "span", attrs: {}, children: ["0.03"]}
                        ]}
                    ]}, 

                    {tag: "div", attrs: {class:"send__row"}, children: [
                        {tag: "div", attrs: {class:"send__fee--details"}, children: [
                            {tag: "span", attrs: {}, children: ["Total"]}
                        ]}, 

                        {tag: "div", attrs: {class:"send__fee--amount"}, children: [
                            {tag: "span", attrs: {}, children: ["0.03"]}
                        ]}
                    ]}, 

                    {tag: "div", attrs: {class:"send__row"}, children: [
                        {tag: "div", attrs: {class:"send__confirmation"}, children: [
                            {tag: "div", attrs: {class:"checkbox--default"}, children: [
                                {tag: "input", attrs: {type:"checkbox", id:"check1", name:"check"}}, 
                                {tag: "label", attrs: {for:"check1"}}
                            ]}, 

                            {tag: "label", attrs: {for:"check1"}, children: [
                                {tag: "span", attrs: {}, children: ["Everything looks good"]}
                            ]}
                        ]}, 

                        {tag: "a", attrs: {class:"btn btn--blue btn--hicon"}, children: [
                            icons.heart(), 
                            {tag: "span", attrs: {}, children: ["Create Giftcard"]}
                        ]}
                    ]}
                ]}
            ]}
        );
    }
};


var RedeemTab = {
    view: function () {
        return (
            {tag: "div", attrs: {class:"tab--element__content"}}
        );
    }
};


var BalanceTab = {
    view: function () {
        return (
            {tag: "div", attrs: {class:"tab--element__content"}}
        );
    }
};


var StatusTab = {
    view: function () {
        return (
            {tag: "div", attrs: {class:"tab--element__content"}}
        );
    }
};


var Gifts = module.exports;

Gifts.controller = function () {
    this.currentTab = m.prop(CreateTab);
};

Gifts.view = function (ctrl) {
    return (
        {tag: "main", attrs: {}, children: [
            {tag: "div", attrs: {class:"title title--main"}, children: [
                {tag: "h1", attrs: {}, children: ["I/O Coin Gifts"]}, 
                {tag: "div", attrs: {class:"send__source__balance"}, children: [
                    {tag: "span", attrs: {}, children: ["Balance"]}, 
                    {tag: "div", attrs: {class:"send__source__amount"}, children: ["129", {tag: "span", attrs: {class:"send__source__amount--decimal"}, children: [".041548"]}]}
                ]}
            ]}, 

            {tag: "section", attrs: {class:"gifts"}, children: [
                {tag: "div", attrs: {class:"gifts__hero"}, children: [
                    {tag: "div", attrs: {class:"gifts__description"}, children: [
                        {tag: "h3", attrs: {}, children: ["Share the love"]}, 
                        {tag: "p", attrs: {}, children: [
                            "The giftcard system lets you generate a vouchercode." + ' ' +
                            "You sent the coins to a specific address and the system will generate an unique vouchercode." + ' ' +
                            "The receiving party will be able to redeem the code in his HTML5 wallet or Android wallet." + ' ' +
                            "A nice and easy way to give away IOC to the people you know instead of sending it directly."
                        ]}
                    ]}, 

                    {tag: "div", attrs: {class:"gifts__icon"}, children: [
                        icons.gift()
                    ]}
                ]}, 

                {tag: "div", attrs: {class:"gifts__create"}, children: [
                    {tag: "div", attrs: {class:"tab--element"}, children: [
                        {tag: "div", attrs: {class:"tab--element__nav"}, children: [
                            m.component(TabButton, {tab:CreateTab, label:"Create a gift card", prop:ctrl.currentTab}), 
                            m.component(TabButton, {tab:RedeemTab, label:"Redeem", prop:ctrl.currentTab}), 
                            m.component(TabButton, {tab:BalanceTab, label:"Balance", prop:ctrl.currentTab}), 
                            m.component(TabButton, {tab:StatusTab, label:"Status", prop:ctrl.currentTab})
                        ]}
                    ]}, 

                     m.component(ctrl.currentTab()) 
                ]}
            ]}
        ]}
    );
};
