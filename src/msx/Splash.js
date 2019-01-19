	// Electron/Node modules
	var remote = require('electron').remote,
	    path = require('path'),
	    dialog = remote.dialog,
	    fs = require('fs');

	// Libraries
	var m = require('mithril'),
	    _ = require('underscore');

	// Models
	var AppModel = require('../models/AppViewModel'),
	    LocalWallet = require('../models/LocalWallet'),
	    RemoteWallet = require('../models/RemoteWallet');

	// Views
	var icons = require('./icons');


	// The default places where the wallet is stored on each platform.
	var defaultPathBase = {
	    win32: process.env.APPDATA,
	    darwin: path.join(process.env.HOME || '', 'Library'),
	    linux: process.env.HOME
	}[process.platform];

	var DEFAULT_PATH = path.join(defaultPathBase, 'IOCoin');

	// Set this to false to enable the splash screen.
	var SKIP_SPLASH = false;


	function loadWalletPaths() {
	    try {
		return JSON.parse(localStorage.wallets || '[]');
	    }
	    catch (error) {
		delete localStorage.wallets;
		return [];
	    }
	}
	function saveWalletPaths(paths) {
	    localStorage.wallets = JSON.stringify(paths);
	}


	var Splash = module.exports;

	Splash.controller = function () {
	    var self = this;

	    this.close = function () {
		remote.getCurrentWindow().close();
	    };

	    this.openWallet = function (walletPath) {
		self.loading(true);

		m.sync([
		    LocalWallet.initialize(walletPath),
		    RemoteWallet.initialize(walletPath)

		]).then(function () {
		    m.startComputation();
		    AppModel.splashActive(false);
		    m.endComputation();

		}, function (errors) {
		    self.loading(false);
		    m.redraw(true);

		    if (errors[0]) {
			//console.log('Error from LocalWallet.initialize:');
			//console.dir(errors[0]);
			alert('An error was encountered loading wallet data: ' + errors[0].message);
		    }
		    if (errors[1]) {
			//console.log('Error from RemoteWallet.initialize:');
			//console.dir(errors[1]);
			//alert('An error was encountered while starting or connecting to iocoind: ' + errors[1].message);
			alert('Timeout occured connecting to server, please try again!');
		    }

		}.bind(this));
	    };

	    this.newWallet = function () {
		dialog.showOpenDialog(remote.getCurrentWindow(), {
		    title: 'Choose wallet directory',
		    defaultPath: DEFAULT_PATH,
		    //properties: ['openDirectory', 'createDirectory']
		    properties: ['openDirectory']

		}, 
	function (filePaths) {
		    var walletPath = filePaths ? filePaths[0] : undefined;

                    //console.log(">>> walletPath " + walletPath);

		    if (walletPath === undefined) {
			return;
		    }

		    var wallets = loadWalletPaths();

		    // Only add the wallet if it's not already in the list.
		    if (!_.contains(wallets, walletPath)) {
			wallets.push(walletPath);
			saveWalletPaths(wallets);
		    }

		    m.startComputation();
                    //console.log("openWallet");
		    self.openWallet(walletPath);
		    m.endComputation();

          
		});
	    };

	    this.toggleDefault = function (walletPath, event) {
        event.stopPropagation();
        var checked = event.target.checked;

        if (checked) {
            localStorage.defaultWallet = walletPath;
        }
        else {
            delete localStorage.defaultWallet;
        }
    };

    this.loading = m.prop(false);

    this.choosingWallet = m.prop(false);

        //m.startComputation();
        //this.openWallet("/home/debian/data1");
        //m.endComputation();

    if (localStorage.defaultWallet != undefined) {
        m.startComputation();
        this.openWallet(localStorage.defaultWallet);
        m.endComputation();
    }
};

Splash.view = function (ctrl) {
    var wallets = loadWalletPaths();
    var stopPropagation = function (event) { event.stopPropagation(); };

    return (
        <div class="splash">
            <div class="splash__drag"></div>
            <div class="splash__control">
                <a href="#" onclick={ctrl.close}>{icons.close()}</a>
            </div>

            <div class="splash__hero">
                <h1>Welcome to your wallet</h1>
                <span class="fade--in">DIONS</span>
            </div>

            <div class="splash__inner">
                <div class="splash__inner--left">
                    <div class={"splash__logo" + (ctrl.loading() ? " logo--loading" : "")}>
                        {icons.logo()}
                        {ctrl.loading() ? null : <div class="splash__logo--copy">I/O Coin</div>}
                    </div>
                </div>

                {ctrl.loading() ? null : [
                    <div class="splash__inner--right">
                        {ctrl.choosingWallet() ? [
                            <a class="splash__button--blue" href="#"
                               onclick={ ctrl.choosingWallet.bind(ctrl, false) }>
                                {icons.send_arrow()}
                                <div class="splash__button--text">
                                    <h2>Back</h2>
                                    <span>Go back to the main menu.</span>
                                </div>
                            </a>
                        ].concat(
                            _.map(wallets, function (wallet) {
                                //console.log(">>> wallet " + wallet);
                                return (
                                    <a class="splash__button--blue" href="#"
                                       onclick={ ctrl.openWallet.bind(ctrl, wallet) }>
                                        {icons.wallet()}

                                        <div class="splash__button--text">
                                            <h2>{ path.basename(wallet) }</h2>
                                            <span>{ wallet }</span>
                                        </div>

                                        <div class="checkbox--default checkbox--rounded tooltip tooltip-n" aria-label="Make default wallet">
                                            <input type="checkbox" id="check1" name="check"
                                                   onclick={ ctrl.toggleDefault.bind(ctrl, wallet) } />
                                            <label for="check1" onclick={ stopPropagation }></label>
                                        </div>
                                    </a>
                                );
                            })
                        ):[
                            <div class="splash__button--green" href="#"
                               onclick={ ctrl.newWallet.bind(ctrl) }>
                                {icons.maximize()}
                                <div class="splash__button--text">
                                    <h2>New / Import Wallet</h2>
                                    <span>Select a new wallet directory to load from.</span>
                                </div>
                            </div>,

                            wallets.length == 0 ? null : [
                                <a class="splash__button--blue" href="#"
                                   onclick={ ctrl.choosingWallet.bind(ctrl, true) }>
                                    {icons.reload()}
                                    <div class="splash__button--text">
                                        <h2>Load Recent</h2>
                                        <span>Choose from a list of directories recently used.</span>
                                    </div>
                                </a>
                            ]
                        ]}
                    </div>
                ]}
            </div>
        </div>
    );
};
