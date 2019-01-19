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
        {tag: "div", attrs: {class:"splash"}, children: [
            {tag: "div", attrs: {class:"splash__drag"}}, 
            {tag: "div", attrs: {class:"splash__control"}, children: [
                {tag: "a", attrs: {href:"#", onclick:ctrl.close}, children: [icons.close()]}
            ]}, 

            {tag: "div", attrs: {class:"splash__hero"}, children: [
                {tag: "h1", attrs: {}, children: ["Welcome to your wallet"]}, 
                {tag: "span", attrs: {class:"fade--in"}, children: ["DIONS"]}
            ]}, 

            {tag: "div", attrs: {class:"splash__inner"}, children: [
                {tag: "div", attrs: {class:"splash__inner--left"}, children: [
                    {tag: "div", attrs: {class:"splash__logo" + (ctrl.loading() ? " logo--loading" : "")}, children: [
                        icons.logo(), 
                        ctrl.loading() ? null : {tag: "div", attrs: {class:"splash__logo--copy"}, children: ["I/O Coin"]}
                    ]}
                ]}, 

                ctrl.loading() ? null : [
                    {tag: "div", attrs: {class:"splash__inner--right"}, children: [
                        ctrl.choosingWallet() ? [
                            {tag: "a", attrs: {class:"splash__button--blue", href:"#", 
                               onclick: ctrl.choosingWallet.bind(ctrl, false) }, children: [
                                icons.send_arrow(), 
                                {tag: "div", attrs: {class:"splash__button--text"}, children: [
                                    {tag: "h2", attrs: {}, children: ["Back"]}, 
                                    {tag: "span", attrs: {}, children: ["Go back to the main menu."]}
                                ]}
                            ]}
                        ].concat(
                            _.map(wallets, function (wallet) {
                                //console.log(">>> wallet " + wallet);
                                return (
                                    {tag: "a", attrs: {class:"splash__button--blue", href:"#", 
                                       onclick: ctrl.openWallet.bind(ctrl, wallet) }, children: [
                                        icons.wallet(), 

                                        {tag: "div", attrs: {class:"splash__button--text"}, children: [
                                            {tag: "h2", attrs: {}, children: [ path.basename(wallet) ]}, 
                                            {tag: "span", attrs: {}, children: [ wallet ]}
                                        ]}, 

                                        {tag: "div", attrs: {class:"checkbox--default checkbox--rounded tooltip tooltip-n", "aria-label":"Make default wallet"}, children: [
                                            {tag: "input", attrs: {type:"checkbox", id:"check1", name:"check", 
                                                   onclick: ctrl.toggleDefault.bind(ctrl, wallet) }}, 
                                            {tag: "label", attrs: {for:"check1", onclick: stopPropagation }}
                                        ]}
                                    ]}
                                );
                            })
                        ):[
                            {tag: "div", attrs: {class:"splash__button--green", href:"#", 
                               onclick: ctrl.newWallet.bind(ctrl) }, children: [
                                icons.maximize(), 
                                {tag: "div", attrs: {class:"splash__button--text"}, children: [
                                    {tag: "h2", attrs: {}, children: ["New / Import Wallet"]}, 
                                    {tag: "span", attrs: {}, children: ["Select a new wallet directory to load from."]}
                                ]}
                            ]},

                            wallets.length == 0 ? null : [
                                {tag: "a", attrs: {class:"splash__button--blue", href:"#", 
                                   onclick: ctrl.choosingWallet.bind(ctrl, true) }, children: [
                                    icons.reload(), 
                                    {tag: "div", attrs: {class:"splash__button--text"}, children: [
                                        {tag: "h2", attrs: {}, children: ["Load Recent"]}, 
                                        {tag: "span", attrs: {}, children: ["Choose from a list of directories recently used."]}
                                    ]}
                                ]}
                            ]
                        ]
                    ]}
                ]
            ]}
        ]}
    );
};
