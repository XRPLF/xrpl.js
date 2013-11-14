// Remote access to a server.
// - We never send binary data.
// - We use the W3C interface for node and browser compatibility:
//   http://www.w3.org/TR/websockets/#the-websocket-interface
//
// This class is intended for both browser and node.js use.
//
// This class is designed to work via peer protocol via either the public or
// private websocket interfaces.  The JavaScript class for the peer protocol
// has not yet been implemented. However, this class has been designed for it
// to be a very simple drop option.
//
// YYY Will later provide js/network.js which will transparently use multiple
// instances of this class for network access.

// npm
var EventEmitter = require('events').EventEmitter;
var util         = require('util');

var Request      = require('./request').Request;
var Server       = require('./server').Server;
var Amount       = require('./amount').Amount;
var Currency     = require('./currency').Currency;
var UInt160      = require('./uint160').UInt160;
var Transaction  = require('./transaction').Transaction;
var Account      = require('./account').Account;
var Meta         = require('./meta').Meta;
var OrderBook    = require('./orderbook').OrderBook;
var PathFind     = require('./pathfind').PathFind;
var RippleError  = require('./rippleerror').RippleError;

var utils        = require('./utils');
var config       = require('./config');
var sjcl         = require('./utils').sjcl;

/**
    Interface to manage the connection to a Ripple server.

    This implementation uses WebSockets.

    Keys for opts:

      trace
      max_listeners      : Set maxListeners for remote; prevents EventEmitter warnings
      connection_offset  : Connect to remote servers on supplied interval (in seconds)
      trusted            : truthy, if remote is trusted
      max_fee            : Maximum acceptable transaction fee
      fee_cushion        : Extra fee multiplier to account for async fee changes.
      servers            : Array of server objects with the following form

         {
              host:    <string>
            , port:    <number>
            , secure:  <boolean>
         }

    Events:
      'connect'
      'connected' (DEPRECATED)
      'disconnect'
      'disconnected' (DEPRECATED)
      'state':
      - 'online'        : Connected and subscribed.
      - 'offline'       : Not subscribed or not connected.
      'subscribed'      : This indicates stand-alone is available.

    Server events:
      'ledger_closed'   : A good indicate of ready to serve.
      'transaction'     : Transactions we receive based on current subscriptions.
      'transaction_all' : Listening triggers a subscribe to all transactions
                          globally in the network.

    @param opts      Connection options.
    @param trace
*/

function Remote(opts, trace) {
  EventEmitter.call(this);

  var self  = this;

  this.trusted               = Boolean(opts.trusted);
  this.local_sequence        = Boolean(opts.local_sequence); // Locally track sequence numbers
  this.local_fee             = (typeof opts.local_fee === 'undefined') ? true : Boolean(opts.local_fee); // Locally set fees
  this.local_signing         = (typeof opts.local_signing === 'undefined') ? true : Boolean(opts.local_signing);
  this.fee_cushion           = (typeof opts.fee_cushion === 'undefined') ? 1.2 : Number(opts.fee_cushion);
  this.max_fee               = (typeof opts.max_fee === 'undefined') ? Infinity : Number(opts.max_fee);
  this.id                    = 0;
  this.trace                 = Boolean(opts.trace);
  this._server_fatal         = false; // True, if we know server exited.
  this._ledger_current_index = void(0);
  this._ledger_hash          = void(0);
  this._ledger_time          = void(0);
  this._stand_alone          = void(0);
  this._testnet              = void(0);
  this._transaction_subs     = 0;
  this.online_target         = false;
  this._online_state         = 'closed'; // 'open', 'closed', 'connecting', 'closing'
  this.state                 = 'offline'; // 'online', 'offline'
  this.retry_timer           = void(0);
  this.retry                 = void(0);

  this._load_base            = 256;
  this._load_factor          = 256;
  this._fee_ref              = 10;
  this._fee_base             = 10;
  this._reserve_base         = void(0);
  this._reserve_inc          = void(0);
  this._connection_count     = 0;
  this._connected            = false;
  this._connection_offset    = 1000 * (typeof opts.connection_offset === 'number' ? opts.connection_offset : 5)
  this._submission_timeout   = 1000 * (typeof opts.submission_timeout === 'number' ? opts.submission_timeout : 10)

  this._received_tx          = { };
  this._cur_path_find        = null;

  // Local signing implies local fees and sequences
  if (this.local_signing) {
    this.local_sequence = true;
    this.local_fee      = true;
  }

  this._servers        = [ ];
  this._primary_server = void(0);

  // Cache information for accounts.
  // DEPRECATED, will be removed
  this.accounts = {
    // Consider sequence numbers stable if you know you're not generating bad transactions.
    // Otherwise, clear it to have it automatically refreshed from the network.

    // account : { seq : __ }
  };

  // Account objects by AccountId.
  this._accounts = { };

  // OrderBook objects
  this._books = { };

  // Secrets that we know about.
  this.secrets = {
    // Secrets can be set by calling set_secret(account, secret).

    // account : secret
  };

  // Cache for various ledgers.
  // XXX Clear when ledger advances.
  this.ledgers = {
    current : {
      account_root : {}
    }
  };

  // Fallback for previous API
  if (!opts.hasOwnProperty('servers')) {
    opts.servers = [
      {
        host:     opts.websocket_ip,
        port:     opts.websocket_port,
        secure:   opts.websocket_ssl,
        trusted:  opts.trusted
      }
    ];
  }

  opts.servers.forEach(function(server) {
    var pool = Number(server.pool) || 1;
    while (pool--) { self.add_server(server); };
  });

  // This is used to remove Node EventEmitter warnings
  var maxListeners = opts.maxListeners || opts.max_listeners || 0;
  this._servers.concat(this).forEach(function(emitter) {
    emitter.setMaxListeners(maxListeners);
  });

  function listener_added(type, listener) {
    if (type === 'transaction_all') {
      if (!self._transaction_subs && self._connected) {
        self.request_subscribe('transactions').request();
      }
      self._transaction_subs += 1;
    }
  };

  function listener_removed(type, listener) {
    if (type === 'transaction_all') {
      self._transaction_subs -= 1;
      if (!self._transaction_subs && self._connected) {
        self.request_unsubscribe('transactions').request();
      }
    }
  };

  this.on('newListener', listener_added);
  this.on('removeListener', listener_removed);
}

util.inherits(Remote, EventEmitter);

// Flags for ledger entries. In support of account_root().
Remote.flags = {
  // Account Root
  account_root : {
    PasswordSpent:      0x00010000, // True, if password set fee is spent.
    RequireDestTag:     0x00020000, // True, to require a DestinationTag for payments.
    RequireAuth:        0x00040000, // True, to require a authorization to hold IOUs.
    DisallowXRP:        0x00080000, // True, to disallow sending XRP.
    DisableMaster:      0x00100000  // True, force regular key.
  },

  // Offer
  offer: {
    Passive:            0x00010000,
    Sell:               0x00020000  // True, offer was placed as a sell.
  },

  // Ripple State
  state: {
    LowReserve:         0x00010000, // True, if entry counts toward reserve.
    HighReserve:        0x00020000,
    LowAuth:            0x00040000,
    HighAuth:           0x00080000,
    LowNoRipple:        0x00100000,
    HighNoRipple:       0x00200000
  }
};

function isTemMalformed(engine_result_code) {
  return (engine_result_code >= -299 && engine_result_code <  199);
};

function isTefFailure(engine_result_code) {
  return (engine_result_code >= -299 && engine_result_code <  199);
};

Remote.from_config = function (obj, trace) {
  var serverConfig = typeof obj === 'string' ? config.servers[obj] : obj;

  var remote = new Remote(serverConfig, trace);

  function initialize_account(account) {
    var accountInfo = config.accounts[account];
    if (typeof accountInfo === 'object') {
      if (accountInfo.secret) {
        // Index by nickname
        remote.set_secret(account, accountInfo.secret);
        // Index by account ID
        remote.set_secret(accountInfo.account, accountInfo.secret);
      }
    }
  };

  if (typeof config.accounts === 'object') {
    for (var account in config.accounts) {
      initialize_account(account);
    }
  }

  return remote;
};

Remote.create_remote = function(options, callback) {
  var remote = Remote.from_config(options);
  remote.connect(callback);
  return remote;
};

Remote.prototype.addServer = function (opts) {
  var self = this;

  var server = new Server(this, {
    host   : opts.host || opts.websocket_ip,
    port   : opts.port || opts.websocket_port,
    secure : opts.secure || opts.websocket_ssl
  });

  function server_message(data) {
    self._handle_message(data, server);
  };

  function server_connect() {
    self._connection_count++;
    self._set_state('online');
    if (opts.primary || !self._primary_server) {
      self._set_primary_server(server);
    }
    if (self._connection_count === self._servers.length) {
      self.emit('ready');
    }
  };

  function server_disconnect() {
    self._connection_count--;
    if (!self._connection_count) {
      self._set_state('offline');
    }
  };

  server.on('message', server_message);
  server.on('connect', server_connect);
  server.on('disconnect', server_disconnect);

  this._servers.push(server);

  return this;
};

// Inform remote that the remote server is not comming back.
Remote.prototype.serverFatal = function () {
  this._server_fatal = true;
};

// Set the emitted state: 'online' or 'offline'
Remote.prototype._setState = function (state) {
  this._trace('remote: set_state: %s', state);

  if (this.state !== state) {
    this.state = state;

    this.emit('state', state);

    switch (state) {
      case 'online':
        this._online_state = 'open';
        this._connected    = true;
        this.emit('connect');
        this.emit('connected');
        break;

      case 'offline':
        this._online_state = 'closed';
        this._connected    = false;
        this.emit('disconnect');
        this.emit('disconnected');
        break;
    }
  }
};

Remote.prototype.setTrace = function (trace) {
  this.trace = trace === void(0) || trace;
  return this;
};

Remote.prototype._trace = function() {
  if (this.trace) {
    utils.logObject.apply(utils, arguments);
  }
};

/**
 * Connect to the Ripple network.
 */

Remote.prototype.connect = function (online) {
  if (!this._servers.length) {
    throw new Error('No servers available.');
  }

  switch (typeof online) {
    case 'undefined':
      break;
    case 'function':
      this.once('connect', online);
      break;
    default:
      // Downwards compatibility
      if (!Boolean(online)) {
        return this.disconnect();
      }
  }

  var self = this;

  ;(function next_server(i) {
    var server = self._servers[i];
    server.connect();
    server._sid = ++i;

    if (i < self._servers.length) {
      setTimeout(function() {
        next_server(i);
      }, self._connection_offset);
    }
  })(0);

  return this;
};

/**
 * Disconnect from the Ripple network.
 */
Remote.prototype.disconnect = function (online) {
  if (!this._servers.length) {
    throw new Error('No servers available, not disconnecting');
  }

  this._servers.forEach(function(server) {
    server.disconnect();
  });

  this._set_state('offline');

  return this;
};

// It is possible for messages to be dispatched after the connection is closed.
Remote.prototype._handleMessage = function (message, server) {
  var self = this;

  try { message = JSON.parse(message); } catch(e) { }

  var unexpected = typeof message !== 'object' || typeof message.type !== 'string';

  if (unexpected) {
    // Unexpected response from remote.
    this.emit('error', new RippleError('remoteUnexpected', 'Unexpected response from remote'));
    return;
  }

  switch (message.type) {
    case 'response':
      // Handled by the server that sent the request
      break;

    case 'ledgerClosed':
      // XXX If not trusted, need to verify we consider ledger closed.
      // XXX Also need to consider a slow server or out of order response.
      // XXX Be more defensive fields could be missing or of wrong type.
      // YYY Might want to do some cache management.

      this._ledger_time           = message.ledger_time;
      this._ledger_hash           = message.ledger_hash;
      this._ledger_current_index  = message.ledger_index + 1;

      this.emit('ledger_closed', message, server);
      break;

    case 'transaction':
      // To get these events, just subscribe to them. A subscribes and
      // unsubscribes will be added as needed.
      // XXX If not trusted, need proof.

      // De-duplicate transactions that are immediately following each other
      var hash = message.transaction.hash;

      if (this._received_tx.hasOwnProperty(hash)) break;

      this._received_tx[hash] = true;

      this._trace('remote: tx: %s', message);

      // Process metadata
      message.mmeta = new Meta(message.meta);

      // Pass the event on to any related Account objects
      message.mmeta.getAffectedAccounts().forEach(function(account) {
        account = self._accounts[account];
        if (account) account.notify(message);
      });

      // Pass the event on to any related OrderBooks
      message.mmeta.getAffectedBooks().forEach(function(book) {
        book = self._books[book];
        if (book) book.notify(message);
      });

      this.emit('transaction', message);
      this.emit('transaction_all', message);
      break;

    case 'path_find':
      // Pass the event to the currently open PathFind object
      if (this._cur_path_find) {
        this._cur_path_find.notify_update(message);
      }

      this.emit('path_find_all', message);
      break;
    case 'serverStatus':
      self.emit('server_status', message);

      var load_changed = message.hasOwnProperty('load_base')
      && message.hasOwnProperty('load_factor')
      && (message.load_base !== self._load_base || message.load_factor !== self._load_factor)
      ;

      if (load_changed) {
        self._load_base   = message.load_base;
        self._load_factor = message.load_factor;
        var obj = {
          load_base:    self._load_base,
          load_factor:  self._load_factor,
          fee_units:    self.fee_tx_unit()
        }
        self.emit('load', obj);
        self.emit('load_changed', obj);
      }
      break;

    // All other messages
    default:
      this._trace('remote: ' + message.type + ': %s', message);
      this.emit('net_' + message.type, message);
      break;
  }
};

Remote.prototype.ledgerHash = function () {
  return this._ledger_hash;
};

Remote.prototype._setPrimaryServer = function (server) {
  if (this._primary_server) {
    this._primary_server._primary = false;
  }
  this._primary_server            = server;
  this._primary_server._primary   = true;
};

Remote.prototype._serverIsAvailable = function (server) {
  return server && server._connected;
};

Remote.prototype._nextServer = function () {
  var result = null;

  for (var i=0, l=this._servers.length; i<l; i++) {
    var server = this._servers[i];
    if (this._server_is_available(server)) {
      result = server;
      break;
    }
  }

  return result;
};

Remote.prototype._getServer = function () {
  var server;

  if (this._server_is_available(this._primary_server)) {
    server = this._primary_server;
  } else {
    server = this._next_server();
    if (server) {
      this._set_primary_server(server);
    }
  }

  return server;
};

// Send a request.
// <-> request: what to send, consumed.
Remote.prototype.request = function(request) {
  if (typeof request === 'string') {
    if (!/^request_/.test(request)) request = 'request_' + request;
    if (this[request]) {
      var args = Array.prototype.slice.call(arguments, 1);
      return this[request].apply(this, args);
    } else {
      throw new Error('Command does not exist: ' + request);
    }
  } else if (!request instanceof Request) {
    throw new Error('Argument is not a Request');
  }
  if (!this._servers.length) {
    request.emit('error', new Error('No servers available'));
  } else if (!this._connected) {
    this.once('connect', this.request.bind(this, request));
  } else if (request.server === null) {
    request.emit('error', new Error('Server does not exist'));
  } else {
    var server = request.server || this._get_server();
    if (server) {
      server.request(request);
    } else {
      request.emit('error', new Error('No servers available'));
    }
  }
};

Remote.prototype.requestServerInfo = function(callback) {
  return new Request(this, 'server_info').callback(callback);
};

// XXX This is a bad command. Some varients don't scale.
// XXX Require the server to be trusted.
Remote.prototype.requestLedger = function (ledger, opts, callback) {
  //utils.assert(this.trusted);

  var request = new Request(this, 'ledger');

  if (ledger) {
    // DEPRECATED: use .ledger_hash() or .ledger_index()
    //console.log('request_ledger: ledger parameter is deprecated');
    request.message.ledger  = ledger;
  }

  var request_fields = [
    'full',
    'expand',
    'transactions',
    'accounts'
  ];

  switch (typeof opts) {
    case 'object':
      for (var key in opts) {
        if (~request_fields.indexOf(key)) {
          request.message[key] = true;
        }
      }
      break;

    case 'function':
      callback = opts;
      opts = void(0);
      break;

    default:
      //DEPRECATED
      this._trace('request_ledger: full parameter is deprecated');
      request.message.full = true;
      break;
  }

  request.callback(callback);

  return request;
};

// Only for unit testing.
Remote.prototype.requestLedgerHash = function (callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof.
  return new Request(this, 'ledger_closed').callback(callback);
};

// .ledger()
// .ledger_index()
Remote.prototype.requestLedgerHeader = function (callback) {
  return new Request(this, 'ledger_header').callback(callback);
};

// Get the current proposed ledger entry.  May be closed (and revised) at any time (even before returning).
// Only for unit testing.
Remote.prototype.requestLedgerCurrent = function (callback) {
  return new Request(this, 'ledger_current').callback(callback);
};

// --> type : the type of ledger entry.
// .ledger()
// .ledger_index()
// .offer_id()
Remote.prototype.requestLedgerEntry = function (type, callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof, maybe talk packet protocol.

  var self = this;
  var request = new Request(this, 'ledger_entry');

  // Transparent caching. When .request() is invoked, look in the Remote object for the result.
  // If not found, listen, cache result, and emit it.
  //
  // Transparent caching:
  if (type === 'account_root') {
    request.request_default = request.request;

    request.request = function () {                        // Intercept default request.
      var bDefault  = true;
      // .self = Remote
      // this = Request

      // console.log('request_ledger_entry: caught');

      //if (self._ledger_hash) {
        // A specific ledger is requested.
        // XXX Add caching.
        // else if (req.ledger_index)
        // else if ('ripple_state' === request.type)         // YYY Could be cached per ledger.
      //}

      if (!self._ledger_hash && type === 'account_root') {
        var cache = self.ledgers.current.account_root;

        if (!cache) {
          cache = self.ledgers.current.account_root = {};
        }

        var node = self.ledgers.current.account_root[request.message.account_root];

        if (node) {
          // Emulate fetch of ledger entry.
          // console.log('request_ledger_entry: emulating');
          // YYY Missing lots of fields.
          request.emit('success', { node: node });
          bDefault  = false;
        } else { // Was not cached.
          // XXX Only allow with trusted mode.  Must sync response with advance.
          switch (type) {
            case 'account_root':
              request.once('success', function (message) {
                // Cache node.
                // console.log('request_ledger_entry: caching');
                self.ledgers.current.account_root[message.node.Account] = message.node;
              });
              break;

            default:
              // This type not cached.
              // console.log('request_ledger_entry: non-cached type');
          }
        }
      }

      if (bDefault) {
        // console.log('request_ledger_entry: invoking');
        request.request_default();
      }
    };
  }

  request.callback(callback);

  return request;
};

// .accounts(accounts, realtime)
Remote.prototype.requestSubscribe = function (streams, callback) {
  var request = new Request(this, 'subscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [ streams ];
  }

  request.callback(callback);

  return request;
};

// .accounts(accounts, realtime)
Remote.prototype.requestUnsubscribe = function (streams, callback) {
  var request = new Request(this, 'unsubscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [ streams ];
  }

  request.callback(callback);

  return request;
};

// .ledger_choose()
// .ledger_hash()
// .ledger_index()
Remote.prototype.requestTransaction =
Remote.prototype.requestTransactionEntry = function (hash, ledger_hash, callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof, maybe talk packet protocol.
  var request = new Request(this, 'transaction_entry');

  request.tx_hash(hash);

  switch (typeof ledger_hash) {
    case 'string':
      request.ledger_hash(ledger_hash);
      break;
    default:
      request.ledger_index('validated');
      callback = ledger_hash;
  }

  request.callback(callback);

  return request;
};

// DEPRECATED: use request_transaction_entry
Remote.prototype.requestTx = function (hash, callback) {
  var request = new Request(this, 'tx');

  request.message.transaction  = hash;
  request.callback(callback);

  return request;
};

Remote.prototype.requestAccountInfo = function (accountID, callback) {
  var request = new Request(this, 'account_info');
  var account = UInt160.json_rewrite(accountID);

  request.message.ident   = account; //DEPRECATED;
  request.message.account = account;
  request.callback(callback);

  return request;
};

Remote.prototype.requestAccountCurrencies = function (accountID, callback) {
  var request = new Request(this, 'account_currencies');
  var account = UInt160.json_rewrite(accountID);

  request.message.ident   = account; //DEPRECATED;
  request.message.account = account;
  request.callback(callback);

  return request;
};

Remote.account_request = function(type, accountID, account_index, ledger, callback) {
  if (typeof accountID === 'object') {
    var options = accountID;
    callback      = account_index;
    ledger        = options.ledger;
    account_index = options.account_index;
    accoutID      = options.accountID || options.account;
  }

  var request = new Request(this, type);
  var account = UInt160.json_rewrite(accountID);

  request.message.ident   = account; //DEPRECATED;
  request.message.account = account;

  if (account_index) {
    request.message.index = account_index;
  }

  request.ledger_choose(ledger);
  request.callback(callback);

  return request;
};

// --> account_index: sub_account index (optional)
// --> current: true, for the current ledger.
Remote.prototype.requestAccountLines = function (accountID, account_index, ledger, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);
  var args = Array.prototype.slice.call(arguments);
  args.unshift('account_lines');
  return Remote.account_request.apply(this, args);
};

// --> account_index: sub_account index (optional)
// --> current: true, for the current ledger.
Remote.prototype.requestAccountOffers = function (accountID, account_index, ledger, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('account_offers');
  return Remote.account_request.apply(this, args);
};

/*
  account: account,
  ledger_index_min: ledger_index, // optional, defaults to -1 if ledger_index_max is specified.
  ledger_index_max: ledger_index, // optional, defaults to -1 if ledger_index_min is specified.
  binary: boolean,                // optional, defaults to false
  count: boolean,                 // optional, defaults to false
  descending: boolean,            // optional, defaults to false
  offset: integer,                // optional, defaults to 0
  limit: integer                  // optional
*/

Remote.prototype.requestAccountTx = function (options, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);

  var request = new Request(this, 'account_tx');

  var request_fields = [
    'account',
    'ledger_index_min',  //earliest
    'ledger_index_max',  //latest
    'binary',            //false
    'count',             //false
    'descending',        //false
    'offset',            //0
    'limit',

    //extended account_tx
    'forward',           //false
    'marker'
  ];

  for (var key in options) {
    if (~request_fields.indexOf(key)) {
      request.message[key] = options[key];
    }
  }

  request.callback(callback);

  return request;
};

/**
 * Request the overall transaction history.
 *
 * Returns a list of transactions that happened recently on the network. The
 * default number of transactions to be returned is 20.
 */

Remote.prototype.requestTxHistory = function (start, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);

  var request = new Request(this, 'tx_history');

  request.message.start = start;
  request.callback(callback);

  return request;
};

Remote.prototype.requestBookOffers = function (gets, pays, taker, callback) {
  var request = new Request(this, 'book_offers');

  request.message.taker_gets = {
    currency: Currency.json_rewrite(gets.currency)
  };

  if (request.message.taker_gets.currency !== 'XRP') {
    request.message.taker_gets.issuer = UInt160.json_rewrite(gets.issuer);
  }

  request.message.taker_pays = {
    currency: Currency.json_rewrite(pays.currency)
  }

  if (request.message.taker_pays.currency !== 'XRP') {
    request.message.taker_pays.issuer = UInt160.json_rewrite(pays.issuer);
  }

  request.message.taker = taker ? taker : UInt160.ACCOUNT_ONE;

  request.callback(callback);

  return request;
};

Remote.prototype.requestWalletAccounts = function (seed, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'wallet_accounts');
  request.message.seed = seed;

  return request.callback(callback);
};

Remote.prototype.requestSign = function (secret, tx_json, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'sign');
  request.message.secret  = secret;
  request.message.tx_json = tx_json;
  request.callback(callback);

  return request;
};

// Submit a transaction.
Remote.prototype.requestSubmit = function (callback) {
  return new Request(this, 'submit').callback(callback);
};

//
// Higher level functions.
//

/**
 * Create a subscribe request with current subscriptions.
 *
 * Other classes can add their own subscriptions to this request by listening to
 * the server_subscribe event.
 *
 * This function will create and return the request, but not submit it.
 */

Remote.prototype._serverPrepareSubscribe = function (callback) {
  var self  = this;

  var feeds = [ 'ledger', 'server' ];

  if (this._transaction_subs) {
    feeds.push('transactions');
  }

  var request = this.request_subscribe(feeds);

  request.once('success', function (message) {
    self._stand_alone = !!message.stand_alone;
    self._testnet     = !!message.testnet;

    if (typeof message.random === 'string') {
      var rand = message.random.match(/[0-9A-F]{8}/ig);
      while (rand && rand.length) {
        sjcl.random.addEntropy(parseInt(rand.pop(), 16));
      }
      self.emit('random', utils.hexToArray(message.random));
    }

    if (message.ledger_hash && message.ledger_index) {
      self._ledger_time           = message.ledger_time;
      self._ledger_hash           = message.ledger_hash;
      self._ledger_current_index  = message.ledger_index+1;
      self.emit('ledger_closed', message);
    }

    // FIXME Use this to estimate fee.
    // XXX When we have multiple server support, most of this should be tracked
    //     by the Server objects and then aggregated/interpreted by Remote.
    self._load_base     = message.load_base || 256;
    self._load_factor   = message.load_factor || 256;
    self._fee_ref       = message.fee_ref;
    self._fee_base      = message.fee_base;
    self._reserve_base  = message.reserve_base;
    self._reserve_inc   = message.reserve_inc;

    self.emit('subscribed');
  });

  self.emit('prepare_subscribe', request);

  request.callback(callback);

  // XXX Could give error events, maybe even time out.

  return request;
};

// For unit testing: ask the remote to accept the current ledger.
// - To be notified when the ledger is accepted, server_subscribe() then listen to 'ledger_hash' events.
// A good way to be notified of the result of this is:
//    remote.once('ledger_closed', function (ledger_closed, ledger_index) { ... } );
Remote.prototype.ledgerAccept = function (callback) {
  if (this._stand_alone) {
    var request = new Request(this, 'ledger_accept');
    request.request();
    request.callback(callback);
  } else {
    this.emit('error', new RippleError('notStandAlone'));
  }

  return this;
};

// Return a request to refresh the account balance.
Remote.prototype.requestAccountBalance = function (account, ledger, callback) {
  if (typeof account === 'object') {
    callback = ledger;
    ledger   = account.ledger;
    account  = account.account;
  }

  var request = this.request_ledger_entry('account_root');
  request.account_root(account);
  request.ledger_choose(ledger);

  request.once('success', function (message) {
    request.emit('account_balance', Amount.from_json(message.node.Balance));
  });

  request.callback(callback, 'account_balance');

  return request;
};

// Return a request to return the account flags.
Remote.prototype.requestAccountFlags = function (account, ledger, callback) {
  if (typeof account === 'object') {
    callback = ledger;
    ledger   = account.ledger;
    account  = account.account;
  }

  var request = this.request_ledger_entry('account_root');
  request.account_root(account);
  request.ledger_choose(ledger);

  request.once('success', function (message) {
    request.emit('account_flags', message.node.Flags);
  });

  request.callback(callback, 'account_flags');

  return request;
};

// Return a request to emit the owner count.
Remote.prototype.requestOwnerCount = function (account, ledger, callback) {
  if (typeof account === 'object') {
    callback = ledger;
    ledger   = account.ledger;
    account  = account.account;
  }

  var request = this.request_ledger_entry('account_root');
  request.account_root(account);
  request.ledger_choose(ledger);

  request.once('success', function (message) {
    request.emit('owner_count', message.node.OwnerCount);
  });

  request.callback(callback, 'owner_count');

  return request;
};

Remote.prototype.getAccount = function(accountID) {
  return this._accounts[UInt160.json_rewrite(accountID)];
};

Remote.prototype.addAccount = function(accountID) {
  var account = new Account(this, accountID);

  if (account.is_valid()) {
    this._accounts[accountID] = account;
  }

  return account;
};

Remote.prototype.account = function (accountID) {
  var account = this.get_account(accountID);
  return account ? account : this.add_account(accountID);
};

Remote.prototype.pathFind = function (src_account, dst_account, dst_amount, src_currencies) {
  if (typeof src_account === 'object') {
    var options = src_account;
    src_currencies = options.src_currencies;
    dst_amount     = options.dst_amount;
    dst_account    = options.dst_account;
    src_account    = options.src_account;
  }

  var path_find = new PathFind(this, src_account, dst_account, dst_amount, src_currencies);

  if (this._cur_path_find) {
    this._cur_path_find.notify_superceded();
  }

  path_find.create();

  this._cur_path_find = path_find;

  return path_find;
};

Remote.prepare_trade = function(currency, issuer) {
  return currency + (currency === 'XRP' ? '' : ('/' + issuer));
};

Remote.prototype.book = function (currency_gets, issuer_gets, currency_pays, issuer_pays) {
  if (typeof currency_gets === 'object') {
    var options = currency_gets;
    issuer_pays   = options.issuer_pays;
    currency_pays = options.currency_pays;
    issuer_gets   = options.issuer_gets;
    currency_gets = options.currency_gets;
  }

  var gets = Remote.prepare_trade(currency_gets, issuer_gets);
  var pays = Remote.prepare_trade(currency_pays, issuer_pays);
  var key = gets + ':' + pays;
  var book;

  if (!this._books.hasOwnProperty(key)) {
    book = new OrderBook(this, currency_gets, issuer_gets, currency_pays, issuer_pays);
    if (book.is_valid()) {
      this._books[key] = book;
    }
  }

  return this._books[key];
};

// Return the next account sequence if possible.
// <-- undefined or Sequence
Remote.prototype.accountSeq = function (account, advance) {
  var account      = UInt160.json_rewrite(account);
  var account_info = this.accounts[account];
  var seq;

  if (account_info && account_info.seq) {
    seq = account_info.seq;
    var change = { ADVANCE: 1, REWIND: -1 }[advance.toUpperCase()] || 0;
    account_info.seq += change;
  }

  return seq;
};

Remote.prototype.setAccountSeq = function (account, seq) {
  var account = UInt160.json_rewrite(account);

  if (!this.accounts.hasOwnProperty(account)) {
    this.accounts[account] = { };
  }

  this.accounts[account].seq = seq;
}

// Return a request to refresh accounts[account].seq.
Remote.prototype.accountSeqCache = function (account, ledger, callback) {
  if (typeof account === 'object') {
    var options = account;
    callback = ledger;
    ledger   = options.ledger;
    account  = options.account;
  }

  var self = this;

  if (!this.accounts.hasOwnProperty(account)) {
    this.accounts[account] = { };
  }

  var account_info = this.accounts[account];
  var request      = account_info.caching_seq_request;

  if (!request) {
    // console.log('starting: %s', account);
    request = this.request_ledger_entry('account_root');
    request.account_root(account);
    request.ledger_choose(ledger);

    function account_root_success(message) {
      delete account_info.caching_seq_request;

      var seq = message.node.Sequence;
      account_info.seq  = seq;

      // console.log('caching: %s %d', account, seq);
      // If the caller also waits for 'success', they might run before this.
      request.emit('success_account_seq_cache', message);
    }

    function account_root_error(message) {
      // console.log('error: %s', account);
      delete account_info.caching_seq_request;

      request.emit('error_account_seq_cache', message);
    }

    request.once('success', account_root_success);
    request.once('error', account_root_error);

    account_info.caching_seq_request = request;
  }

  request.callback(callback, 'success_account_seq_cache', 'error_account_seq_cache');

  return request;
};

// Mark an account's root node as dirty.
Remote.prototype.dirtyAccountRoot = function (account) {
  var account = UInt160.json_rewrite(account);
  delete this.ledgers.current.account_root[account];
};

// Store a secret - allows the Remote to automatically fill out auth information.
Remote.prototype.setSecret = function (account, secret) {
  this.secrets[account] = secret;
};

// Return a request to get a ripple balance.
//
// --> account: String
// --> issuer: String
// --> currency: String
// --> current: bool : true = current ledger
//
// If does not exist: emit('error', 'error' : 'remoteError', 'remote' : { 'error' : 'entryNotFound' })
Remote.prototype.requestRippleBalance = function (account, issuer, currency, ledger, callback) {
  if (typeof account === 'object') {
    var options = account;
    callback = issuer;
    ledger   = options.ledger;
    currency = options.currency;
    issuer   = options.issuer;
    account  = options.account;
  }

  var request = this.request_ledger_entry('ripple_state'); // YYY Could be cached per ledger.

  request.ripple_state(account, issuer, currency);
  request.ledger_choose(ledger);
  request.once('success', function(message) {
    var node            = message.node;
    var lowLimit        = Amount.from_json(node.LowLimit);
    var highLimit       = Amount.from_json(node.HighLimit);
    // The amount the low account holds of issuer.
    var balance         = Amount.from_json(node.Balance);
    // accountHigh implies: for account: balance is negated, highLimit is the limit set by account.
    var accountHigh     = UInt160.from_json(account).equals(highLimit.issuer());

    request.emit('ripple_state', {
      account_balance     : ( accountHigh ? balance.negate() : balance.clone()).parse_issuer(account),
      peer_balance        : (!accountHigh ? balance.negate() : balance.clone()).parse_issuer(issuer),

      account_limit       : ( accountHigh ? highLimit : lowLimit).clone().parse_issuer(issuer),
      peer_limit          : (!accountHigh ? highLimit : lowLimit).clone().parse_issuer(account),

      account_quality_in  : ( accountHigh ? node.HighQualityIn : node.LowQualityIn),
      peer_quality_in     : (!accountHigh ? node.HighQualityIn : node.LowQualityIn),

      account_quality_out : ( accountHigh ? node.HighQualityOut : node.LowQualityOut),
      peer_quality_out    : (!accountHigh ? node.HighQualityOut : node.LowQualityOut),
    });
  });

  request.callback(callback, 'ripple_state');

  return request;
};

Remote.prepare_currencies = function(ci) {
  var ci_new  = { };

  if (ci.hasOwnProperty('issuer')) {
    ci_new.issuer = UInt160.json_rewrite(ci.issuer);
  }

  if (ci.hasOwnProperty('currency')) {
    ci_new.currency = Currency.json_rewrite(ci.currency);
  }

  return ci_new;
};

Remote.prototype.requestRipplePathFind = function (src_account, dst_account, dst_amount, src_currencies, callback) {
  if (typeof src_account === 'object') {
    var options = src_account;
    callback       = dst_account;
    src_currencies = options.src_currencies;
    dst_amount     = options.dst_amount;
    dst_account    = options.dst_account;
    src_account    = options.src_account;
  }

  var request = new Request(this, 'ripple_path_find');

  request.message.source_account      = UInt160.json_rewrite(src_account);
  request.message.destination_account = UInt160.json_rewrite(dst_account);
  request.message.destination_amount  = Amount.json_rewrite(dst_amount);

  if (src_currencies) {
    request.message.source_currencies = src_currencies.map(Remote.prepare_currencies);
  }

  request.callback(callback);

  return request;
};

Remote.prototype.requestPathFindCreate = function (src_account, dst_account, dst_amount, src_currencies, callback) {
  if (typeof src_account === 'object') {
    var options = src_account;
    callback       = dst_account;
    src_currencies = options.src_currencies;
    dst_amount     = options.dst_amount;
    dst_account    = options.dst_account;
    src_account    = options.src_account;
  }

  var request = new Request(this, 'path_find');

  request.message.subcommand          = 'create';
  request.message.source_account      = UInt160.json_rewrite(src_account);
  request.message.destination_account = UInt160.json_rewrite(dst_account);
  request.message.destination_amount  = Amount.json_rewrite(dst_amount);

  if (src_currencies) {
    request.message.source_currencies = src_currencies.map(Remote.prepare_currencies);
  }

  request.callback(callback);

  return request;
};

Remote.prototype.requestPathFindClose = function () {
  var request = new Request(this, 'path_find');

  request.message.subcommand = 'close';

  return request;
};

Remote.prototype.requestUnlList = function (callback) {
  return new Request(this, 'unl_list').callback(callback);
};

Remote.prototype.requestUnlAdd = function (addr, comment, callback) {
  var request = new Request(this, 'unl_add');

  request.message.node = addr;

  if (comment) {
    // note is not specified anywhere, should remove?
    var note = undefined; 
    request.message.comment = note;
  }

  request.callback(callback);

  return request;
};

// --> node: <domain> | <public_key>
Remote.prototype.requestUnlDelete = function (node, callback) {
  var request = new Request(this, 'unl_delete');

  request.message.node = node;
  request.callback(callback);

  return request;
};

Remote.prototype.requestPeers = function (callback) {
  return new Request(this, 'peers').callback(callback);
};

Remote.prototype.requestConnect = function (ip, port, callback) {
  var request = new Request(this, 'connect');

  request.message.ip = ip;

  if (port) {
    request.message.port = port;
  }

  request.callback(callback);

  return request;
};

Remote.prototype.transaction = function (source, destination, amount, callback) {
  var tx = new Transaction(this);

  if (arguments.length >= 3) {
    tx = tx.payment(source, destination, amount);
    if (typeof callback === 'function') {
      tx.submit(callback);
    }
  }

  return tx;
};

/**
 * Calculate a transaction fee for a number of tx fee units.
 *
 * This takes into account the last known network and local load fees.
 *
 * @return {Amount} Final fee in XRP for specified number of fee units.
 */
Remote.prototype.feeTx = function (units) {
  var fee_unit = this.fee_tx_unit();
  return Amount.from_json(String(Math.ceil(units * fee_unit)));
};

/**
 * Get the current recommended transaction fee unit.
 *
 * Multiply this value with the number of fee units in order to calculate the
 * recommended fee for the transaction you are trying to submit.
 *
 * @return {Number} Recommended amount for one fee unit as float.
 */
Remote.prototype.feeTxUnit = function () {
  var fee_unit = this._fee_base / this._fee_ref;

  // Apply load fees
  fee_unit *= this._load_factor / this._load_base;

  // Apply fee cushion (a safety margin in case fees rise since we were last updated
  fee_unit *= this.fee_cushion;

  return fee_unit;
};

/**
 * Get the current recommended reserve base.
 *
 * Returns the base reserve with load fees and safety margin applied.
 */
Remote.prototype.reserve = function (owner_count) {
  var reserve_base = Amount.from_json(String(this._reserve_base));
  var reserve_inc  = Amount.from_json(String(this._reserve_inc));
  var owner_count  = owner_count || 0;

  if (owner_count < 0) {
    throw new Error('Owner count must not be negative.');
  }

  return reserve_base.add(reserve_inc.product_human(owner_count));
};

Remote.prototype.ping = function(host, callback) {
  var request = new Request(this, 'ping');

  switch (typeof host) {
    case 'function':
      callback = host;
      break;
    case 'string':
      request.set_server(host);
      break;
  }

  var then = Date.now();

  request.once('success', function() {
    request.emit('pong', Date.now() - then);
  });

  request.callback(callback, 'pong');

  return request;
};

Object.keys(Remote.prototype).forEach(function(key) {
  var UPPERCASE = /[A-Z]/;

  if (!UPPERCASE.test(key)) return;

  var underscored = '';

  for (var i=0; i<key.length; i++) {
    if (UPPERCASE.test(key[i])) {
      underscored += '_';
    }
    underscored += key[i].toLowerCase();
  }

  Remote.prototype[underscored] = Remote.prototype[key];
});

exports.Remote = Remote;

// vim:sw=2:sts=2:ts=8:et
