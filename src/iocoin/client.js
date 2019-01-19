var commands = require('./commands'),
    rpc = require('./jsonrpc'),
    Promise = require('promise');

//===----------------------------------------------------------------------===//
// Client
//===----------------------------------------------------------------------===//
function Client(opts) {
    this.rpc = new rpc.Client(opts);
}


//===----------------------------------------------------------------------===//
// cmd
//===----------------------------------------------------------------------===//
Client.prototype.cmd = function () {
    var args = [].slice.call(arguments);
    var cmd = args.shift();

    console.log(cmd);
    console.log(args);
    callRpc(cmd, args, this.rpc);
};


//===----------------------------------------------------------------------===//
// Initialize wrappers
//===----------------------------------------------------------------------===//
(function () {

    for (var protoFn in commands) {
        (function (protoFn) {
            Client.prototype[protoFn] = function () {
                var args = [].slice.call(arguments),
                    thisClient = this;

                return new Promise(function (fulfill, reject) {
                    thisClient.rpc.call(commands[protoFn], args, fulfill, reject);
                });
            };
        })(protoFn);
    }

})();

// Export!
module.exports.Client = Client;
