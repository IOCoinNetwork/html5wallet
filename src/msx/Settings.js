// Electron/Node modules
var remote = require('electron').remote,
    dialog = remote.dialog,
    utils = require('../utils'),
    path = require('path');

// Libraries
var m = require('mithril');

// Models
var RemoteWallet = require('../models/RemoteWallet'),
    LocalWallet = require('../models/LocalWallet');

var UploadAvatar = require('./UploadAvatar.js');

// Views
var icons = require('./icons');
var Overview = require('./Overview');


var defaultBackupPath = path.join.apply(path, {
    win32: [process.env.USERPROFILE, 'Desktop'],
    darwin: [process.env.HOME, 'Desktop'],
    linux: [process.env.HOME, 'Desktop']
}[process.platform]);

//var defaultAvatarPath =  'views/temp_assets/avatar.jpg';
// The default places where the wallet is stored on each platform.
var defaultPathBase = {
    win32: process.env.APPDATA,
    darwin: path.join(process.env.HOME || '', 'Library'),
    linux: process.env.HOME
}[process.platform];
var DEFAULT_PATH = path.join(defaultPathBase, 'IOCoin');

var Settings = module.exports;

Settings.controller = function () {
    this.enterAliasMode = m.prop(false);

    this.saveAlias = function (event) {
      if (event.which != 13)
        return;

      this.enterAliasMode(false);

      r = event.srcElement.value;
      var t = 1 == 1;
      //console.log("  set reserve " + r + "<");
      RemoteWallet.client.reserveBalance(parseFloat(r)).catch(function(e) {
        //console.log("error.code " + e.code); 
        //console.log("error.message " + e.message); 
      });
    }.bind(this);

    this.setAvatar = function () {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
	    title: 'Choose avatar file',
	    defaultPath: DEFAULT_PATH,
	    properties: ['openFile']
      },
      function (filePath) {
      //console.log("filePath " + filePath);
      if(filePath != null)
      {
        LocalWallet.avatarFile = filePath;
        LocalWallet.save();
      }
      });
    };
    this.backupWallet = function () {
        dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Choose location to save wallet backup',
            defaultPath: path.join(defaultBackupPath, 'wallet.dat')

        }, function (backupPath) {
            if (backupPath === undefined) {
                return;
            }
            RemoteWallet.client.backupWallet(backupPath);
        })
    };

    this.toggleLoadAtStartup = function (event) {
        event.stopPropagation();
        var checked = event.target.checked;

        if (checked) {
            localStorage.defaultWallet = RemoteWallet.walletPath;
        }
        else {
            delete localStorage.defaultWallet;
        }
    };
};

Settings.view = function (ctrl) {
    return (
        <main>
        	<div class="title title--main">
        		<h1>Settings</h1>
                <a class="btn btn--blue" href="#" onclick={ ctrl.backupWallet }>Backup Wallet</a>
        	</div>

            <section class="settings">
                <div class="settings__entry">
                    <div class="settings__profile">
                        <a class="avatar__image tooltip tooltip-n" href="#" aria-label="Change avatar"
                   onclick={ctrl.setAvatar}>
                            <img width="110px" height="110px" src={LocalWallet.avatarFile}/>
                        </a>

                        <div class="settings__stats">
                            <div class="settings__stats--value">{ RemoteWallet.transactions.length }</div>
                            <div class="settings__stats--cat">Transactions</div>
                        </div>

                        <div class="settings__stats">
                            <div class="settings__stats--value">{ LocalWallet.personalContacts.length }</div>
                            <div class="settings__stats--cat">Addresses</div>
                        </div>

                        <div class="settings__stats">
                            <div class="settings__stats--value">{ LocalWallet.publicContacts.length }</div>
                            <div class="settings__stats--cat">Contacts</div>
                        </div>
                    </div>

                    {RemoteWallet.isLocked ? (
                        <a class="settings__lock tooltip tooltip-n" href="#" aria-label="Wallet is locked"
                           onclick={ RemoteWallet.unlockWallet.bind(null, {stayUnlocked: true, stakingOnly: false}) }>
                            { icons.lock() }
                        </a>
                    ):(
                        <a class="settings__lock tooltip tooltip-nw" href="#"
                           aria-label={ RemoteWallet.isEncrypted ? "Wallet is unlocked" : "Wallet is unencrypted (click to encrypt it)" }
                           onclick={ RemoteWallet.lockWallet.bind(null, {v: Overview}) }>
                            { icons.unlock() }
                        </a>
                    )}
                </div>
            </section>

            <section class="settings">
                <h3>Blockchain</h3>

                {RemoteWallet.syncing ? [
                    <h5>Syncing in progress ({ RemoteWallet.currentBlock } / { RemoteWallet.highestBlock } blocks)</h5>
                ]:[
                    <h5>Syncing complete</h5>
                ]}

                <div class="settings__entry">
                    <div class="settings__sync">
                        <progress max="100" value={ RemoteWallet.syncProgressPercent.toString() }></progress>

                        <div class="settings__sync--percentage">
                            <span>{ RemoteWallet.syncProgressPercent }%</span>
                        </div>
                    </div>

                    {!RemoteWallet.syncing ? null : [
                        <div class="settings__sync--spinner">{ icons.loader() }</div>
                    ]}
                </div>
            </section>

            <section class="settings">
                <h3>Wallet Settings</h3>

                <div class="settings__entry">
                    <div class="settings__description">
                        <h4>Load At Startup</h4>
                        <p>Load this wallet on startup, skipping the wallet selection screen.</p>
                    </div>

                    <div class="settings__switch">
                        <input id="load-at-startup-checkbox" class="switch" type="checkbox"
                               checked={ localStorage.defaultWallet !== undefined ? 'checked' : null }
                               onclick={ ctrl.toggleLoadAtStartup } />
                        <label for="load-at-startup-checkbox"></label>
                    </div>
                </div>
                <div class="settings__entry">
                    <div class="settings__description">
                        <h4>Reserve balance</h4>
                        <p>Here you can set a reserve balance that will not be used for staking.</p>
                        <p>Your current reserved balance is {RemoteWallet.reserveamount} IOC</p>
                    </div>

                    <div>
                            {ctrl.enterAliasMode() ? (
                                <input type="text" config={utils.autofocus} onblur={ctrl.enterAliasMode.bind(ctrl, false)} onkeypress={ctrl.saveAlias}/>
                            ):(
                                <a class="btn btn--green btn--hicon btn--nostretch" onclick={ctrl.enterAliasMode.bind(ctrl, true)}>
                                    {icons.alias()}<span>Set reserve</span>
                                </a>
                            )}
                    </div>
                </div>
                <div class="settings__entry">
                  {RemoteWallet.isEncrypted ? [
                    <section>
                    <div class="settings__description">
                        <h4>Change password</h4>
                        <p>Click here to change your password.</p>
                    </div>

                    <div>
                      <a class="btn btn--blue" href="#" onclick={ RemoteWallet.changePassword}>Change password</a>
                    </div>
                    </section>
                    ]
                    :
                    [
                    <div class="settings__description">
                        <h4>Wallet is not encrypted</h4>
                        <p>Click on the padlock if you want to set a password and encrypt your wallet.</p>
                    </div>
                    ]}
                </div>
            </section>
        </main>
    );
};
