var path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    child_process = require('child_process'),
    os = require('os'),
    app = require('electron').app;


function _checkDaemonCredentials(walletPath) {
    var rpc_username, rpc_password,
        config_file_path = path.join(walletPath, 'iocoin.conf');

    var configExists;

    configExists = fs.existsSync(config_file_path);

    // If the config directory doesn't exist, create it to prevent crash at `fs.openSync`.
    if (!configExists && !fs.existsSync(walletPath)) {
        fs.mkdirSync(walletPath);
    }

    if (configExists) {
        // Read the contents of the config file.
        var config_data = fs.readFileSync(config_file_path).toString('ascii'),
        // Remove Windows newlines and split the lines in the config up.
            config_lines = config_data.replace('\r', '').split('\n'),
            config_options = {},
            config_regex = /(.+)=(.+)/;

        // Parse each line.
        config_lines.map(function (line) {
            var match = config_regex.exec(line),
                key = null,
                value = null;

            if (match) {
                key = match[1];
                value = match[2];
            }

            if (key && value) {
                config_options[key] = value;
            }
        });

        if (config_options['rpcuser'] && config_options['rpcpassword']) {
            return;
        }
    }

    rpc_username = 'iocoinrpc';
    // Generate a random 32-character hex password.
    rpc_password = crypto.randomBytes(16).toString('hex');

    // Write the config file.
    var data = ['', 'rpcuser=' + rpc_username, 'rpcpassword=' + rpc_password].join('\n');
    var config_file = fs.openSync(config_file_path, 'a');
    fs.writeSync(config_file, data);
    fs.closeSync(config_file);
}

function stopDemon(p)
{
  console.log("stop demon " + p);
    var exePath,
        platform = os.platform();

    if (platform == 'win32' || platform == 'win64') {
        if (process.env['ProgramFiles(x86)']) {
            exePath = process.env['ProgramFiles(x86)'] + '\\DIONS HTML5 Wallet\\iocoind.exe';
        }
        else {
            exePath = process.env['ProgramFiles'] + '\\DIONS HTML5 Wallet\\iocoind.exe';
        }
    }
    else {
        // The daemon should be somewhere in their PATH, `/usr/bin/local` by default.
        exePath = '/usr/local/bin/iocoind';
    }

    console.log("spawn daemon");
  return child_process.spawn(exePath, ['--datadir='+p, 'stop'] , { detached: true });
}

function spawnDaemon(walletPath) {
    console.log("spawnDaemon " + walletPath);
    var exePath,
        platform = os.platform();

    // Ensure that the config file exists and contains credentials first.
    _checkDaemonCredentials(walletPath);

    if (platform == 'win32' || platform == 'win64') {
        if (process.env['ProgramFiles(x86)']) {
            exePath = process.env['ProgramFiles(x86)'] + '\\DIONS HTML5 Wallet\\iocoind.exe';
        }
        else {
            exePath = process.env['ProgramFiles'] + '\\DIONS HTML5 Wallet\\iocoind.exe';
        }
    }
    else {
        // The daemon should be somewhere in their PATH, `/usr/bin/local` by default.
        exePath = '/usr/local/bin/iocoind';
    }

    console.log("spawn daemon");
    //return child_process.spawn(exePath, ['-server', '-min', '-splash=0', '--datadir='+walletPath] , { detached: true });
    var p = child_process.spawn(exePath, ['-server', '-min', '-splash=0', '--datadir='+walletPath] , { detached: true });
    p.on('exit', function () {
     p = null;
     EXIT_STATUS.enc=true;
      app.quit();
    });
    return p;
}


module.exports = {
    spawnDaemon: spawnDaemon,
    stopDemon: stopDemon
};
