// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views


var ContactListViewModel = {
    selectedAddress: m.prop(null),

    editMode: m.prop(false),

    init: function (contacts) {
        var self = ContactListViewModel;

        if (contacts.length > 0) {
            self.selectedAddress(contacts[0].address);
        }
        else {
            self.selectedAddress(null);
        }

        self.editMode(false);
    }
};

module.exports = ContactListViewModel;