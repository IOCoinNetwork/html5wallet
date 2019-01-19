// Electron/Node modules

// Libraries
var m = require('mithril');

// Models

// Views


var LightboxPModel = {
    // Should the Lightbox be visible?
    active: m.prop(false),

    // The callback to call when the user clicks the OK button.
    onSuccess: null,

    // The callback to call when the user clicks the Cancel button.
    onCancel: null,

    // The callback to call to check if the passphrase is correct.
    checkPassphrase: null,

    setPassphrase: null,
    changePassphrase: null,

    reset: function () {
        LightboxPModel.active(false);
        LightboxPModel.onSuccess = null;
        LightboxPModel.onCancel = null;
        LightboxPModel.checkPassphrase = null;
    }
};

module.exports = LightboxPModel;
