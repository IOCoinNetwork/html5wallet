// Electron/Node modules

// Libraries
var m = require('mithril'),
    $ = require('jquery');

// Register perfect-scrollbar with jQuery
//$(document).ready(function () { 
//  require('perfect-scrollbar/jquery');
//  $('#msg').perfectScrollbar();
//
//  Ps.initialize(document.getElementById('msg'));


//});

// Models
var AppViewModel = require('../models/AppViewModel');

// Views
var icons = require('./icons'),
    App = require('./App'),
    ContactList = require('./ContactList'),
    ContactControls = require('./ContactControls'),
    ContactListViewModel = require('../models/ContactListViewModel'),
    RemoteWallet = require('../models/RemoteWallet'),
    AddressBook = require('./AddressBook');

var out = null;

window.onload = function(e) {
  //console.log("messages onload");
  out = document.getElementById("m"); 
};

msg_={mymessages:undefined}

var MessageEntry = {
    controller: function (args) {
    
    },

    view: function (ctrl, args) {
        ////console.log("  args.plain  " + args.plain);
        ////console.log("  args.status " + args.status);
        if(args.d != null)
        {
          if(args.status === "received")
            return (
                   <div>
                      <div class={"messages__body--received"}> 
                          <div><p></p></div>
                          <div class={"messages__text--details"}>
                            <span class={"messages__date"}>{args.d}</span>
                              <div class={"messages__status"}>
                                {icons.check_alt()}
                                {icons.lock_alt()}
                              </div>
                        </div>
                      </div>
                      <div class={"messages__body--received"}> 
                          <div class={"messages__text"}><p>{args.plain}</p></div>
                          <div class={"messages__text--details"}>
                              <span class={"messages__time"}>{(new Date(args.time)).getHours()}:{(new Date(args.time)).getMinutes()}</span>
                              <div class={"messages__status"}>
                                  {icons.check_alt()}
                                  {icons.lock_alt()}
                              </div>
                          </div>
                      </div>
                </div>
            );
          else if(args.status === "sent")
            return (
                   <div>
                         <div class={"messages__body--sent"}> 
                          <div><p></p></div>
                          <div class={"messages__text--details"}>
                              <span class={"messages__date"}>{args.d}</span>
                              <div class={"messages__status"}>
                                  {icons.check_alt()}
                                  {icons.lock_alt()}
                              </div>
                          </div>
                      </div>
                         <div class={"messages__body--sent"}> 
                          <div class={"messages__text"}><p>{args.plain}</p></div>
                          <div class={"messages__text--details"}>
                              <span class={"messages__time"}>{(new Date(args.time)).getHours()}:{(new Date(args.time)).getMinutes()}</span>
                              <div class={"messages__status"}>
                                  {icons.check_alt()}
                                  {icons.lock_alt()}
                              </div>
                          </div>
                      </div>
                  </div>
            );
        }
        else if(args.status === "received")
          return (
                         <div class={"messages__body--received"}> 
                          <div class={"messages__text"}><p>{args.plain}</p></div>
                          <div class={"messages__text--details"}>
                              <span class={"messages__time"}>{(new Date(args.time)).getHours()}:{(new Date(args.time)).getMinutes()}</span>
                              <div class={"messages__status"}>
                                  {icons.check_alt()}
                                  {icons.lock_alt()}
                              </div>
                          </div>
                      </div>
          );
        else if(args.status === "sent")
          return (
                         <div class={"messages__body--sent"}> 
                          <div class={"messages__text"}><p>{args.plain}</p></div>
                          <div class={"messages__text--details"}>
                              <span class={"messages__time"}>{(new Date(args.time)).getHours()}:{(new Date(args.time)).getMinutes()}</span>
                              <div class={"messages__status"}>
                                  {icons.check_alt()}
                                  {icons.lock_alt()}
                              </div>
                          </div>
                      </div>
          );

    }
};

var Messages = module.exports;

Messages.controller = function(args) {
  state.first=true;
  this.mymessages = [];

    //RemoteWallet.client.rsaMessageList().then(function(r) {
    //  msg_.mymessages = r.sort(function(a,b){return new Date(a.time) - new Date(b.time)});
    //});

  this.enterMessage = function (event) {
    this.text = event.target.value;
    if(event.which != 13 || event.target.value === '') {
      return;
    }

    this.sendMessage();
    event.target.value = '';
  }.bind(this);

  this.sendMessage = function() {
    if(this.text === "")
      return;

    RemoteWallet.client.messageSend(Messages.args.recipient, this.text, Messages.args.sender);
    this.text = "";
  }

};

var f1 = function() { var out = document.getElementById("m"); 

    //console.log(">>>>>>> f1");
var c = 0;
var add = setInterval(function() {
    // allow 1px inaccuracy by adding 1
    var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
    ////console.log(out.scrollHeight - out.clientHeight,  out.scrollTop + 1);
    //var newElement = document.createElement("div");
    //newElement.innerHTML = c++;
    //out.appendChild(newElement);
    // scroll to bottom if isScrolledToBotto
    if(isScrolledToBottom)
      out.scrollTop = out.scrollHeight - out.clientHeight;
}, 1000);

};

$(document).on('f1', function () {
  //var out = document.getElementById("m"); 
  if(out == null)
  {
    //console.log("scroll m null");
    return;
  }

  var c = 0;
  var add = setInterval(function() {
    // allow 1px inaccuracy by adding 1
    var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
    //console.log(out.scrollHeight - out.clientHeight,  out.scrollTop + 1);
    var newElement = document.createElement("div");
    newElement.innerHTML = c++;
    out.appendChild(newElement);
    // scroll to bottom if isScrolledToBotto
    if(isScrolledToBottom)
      out.scrollTop = out.scrollHeight - out.clientHeight;
}, 1000);

});

var f2 = function() {
  var o = document.getElementById("m"); 
  var out = document.getElementsByClassName("messages"); 
  o.scrollTop = o.scrollHeight - o.clientHeight;
  out.scrollTop = out.scrollHeight - out.clientHeight;
};
Messages.view = function (ctrl) {

    RemoteWallet.client.rsaMessageList().then(function(r) {
      ctrl.mymessages = r.sort(function(a,b){return new Date(a.time) - new Date(b.time)});
    });
    var prev_date = null;

    return (
        <main>
        	<ContactList/>

            <div class="wrapper" style="overflow:hidden">
                <ContactControls actionButton={(
                    <a class="btn btn--green btn--hicon tooltip tooltip-s" href="#" aria-label="View contact" onclick={AppViewModel.subview.bind(null, AddressBook)}>
                        {icons.star()}<span>Contact</span>
                    </a>
                )}/>
                <div id="m" class="messages" style="height:600px; overflow-y:scroll; overflow-x:hidden">
                {ctrl.mymessages.map(function (entry) {
                    var date = new Date(entry.time);
                    date = date.getDate() + ":" + (date.getMonth()+1) + ":" + date.getFullYear();
                    //console.log("  date " + date);
                    var date_changed=false;
                    if(date !== prev_date)
                    {
                      //console.log("  date changed " + date);
                      prev_date=date;
                      date_changed=true;
                    }

                    if(date_changed)
                    {
                      if(Messages.args.sender === entry.sender && 
                         Messages.args.recipient === entry.recipient)
                        return <MessageEntry key={entry.time} status={"received"} plain={entry.plain_text} time={entry.time} d={date}/>;

                      if(Messages.args.sender === entry.recipient && 
                         Messages.args.recipient === entry.sender)
                        return <MessageEntry key={entry.time} status={"sent"} plain={entry.plain_text} time={entry.time} d={date}/>;
                    } 
                    else
                    {
                      if(Messages.args.sender === entry.sender && 
                         Messages.args.recipient === entry.recipient)
                        return <MessageEntry key={entry.time} status={"received"} plain={entry.plain_text} time={entry.time} d={null}/>;

                      if(Messages.args.sender === entry.recipient && 
                         Messages.args.recipient === entry.sender)
                        return <MessageEntry key={entry.time} status={"sent"} plain={entry.plain_text} time={entry.time} d={null}/>;
                    }

                })}

                    <div class="messages__input">
                        <a class="messages__settings tooltip tooltip-n" href="#" aria-label="Fee settings">{icons.cog()}</a>
                        <input type="text" placeholder="Write a message..." autofocus onkeypress={ctrl.enterMessage}/>
                        <a class="messages__lock tooltip tooltip-n" href="#" aria-label="Encryption: On">{icons.lock_alt()}</a>
                        <a class="btn btn--blue" href="#" onclick={ctrl.sendMessage.bind(ctrl)}>Send</a>
                    </div>
            </div>
          </div>
        </main>
    );
};
