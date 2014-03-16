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

var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var LRU          = require('lru-cache');
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
var sjcl         = require('./utils').sjcl;
var config       = require('./config');
var log          = require('./log').internal.sub('remote');

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

  this.trusted               = opts.trusted;
  this.local_sequence        = opts.local_sequence; // Locally track sequence numbers
  this.local_fee             = (typeof opts.local_fee === 'undefined') ? true : opts.local_fee; // Locally set fees
  this.local_signing         = (typeof opts.local_signing === 'undefined') ? true : opts.local_signing;
  this.fee_cushion           = (typeof opts.fee_cushion === 'undefined') ? 1.2 : opts.fee_cushion;
  this.max_fee               = (typeof opts.max_fee === 'undefined') ? Infinity : opts.max_fee;
  this.id                    = 0;
  this.trace                 = opts.trace;
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
  this._connection_count     = 0;
  this._connected            = false;
  this._connection_offset    = 1000 * (typeof opts.connection_offset === 'number' ? opts.connection_offset : 5)
  this._submission_timeout   = 1000 * (typeof opts.submission_timeout === 'number' ? opts.submission_timeout : 10)

  this._received_tx          = LRU({ max: 100 });
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
      account_root : { }
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

  if (typeof this._connection_offset !== 'number') {
    throw new TypeError('Remote "connection_offset" configuration is not a Number');
  }

  if (typeof this._submission_timeout !== 'number') {
    throw new TypeError('Remote "submission_timeout" configuration is not a Number');
  }

  if (typeof this.max_fee !== 'number') {
    throw new TypeError('Remote "max_fee" configuration is not a Number');
  }

  if (typeof this.fee_cushion !== 'number') {
    throw new TypeError('Remote "fee_cushion" configuration is not a Number');
  }

  if (!/^(undefined|boolean)$/.test(typeof opts.trace)) {
    throw new TypeError('Remote "trace" configuration is not a Boolean');
  }

  if (typeof this.local_signing !== 'boolean') {
    throw new TypeError('Remote "local_signing" configuration is not a Boolean');
  }

  if (typeof this.local_fee !== 'boolean') {
    throw new TypeError('Remote "local_fee" configuration is not a Boolean');
  }

  if (typeof this.local_sequence !== 'boolean') {
    throw new TypeError('Remote "local_sequence" configuration is not a Boolean');
  }

  if (!Array.isArray(opts.servers)) {
    throw new TypeError('Remote "servers" configuration is not an Array');
  }

  if (!/^(undefined|number)$/.test(typeof opts.ping)) {
    throw new TypeError('Remote "ping" configuration is not a Number');
  }

  if (!/^(undefined|object)$/.test(typeof opts.storage)) {
    throw new TypeError('Remote "storage" configuration is not an Object');
  }

  opts.servers.forEach(function(server) {
    var pool = Number(server.pool) || 1;
    while (pool--) { self.addServer(server); };
  });

  // This is used to remove Node EventEmitter warnings
  var maxListeners = opts.maxListeners || opts.max_listeners || 0;

  this._servers.concat(this).forEach(function(emitter) {
    emitter.setMaxListeners(maxListeners);
  });

  function listenerAdded(type, listener) {
    if (type === 'transaction_all') {
      if (!self._transaction_subs && self._connected) {
        self.request_subscribe('transactions').request();
      }
      self._transaction_subs += 1;
    }
  };

  this.on('newListener', listenerAdded);

  function listenerRemoved(type, listener) {
    if (type === 'transaction_all') {
      self._transaction_subs -= 1;
      if (!self._transaction_subs && self._connected) {
        self.request_unsubscribe('transactions').request();
      }
    }
  };

  this.on('removeListener', listenerRemoved);

  function getPendingTransactions() {
    self.storage.getPendingTransactions(function(err, transactions) {
      if (err || !Array.isArray(transactions)) return;

      var properties = [
        'submittedIDs',
        'clientID',
        'submitIndex'
      ];

      function resubmitTransaction(tx) {
        var transaction = self.transaction();
        transaction.parseJson(tx.tx_json);
        properties.forEach(function(prop) {
          if (typeof tx[prop] !== 'undefined') {
            transaction[prop] = tx[prop];
          }
        });
        transaction.submit();
      };

      transactions.forEach(resubmitTransaction);
    });
  };

  if (opts.storage) {
    this.storage = opts.storage;
    this.once('connect', getPendingTransactions);
  }

  function pingServers() {
    var pingRequest = self.requestPing();
    pingRequest.on('error', function(){});
    pingRequest.broadcast();
  };

  if (opts.ping) {
    this.once('connect', function() {
      self._pingInterval = setInterval(pingServers, opts.ping * 1000);
    });
  }
};

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

Remote.from_config = function(obj, trace) {
  var serverConfig = (typeof obj === 'string') ? config.servers[obj] : obj;

  var remote = new Remote(serverConfig, trace);

  function initializeAccount(account) {
    var accountInfo = this.accounts[account];
    if (typeof accountInfo === 'object') {
      if (accountInfo.secret) {
        // Index by nickname
        remote.setSecret(account, accountInfo.secret);
        // Index by account ID
        remote.setSecret(accountInfo.account, accountInfo.secret);
      }
    }
  };

  if (config.accounts) {
    Object.keys(config.accounts).forEach(initializeAccount, config);
  }

  return remote;
};

Remote.prototype.addServer = function(opts) {
  var self = this;

  var server = new Server(this, opts);

  function serverMessage(data) {
    self._handleMessage(data, server);
  };

  server.on('message', serverMessage);

  function serverConnect() {
    if (opts.primary || !self._primary_server) {
      self._setPrimaryServer(server);
    }
    switch (++self._connection_count) {
      case 1:
        self._setState('online');
        break;
      case self._servers.length:
        self.emit('ready');
        break;
    }
  };

  server.on('connect', serverConnect);

  function serverDisconnect() {
    self._connection_count--;
    if (self._connection_count === 0) {
      self._setState('offline');
    }
  };

  server.on('disconnect', serverDisconnect);

  this._servers.push(server);

  return this;
};

// Inform remote that the remote server is not comming back.
Remote.prototype.serverFatal = function() {
  this._server_fatal = true;
};

// Set the emitted state: 'online' or 'offline'
Remote.prototype._setState = function(state) {
  if (this.state !== state) {
    this._trace('remote: set_state:', state);

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

Remote.prototype.setTrace = function(trace) {
  this.trace = trace === void(0) || trace;
  return this;
};

// Store a secret - allows the Remote to automatically fill out auth information.
Remote.prototype.setSecret = function(account, secret) {
  this.secrets[account] = secret;
};

Remote.prototype._trace = function() {
  if (this.trace) {
    log.info.apply(log, arguments);
  }
};

/**
 * Connect to the Ripple network.
 *
 * param {Function} callback
 */

Remote.prototype.connect = function(online) {
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

  ;(function nextServer(i) {
    var server = self._servers[i];
    server.connect();
    server._sid = ++i;

    if (i < self._servers.length) {
      setTimeout(function() {
        nextServer(i);
      }, self._connection_offset);
    }
  })(0);

  return this;
};

/**
 * Disconnect from the Ripple network.
 */
Remote.prototype.disconnect = function(callback) {
  if (!this._servers.length) {
    throw new Error('No servers available, not disconnecting');
  }

  if (typeof callback === 'function') {
    this.once('disconnect', callback);
  }

  this._servers.forEach(function(server) {
    server.disconnect();
  });

  this._set_state('offline');

  return this;
};

// It is possible for messages to be dispatched after the connection is closed.
Remote.prototype._handleMessage = function(message, server) {
  var self = this;

  try { message = JSON.parse(message); } catch(e) { }

  if (!Remote.isValidMessage(message)) {
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
      if (!Remote.isValidLedgerData(message)) return;

      if (message.ledger_index >= this._ledger_current_index) {
        this._ledger_time           = message.ledger_time;
        this._ledger_hash           = message.ledger_hash;
        this._ledger_current_index  = message.ledger_index + 1;
        this.emit('ledger_closed', message, server);
      }
      break;

    case 'serverStatus':
      self.emit('server_status', message);
      break;

    case 'transaction':
      // To get these events, just subscribe to them. A subscribes and
      // unsubscribes will be added as needed.
      // XXX If not trusted, need proof.

      // De-duplicate transactions that are immediately following each other
      var hash = message.transaction.hash;

      if (this._received_tx.hasOwnProperty(hash)) {
        break;
      }

      if (message.validated) {
        this._received_tx.set(hash, true);
      }

      this._trace('remote: tx:', message);

      if (message.meta) {
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
      } else {
        [ 'Account', 'Destination' ].forEach(function(prop) {
          var account = message.transaction[prop];
          if (account && (account = self.account(account))) {
            account.notify(message);
          }
        });
      }

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

    // All other messages
    default:
      this._trace('remote: ' + message.type + ': ', message);
      this.emit('net_' + message.type, message);
      break;
  }
};

Remote.isValidMessage = function(message) {
  return (typeof message === 'object')
      && (typeof message.type === 'string');
};

Remote.isValidLedgerData = function(ledger) {
  return (typeof ledger              === 'object')
      && (typeof ledger.fee_base     === 'number')
      && (typeof ledger.fee_ref      === 'number')
      && (typeof ledger.fee_base     === 'number')
      && (typeof ledger.ledger_hash  === 'string')
      && (typeof ledger.ledger_index === 'number')
      && (typeof ledger.ledger_time  === 'number')
      && (typeof ledger.reserve_base === 'number')
      && (typeof ledger.reserve_inc  === 'number')
      && (typeof ledger.txn_count    === 'number');
};

Remote.isLoadStatus = function(message) {
  return (typeof message.load_base === 'number')
      && (typeof message.load_factor === 'number');
};

Remote.prototype.ledgerHash = function() {
  return this._ledger_hash;
};

Remote.prototype._setPrimaryServer = function(server) {
  if (this._primary_server) {
    this._primary_server._primary = false;
  }
  this._primary_server            = server;
  this._primary_server._primary   = true;
};

Remote.prototype._serverIsAvailable = function(server) {
  return server && server._connected;
};

Remote.prototype._nextServer = function() {
  var result = null;

  for (var i=0, l=this._servers.length; i<l; i++) {
    var server = this._servers[i];
    if (this._serverIsAvailable(server)) {
      result = server;
      break;
    }
  }

  return result;
};

Remote.prototype._getServer = function() {
  var server;

  if (this._serverIsAvailable(this._primary_server)) {
    server = this._primary_server;
  } else {
    server = this._nextServer();
    if (server) {
      this._setPrimaryServer(server);
    }
  }

  return server;
};

// Send a request.
// <-> request: what to send, consumed.
Remote.prototype.request = function(request) {
  if (typeof request === 'string') {
    if (!/^request_/.test(request)) request = 'request_' + request;
    if (typeof this[request] === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      return this[request].apply(this, args);
    } else {
      throw new Error('Command does not exist: ' + request);
    }
  } else if (!(request instanceof Request)) {
    throw new Error('Argument is not a Request');
  }
  if (!this._servers.length) {
    request.emit('error', new Error('No servers available'));
  } else if (!this._connected) {
    this.once('connect', this.request.bind(this, request));
  } else if (request.server === null) {
    request.emit('error', new Error('Server does not exist'));
  } else {
    var server = request.server || this._getServer();
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

// XXX This is a bad command. Some variants don't scale.
// XXX Require the server to be trusted.
Remote.prototype.requestLedger = function(ledger, options, callback) {
  //utils.assert(this.trusted);

  var request = new Request(this, 'ledger');

  if (ledger) {
    // DEPRECATED: use .ledger_hash() or .ledger_index()
    //console.log('request_ledger: ledger parameter is deprecated');
    request.message.ledger  = ledger;
  }

  var requestFields = [
    'full',
    'expand',
    'transactions',
    'accounts'
  ];

  switch (typeof options) {
    case 'object':
      for (var key in options) {
        if (~requestFields.indexOf(key)) {
          request.message[key] = true;
        }
      }
      break;

    case 'function':
      callback = options;
      options = void(0);
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
Remote.prototype.requestLedgerHash = function(callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof.
  return new Request(this, 'ledger_closed').callback(callback);
};

// .ledger()
// .ledger_index()
Remote.prototype.requestLedgerHeader = function(callback) {
  return new Request(this, 'ledger_header').callback(callback);
};

// Get the current proposed ledger entry.  May be closed (and revised) at any time (even before returning).
// Only for unit testing.
Remote.prototype.requestLedgerCurrent = function(callback) {
  return new Request(this, 'ledger_current').callback(callback);
};

// --> type : the type of ledger entry.
// .ledger()
// .ledger_index()
// .offer_id()
Remote.prototype.requestLedgerEntry = function(type, callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof, maybe talk packet protocol.

  var self = this;
  var request = new Request(this, 'ledger_entry');

  // Transparent caching. When .request() is invoked, look in the Remote object for the result.
  // If not found, listen, cache result, and emit it.
  //
  // Transparent caching:
  if (type === 'account_root') {
    request.request_default = request.request;

    request.request = function() {                        // Intercept default request.
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
              request.once('success', function(message) {
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
Remote.prototype.requestSubscribe = function(streams, callback) {
  var request = new Request(this, 'subscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [ streams ];
  }

  request.callback(callback);

  return request;
};

// .accounts(accounts, realtime)
Remote.prototype.requestUnsubscribe = function(streams, callback) {
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
Remote.prototype.requestTransactionEntry = function(hash, ledger_hash, callback) {
  //utils.assert(this.trusted);   // If not trusted, need to check proof, maybe talk packet protocol.
  var request = new Request(this, 'transaction_entry');

  request.txHash(hash);

  switch (typeof ledger_hash) {
    case 'string':
      request.ledgerHash(ledger_hash);
      break;

    case 'number':
      request.ledgerIndex(ledger_hash);
      break;

    case 'undefined':
    case 'function':
      request.ledgerIndex('validated');
      callback = ledger_hash;
      break;

    default:
      throw new Error('Invalid ledger_hash type');
  }

  request.callback(callback);

  return request;
};

// DEPRECATED: use request_transaction_entry
Remote.prototype.requestTx = function(hash, callback) {
  var request = new Request(this, 'tx');

  request.message.transaction = hash;
  request.callback(callback);

  return request;
};

Remote.accountRequest = function(type, account, accountIndex, ledger, peer, callback) {
  if (typeof account === 'object') {
    var options  = account;
    callback     = accountIndex;
    ledger       = options.ledger;
    accountIndex = options.account_index || options.accountIndex;
    account      = options.accountID || options.account;
    peer         = options.peer;
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

  var request = new Request(this, type);
  var account = UInt160.json_rewrite(account);

  request.message.ident   = account; //DEPRECATED;
  request.message.account = account;

  if (typeof accountIndex === 'number') {
    request.message.index = accountIndex;
  }

  if (typeof ledger !== 'undefined') {
    request.ledgerChoose(ledger);
  }

  if (typeof peer !== 'undefined') {
    request.message.peer = UInt160.json_rewrite(peer);
  }

  request.callback(callback);

  return request;
};

Remote.prototype.requestAccountInfo = function(accountID, callback) {
  var args = Array.prototype.concat.apply(['account_info'], arguments);
  return Remote.accountRequest.apply(this, args);
};

Remote.prototype.requestAccountCurrencies = function(accountID, callback) {
  var args = Array.prototype.concat.apply(['account_currencies'], arguments);
  return Remote.accountRequest.apply(this, args);
};

// --> account_index: sub_account index (optional)
// --> current: true, for the current ledger.
Remote.prototype.requestAccountLines = function(accountID, account_index, ledger, peer, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);
  var args = Array.prototype.concat.apply(['account_lines'], arguments);
  return Remote.accountRequest.apply(this, args);
};

// --> account_index: sub_account index (optional)
// --> current: true, for the current ledger.
Remote.prototype.requestAccountOffers = function(accountID, account_index, ledger, callback) {
  var args = Array.prototype.concat.apply(['account_offers'], arguments);
  return Remote.accountRequest.apply(this, args);
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

Remote.prototype.requestAccountTx = function(options, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);

  var request = new Request(this, 'account_tx');

  var requestFields = [
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
    if (~requestFields.indexOf(key)) {
      request.message[key] = options[key];
    }
  }

  function propertiesFilter(obj, transaction) {
    var properties = Object.keys(obj);
    return function(transaction) {
      var result = properties.every(function(property) {
        return transaction.tx[property] === obj[property];
      });
      return result;
    };
  };

  var SerializedObject = require('./serializedobject').SerializedObject;

  function parseBinary(transaction) {
    var tx = { validated: transaction.validated };
    tx.meta = new SerializedObject(transaction.meta).to_json();
    tx.tx = new SerializedObject(transaction.tx_blob).to_json();
    tx.tx.ledger_index = transaction.ledger_index;
    return tx;
  };

  function accountTxFilter(fn) {
    if (typeof fn !== 'function') {
      throw new Error('Missing filter function');
    }

    var self = this;

    function filterHandler() {
      var listeners = self.listeners('success');

      self.removeAllListeners('success');

      self.once('success', function(res) {
        res.transactions = res.transactions.filter(fn);

        if (options.binary) {
          res.transactions = res.transactions.map(parseBinary);
        }

        if (typeof options.map === 'function') {
          res.transactions = res.transactions.map(options.map);
        }

        if (typeof options.reduce === 'function') {
          res.transactions = res.transactions.reduce(options.reduce);
        }

        if (typeof options.pluck === 'string') {
          res = res[options.pluck];
        }

        listeners.forEach(function(listener) {
          listener.call(self, res);
        });
      });
    };

    this.once('request', filterHandler);

    return this;
  };

  request.filter = accountTxFilter;

  if (options.binary || (options.map || options.reduce)) {
    options.filter = options.filter || Boolean;
  }

  if (options.filter) {
    switch (options.filter) {
      case 'inbound':
        request.filter(propertiesFilter({ Destination: options.account }));
        break;
      case 'outbound':
        request.filter(propertiesFilter({ Account: options.account }));
        break;
      default:
        if (typeof options.filter === 'object') {
          options.filter = propertiesFilter(options.filter);
        }

        request.filter(options.filter);
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

Remote.prototype.requestTxHistory = function(start, callback) {
  // XXX Does this require the server to be trusted?
  //utils.assert(this.trusted);

  var request = new Request(this, 'tx_history');

  request.message.start = start;
  request.callback(callback);

  return request;
};

Remote.prototype.requestBookOffers = function(gets, pays, taker, callback) {
  if (gets.hasOwnProperty('pays')) {
    var options = gets;
    callback = pays;
    taker = options.taker;
    pays = options.pays;
    gets = options.gets;
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

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

Remote.prototype.requestWalletAccounts = function(seed, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'wallet_accounts');
  request.message.seed = seed;
  request.callback(callback);

  return request;
};

Remote.prototype.requestSign = function(secret, tx_json, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'sign');
  request.message.secret  = secret;
  request.message.tx_json = tx_json;
  request.callback(callback);

  return request;
};

// Submit a transaction.
Remote.prototype.requestSubmit = function(callback) {
  return new Request(this, 'submit').callback(callback);
};

/**
 * Create a subscribe request with current subscriptions.
 *
 * Other classes can add their own subscriptions to this request by listening to
 * the server_subscribe event.
 *
 * This function will create and return the request, but not submit it.
 */

Remote.prototype._serverPrepareSubscribe = function(callback) {
  var self  = this;

  var feeds = [ 'ledger', 'server' ];

  if (this._transaction_subs) {
    feeds.push('transactions');
  }

  var request = this.requestSubscribe(feeds);

  function serverSubscribed(message) {
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

    self.emit('subscribed');
  };

  request.once('success', serverSubscribed);

  self.emit('prepare_subscribe', request);

  request.callback(callback, 'subscribed');

  // XXX Could give error events, maybe even time out.

  return request;
};

// For unit testing: ask the remote to accept the current ledger.
// - To be notified when the ledger is accepted, server_subscribe() then listen to 'ledger_hash' events.
// A good way to be notified of the result of this is:
//    remote.once('ledger_closed', function(ledger_closed, ledger_index) { ... } );
Remote.prototype.ledgerAccept = function(callback) {
  if (this._stand_alone) {
    var request = new Request(this, 'ledger_accept');
    request.request();
    request.callback(callback);
  } else {
    this.emit('error', new RippleError('notStandAlone'));
  }

  return this;
};

Remote.accountRootRequest = function(type, responseFilter, account, ledger, callback) {
  if (typeof account === 'object') {
    callback = ledger;
    ledger   = account.ledger;
    account  = account.account;
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

  var request = this.requestLedgerEntry('account_root');
  request.accountRoot(account);
  request.ledgerChoose(ledger);

  request.once('success', function(message) {
    request.emit(type, responseFilter(message));
  });

  request.callback(callback, type);

  return request;
};

// Return a request to refresh the account balance.
Remote.prototype.requestAccountBalance = function(account, ledger, callback) {
  function responseFilter(message) {
    return Amount.from_json(message.node.Balance);
  };

  var args = Array.prototype.concat.apply(['account_balance', responseFilter], arguments);
  var request = Remote.accountRootRequest.apply(this, args);

  return request;
};

// Return a request to return the account flags.
Remote.prototype.requestAccountFlags = function(account, ledger, callback) {
  function responseFilter(message) {
    return message.node.Flags;
  };

  var args = Array.prototype.concat.apply(['account_flags', responseFilter], arguments);
  var request = Remote.accountRootRequest.apply(this, args);

  return request;
};

// Return a request to emit the owner count.
Remote.prototype.requestOwnerCount = function(account, ledger, callback) {
  function responseFilter(message) {
    return message.node.OwnerCount;
  };

  var args = Array.prototype.concat.apply(['owner_count', responseFilter], arguments);
  var request = Remote.accountRootRequest.apply(this, args);

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

Remote.prototype.account = function(accountID) {
  var account = this.getAccount(accountID);
  return account ? account : this.addAccount(accountID);
};

Remote.prototype.pathFind = function(src_account, dst_account, dst_amount, src_currencies) {
  if (typeof src_account === 'object') {
    var options = src_account;
    src_currencies = options.src_currencies;
    dst_amount     = options.dst_amount;
    dst_account    = options.dst_account;
    src_account    = options.src_account;
  }

  var pathFind = new PathFind(this, src_account, dst_account, dst_amount, src_currencies);

  if (this._cur_path_find) {
    this._cur_path_find.notify_superceded();
  }

  pathFind.create();

  this._cur_path_find = pathFind;

  return pathFind;
};

Remote.prepareTrade = function(currency, issuer) {
  return currency + (currency === 'XRP' ? '' : ('/' + issuer));
};

Remote.prototype.book = function(currency_gets, issuer_gets, currency_pays, issuer_pays) {
  if (typeof currency_gets === 'object') {
    var options = currency_gets;
    issuer_pays   = options.issuer_pays;
    currency_pays = options.currency_pays;
    issuer_gets   = options.issuer_gets;
    currency_gets = options.currency_gets;
  }

  var gets = Remote.prepareTrade(currency_gets, issuer_gets);
  var pays = Remote.prepareTrade(currency_pays, issuer_pays);
  var key = gets + ':' + pays;
  var book;

  if (!this._books.hasOwnProperty(key)) {
    book = new OrderBook(this, currency_gets, issuer_gets, currency_pays, issuer_pays, key);
    if (book.is_valid()) {
      this._books[key] = book;
    }
  }

  return this._books[key];
};

// Return the next account sequence if possible.
// <-- undefined or Sequence
Remote.prototype.accountSeq = function(account, advance) {
  var account     = UInt160.json_rewrite(account);
  var accountInfo = this.accounts[account];
  var seq;

  if (account_info && account_info.seq) {
    seq = accountInfo.seq;
    var change = { ADVANCE: 1, REWIND: -1 }[advance.toUpperCase()] || 0;
    accountInfo.seq += change;
  }

  return seq;
};

Remote.prototype.setAccountSeq = function(account, seq) {
  var account = UInt160.json_rewrite(account);

  if (!this.accounts.hasOwnProperty(account)) {
    this.accounts[account] = { };
  }

  this.accounts[account].seq = seq;
};

// Return a request to refresh accounts[account].seq.
Remote.prototype.accountSeqCache = function(account, ledger, callback) {
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
    request = this.requestLedgerEntry('account_root');
    request.accountRoot(account);
    request.ledgerChoose(ledger);

    function accountRootSuccess(message) {
      delete account_info.caching_seq_request;

      var seq = message.node.Sequence;
      account_info.seq  = seq;

      // console.log('caching: %s %d', account, seq);
      // If the caller also waits for 'success', they might run before this.
      request.emit('success_account_seq_cache', message);
    };

    request.once('success', accountRootSuccess);

    function accountRootError(message) {
      // console.log('error: %s', account);
      delete account_info.caching_seq_request;

      request.emit('error_account_seq_cache', message);
    };

    request.once('error', accountRootError);

    account_info.caching_seq_request = request;
  }

  request.callback(callback, 'success_account_seq_cache', 'error_account_seq_cache');

  return request;
};

// Mark an account's root node as dirty.
Remote.prototype.dirtyAccountRoot = function(account) {
  var account = UInt160.json_rewrite(account);
  delete this.ledgers.current.account_root[account];
};

// Return a request to get a ripple balance.
//
// --> account: String
// --> issuer: String
// --> currency: String
// --> current: bool : true = current ledger
//
// If does not exist: emit('error', 'error' : 'remoteError', 'remote' : { 'error' : 'entryNotFound' })
Remote.prototype.requestRippleBalance = function(account, issuer, currency, ledger, callback) {
  if (typeof account === 'object') {
    var options = account;
    callback = issuer;
    ledger   = options.ledger;
    currency = options.currency;
    issuer   = options.issuer;
    account  = options.account;
  }

  var request = this.requestLedgerEntry('ripple_state'); // YYY Could be cached per ledger.

  request.rippleState(account, issuer, currency);
  request.ledgerChoose(ledger);

  function rippleState(message) {
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
  };

  request.once('success', rippleState);
  request.callback(callback, 'ripple_state');

  return request;
};

Remote.prepareCurrencies = function(ci) {
  var ci_new  = { };

  if (ci.hasOwnProperty('issuer')) {
    ci_new.issuer = UInt160.json_rewrite(ci.issuer);
  }

  if (ci.hasOwnProperty('currency')) {
    ci_new.currency = Currency.json_rewrite(ci.currency);
  }

  return ci_new;
};

Remote.prototype.requestRipplePathFind = function(src_account, dst_account, dst_amount, src_currencies, callback) {
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
    request.message.source_currencies = src_currencies.map(Remote.prepareCurrencies);
  }

  request.callback(callback);

  return request;
};

Remote.prototype.requestPathFindCreate = function(src_account, dst_account, dst_amount, src_currencies, callback) {
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
    request.message.source_currencies = src_currencies.map(Remote.prepareCurrencies);
  }

  request.callback(callback);

  return request;
};

Remote.prototype.requestPathFindClose = function() {
  var request = new Request(this, 'path_find');

  request.message.subcommand = 'close';

  return request;
};

Remote.prototype.requestUnlList = function(callback) {
  return new Request(this, 'unl_list').callback(callback);
};

Remote.prototype.requestUnlAdd = function(addr, comment, callback) {
  var request = new Request(this, 'unl_add');

  request.message.node = addr;

  if (comment) {
    // note is not specified anywhere, should remove?
    request.message.comment = void(0);
  }

  request.callback(callback);

  return request;
};

// --> node: <domain> | <public_key>
Remote.prototype.requestUnlDelete = function(node, callback) {
  var request = new Request(this, 'unl_delete');

  request.message.node = node;
  request.callback(callback);

  return request;
};

Remote.prototype.requestPeers = function(callback) {
  return new Request(this, 'peers').callback(callback);
};

Remote.prototype.requestConnect = function(ip, port, callback) {
  var request = new Request(this, 'connect');

  request.message.ip = ip;

  if (port) {
    request.message.port = port;
  }

  request.callback(callback);

  return request;
};

Remote.prototype.createTransaction =
Remote.prototype.transaction = function(source, options, callback) {
  var transaction = new Transaction(this);

  var transactionTypes = {
    payment:      'payment',
    accountset:   'accountSet',
    trustset:     'trustSet',
    offercreate:  'offerCreate',
    offercancel:  'offerCancel',
    sign:         'sign'
  }

  var transactionType;

  switch (typeof source) {
    case 'object':
      if (typeof source.type !== 'string') {
        throw new Error('Missing transaction type');
      }

      transactionType = transactionTypes[source.type.toLowerCase()];

      if (!transactionType) {
        throw new Error('Invalid transaction type: ' + transactionType);
      }

      transaction = transaction[transactionType](source);
      break;

    case 'string':
      transactionType = source.toLowerCase();

      if (!transactionType) {
        throw new Error('Invalid transaction type: ' + transactionType);
      }

      transaction = transaction[transactionType](options);
      break;
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    transaction.submit(lastArg);
  }

  return transaction;
};

/**
 * Calculate a transaction fee for a number of tx fee units.
 *
 * This takes into account the last known network and local load fees.
 *
 * @return {Amount} Final fee in XRP for specified number of fee units.
 */

Remote.prototype.feeTx = function(units) {
  return this._getServer().feeTx(units);
};

/**
 * Get the current recommended transaction fee unit.
 *
 * Multiply this value with the number of fee units in order to calculate the
 * recommended fee for the transaction you are trying to submit.
 *
 * @return {Number} Recommended amount for one fee unit as float.
 */

Remote.prototype.feeTxUnit = function() {
  return this._getServer().feeTxUnit();
};

/**
 * Get the current recommended reserve base.
 *
 * Returns the base reserve with load fees and safety margin applied.
 */

Remote.prototype.reserve = function(owner_count) {
  return this._getServer().reserve(owner_count);
};

Remote.prototype.requestPing =
Remote.prototype.ping = function(host, callback) {
  var request = new Request(this, 'ping');

  switch (typeof host) {
    case 'function':
      callback = host;
      break;

    case 'string':
      request.setServer(host);
      break;
  }

  var then = Date.now();

  request.once('success', function() {
    request.emit('pong', Date.now() - then);
  });

  request.callback(callback, 'pong');

  return request;
};

exports.Remote = Remote;

// vim:sw=2:sts=2:ts=8:et
