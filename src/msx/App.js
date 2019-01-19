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
        <main>
            <webview src={url} autosize="on" style="height:calc(100vh - 64px)"/>
        </main>
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
            <a href="#" class={classes} onclick={AppViewModel.subview.bind(null, args.view)}>
                {args.icon}
                <span class="tab__name">{args.label}</span>
                {(typeof args.notifications == 'number') ? (
                    <div class="tab__tick"><span>{args.notifications}</span></div>
                ) : null}
            </a>
        );
    }
};
var TabButtonGrayOut = {
    view: function (ctrl, args) {
        var    classes = 'tab0' ;
        return (
            <a href="#" class={classes}>
                           
                {args.icon}
                <span class="tab__name">{args.label}</span>
            </a>
        );
    }
};
var TabButtonLocked = {
    view: function (ctrl, args) {
        var    classes = 'tab' ;
        return (
            <a href="#" class={classes} onclick={RemoteWallet.unlockWallet__.bind(null, {stayUnlocked: true, stakingOnly: false, v: args.view})}>
                           
                {args.icon}
                <span class="tab__name">{args.label}</span>
            </a>
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
        return <Splash/>;
    }

    ////console.log("  return 1");
    return [
        <aside>
            <div class="logo">{icons.logo()}</div>
            <div class="avatar">
                <a class="avatar__image"  >
                  <img width="60px" height="60px" src={LocalWallet.avatarFile} />
                </a>
            </div>
            <nav>
                <span class="category">Wallet</span>
                <TabButton label="Overview" view={Overview} icon={icons.home()}/>
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="Send Payment (Locked)" view={Send} icon={icons.send()}/>
                      ] : [
                <TabButton label="Send Payment" view={Send} icon={icons.send()}/>
                      ]}
                {RemoteWallet.version == WALLET_VERSION.LATEST ? [ <div>
                {RemoteWallet.currentBlock >= DIONS.block ? [
                    RemoteWallet.isLocked ? [
                <TabButtonLocked label="Shade Payment (Locked)" view={ShadeSend} icon={icons.send()}/>
                    ] : [
                <TabButton label="Shade Payment" view={ShadeSend} icon={icons.send()}/>
                      ]
                ] : [
                <TabButtonGrayOut label="Shade Payment (at shade block!)" view={ShadeSend} icon={icons.send()}/>
                ]}
                </div> ] : [
                <TabButtonGrayOut label="Shade Payment (upgrade!)" view={ShadeSend} icon={icons.send()}/>
                ]}
                <TabButton label="Transactions" view={Transactions} icon={icons.transaction()}
                           notifications={(RemoteWallet.newTransactions > 0) ? RemoteWallet.newTransactions : undefined}/>
                <TabButton label="My Wallet" view={MyWallet} icon={icons.wallet()}/>
     
                {RemoteWallet.version == WALLET_VERSION.LATEST ? [ <div>
                {RemoteWallet.currentBlock >= DIONS.block ? [ 
                    RemoteWallet.isLocked ? [
                <TabButtonLocked label="My Shades (Locked)" view={MyShades} icon={icons.wallet()}/>
                    ]:[
                <TabButton label="My Shades" view={MyShades} icon={icons.wallet()}/>
                    ] 
                  ] : [
                <TabButtonGrayOut label="My Shades (at shade block!)" view={MyShades} icon={icons.wallet()}/>
                      ]}
                  </div> ] : [
                <TabButtonGrayOut label="My Shades (upgrade!)" view={MyShades} icon={icons.wallet()}/>
                   ]}
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="Dions (Locked)" view={MyNames} icon={icons.wallet()}/>
                    ]:[
                <TabButton label="Dions" view={MyNames} icon={icons.wallet()}/>
                    ]}
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="My RSA keys (Locked)" view={MyRSAKeys} icon={icons.wallet()}/>
                    ]:[
                <TabButton label="My RSA keys" view={MyRSAKeys} icon={icons.wallet()}/>
                    ]}
                <TabButton label="Invites" view={RSAFriends} icon={icons.wallet()} notifications={(RemoteWallet.newInvitations > 0) ? RemoteWallet.newInvitations : undefined}/>
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="Address Book (Locked)" view={AddressBook} icon={icons.star()}/>
                    ]:[
                <TabButton label="Address Book" view={AddressBook} icon={icons.star()}/>
                    ]}
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="Messages (Locked)" view={Messages} icon={icons.chat()}/>
                    ]:[
                <TabButton label="Messages" view={Messages} icon={icons.chat()}/>
                    ]}
                    {RemoteWallet.isLocked ? [
                <TabButtonLocked label="Settings (Locked)" view={Settings} icon={icons.settings()}/>
                    ]:[
                <TabButton label="Settings" view={Settings} icon={icons.settings()}/>
                    ]}

            </nav>

            

            {!RemoteWallet.syncing ? null : [
                <div class="sidebar__sync">
                    <progress max="100" value={ RemoteWallet.syncProgressPercent.toString() }></progress>
                    {icons.loader()}
                </div>
            ]}
        </aside>,

        <header>
          <script>
          </script>
            {AppViewModel.subview() == Transactions ? [ 
            <div class="search">
                {icons.search()}
                <input type="search" name="header-search" placeholder="Search..."/>

                {(true) ? null : [
                    <div class="search__results">
                        <ul>
                            <li>
                                <a>
                                    <div class="search__results--item">{icons.user_card()} <span>Username result</span></div>
                                    {icons.forward_arrow()}
                                </a>
                            </li>
                            <li>
                                <a>
                                    <div class="search__results--item">{icons.transaction_alt()} <span>Transaction result</span></div>
                                    {icons.forward_arrow()}
                                </a>
                            </li>
                        </ul>
                    </div>
                ]}
            </div>
            ] : [ 
            <div class="search"></div>
                ]}

            <div class="search">{RemoteWallet.version < WALLET_VERSION.LATEST ? [
               <a>Your wallet version is {RemoteWallet.version}, to use shade and latest features you must upgrade your wallet to the latest version</a> 
                 ] : [
                 null ]}</div>
            <div class="indicators">
                 {RemoteWallet.currentBlock < DIONS.block ? [
                <a class="tooltip tooltip-s" aria-label={ RemoteWallet.connections + " Connections, " + " block count " + (RemoteWallet.currentBlock) + ", " + (RELEASE.code) + ", " + (DIONS.block - RemoteWallet.currentBlock) + " blocks to stealth"}>
			    {icons.signal()}
                </a>
                      ] : [
                <a class="tooltip tooltip-s" aria-label={ RemoteWallet.connections + " Connections, " + " block count " + (RemoteWallet.currentBlock) + ", " + (RELEASE.code) + ""}>
			    {icons.signal()}
                </a>
                         ]}

                {!RemoteWallet.isStaking ? [ 
                    <a class="tooltip tooltip-s" aria-label="Not staking">
                        {icons.pickaxe_alt()}
                    </a>
                  ] : [
                    <a class="tooltip tooltip-s" aria-label={"Staking\n " +  RemoteWallet.stakingInfoString()}>
                        {icons.pickaxe_green()}
                    </a>
                ]}

                {!RemoteWallet.isEncrypted ? [ 
                        <a href="#" class="settings__lock tooltip tooltip-s" aria-label="Not is not encrypted (click to encrypt)" onclick={ RemoteWallet.lockWallet.bind(null, {v: Overview}) }>
                            {icons.unlock()}
                        </a>
                                             ] : [
                    RemoteWallet.isLocked ? [
                        <a href="#" class="settings__lock tooltip tooltip-s" aria-label="Unlock wallet"
                           onclick={ RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: false}) }>
                            {icons.lock()}
                        </a>
                    ]:[
                        <a href="#" class="settings__lock tooltip tooltip-s" aria-label="Lock wallet"
                           onclick={ RemoteWallet.lockWallet.bind(null, {v: Overview}) }>
                            {icons.unlock()}
                        </a>
                    ]
                ]}
                    <a class="tooltip tooltip-s " aria-label="Avatar">
                        <img class="avatar__image" width="10px" height="10px" src={LocalWallet.avatarFile}
                   onclick={AppViewModel.subview.bind(AppViewModel, Settings)}/>
                    </a>
            </div>

            <div class="controls">
                <a href="#" onclick={ ctrl.minimize }>{icons.minimize()}</a>
                <a href="#" onclick={ ctrl.maximize }>{icons.maximize()}</a>
                <a href="#" onclick={ ctrl.close }>{icons.close()}</a>
            </div>
        </header>,

        m.component(AppViewModel.subview()),

        AppViewModel.consoleIsOpen() == true ? <Console/> : null,

        LightboxModel.active() ? <Lightbox/> : null,
        LightboxPModel.active() ? <LightboxP/> : null
    ];
};

m.route(document.body, "/", {
  "/": App,
  "/showdns": ShowDNS //assuming a Login module also exists
})
