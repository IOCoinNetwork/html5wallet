var m = require('mithril');
var utils = require('../utils');

var RemoteWallet = require('../models/RemoteWallet');


var Console = module.exports;


Console.model = {
    messages: [],
    commandHistory: [],
    commandSelectedIndex: null,

    addMessage: function (lines) {
        var currentTime = new Date(),
            hours = currentTime.getHours(),
            minutes = currentTime.getMinutes(),
            seconds = currentTime.getSeconds(),
            twoDigitify = function (v) { return (v >= 10 ? v : '0' + v); },
            timestamp = twoDigitify(hours) + ':' + twoDigitify(minutes) + ':' + twoDigitify(seconds);

        this.messages.push({
            time: timestamp,
            lines: lines
        })
    }
};


Console.model.addMessage([
    "Welcome to the I/O Coin RPC console. ",
    "Use up and down arrows to navigate history,and Ctrl-L to clear screen. ",
    "Type help for an overview of available commands."
]);


Console.controller = function () {
    this.inputValue = m.prop("");

    var model = Console.model;

    this.handleEnterAndClear = function (event) {
        // Ctrl-L: clear the screen
        if (event.which == 12 && event.ctrlKey) {
            m.startComputation();
            model.messages = [];
            m.endComputation();
            return;
        }

        // Enter: submit command
        if (event.which == 13) {
            var arguments = this.inputValue();

            m.startComputation();
            model.addMessage([arguments]);
            model.commandHistory.push(arguments);
            model.commandSelectedIndex = null;
            this.inputValue("");
            m.endComputation();

            arguments = arguments.split(' ');
            //XXXX var command = arguments.shift().toLowerCase();
            var command = arguments.shift();

            function onSuccess(data) {
                if (typeof data == 'object') {
                    data = JSON.stringify(data, null, 2).split('\n');
                }
                else if (typeof data == 'string') {
                    data = data.split('\n');
                }
                else {
                    data = [data];
                }

                m.startComputation();
                model.addMessage(data);
                m.endComputation();
            }

            function onError(error) {
                m.startComputation();
                model.addMessage([error.message]);
                console.dir(error);
                m.endComputation();
            }

            RemoteWallet.client.rpc.call(command, arguments, onSuccess, onError);
        }
    }.bind(this);

    this.handleArrowKeys = function (event) {
        if (event.which != 38 && event.which != 40)
            return;

        var lastIndex = model.commandSelectedIndex,
            maxIndex = model.commandHistory.length - 1;

        if (maxIndex < 0)
            return;

        if (event.which == 38) { // Up Arrow key
            if (lastIndex == 0)
                return;

            if (lastIndex == null) {
                model.commandSelectedIndex = maxIndex;
            }
            else {
                model.commandSelectedIndex--;
            }
        }
        else if (event.which == 40) { // Down Arrow key
            if (lastIndex == null)
                return;

            if (lastIndex == maxIndex) {
                model.commandSelectedIndex = null;
                this.inputValue('');
                return;
            }
            else {
                model.commandSelectedIndex++;
            }
        }

        m.startComputation();
        this.inputValue(model.commandHistory[model.commandSelectedIndex]);
        m.endComputation();

    }.bind(this);
};


Console.view = function (ctrl) {
    var model = Console.model;

    var messages = model.messages.map(function (message) {
        return message.lines.map(function (line, index) {
            return (
                {tag: "div", attrs: {class:"console__result"}, children: [
                    {tag: "div", attrs: {class:"console__time"}, children: [
                         (index == 0) ? '['+message.time+']' : null
                    ]}, 
                    {tag: "pre", attrs: {class:"console__message"}, children: [
                         line 
                    ]}
                ]}
            );
        });
    });

    return (
        {tag: "div", attrs: {class:"console"}, children: [
            {tag: "div", attrs: {class:"console__body"}, children: [
                 messages 
            ]}, 
            {tag: "div", attrs: {class:"console__bottom"}, children: [
                {tag: "input", attrs: {
                    type:"text", 
                    name:"console-input", 
                    placeholder:"Enter commands", 
                    config: utils.autofocus, 
                    onkeypress: ctrl.handleEnterAndClear, 
                    onkeydown: ctrl.handleArrowKeys, 
                    oninput: m.withAttr("value", ctrl.inputValue), 
                    value: ctrl.inputValue() }
                    }
            ]}
        ]}
    );
};
