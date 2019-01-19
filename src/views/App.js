// Electron/Node modules
var remote = require('electron').remote;

//DIONS={block:75*500 + 1854426}; 
DIONS={block:75 * 500 + 1860837}; 
WALLET_VERSION={LATEST:80000};
RELEASE={code:"SIRIUS"};
//main.h:const int SHADE_FEATURE_UPDATE = 75 * 500 + 1854426;
//main.h:const int SHADE_FEATURE_UPDATE = 75 * 500 + 1860837;
// Libraries
var m = require('mithril'),
    $ = require('jquery');

// Register perfect-scrollbar with jQuery
//require('perfect-scrollbar/jquery')($);

// Models
var AppViewModel = require('../models/AppViewModel'),
    RemoteWallet = require('../models/RemoteWallet'),
    LocalWallet = require('../models/LocalWallet'),
    LightboxPModel = require('../models/LightboxPModel'),
    LightboxModel = require('../models/LightboxModel');

// Views
var Overview = require('./Overview'),
    Send = require('./Send'),
    ShadeSend = require('./ShadeSend'),
    MyWallet = require('./MyWallet'),
    MyShades = require('./MyShades'),
    MyNames = require('./MyNames'),
    ShowDNS = require('./ShowDNS'),
    MyRSAKeys = require('./MyRSAKeys'),
    RSAFriends = require('./RSAFriends'),
    Console = require('./Console'),
    Transactions = require('./Transactions'),
    AddressBook = require('./AddressBook'),
    Messages = require('./Messages'),
    Settings = require('./Settings'),
    Splash = require('./Splash'),
    icons = require('./icons'),
    LightboxP = require('./LightboxP'),
    Lightbox = require('./Lightbox');


var App = module.exports;


function webView(url) {
    return (
        {tag: "main", attrs: {}, children: [
            {tag: "webview", attrs: {src:url, autosize:"on", style:"height:calc(100vh - 64px)"}}
        ]}
    );
}

var MarketWebView = {
    view: webView.bind(null, "http://coinmarketcap.com/currencies/iocoin/#markets")
};

var CommunityWebView = {
    view: webView.bind(null, "http://www.iocoinhub.io/dashboard")
};
    window.addEventListener('keydown', function (e) {
        //console.log("  >>> keydown");
        if (AppViewModel.splashActive())
            return;

        //console.log("  >>> keydown 1");
        // Check for ~ key (192)
        //console.log("  >>> key code " + e.keyCode);
        if (e.keyCode == 27) {
        //console.log("  >>> keydown 2");
        //console.log("  >>> consoleIsOpen " + AppViewModel.consoleIsOpen());
            //AppViewModel.consoleIsOpen(!AppViewModel.consoleIsOpen());
            //e.preventDefault();

            // Toggle the console
            m.startComputation();
            AppViewModel.consoleIsOpen(!AppViewModel.consoleIsOpen());
            m.endComputation();
        }
    });

App.controller = function () {
    AppViewModel.subview(Overview);

    //window.addEventListener('onbeforeunload', function(e) {
    //  //console.log("onbeforeunload");
    //});

    this.minimize = function () {
        remote.getCurrentWindow().minimize();
    };
    this.maximize = function () {
        var currentWindow = remote.getCurrentWindow();

        if (currentWindow.isMaximized()) {
            currentWindow.unmaximize();
        }
        else {
            currentWindow.maximize();
        }
    };
    this.close = function () {
        remote.getCurrentWindow().close();
    }
};


//function PerfectScrollbar_config(element, isInitialized) {
//    if (!isInitialized) {
//        $(element).perfectScrollbar();
//    }
//}

var f3 = function()
{

}


var TabButton = {
    view: function (ctrl, args) {
        var active = (AppViewModel.subview() === args.view),
            classes = 'tab' + (active ? ' tab--active' : '');

        return (
            {tag: "a", attrs: {href:"#", class:classes, onclick:AppViewModel.subview.bind(null, args.view)}, children: [
                args.icon, 
                {tag: "span", attrs: {class:"tab__name"}, children: [args.label]}, 
                (typeof args.notifications == 'number') ? (
                    {tag: "div", attrs: {class:"tab__tick"}, children: [{tag: "span", attrs: {}, children: [args.notifications]}]}
                ) : null
            ]}
        );
    }
};
var TabButtonGrayOut = {
    view: function (ctrl, args) {
        var    classes = 'tab0' ;
        return (
            {tag: "a", attrs: {href:"#", class:classes}, children: [
                           
                args.icon, 
                {tag: "span", attrs: {class:"tab__name"}, children: [args.label]}
            ]}
        );
    }
};
var TabButtonLocked = {
    view: function (ctrl, args) {
        var    classes = 'tab' ;
        return (
            {tag: "a", attrs: {href:"#", class:classes, onclick:RemoteWallet.unlockWallet__.bind(null, {stayUnlocked: true, stakingOnly: false, v: args.view})}, children: [
                           
                args.icon, 
                {tag: "span", attrs: {class:"tab__name"}, children: [args.label]}
            ]}
        );
    }
};

//$(window).on('load', function(e)
//{
  //var o = document.getElementById("m"); 
  //  o.scrollTop = o.scrollHeight - o.clientHeight;

//var first=true;
state={first:true, disable:true}; 


var add = setInterval(function() {
 
  var o = document.getElementById("m"); 
  if(o)
  {
    if(state.first)
    {
      o.scrollTop = o.scrollHeight - o.clientHeight;
      state.first=false;
    }

    var isScrolledToBottom = o.scrollHeight - o.clientHeight <= o.scrollTop + 100;
    if(isScrolledToBottom)
      o.scrollTop = o.scrollHeight - o.clientHeight;
  }
}, 1000);

//});


App.view = function (ctrl) {
    if (AppViewModel.splashActive()) {
        return Splash;
    }

    ////console.log("  return 1");
    return [
        {tag: "aside", attrs: {}, children: [
            {tag: "div", attrs: {class:"logo"}, children: [icons.logo()]}, 
            {tag: "div", attrs: {class:"avatar"}, children: [
                {tag: "a", attrs: {class:"avatar__image"}, children: [
                  {tag: "img", attrs: {width:"60px", height:"60px", src:LocalWallet.avatarFile}}
                ]}
            ]}, 
            {tag: "nav", attrs: {}, children: [
                {tag: "span", attrs: {class:"category"}, children: ["Wallet"]}, 
                m.component(TabButton, {label:"Overview", view:Overview, icon:icons.home()}), 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Send Payment (Locked)", view:Send, icon:icons.send()})
                      ] : [
                m.component(TabButton, {label:"Send Payment", view:Send, icon:icons.send()})
                      ], 
                RemoteWallet.version == WALLET_VERSION.LATEST ? [ {tag: "div", attrs: {}, children: [
                RemoteWallet.currentBlock >= DIONS.block ? [
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Shade Payment (Locked)", view:ShadeSend, icon:icons.send()})
                    ] : [
                m.component(TabButton, {label:"Shade Payment", view:ShadeSend, icon:icons.send()})
                      ]
                ] : [
                m.component(TabButtonGrayOut, {label:"Shade Payment (at shade block!)", view:ShadeSend, icon:icons.send()})
                ]
                ]} ] : [
                m.component(TabButtonGrayOut, {label:"Shade Payment (upgrade!)", view:ShadeSend, icon:icons.send()})
                ], 
                m.component(TabButton, {label:"Transactions", view:Transactions, icon:icons.transaction(), 
                           notifications:(RemoteWallet.newTransactions > 0) ? RemoteWallet.newTransactions : undefined}), 
                m.component(TabButton, {label:"My Wallet", view:MyWallet, icon:icons.wallet()}), 
     
                RemoteWallet.version == WALLET_VERSION.LATEST ? [ {tag: "div", attrs: {}, children: [
                RemoteWallet.currentBlock >= DIONS.block ? [ 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"My Shades (Locked)", view:MyShades, icon:icons.wallet()})
                    ]:[
                m.component(TabButton, {label:"My Shades", view:MyShades, icon:icons.wallet()})
                    ] 
                  ] : [
                m.component(TabButtonGrayOut, {label:"My Shades (at shade block!)", view:MyShades, icon:icons.wallet()})
                      ]
                  ]} ] : [
                m.component(TabButtonGrayOut, {label:"My Shades (upgrade!)", view:MyShades, icon:icons.wallet()})
                   ], 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Dions (Locked)", view:MyNames, icon:icons.wallet()})
                    ]:[
                m.component(TabButton, {label:"Dions", view:MyNames, icon:icons.wallet()})
                    ], 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"My RSA keys (Locked)", view:MyRSAKeys, icon:icons.wallet()})
                    ]:[
                m.component(TabButton, {label:"My RSA keys", view:MyRSAKeys, icon:icons.wallet()})
                    ], 
                m.component(TabButton, {label:"Invites", view:RSAFriends, icon:icons.wallet(), notifications:(RemoteWallet.newInvitations > 0) ? RemoteWallet.newInvitations : undefined}), 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Address Book (Locked)", view:AddressBook, icon:icons.star()})
                    ]:[
                m.component(TabButton, {label:"Address Book", view:AddressBook, icon:icons.star()})
                    ], 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Messages (Locked)", view:Messages, icon:icons.chat()})
                    ]:[
                m.component(TabButton, {label:"Messages", view:Messages, icon:icons.chat()})
                    ], 
                    RemoteWallet.isLocked ? [
                m.component(TabButtonLocked, {label:"Settings (Locked)", view:Settings, icon:icons.settings()})
                    ]:[
                m.component(TabButton, {label:"Settings", view:Settings, icon:icons.settings()})
                    ]

            ]}, 

            

            !RemoteWallet.syncing ? null : [
                {tag: "div", attrs: {class:"sidebar__sync"}, children: [
                    {tag: "progress", attrs: {max:"100", value: RemoteWallet.syncProgressPercent.toString() }}, 
                    icons.loader()
                ]}
            ]
        ]},

        {tag: "header", attrs: {}, children: [
          {tag: "script", attrs: {}
          }, 
            AppViewModel.subview() == Transactions ? [ 
            {tag: "div", attrs: {class:"search"}, children: [
                icons.search(), 
                {tag: "input", attrs: {type:"search", name:"header-search", placeholder:"Search..."}}, 

                (true) ? null : [
                    {tag: "div", attrs: {class:"search__results"}, children: [
                        {tag: "ul", attrs: {}, children: [
                            {tag: "li", attrs: {}, children: [
                                {tag: "a", attrs: {}, children: [
                                    {tag: "div", attrs: {class:"search__results--item"}, children: [icons.user_card(), " ", {tag: "span", attrs: {}, children: ["Username result"]}]}, 
                                    icons.forward_arrow()
                                ]}
                            ]}, 
                            {tag: "li", attrs: {}, children: [
                                {tag: "a", attrs: {}, children: [
                                    {tag: "div", attrs: {class:"search__results--item"}, children: [icons.transaction_alt(), " ", {tag: "span", attrs: {}, children: ["Transaction result"]}]}, 
                                    icons.forward_arrow()
                                ]}
                            ]}
                        ]}
                    ]}
                ]
            ]}
            ] : [ 
            {tag: "div", attrs: {class:"search"}}
                ], 

            {tag: "div", attrs: {class:"search"}, children: [RemoteWallet.version < WALLET_VERSION.LATEST ? [
               {tag: "a", attrs: {}, children: ["Your wallet version is ", RemoteWallet.version, ", to use shade and latest features you must upgrade your wallet to the latest version"]} 
                 ] : [
                 null ]]}, 
            {tag: "div", attrs: {class:"indicators"}, children: [
                 RemoteWallet.currentBlock < DIONS.block ? [
                {tag: "a", attrs: {class:"tooltip tooltip-s", "aria-label": RemoteWallet.connections + " Connections, " + " block count " + (RemoteWallet.currentBlock) + ", " + (RELEASE.code) + ", " + (DIONS.block - RemoteWallet.currentBlock) + " blocks to stealth"}, children: [
			    icons.signal()
                ]}
                      ] : [
                {tag: "a", attrs: {class:"tooltip tooltip-s", "aria-label": RemoteWallet.connections + " Connections, " + " block count " + (RemoteWallet.currentBlock) + ", " + (RELEASE.code) + ""}, children: [
			    icons.signal()
                ]}
                         ], 

                !RemoteWallet.isStaking ? [ 
                    {tag: "a", attrs: {class:"tooltip tooltip-s", "aria-label":"Not staking"}, children: [
                        icons.pickaxe_alt()
                    ]}
                  ] : [
                    {tag: "a", attrs: {class:"tooltip tooltip-s", "aria-label":"Staking\n " +  RemoteWallet.stakingInfoString()}, children: [
                        icons.pickaxe_green()
                    ]}
                ], 

                !RemoteWallet.isEncrypted ? [ 
                        {tag: "a", attrs: {href:"#", class:"settings__lock tooltip tooltip-s", "aria-label":"Not is not encrypted (click to encrypt)", onclick: RemoteWallet.lockWallet.bind(null, {v: Overview}) }, children: [
                            icons.unlock()
                        ]}
                                             ] : [
                    RemoteWallet.isLocked ? [
                        {tag: "a", attrs: {href:"#", class:"settings__lock tooltip tooltip-s", "aria-label":"Unlock wallet", 
                           onclick: RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: false}) }, children: [
                            icons.lock()
                        ]}
                    ]:[
                        {tag: "a", attrs: {href:"#", class:"settings__lock tooltip tooltip-s", "aria-label":"Lock wallet", 
                           onclick: RemoteWallet.lockWallet.bind(null, {v: Overview}) }, children: [
                            icons.unlock()
                        ]}
                    ]
                ], 
                    {tag: "a", attrs: {class:"tooltip tooltip-s ", "aria-label":"Avatar"}, children: [
                        {tag: "img", attrs: {class:"avatar__image", width:"10px", height:"10px", src:LocalWallet.avatarFile, 
                   onclick:AppViewModel.subview.bind(AppViewModel, Settings)}}
                    ]}
            ]}, 

            {tag: "div", attrs: {class:"controls"}, children: [
                {tag: "a", attrs: {href:"#", onclick: ctrl.minimize}, children: [icons.minimize()]}, 
                {tag: "a", attrs: {href:"#", onclick: ctrl.maximize}, children: [icons.maximize()]}, 
                {tag: "a", attrs: {href:"#", onclick: ctrl.close}, children: [icons.close()]}
            ]}
        ]},

        m.component(AppViewModel.subview()),

        AppViewModel.consoleIsOpen() == true ? Console : null,

        LightboxModel.active() ? Lightbox : null,
        LightboxPModel.active() ? LightboxP : null
    ];
};

m.route(document.body, "/", {
  "/": App,
  "/showdns": ShowDNS //assuming a Login module also exists
})
