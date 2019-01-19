var app = require('electron').app;  // Module to control application life.
var BrowserWindow = require('electron').BrowserWindow;  // Module to create native browser window.
var ipc = require('electron').ipcMain;
var daemon = require('./daemon');
var Menu = require('electron').Menu;
var MenuItem = require('electron').MenuItem;

var    Promise = require('promise');

// Report crashes to our server.
//require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null,
    daemonProcess = null,
    lastWalletPath;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});


DEMON_CLOSE={default:true};

EXIT_STATUS={enc:false};

//app.disableHardwareAcceleration(); 
//app.commandLine.appendSwitch("disable-cpu");

var pid__ = [];

var stop__ = function() 
{
  //XXXXconsole.log("pid");
  var psList = require('ps-list');
  psList().then(data => {
    for (var i = 0; i < data.length; i++) 
    {
      var cmd = data[i].cmd;
      if(cmd.indexOf("iocoind") !== -1)
      {
        //XXXXconsole.log(cmd);
        var pid = data[i].pid;
        //XXXXconsole.log("Kill process " + pid);               
        pid__.push(pid);
        //process.kill(pid);
      }
    }
  });
  Promise.all([psList]);
  //XXXXconsole.log("pid __");
}

process.on('exit', function () {
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    var template = [
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.reload();
                    }
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: (function() {
                        if (process.platform == 'darwin')
                            return 'Ctrl+Command+F';
                        else
                            return 'F11';
                    })(),
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: (function() {
                        if (process.platform == 'darwin')
                            return 'Alt+Command+I';
                        else
                            return 'Ctrl+Shift+I';
                    })(),
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: 'Window',
            role: 'window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                }
            ]
        }
    ];

    if (process.platform == 'darwin') {
        var name = require('app').getName();
        template.unshift({
            label: name,
            submenu: [
                {
                    label: 'About ' + name,
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Hide ' + name,
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    role: 'hideothers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() { app.quit(); }
                }
            ]
        });
        // Window menu.
        template[3].submenu.push(
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        );
    }

    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Create the browser window.
    mainWindow = new BrowserWindow({
        experimentalFeatures: true,
        width: 1180,
        height: 800,
        //height: 600,
        frame: false,
        'min-width': 840,
        'min-height': 650
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/../index.html');

    // Open the devtools.
    //mainWindow.openDevTools({detach: true});

    mainWindow.on('close', function(e) {
     if(!EXIT_STATUS.enc)
     {
      var choice = require('electron').dialog.showMessageBox(this,
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Leave demon running (recommended) ?'
       });
       if(choice == 0){
       }
       else
       {
         daemon.stopDemon(lastWalletPath);
       }
       }
      });

    // Emitted when the window is closed.
    mainWindow.on('closed', function(e) {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        //var choice = require('electron').dialog.showMessageBox(this,
        //{
        //  type: 'question',
        //  buttons: ['Yes', 'No'],
        //  title: 'Confirm',
        //  message: 'Are you sure you want to quit?'
       //});
       //if(choice == 1){
       //  e.preventDefault();
       //}
   // });
        //XXXXconsole.log('mainWindow closed');
        mainWindow = null;
    });
});


// When the renderer gives the signal, spawn the daemon.
ipc.on('spawn-daemon', function (event, walletPath) {

    //XXXXconsole.log("XXXX 1");

    if (daemonProcess && lastWalletPath === walletPath) {
        event.sender.send('spawn-daemon', null);
        return;
    }

    if (daemonProcess) {
        //daemonProcess.kill();
    }

    try {
      //XXXXconsole.log("ps list");
      const psList = require('ps-list');

      psList().then(data => {
        var found=false; 
            //XXXXconsole.log(data);
        for (var i = 0; i < data.length; i++) 
        {
          var cmd = data[i].cmd;
          if(cmd.indexOf("iocoind") !== -1)
          {
            //XXXXconsole.log(cmd);
            found=true;
          }
        }

        if(found == true)
        {
          //XXXXconsole.log("D 1");
        }
        else
        {
          //XXXXconsole.log("D 2");
          daemonProcess = daemon.spawnDaemon(walletPath);
        }
      });
    }
    catch (error) {
        event.sender.send('spawn-daemon', error.toString());
        return;
    }

    lastWalletPath = walletPath;

    // If the daemon dies, we die.
    // TODO: Just quit back to the main screen and display a message.
    //XXXXconsole.log("main.js:236 daemon process on exit, commented out");
    //daemonProcess.on('exit', function () {
    // daemonProcess = null;
    //  app.quit();
    //});

    event.sender.send('spawn-daemon', null);
});
