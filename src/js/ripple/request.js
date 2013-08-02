var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var UInt160      = require('./uint160').UInt160;
var Currency     = require('./currency').Currency;
var Transaction  = require('./transaction').Transaction;
var Account      = require('./account').Account;
var Meta         = require('./meta').Meta;
var OrderBook    = require('./orderbook').OrderBook;

// Request events emitted:
//  'success' : Request successful.
//  'error'   : Request failed.
//  'remoteError'
//  'remoteUnexpected'
//  'remoteDisconnected'
function Request(remote, command) {
  EventEmitter.call(this);
  this.remote     = remote;
  this.requested  = false;
  this.message    = {
    command : command,
    id      : void(0)
  };
};

util.inherits(Request, EventEmitter);

// Send the request to a remote.
Request.prototype.request = function (remote) {
  if (!this.requested) {
    this.requested  = true;
    this.remote.request(this);
    this.emit('request', remote);
  }
};

Request.prototype.callback = function(callback, successEvent, errorEvent) {
  if (callback && typeof callback === 'function') {
    this.once(successEvent || 'success', callback.bind(this, null));
    this.once(errorEvent   || 'error'  , callback.bind(this));
    this.request();
  }

  return this;
};

Request.prototype.timeout = function(duration, callback) {
  if (!this.requested) {
    this.once('request', this.timeout.bind(this, duration, callback));
    return;
  };

  var self      = this;
  var emit      = this.emit;
  var timed_out = false;

  var timeout = setTimeout(function() {
    timed_out = true;
    if (typeof callback === 'function') callback();
    emit.call(self, 'timeout');
  }, duration);

  this.emit = function() {
    if (timed_out) return;
    else clearTimeout(timeout);
    emit.apply(self, arguments);
  };

  return this;
};

Request.prototype.build_path = function (build) {
  if (build) {
    this.message.build_path = true;
  }

  return this;
};

Request.prototype.ledger_choose = function (current) {
  if (current) {
    this.message.ledger_index = this.remote._ledger_current_index;
  } else {
    this.message.ledger_hash  = this.remote._ledger_hash;
  }

  return this;
};

// Set the ledger for a request.
// - ledger_entry
// - transaction_entry
Request.prototype.ledger_hash = function (h) {
  this.message.ledger_hash  = h;

  return this;
};

// Set the ledger_index for a request.
// - ledger_entry
Request.prototype.ledger_index = function (ledger_index) {
  this.message.ledger_index  = ledger_index;

  return this;
};

Request.prototype.ledger_select = function (ledger_spec) {
  switch (ledger_spec) {
    case 'current':
    case 'closed':
    case 'verified':
      this.message.ledger_index = ledger_spec;
      break;

    default:
      // XXX Better test needed
      if (String(ledger_spec).length > 12) {
        this.message.ledger_hash  = ledger_spec;
      } else {
        this.message.ledger_index  = ledger_spec;
      }
      break;
  }

  return this;
};

Request.prototype.account_root = function (account) {
  this.message.account_root  = UInt160.json_rewrite(account);

  return this;
};

Request.prototype.index = function (hash) {
  this.message.index  = hash;

  return this;
};

// Provide the information id an offer.
// --> account
// --> seq : sequence number of transaction creating offer (integer)
Request.prototype.offer_id = function (account, seq) {
  this.message.offer = {
    account:  UInt160.json_rewrite(account),
    seq:      seq
  };

  return this;
};

// --> index : ledger entry index.
Request.prototype.offer_index = function (index) {
  this.message.offer  = index;

  return this;
};

Request.prototype.secret = function (s) {
  if (s) {
    this.message.secret  = s;
  }

  return this;
};

Request.prototype.tx_hash = function (h) {
  this.message.tx_hash  = h;

  return this;
};

Request.prototype.tx_json = function (j) {
  this.message.tx_json  = j;

  return this;
};

Request.prototype.tx_blob = function (j) {
  this.message.tx_blob  = j;

  return this;
};

Request.prototype.ripple_state = function (account, issuer, currency) {
  this.message.ripple_state  = {
    'accounts' : [
      UInt160.json_rewrite(account),
      UInt160.json_rewrite(issuer)
    ],
    'currency' : currency
  };

  return this;
};

Request.prototype.accounts = function (accounts, realtime) {
  if (!Array.isArray(accounts)) {
    accounts = [ accounts ];
  }

  // Process accounts parameters
  var procAccounts = accounts.map(function(account) {
    return UInt160.json_rewrite(account);
  });
  
  if (realtime) {
    this.message.rt_accounts = procAccounts;
  } else {
    this.message.accounts = procAccounts;
  }

  return this;
};

Request.prototype.rt_accounts = function (accounts) {
  return this.accounts(accounts, true);
};

Request.prototype.books = function (books, snapshot) {
  var procBooks = [];

  for (var i = 0, l = books.length; i < l; i++) {
    var book = books[i];
    var json = {};

    function processSide(side) {
      if (!book[side]) throw new Error('Missing '+side);

      var obj = json[side] = {
        currency: Currency.json_rewrite(book[side].currency)
      };
      
      if (obj.currency !== 'XRP') {
        obj.issuer = UInt160.json_rewrite(book[side].issuer);
      }
    }

    processSide('taker_gets');
    processSide('taker_pays');

    if (snapshot) json.snapshot = true;
    if (book.both) json.both = true; 

    procBooks.push(json);
  }

  this.message.books = procBooks;

  return this;
};

exports.Request = Request;
