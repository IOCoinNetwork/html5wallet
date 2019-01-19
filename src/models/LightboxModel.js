// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views


var LightboxModel = {
    // Should the Lightbox be visible?
    active: m.prop(false),

    // The callback to call when the user clicks the OK button.
    onSuccess: null,

    // The callback to call when the user clicks the Cancel button.
    onCancel: null,

    // The callback to call to check if the passphrase is correct.
    checkPassphrase: null,

    setPassphrase: null,

    reset: function () {
        LightboxModel.active(false);
        LightboxModel.onSuccess = null;
        LightboxModel.onCancel = null;
        LightboxModel.checkPassphrase = null;
    }
};

module.exports = LightboxModel;
