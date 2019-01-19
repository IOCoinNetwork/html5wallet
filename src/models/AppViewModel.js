var m = require('mithril');


var AppModel = {
    _subview: m.prop(null),
    subview: function (newSubview, args) {
        if (newSubview == AppModel._subview()) {
            return;
        }
        if (newSubview) {
            newSubview.args = args;
            m.redraw.strategy("all");
            AppModel._subview(newSubview);
        }
        else {
            return AppModel._subview();
        }
    },

    consoleIsOpen: m.prop(false),

    splashActive: m.prop(true)
};


module.exports = AppModel;
