// Electron/Node modules

// Libraries
var m = require('mithril'),
    utils = require('../utils');

// Models
var ContactListViewModel = require('../models/ContactListViewModel'),
    RemoteWallet = require('../models/RemoteWallet'),
    LocalWallet = require('../models/LocalWallet');

// Views
var icons = require('./icons');


var ContactControls = module.exports;

ContactControls.controller = function () {
    this.addContactMode = m.prop(false);
    this.enterAddContactMode = this.addContactMode.bind(this, true);
    this.switchingInputs = m.prop();

    var self = this;

    this.addContactInputBlur = function () {
        self.switchingInputs(false);

        setImmediate(function () {
            if (!self.switchingInputs()) {
                m.startComputation();
                self.addContactMode(false);
                m.endComputation();
            }
        });
    };

    this.addContactInputFocus = function () {
        self.switchingInputs(true);
    };

    this.addContactEnter = function (event) {
        if (event.which !== 13 || event.target.value === '') {
            return;
        }

        var nameInput = document.getElementById('add-contact-name'),
            addressInput = document.getElementById('add-contact-address');

        if (event.target === nameInput && addressInput.value === '') {
            addressInput.focus();
            return;
        }
        if (event.target === addressInput && nameInput.value === '') {
            nameInput.focus();
            return;
        }

        var name = nameInput.value,
            address = addressInput.value;

        RemoteWallet.client.validateAddress(address).then(function (result) {
            if (!result.isvalid) {
                return window.alert('That address is not valid.');
            }

            if (result.ismine) {
                return window.alert('That address belongs to yourself.');
            }

            var contactMatchesAddress = function (contact) {
                return contact.address === address;
            };

            if (LocalWallet.publicContacts.filter(contactMatchesAddress).length > 0) {
                return window.alert('Your contacts already contains that address.');
            }

            m.startComputation();

            LocalWallet.addContact('public', address, name);

            self.addContactMode(false);

            ContactListViewModel.selectedAddress(address);

            m.endComputation();
        });
    };

    this.delete = function (address) {
        LocalWallet.publicContacts = LocalWallet.publicContacts.filter(function (contact) {
            return contact.address != address;
        });
        LocalWallet.save();
        ContactListViewModel.init(LocalWallet.publicContacts);
    };
};

ContactControls.view = function (ctrl, args) {
    var selectedAddress = ContactListViewModel.selectedAddress();

    return (
        <div class="favorites__controls">
            {ctrl.addContactMode() ? [
                <div class="favorites__view">
                    <label>
                        Name:
                        <input id="add-contact-name" type="text"
                               onkeypress={ctrl.addContactEnter}
                               onblur={ctrl.addContactInputBlur}
                               onfocus={ctrl.addContactInputFocus}
                               config={utils.autofocus}
                            />
                    </label>

                    <label>
                        Address:
                        <input id="add-contact-address" type="text"
                               onkeypress={ctrl.addContactEnter}
                               onblur={ctrl.addContactInputBlur}
                               onfocus={ctrl.addContactInputFocus}
                            />
                    </label>
                </div>
            ]:[
                <div class="favorites__view">
                    {selectedAddress && args && args.actionButton}
                </div>,

                <div class="favorites__modify">
                    {selectedAddress ? [
                        <a class="btn btn--icon-small-red tooltip tooltip-s" href="#" aria-label="Delete"
                           onclick={ ctrl.delete.bind(ctrl, selectedAddress) }>
                            {icons.remove()}
                        </a>
                    ] : null}
                </div>
            ]}
        </div>
    );
};
