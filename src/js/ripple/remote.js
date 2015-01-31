// Interface to manage connections to rippled servers
//
// - We never send binary data.
// - We use the W3C interface for node and browser compatibility:
//   http://www.w3.org/TR/websockets/#the-websocket-interface
//
// This class is intended for both browser and Node.js use.
//
// This class is designed to work via peer protocol via either the public or
// private WebSocket interfaces. The JavaScript class for the peer protocol
// has not yet been implemented. However, this class has been designed for it
// to be a very simple drop option.

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var LRU = require('lru-cache');
var async = require('async');
var lodash = require('lodash');
var Server = require('./server').Server;
var Request = require('./request').Request;
var Server = require('./server').Server;
var Amount = require('./amount').Amount;
var Currency = require('./currency').Currency;
var UInt160 = require('./uint160').UInt160;
var UInt256 = require('./uint256').UInt256;
var Transaction = require('./transaction').Transaction;
var Account = require('./account').Account;
var Meta = require('./meta').Meta;
var OrderBook = require('./orderbook').OrderBook;
var PathFind = require('./pathfind').PathFind;
var SerializedObject = require('./serializedobject').SerializedObject;
var RippleError = require('./rippleerror').RippleError;
var utils = require('./utils');
var sjcl = require('./utils').sjcl;
var hashprefixes = require('./hashprefixes');
var config = require('./config');
var log = require('./log').internal.sub('remote');

/**
 * Interface to manage connections to rippled servers
 *
 * @param {Object} Options
 */

function Remote(opts) {
  EventEmitter.call(this);

  var self = this;
  var opts = opts || { };

  Object.keys(Remote.DEFAULTS).forEach(function(config) {
    if (opts.hasOwnProperty(config)) {
      this[config] = opts[config];
    } else {
      this[config] = Remote.DEFAULTS[config];
    }
  }, this);

  this.state = 'offline'; // 'online', 'offline'
  this._server_fatal = false; // server exited
  this._stand_alone = void(0);
  this._testnet = void(0);

  this._ledger_current_index = void(0);
  this._ledger_hash = void(0);
  this._ledger_time = void(0);

  this._connection_count = 0;
  this._connected = false;
  this._should_connect = true;

  this._transaction_listeners = 0;
  this._received_tx = new LRU({ max: 100 });
  this._cur_path_find = null;

  if (this.local_signing) {
    // Local signing implies local fees and sequences
    this.local_sequence = true;
    this.local_fee = true;
  }

  this._servers = [ ];
  this._primary_server = void(0);

  // Cache information for accounts.
  // DEPRECATED, will be removed
  // Consider sequence numbers stable if you know you're not generating bad
  // transactions.
  // Otherwise, clear it to have it automatically refreshed from the network.
  // account : { seq : __ }
  this.accounts = { };

  // Account objects by AccountId.
  this._accounts = { };

  // OrderBook objects
  this._books = { };

  // Secrets that we know about.
  // Secrets can be set by calling set_secret(account, secret).
  // account : secret
  this.secrets = { };

  // Cache for various ledgers.
  // XXX Clear when ledger advances.
  this.ledgers = {
    current: {
      account_root: { }
    }
  };

  if (typeof this.trusted !== 'boolean') {
    throw new TypeError('trusted must be a boolean');
  }
  if (typeof this.trace !== 'boolean') {
    throw new TypeError('trace must be a boolean');
  }
  if (typeof this.allow_partial_history !== 'boolean') {
    throw new TypeError('allow_partial_history must be a boolean');
  }
  if (typeof this.max_fee !== 'number') {
    throw new TypeError('max_fee must be a number');
  }
  if (typeof this.max_attempts !== 'number') {
    throw new TypeError('max_attempts must be a number');
  }
  if (typeof this.fee_cushion !== 'number') {
    throw new TypeError('fee_cushion must be a number');
  }
  if (typeof this.local_signing !== 'boolean') {
    throw new TypeError('local_signing must be a boolean');
  }
  if (typeof this.local_fee !== 'boolean') {
    throw new TypeError('local_fee must be a boolean');
  }
  if (typeof this.local_sequence !== 'boolean') {
    throw new TypeError('local_sequence must be a boolean');
  }
  if (typeof this.canonical_signing !== 'boolean') {
    throw new TypeError('canonical_signing must be a boolean');
  }
  if (typeof this.submission_timeout !== 'number') {
    throw new TypeError('submission_timeout must be a number');
  }
  if (typeof this.last_ledger_offset !== 'number') {
    throw new TypeError('last_ledger_offset must be a number');
  }
  if (!Array.isArray(this.servers)) {
    throw new TypeError('servers must be an array');
  }

  this.setMaxListeners(this.max_listeners);

  this.servers.forEach(function(serverOptions) {
    var server = self.addServer(serverOptions);
    server.setMaxListeners(self.max_listeners);
  });

  function listenersModified(action, event) {
    // Automatically subscribe and unsubscribe to orderbook
    // on the basis of existing event listeners
    if (lodash.contains(Remote.TRANSACTION_EVENTS, event)) {
      switch (action) {
        case 'add':
          if (++self._transaction_listeners === 1) {
            self.requestSubscribe('transactions').request();
          }
          break;
        case 'remove':
          if (--self._transaction_listeners === 0) {
            self.requestUnsubscribe('transactions').request();
          }
          break;
      }
    }
  };

  this.on('newListener', function(event) {
    listenersModified('add', event);
  });

  this.on('removeListener', function(event) {
    listenersModified('remove', event);
  });
};

util.inherits(Remote, EventEmitter);

Remote.DEFAULTS = {
  trusted: false,
  trace: false,
  allow_partial_history: true,
  local_sequence: true,
  local_fee: true,
  local_signing: true,
  canonical_signing: true,
  fee_cushion: 1.2,
  max_fee: 1000000, // 1 XRP
  max_attempts: 10,
  submission_timeout: 1000 * 20,
  last_ledger_offset: 3,
  servers: [ ],
  max_listeners: 0 // remove Node EventEmitter warnings
};

Remote.TRANSACTION_EVENTS = [
  'transaction',
  'transaction_all'
];

// Flags for ledger entries. In support of account_root().
Remote.flags = {
  // AccountRoot
  account_root: {
    PasswordSpent: 0x00010000, // password set fee is spent
    RequireDestTag: 0x00020000, // require a DestinationTag for payments
    RequireAuth: 0x00040000, // require a authorization to hold IOUs
    DisallowXRP: 0x00080000, // disallow sending XRP
    DisableMaster: 0x00100000  // force regular key
  },
  // Offer
  offer: {
    Passive: 0x00010000,
    Sell: 0x00020000  // offer was placed as a sell
  },
  // Ripple tate
  state: {
    LowReserve: 0x00010000, // entry counts toward reserve
    HighReserve: 0x00020000,
    LowAuth: 0x00040000,
    HighAuth: 0x00080000,
    LowNoRipple: 0x00100000,
    HighNoRipple: 0x00200000
  }
};

Remote.from_config = function(obj, trace) {
  var serverConfig = (typeof obj === 'string') ? config.servers[obj] : obj;
  var remote = new Remote(serverConfig, trace);

  function initializeAccount(account) {
    var accountInfo = config.accounts[account];
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
    Object.keys(config.accounts).forEach(initializeAccount);
  }

  return remote;
};

/**
 * Check that server message is valid
 *
 * @param {Object} message
 * @return Boolean
 */

Remote.isValidMessage = function(message) {
  return (typeof message === 'object')
      && (typeof message.type === 'string');
};

/**
 * Check that server message contains valid
 * ledger data
 *
 * @param {Object} message
 * @return {Boolean}
 */

Remote.isValidLedgerData = function(message) {
  return (typeof message === 'object')
    && (typeof message.fee_base === 'number')
    && (typeof message.fee_ref === 'number')
    && (typeof message.ledger_hash === 'string')
    && (typeof message.ledger_index === 'number')
    && (typeof message.ledger_time === 'number')
    && (typeof message.reserve_base === 'number')
    && (typeof message.reserve_inc === 'number');
};

/**
 * Check that server message contains valid
 * load status data
 *
 * @param {Object} message
 * @return {Boolean}
 */

Remote.isValidLoadStatus = function(message) {
  return (typeof message.load_base === 'number')
      && (typeof message.load_factor === 'number');
};

/**
 * Check that provided ledger is validated
 *
 * @param {Object} ledger
 * @return {Boolean}
 */

Remote.isValidated = function(message) {
  return (message && typeof message === 'object')
      && (message.validated === true);
};

/**
 * Set the emitted state: 'online' or 'offline'
 *
 * @param {String} state
 */

Remote.prototype._setState = function(state) {
  if (this.state !== state) {
    if (this.trace) {
      log.info('set_state:', state);
    }

    this.state = state;
    this.emit('state', state);

    switch (state) {
      case 'online':
        this._online_state = 'open';
        this._connected = true;
        this.emit('connect');
        this.emit('connected');
        break;
      case 'offline':
        this._online_state = 'closed';
        this._connected = false;
        this.emit('disconnect');
        this.emit('disconnected');
        break;
    }
  }
};

/**
 * Inform remote that the remote server is not comming back.
 */

Remote.prototype.setServerFatal = function() {
  this._server_fatal = true;
};

/**
 * Enable debug output
 *
 * @param {Boolean} trace
 */

Remote.prototype.setTrace = function(trace) {
  this.trace = (trace === void(0) || trace);
  return this;
};

Remote.prototype._trace = function() {
  if (this.trace) {
    log.info.apply(log, arguments);
  }
};

/**
 * Store a secret - allows the Remote to automatically fill
 * out auth information.
 *
 * @param {String} account
 * @param {String} secret
 */

Remote.prototype.setSecret = function(account, secret) {
  this.secrets[account] = secret;
};

Remote.prototype.addServer = function(opts) {
  var self = this;

  var server = new Server(this, opts);

  function serverMessage(data) {
    self._handleMessage(data, server);
  };

  server.on('message', serverMessage);

  function serverConnect() {
    self._connection_count += 1;

    if (opts.primary) {
      self._setPrimaryServer(server);
    }
    if (self._connection_count === 1) {
      self._setState('online');
    }
    if (self._connection_count === self._servers.length) {
      self.emit('ready');
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

  return server;
};

/**
 * Reconnect to Ripple network
 */

Remote.prototype.reconnect = function() {
  if (!this._should_connect) {
    return;
  }

  log.info('reconnecting');

  this._servers.forEach(function(server) {
    server.reconnect();
  });

  return this;
};

/**
 * Connect to the Ripple network
 *
 * @param {Function} callback
 * @api public
 */

Remote.prototype.connect = function(callback) {
  if (!this._servers.length) {
    throw new Error('No servers available.');
  }

  if (typeof callback === 'function') {
    this.once('connect', callback);
  }

  this._should_connect = true;

  this._servers.forEach(function(server) {
    server.connect();
  });

  return this;
};

/**
 * Disconnect from the Ripple network.
 *
 * @param {Function} callback
 * @api public
 */

Remote.prototype.disconnect = function(callback) {
  if (!this._servers.length) {
    throw new Error('No servers available, not disconnecting');
  }

  var callback = (typeof callback === 'function') ? callback : function(){};

  this._should_connect = false;

  if (!this.isConnected()) {
    callback();
    return this;
  }

  this.once('disconnect', callback);

  this._servers.forEach(function(server) {
    server.disconnect();
  });

  this._set_state('offline');

  return this;
};

/**
 * Handle server message. Server messages are proxied to
 * the Remote, such that global events can be handled
 *
 * It is possible for messages to be dispatched after the
 * connection is closed.
 *
 * @param {JSON} message
 * @param {Server} server
 */

Remote.prototype._handleMessage = function(message, server) {
  try {
    message = JSON.parse(message);
  } catch (e) {
  }

  if (!Remote.isValidMessage(message)) {
    // Unexpected response from remote.
    this.emit('error', new RippleError('remoteUnexpected',
      'Unexpected response from remote'));
    return;
  }

  switch (message.type) {
    case 'ledgerClosed':
      this._handleLedgerClosed(message, server);
      break;
    case 'serverStatus':
      this._handleServerStatus(message, server);
      break;
    case 'transaction':
      this._handleTransaction(message, server);
      break;
    case 'path_find':
      this._handlePathFind(message, server);
      break;
    default:
      if (this.trace) {
        log.info(message.type + ': ', message);
      }
      break;
  }
};

/**
 * Handle server ledger_closed event
 *
 * @param {Object} message
 */

Remote.prototype._handleLedgerClosed = function(message, server) {
  var self = this;

  // XXX If not trusted, need to verify we consider ledger closed.
  // XXX Also need to consider a slow server or out of order response.
  // XXX Be more defensive fields could be missing or of wrong type.
  // YYY Might want to do some cache management.
  if (!Remote.isValidLedgerData(message)) {
    return;
  }

  var ledgerAdvanced = message.ledger_index >= this._ledger_current_index;

  if (isNaN(this._ledger_current_index) || ledgerAdvanced) {
    this._ledger_time = message.ledger_time;
    this._ledger_hash = message.ledger_hash;
    this._ledger_current_index = message.ledger_index + 1;

    if (this.isConnected()) {
      this.emit('ledger_closed', message, server);
    } else {
      this.once('connect', function() {
        // Delay until server is 'online'
        self.emit('ledger_closed', message, server);
      });
    }
  }
};

/**
 * Handle server server_status event
 *
 * @param {Object} message
 */

Remote.prototype._handleServerStatus = function(message, server) {
  this.emit('server_status', message, server);
};

/**
 * Handle server transaction event
 *
 * @param {Object} message
 */

Remote.prototype._handleTransaction = function(message, server) {
  // XXX If not trusted, need proof.
  var transactionHash = message.transaction.hash;

  if (this._received_tx.get(transactionHash)) {
    // De-duplicate transactions
    return;
  }

  if (message.validated) {
    this._received_tx.set(transactionHash, true);
  }

  if (this.trace) {
    log.info('tx:', message);
  }

  var metadata = message.meta || message.metadata;

  if (metadata) {
    // Process metadata
    message.mmeta = new Meta(metadata);

    // Pass the event on to any related Account objects
    message.mmeta.getAffectedAccounts().forEach(function(account) {
      if (this._accounts[account]) {
        this._accounts[account].notify(message);
      }
    }, this);

    // Pass the event on to any related OrderBooks
    message.mmeta.getAffectedBooks().forEach(function(book) {
      if (this._books[book]) {
        this._books[book].notify(message);
      }
    }, this);
  } else {
    // Transaction could be from proposed transaction stream
    [ 'Account', 'Destination' ].forEach(function(prop) {
      if (this._accounts[message.transaction[prop]]) {
        this._accounts[message.transaction[prop]].notify(message);
      }
    }, this);
  }

  this.emit('transaction', message, server);
  this.emit('transaction_all', message, server);
};

/**
 * Handle server path_find event
 *
 * @param {Object} message
 */

Remote.prototype._handlePathFind = function(message, server) {
  // Pass the event to the currently open PathFind object
  if (this._cur_path_find) {
    this._cur_path_find.notify_update(message);
  }

  this.emit('path_find_all', message, server);
};

/**
 * Returns the current ledger hash
 *
 * @return {String} ledger hash
 */

Remote.prototype.getLedgerHash = function() {
  return this._ledger_hash;
};

/**
 * Set primary server. Primary server will be selected
 * to handle requested regardless of its internally-tracked
 * priority score
 *
 * @param {Server} server
 */

Remote.prototype._setPrimaryServer =
Remote.prototype.setPrimaryServer = function(server) {
  if (this._primary_server) {
    this._primary_server._primary = false;
  }
  this._primary_server = server;
  this._primary_server._primary = true;
};

/**
 * Get connected state
 *
 * @return {Boolean} connected
 */

Remote.prototype.isConnected = function() {
  return this._connected;
};

/**
 * Get array of connected servers
 */

Remote.prototype.getConnectedServers = function() {
  var servers = [ ];
  for (var i = 0; i < this._servers.length; i++) {
    if (this._servers[i].isConnected()) {
      servers.push(this._servers[i]);
    }
  }
  return servers;
};

/**
 * Select a server to handle a request. Servers are
 * automatically prioritized
 */

Remote.prototype._getServer =
Remote.prototype.getServer = function() {
  if (this._primary_server && this._primary_server.isConnected()) {
    return this._primary_server;
  }

  if (!this._servers.length) {
    return null;
  }

  var connectedServers = this.getConnectedServers();
  if (connectedServers.length === 0 || !connectedServers[0]) {
    return null;
  }

  var server = connectedServers[0];
  var cScore = server._score + server._fee;

  for (var i = 1; i < connectedServers.length; i++) {
    var _server = connectedServers[i];
    var bScore = _server._score + _server._fee;
    if (bScore < cScore) {
      server = _server;
      cScore = bScore;
    }
  }

  return server;
};

/**
 * Send a request. This method is called internally by Request
 * objects. Each Request contains a reference to Remote, and
 * Request.request calls Request.remote.request
 *
 * @param {Request} request
 */

Remote.prototype.request = function(request) {
  if (typeof request === 'string') {
    if (!/^request_/.test(request)) {
      request = 'request_' + request;
    }

    if (typeof this[request] === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      return this[request].apply(this, args);
    }

    throw new Error('Command does not exist: ' + request);
  }

  if (!(request instanceof Request)) {
    throw new Error('Argument is not a Request');
  }

  if (!this._servers.length) {
    return request.emit('error', new Error('No servers available'));
  }
  if (!this.isConnected()) {
    return this.once('connect', this.request.bind(this, request));
  }
  if (request.server === null) {
    return request.emit('error', new Error('Server does not exist'));
  }

  var server = request.server || this.getServer();
  if (server) {
    server._request(request);
  } else {
    request.emit('error', new Error('No servers available'));
  }
};

/**
 * Request ping
 *
 * @param [String] server host
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.ping =
Remote.prototype.requestPing = function(host, callback) {
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

/**
 * Request server_info
 *
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestServerInfo = function(callback) {
  return new Request(this, 'server_info').callback(callback);
};

/**
 * Request ledger
 *
 * @return {Request} request
 */

Remote.prototype.requestLedger = function(options, callback) {
  // XXX This is a bad command. Some variants don't scale.
  // XXX Require the server to be trusted.
  // utils.assert(this.trusted);

  var request = new Request(this, 'ledger');

  switch (typeof options) {
    case 'undefined': break;
    case 'function':
      callback = options;
      break;

    case 'object':
      if (!options) {
        break;
      }

      Object.keys(options).forEach(function(o) {
        switch (o) {
          case 'full':
          case 'expand':
          case 'transactions':
          case 'accounts':
            request.message[o] = true;
            break;
          case 'ledger':
            request.selectLedger(options.ledger);
            break;
          case 'ledger_index':
          case 'ledger_hash':
            request.message[o] = options[o];
            break;
          case 'closed' :
          case 'current' :
          case 'validated' :
            request.message.ledger_index = o;
            break;
        }
      }, options);
      break;

    default:
      request.selectLedger(options);
      break;
  }

  request.callback(callback);

  return request;
};

/**
 * Request ledger_closed
 *
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestLedgerClosed =
Remote.prototype.requestLedgerHash = function(callback) {
  // utils.assert(this.trusted);   // If not trusted, need to check proof.
  return new Request(this, 'ledger_closed').callback(callback);
};

/**
 * Request ledger_header
 *
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestLedgerHeader = function(callback) {
  return new Request(this, 'ledger_header').callback(callback);
};

/**
 * Request ledger_current
 *
 * Get the current proposed ledger entry. May be closed (and revised)
 * at any time (even before returning).
 *
 * Only for unit testing.
 *
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestLedgerCurrent = function(callback) {
  return new Request(this, 'ledger_current').callback(callback);
};

/**
 * Request ledger_data
 *
 * Get the contents of a specified ledger
 *
 * @param {Object} options
 * @property {Boolean} [options.binary]       - Flag which determines if rippled returns binary or parsed JSON
 * @property {String|Number} [options.ledger] - Hash or sequence of a ledger to get contents for
 * @property {Number} [options.limit]         - Number of contents to retrieve from the ledger
 * @property {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {LedgerData} ledgerData
 *
 * @return {Request} request
 */

Remote.prototype.requestLedgerData = function(options, callback) {
  var request = new Request(this, 'ledger_data');

  request.message.binary = options.binary !== false;
  request.selectLedger(options.ledger);
  request.message.limit = options.limit;

  request.once('success', function(res) {
    if (options.binary === false) {
      request.emit('state', res);
      return;
    }

    function iterator(ledgerData, next) {
      async.setImmediate(function() {
        next(null, Remote.parseBinaryLedgerData(ledgerData));
      });
    };

    function complete(err, state) {
      if (err) {
        request.emit('error', err);
      } else {
        res.state = state;
        request.emit('state', res);
      }
    };

    async.mapSeries(res.state, iterator, complete);
  });

  request.callback(callback, 'state');

  return request;
};

/**
 * Request ledger_entry
 *
 * @param [String] type
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestLedgerEntry = function(type, callback) {
  // utils.assert(this.trusted);
  // If not trusted, need to check proof, maybe talk packet protocol.

  var self = this;
  var request = new Request(this, 'ledger_entry');

  if (typeof type === 'function') {
    callback = type;
  }

  // Transparent caching. When .request() is invoked, look in the Remote object
  // for the result.  If not found, listen, cache result, and emit it.
  //
  // Transparent caching:
  if (type === 'account_root') {
    request.request_default = request.request;

    request.request = function() {
      // Intercept default request.
      var bDefault = true;

      if (!self._ledger_hash && type === 'account_root') {
        var cache = self.ledgers.current.account_root;

        if (!cache) {
          cache = self.ledgers.current.account_root = {};
        }

        var node = self.ledgers.current
        .account_root[request.message.account_root];

        if (node) {
          // Emulate fetch of ledger entry.
          // console.log('request_ledger_entry: emulating');
          // YYY Missing lots of fields.
          request.emit('success', { node: node });
          bDefault = false;
        } else { // Was not cached.
          // XXX Only allow with trusted mode.  Must sync response with advance
          switch (type) {
            case 'account_root':
              request.once('success', function(message) {
                // Cache node.
                // console.log('request_ledger_entry: caching');
                self.ledgers.current
                .account_root[message.node.Account] = message.node;
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

/**
 * Request subscribe
 *
 * @param {Array} streams
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestSubscribe = function(streams, callback) {
  var request = new Request(this, 'subscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [ streams ];
  }

  request.callback(callback);

  return request;
};

/**
 * Request usubscribe
 *
 * @param {Array} streams
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestUnsubscribe = function(streams, callback) {
  var request = new Request(this, 'unsubscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [ streams ];
  }

  request.callback(callback);

  return request;
};

/**
 * Request transaction_entry
 *
 * @param {String} transaction hash
 * @param {String|Number} ledger hash or sequence
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestTransactionEntry = function(hash, ledgerHash, callback) {
  // If not trusted, need to check proof, maybe talk packet protocol.
  // utils.assert(this.trusted);
  var request = new Request(this, 'transaction_entry');

  if (typeof hash === 'object') {
    ledgerHash = hash.ledger || hash.ledger_hash || hash.ledger_index;
    hash = hash.hash || hash.tx || hash.transaction;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  request.txHash(hash);

  switch (typeof ledgerHash) {
    case 'string':
    case 'number':
      request.selectLedger(ledgerHash);
      break;

    case 'undefined':
    case 'function':
      request.ledgerIndex('validated');
      callback = ledgerHash;
      break;

    default:
      throw new Error('Invalid ledger_hash type');
  }

  request.callback(callback);

  return request;
};

/**
 * Request tx
 *
 * @param {Object|String} hash
 * @property {String} hash.hash           - Transaction hash
 * @property {Boolean} [hash.binary=true] - Flag which determines if rippled returns binary or parsed JSON
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestTransaction =
Remote.prototype.requestTx = function(hash, callback) {
  var options;

  if (typeof hash === 'string') {
    options = { hash: hash };
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  } else {
    options = hash;
  }

  var request = new Request(this, 'tx');

  request.message.binary = options.binary !== false;
  request.message.transaction = options.hash;

  request.once('success', function(res) {
    if (options.binary === false) {
      request.emit('transaction', res);
      return;
    }

    request.emit('transaction', Remote.parseBinaryTransaction(res));
  });

  request.callback(callback, 'transaction');

  return request;
};

/**
 * Account Request
 *
 * Optional paging with limit and marker options
 * supported in rippled for 'account_lines' and 'account_offers'
 *
 * The paged responses aren't guaranteed to be reliable between
 * ledger closes. You have to supply a ledger_index or ledger_hash
 * when paging to ensure a complete response
 *
 * @param {String} type - request name, e.g. 'account_lines'
 * @param {String} account - ripple address
 * @param {Object} options - all optional
 *   @param {String} peer - ripple address
 *   @param [String|Number] ledger identifier
 *   @param [Number] limit - max results per response
 *   @param {String} marker - start position in response paging
 * @param [Function] callback
 * @return {Request}
 * @throws {Error} if a marker is provided, but no ledger_index or ledger_hash
 */

Remote.accountRequest = function(type, options, callback) {
  var account, ledger, peer, limit, marker;

  if (typeof options === 'object') {
    account = options.account;
    ledger = options.ledger;
    peer = options.peer;
    limit = options.limit;
    marker = options.marker;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  // if a marker is given, we need a ledger
  // check if a valid ledger_index or ledger_hash is provided
  if (marker) {
    if (!(Number(ledger) > 0) && !UInt256.is_valid(ledger)) {
      throw new Error(
        'A ledger_index or ledger_hash must be provided when using a marker');
    }
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

  var request = new Request(this, type);

  if (account) {
    account = UInt160.json_rewrite(account);
    request.message.account = account;
  }

  request.selectLedger(ledger);

  if (UInt160.is_valid(peer)) {
    request.message.peer = UInt160.json_rewrite(peer);
  }

  if (!isNaN(limit)) {
    limit = Number(limit);

    // max for 32-bit unsigned int is 4294967295
    // we'll clamp to 1e9
    if (limit > 1e9) {
      limit = 1e9;
    }
    // min for 32-bit unsigned int is 0
    // we'll clamp to 0
    if (limit < 0) {
      limit = 0;
    }

    request.message.limit = limit;
  }

  if (marker) {
    request.message.marker = marker;
  }

  request.callback(callback);
  return request;
};

/**
 * Request account_info
 *
 * @param {Object} options
 *   @param {String} account - ripple address
 *   @param {String} peer - ripple address
 *   @param [String|Number] ledger identifier
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountInfo = function() {
  var args = Array.prototype.concat.apply(['account_info'], arguments);
  return Remote.accountRequest.apply(this, args);
};

/**
 * Request account_currencies
 *
 * @param {Object} options
 *   @param {String} account - ripple address
 *   @param {String} peer - ripple address
 *   @param [String|Number] ledger identifier
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountCurrencies = function() {
  var args = Array.prototype.concat.apply(['account_currencies'], arguments);
  return Remote.accountRequest.apply(this, args);
};

/**
 * Request account_lines
 *
 * Requests for account_lines support paging, provide a limit and marker
 * to page through responses.
 *
 * The paged responses aren't guaranteed to be reliable between
 * ledger closes. You have to supply a ledger_index or ledger_hash
 * when paging to ensure a complete response
 *
 * @param {Object} options
 *   @param {String} account - ripple address
 *   @param {String} peer - ripple address
 *   @param [String|Number] ledger identifier
 *   @param [Number] limit - max results per response
 *   @param {String} marker - start position in response paging
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountLines = function() {
  // XXX Does this require the server to be trusted?
  // utils.assert(this.trusted);
  var args = Array.prototype.concat.apply(['account_lines'], arguments);
  return Remote.accountRequest.apply(this, args);
};

/**
 * Request account_offers
 *
 * Requests for account_offers support paging, provide a limit and marker
 * to page through responses.
 *
 * The paged responses aren't guaranteed to be reliable between
 * ledger closes. You have to supply a ledger_index or ledger_hash
 * when paging to ensure a complete response
 *
 * @param {Object} options
 *   @param {String} account - ripple address
 *   @param [String|Number] ledger identifier
 *   @param [Number] limit - max results per response
 *   @param {String} marker - start position in response paging
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountOffers = function() {
  var args = Array.prototype.concat.apply(['account_offers'], arguments);
  return Remote.accountRequest.apply(this, args);
};

/**
 * Request account_tx
 *
 * @param {Object} options
 *
 *    @param {String} account
 *    @param [Number] ledger_index_min defaults to -1
 *    @param [Number] ledger_index_max defaults to -1
 *    @param [Boolean] binary, defaults to true
 *    @param [Boolean] parseBinary, defaults to true
 *    @param [Boolean] count, defaults to false
 *    @param [Boolean] descending, defaults to false
 *    @param [Number] offset, defaults to 0
 *    @param [Number] limit
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountTransactions =
Remote.prototype.requestAccountTx = function(options, callback) {
  // XXX Does this require the server to be trusted?
  // utils.assert(this.trusted);

  var request = new Request(this, 'account_tx');

  options.binary = options.binary !== false;

  if (options.min_ledger !== void(0)) {
    options.ledger_index_min = options.min_ledger;
  }

  if (options.max_ledger !== void(0)) {
    options.ledger_index_max = options.max_ledger;
  }

  if (options.binary && options.parseBinary === void(0)) {
    options.parseBinary = true;
  }

  Object.keys(options).forEach(function(o) {
    switch (o) {
      case 'account':
      case 'ledger_index_min':  // earliest
      case 'ledger_index_max':  // latest
      case 'binary':            // false
      case 'count':             // false
      case 'descending':        // false
      case 'offset':            // 0
      case 'limit':

      // extended account_tx
      case 'forward':           // false
      case 'marker':
        request.message[o] = this[o];
        break;
    }
  }, options);

  request.once('success', function(res) {
    if (!options.parseBinary) {
      request.emit('transactions', res);
      return;
    }

    function iterator(transaction, next) {
      async.setImmediate(function() {
        next(null, Remote.parseBinaryAccountTransaction(transaction));
      });
    };

    function complete(err, transactions) {
      if (err) {
        request.emit('error', err);
      } else {
        res.transactions = transactions;
        request.emit('transactions', res);
      }
    };

    async.mapSeries(res.transactions, iterator, complete);
  });

  request.callback(callback, 'transactions');

  return request;
};

/**
 * @param {Object} transaction
 * @return {Transaction}
 */

Remote.parseBinaryAccountTransaction = function(transaction) {
  var tx_obj = new SerializedObject(transaction.tx_blob);
  var tx_obj_json = tx_obj.to_json();
  var meta = new SerializedObject(transaction.meta).to_json();

  var tx_result = {
    validated: transaction.validated
  };

  tx_result.meta = meta;
  tx_result.tx = tx_obj_json;
  tx_result.tx.hash = tx_obj.hash(hashprefixes.HASH_TX_ID).to_hex();
  tx_result.tx.ledger_index = transaction.ledger_index;
  tx_result.tx.inLedger = transaction.ledger_index;

  if (typeof meta.DeliveredAmount === 'object') {
    tx_result.meta.delivered_amount = meta.DeliveredAmount;
  } else {
    switch (typeof tx_obj_json.Amount) {
      case 'string':
      case 'object':
        tx_result.meta.delivered_amount = tx_obj_json.Amount;
        break;
    }
  }

  return tx_result;
};

Remote.parseBinaryTransaction = function(transaction) {
  var tx_obj = new SerializedObject(transaction.tx).to_json();
  var meta = new SerializedObject(transaction.meta).to_json();

  var tx_result = tx_obj;

  tx_result.date = transaction.date;
  tx_result.hash = transaction.hash;
  tx_result.inLedger = transaction.inLedger;
  tx_result.ledger_index = transaction.ledger_index;
  tx_result.meta = meta;
  tx_result.validated = transaction.validated;

  if (typeof meta.DeliveredAmount === 'object') {
    tx_result.meta.delivered_amount = meta.DeliveredAmount;
  } else {
    switch (typeof tx_obj.Amount) {
      case 'string':
      case 'object':
        tx_result.meta.delivered_amount = tx_obj.Amount;
        break;
    }
  }

  return tx_result;
};

/**
 * Parse binary ledger state data
 *
 * @param {Object} ledgerData
 * @property {String} ledgerData.data
 * @property {String} ledgerData.index
 *
 * @return {State}
 */

Remote.parseBinaryLedgerData = function(ledgerData) {
  var data = new SerializedObject(ledgerData.data);

  var state = data.to_json();
  state.index = ledgerData.index;

  return state;
};

/**
 * Request the overall transaction history.
 *
 * Returns a list of transactions that happened recently on the network. The
 * default number of transactions to be returned is 20.
 *
 * @param [Number] start
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestTransactionHistory =
Remote.prototype.requestTxHistory = function(start, callback) {
  // XXX Does this require the server to be trusted?
  // utils.assert(this.trusted);

  var request = new Request(this, 'tx_history');

  if (typeof start === 'object') {
    start = start.start;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  request.message.start = start;
  request.callback(callback);

  return request;
};

/**
 * Request book_offers
 *
 * @param {Object} options
 *   @param {Object} options.gets - taker_gets with issuer and currency
 *   @param {Object} options.pays - taker_pays with issuer and currency
 *   @param {String} [options.taker]
 *   @param {String} [options.ledger]
 *   @param {String|Number} [options.limit]
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestBookOffers = function(gets, pays, taker, callback) {
  var ledger;
  var limit;
  var lastArg = arguments[arguments.length - 1];

  if (gets.hasOwnProperty('gets') || gets.hasOwnProperty('taker_gets')) {
    var options = gets;
    // This would mutate the `lastArg` in `arguments` to be `null` and is
    // redundant. Once upon a time, some awkward code was written f(g, null,
    // null, cb) ...
    callback = pays;
    taker = options.taker;
    pays = options.pays || options.taker_pays;
    gets = options.gets || options.taker_gets;
    ledger = options.ledger;
    limit = options.limit;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

  var request = new Request(this, 'book_offers');

  request.message.taker_gets = {
    currency: Currency.json_rewrite(gets.currency, {force_hex: true})
  };

  if (!Currency.from_json(request.message.taker_gets.currency).is_native()) {
    request.message.taker_gets.issuer = UInt160.json_rewrite(gets.issuer);
  }

  request.message.taker_pays = {
    currency: Currency.json_rewrite(pays.currency, {force_hex: true})
  };

  if (!Currency.from_json(request.message.taker_pays.currency).is_native()) {
    request.message.taker_pays.issuer = UInt160.json_rewrite(pays.issuer);
  }

  request.message.taker = taker ? taker : UInt160.ACCOUNT_ONE;
  request.selectLedger(ledger);

  if (!isNaN(limit)) {
    limit = Number(limit);

    // max for 32-bit unsigned int is 4294967295
    // we'll clamp to 1e9
    if (limit > 1e9) {
      limit = 1e9;
    }
    // min for 32-bit unsigned int is 0
    // we'll clamp to 0
    if (limit < 0) {
      limit = 0;
    }

    request.message.limit = limit;
  }

  request.callback(callback);
  return request;
};

/**
 * Request wallet_accounts
 *
 * @param {String} seed
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestWalletAccounts = function(seed, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'wallet_accounts');

  if (typeof seed === 'object') {
    seed = seed.seed;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  request.message.seed = seed;
  request.callback(callback);

  return request;
};

/**
 * Request sign
 *
 * @param {String} secret
 * @param {Object} tx_json
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestSign = function(secret, tx_json, callback) {
  utils.assert(this.trusted); // Don't send secrets.

  var request = new Request(this, 'sign');

  if (typeof secret === 'object') {
    tx_json = secret.tx_json;
    secret = secret.secret;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  request.message.secret = secret;
  request.message.tx_json = tx_json;
  request.callback(callback);

  return request;
};

/**
 * Request submit
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestSubmit = function(callback) {
  return new Request(this, 'submit').callback(callback);
};

/**
 * Create a subscribe request with current subscriptions.
 *
 * Other classes can add their own subscriptions to this request by listening
 * to the server_subscribe event.
 *
 * This function will create and return the request, but not submit it.
 *
 * @param [Function] callback
 * @api private
 */

Remote.prototype._serverPrepareSubscribe = function(server, callback) {
  var self = this;
  var feeds = [ 'ledger', 'server' ];

  if (typeof server === 'function') {
    callback = server;
  }

  if (this._transaction_listeners) {
    feeds.push('transactions');
  }

  var request = this.requestSubscribe(feeds);

  function serverSubscribed(message) {
    self._stand_alone = !!message.stand_alone;
    self._testnet = !!message.testnet;

    if (typeof message.random === 'string') {
      var rand = message.random.match(/[0-9A-F]{8}/ig);

      while (rand && rand.length) {
        sjcl.random.addEntropy(parseInt(rand.pop(), 16));
      }

      self.emit('random', utils.hexToArray(message.random));
    }

    self._handleLedgerClosed(message, server);

    self.emit('subscribed');
  };

  request.on('error', function(err) {
    if (self.trace) {
      log.info('Initial server subscribe failed', err);
    }
  });

  request.once('success', serverSubscribed);

  self.emit('prepare_subscribe', request);

  request.callback(callback, 'subscribed');

  return request;
};

/**
 * For unit testing: ask the remote to accept the current ledger.
 * To be notified when the ledger is accepted, server_subscribe() then listen
 * to 'ledger_hash' events. A good way to be notified of the result of this is:
 * remote.on('ledger_closed', function(ledger_closed, ledger_index) { ... } );
 *
 * @param [Function] callback
 */

Remote.prototype.ledgerAccept =
Remote.prototype.requestLedgerAccept = function(callback) {
  if (!this._stand_alone) {
    this.emit('error', new RippleError('notStandAlone'));
    return;
  }

  var request = new Request(this, 'ledger_accept');

  this.once('ledger_closed', function(ledger) {
    request.emit('ledger_closed', ledger);
  });

  request.callback(callback, 'ledger_closed');
  request.request();

  return request;
};

/**
 * Account root request abstraction
 *
 * @this Remote
 * @api private
 */

Remote.accountRootRequest = function(type, responseFilter, account, ledger, callback) {
  if (typeof account === 'object') {
    callback = ledger;
    ledger = account.ledger;
    account = account.account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function') {
    callback = lastArg;
  }

  var request = this.requestLedgerEntry('account_root');

  request.accountRoot(account);
  request.selectLedger(ledger);

  request.once('success', function(message) {
    request.emit(type, responseFilter(message));
  });

  request.callback(callback, type);

  return request;
};

/**
 * Request account balance
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountBalance = function() {
  function responseFilter(message) {
    return Amount.from_json(message.node.Balance);
  };

  var args = Array.prototype.concat.apply(
    ['account_balance', responseFilter],
    arguments);

  var request = Remote.accountRootRequest.apply(this, args);

  return request;
};

/**
 * Request account flags
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountFlags = function() {
  function responseFilter(message) {
    return message.node.Flags;
  };

  var args = Array.prototype.concat.apply(
    ['account_flags', responseFilter],
    arguments);

  var request = Remote.accountRootRequest.apply(this, args);

  return request;
};

/**
 * Request owner count
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestOwnerCount = function() {
  function responseFilter(message) {
    return message.node.OwnerCount;
  };

  var args = Array.prototype.concat.apply(
    ['owner_count', responseFilter],
    arguments);

  var request = Remote.accountRootRequest.apply(this, args);

  return request;
};

/**
 * Get an account by accountID (address)
 *
 *
 * @param {String} account
 * @return {Account}
 */

Remote.prototype.getAccount = function(accountID) {
  return this._accounts[UInt160.json_rewrite(accountID)];
};

/**
 * Add an account by accountID (address)
 *
 * @param {String} account
 * @return {Account}
 */

Remote.prototype.addAccount = function(accountID) {
  var account = new Account(this, accountID);

  if (account.isValid()) {
    this._accounts[accountID] = account;
  }

  return account;
};

/**
 * Add an account if it does not exist, return the
 * account by accountID (address)
 *
 * @param {String} account
 * @return {Account}
 */

Remote.prototype.account =
Remote.prototype.findAccount = function(accountID) {
  var account = this.getAccount(accountID);
  return account ? account : this.addAccount(accountID);
};

/**
 * Create a pathfind
 *
 * @param {Object} options
 * @return {PathFind}
 */

Remote.prototype.pathFind =
Remote.prototype.createPathFind = function(src_account, dst_account, dst_amount, src_currencies) {
  if (typeof src_account === 'object') {
    var options = src_account;
    src_currencies = options.src_currencies;
    dst_amount = options.dst_amount;
    dst_account = options.dst_account;
    src_account = options.src_account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  var pathFind = new PathFind(this,
    src_account, dst_account,
    dst_amount, src_currencies);

  if (this._cur_path_find) {
    this._cur_path_find.notify_superceded();
  }

  pathFind.create();

  this._cur_path_find = pathFind;

  return pathFind;
};

Remote.prepareTrade = function(currency, issuer) {
  var suffix = Currency.from_json(currency).is_native() ? '' : ('/' + issuer);
  return currency + suffix;
};

/**
 * Create an OrderBook if it does not exist, return
 * the order book
 *
 * @param {Object} options
 * @return {OrderBook}
 */

Remote.prototype.book =
Remote.prototype.createOrderBook = function(currency_gets, issuer_gets, currency_pays, issuer_pays) {
  if (typeof currency_gets === 'object') {
    var options = currency_gets;
    issuer_pays = options.issuer_pays;
    currency_pays = options.currency_pays;
    issuer_gets = options.issuer_gets;
    currency_gets = options.currency_gets;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  var gets = Remote.prepareTrade(currency_gets, issuer_gets);
  var pays = Remote.prepareTrade(currency_pays, issuer_pays);
  var key = gets + ':' + pays;

  if (this._books.hasOwnProperty(key)) {
    return this._books[key];
  }

  var book = new OrderBook(this,
    currency_gets, issuer_gets,
    currency_pays, issuer_pays,
    key);

  if (book.is_valid()) {
    this._books[key] = book;
  }

  return book;
};

/**
 * Return the next account sequence
 *
 * @param {String} account
 * @param {String} sequence modifier (ADVANCE or REWIND)
 * @return {Number} sequence
 */

Remote.prototype.accountSeq =
Remote.prototype.getAccountSequence = function(account, advance) {
  var account = UInt160.json_rewrite(account);
  var accountInfo = this.accounts[account];

  if (!accountInfo) {
    return;
  }

  var seq = accountInfo.seq;
  var change = { ADVANCE: 1, REWIND: -1 }[advance.toUpperCase()] || 0;

  accountInfo.seq += change;

  return seq;
};

/**
 * Set account sequence
 *
 * @param {String} account
 * @param {Number} sequence
 */

Remote.prototype.setAccountSequence =
Remote.prototype.setAccountSeq = function(account, sequence) {
  var account = UInt160.json_rewrite(account);

  if (!this.accounts.hasOwnProperty(account)) {
    this.accounts[account] = { };
  }

  this.accounts[account].seq = sequence;
};

/**
 * Refresh an account's sequence from server
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.accountSeqCache = function(account, ledger, callback) {
  if (typeof account === 'object') {
    var options = account;
    callback = ledger;
    ledger = options.ledger;
    account = options.account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  if (!this.accounts.hasOwnProperty(account)) {
    this.accounts[account] = { };
  }

  var account_info = this.accounts[account];
  var request = account_info.caching_seq_request;

  function accountRootSuccess(message) {
    delete account_info.caching_seq_request;

    var seq = message.node.Sequence;
    account_info.seq = seq;

    request.emit('success_cache', message);
  };

  function accountRootError(message) {
    delete account_info.caching_seq_request;

    request.emit('error_cache', message);
  };

  if (!request) {
    request = this.requestLedgerEntry('account_root');
    request.accountRoot(account);
    request.selectLedger(ledger);
    request.once('success', accountRootSuccess);
    request.once('error', accountRootError);

    account_info.caching_seq_request = request;
  }

  request.callback(callback, 'success_cache', 'error_cache');

  return request;
};

/**
 * Mark an account's root node as dirty.
 *
 * @param {String} account
 */

Remote.prototype.dirtyAccountRoot = function(account) {
  var account = UInt160.json_rewrite(account);
  delete this.ledgers.current.account_root[account];
};

/**
 * Get an Offer from the ledger
 *
 * @param {Object} options
 *   @param {String|Number} options.ledger
 *   @param {String} [options.account]  - Required unless using options.index
 *   @param {Number} [options.sequence] - Required unless using options.index
 *   @param {String} [options.index]    - Required only if options.account and options.sequence not provided
 *
 * @callback
 * @param {Error} error
 * @param {Object} message
 *
 * @return {Request}
 */

Remote.prototype.requestOffer = function(options, callback) {
  var request = this.requestLedgerEntry('offer');

  if (options.account && options.sequence) {
    request.offerId(options.account, options.sequence);
  } else if (options.index) {
    request.offerIndex(options.index);
  }

  request.ledgerSelect(options.ledger);

  request.once('success', function(res) {
    request.emit('offer', res);
  });

  request.callback(callback, 'offer');

  return request;
};


/**
 * Get an account's balance
 *
 * @param {String} account
 * @param [String] issuer
 * @param [String] currency
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestRippleBalance = function(account, issuer, currency, ledger, callback) {
  if (typeof account === 'object') {
    var options = account;
    callback = issuer;
    ledger = options.ledger;
    currency = options.currency;
    issuer = options.issuer;
    account = options.account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  // YYY Could be cached per ledger.
  var request = this.requestLedgerEntry('ripple_state');

  request.rippleState(account, issuer, currency);
  request.selectLedger(ledger);

  function rippleState(message) {
    var node = message.node;
    var lowLimit = Amount.from_json(node.LowLimit);
    var highLimit = Amount.from_json(node.HighLimit);

    // The amount the low account holds of issuer.
    var balance = Amount.from_json(node.Balance);

    // accountHigh implies for account: balance is negated.  highLimit is the
    // limit set by account.
    var accountHigh = UInt160.from_json(account).equals(highLimit.issuer());

    request.emit('ripple_state', {
      account_balance: (accountHigh
        ? balance.negate()
        : balance.clone()).parse_issuer(account),
      peer_balance: (!accountHigh
        ? balance.negate()
        : balance.clone()).parse_issuer(issuer),
      account_limit: (accountHigh
        ? highLimit
        : lowLimit).clone().parse_issuer(issuer),
      peer_limit: (!accountHigh
        ? highLimit
        : lowLimit).clone().parse_issuer(account),
      account_quality_in: (accountHigh
        ? node.HighQualityIn
        : node.LowQualityIn),
      peer_quality_in: (!accountHigh
        ? node.HighQualityIn
        : node.LowQualityIn),
      account_quality_out: (accountHigh
        ? node.HighQualityOut
        : node.LowQualityOut),
      peer_quality_out: (!accountHigh
        ? node.HighQualityOut
        : node.LowQualityOut)
    });
  };

  request.once('success', rippleState);
  request.callback(callback, 'ripple_state');

  return request;
};

Remote.prepareCurrency =
Remote.prepareCurrencies = function(currency) {
  var newCurrency = { };

  if (currency.hasOwnProperty('issuer')) {
    newCurrency.issuer = UInt160.json_rewrite(currency.issuer);
  }

  if (currency.hasOwnProperty('currency')) {
    newCurrency.currency =
      Currency.json_rewrite(currency.currency, {force_hex: true});
  }

  return newCurrency;
};

/**
 * Request ripple_path_find
 *
 * @param {Object} options
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestRipplePathFind = function(src_account, dst_account, dst_amount, src_currencies, callback) {
  if (typeof src_account === 'object') {
    var options = src_account;
    callback = dst_account;
    src_currencies = options.src_currencies;
    dst_amount = options.dst_amount;
    dst_account = options.dst_account;
    src_account = options.src_account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  var request = new Request(this, 'ripple_path_find');

  request.message.source_account = UInt160.json_rewrite(src_account);
  request.message.destination_account = UInt160.json_rewrite(dst_account);
  request.message.destination_amount = Amount.json_rewrite(dst_amount);

  if (src_currencies) {
    request.message.source_currencies =
      src_currencies.map(Remote.prepareCurrencies);
  }

  request.callback(callback);

  return request;
};

/**
 * Request path_find/create
 *
 * @param {Object} options
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestPathFindCreate = function(src_account, dst_account, dst_amount, src_currencies, callback) {
  if (typeof src_account === 'object') {
    var options = src_account;
    callback = dst_account;
    src_currencies = options.src_currencies;
    dst_amount = options.dst_amount;
    dst_account = options.dst_account;
    src_account = options.src_account;
  } else {
    console.error('DEPRECATED: First argument to request constructor should be'
      + ' an object containing request properties');
  }

  var request = new Request(this, 'path_find');

  request.message.subcommand = 'create';
  request.message.source_account = UInt160.json_rewrite(src_account);
  request.message.destination_account = UInt160.json_rewrite(dst_account);
  request.message.destination_amount = Amount.json_rewrite(dst_amount);

  if (src_currencies) {
    request.message.source_currencies =
      src_currencies.map(Remote.prepareCurrencies);
  }

  request.callback(callback);

  return request;
};

/**
 * Request path_find/close
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestPathFindClose = function(callback) {
  var request = new Request(this, 'path_find');

  request.message.subcommand = 'close';
  request.callback(callback);

  return request;
};

/**
 * Request unl_list
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestUnlList = function(callback) {
  return new Request(this, 'unl_list').callback(callback);
};

/**
 * Request unl_add
 *
 * @param {String} address
 * @param {String} comment
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestUnlAdd = function(address, comment, callback) {
  var request = new Request(this, 'unl_add');

  request.message.node = address;

  if (comment) {
    // note is not specified anywhere, should remove?
    request.message.comment = void(0);
  }

  request.callback(callback);

  return request;
};

/**
 * Request unl_delete
 *
 * @param {String} node
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestUnlDelete = function(node, callback) {
  var request = new Request(this, 'unl_delete');

  request.message.node = node;
  request.callback(callback);

  return request;
};

/**
 * Request peers
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestPeers = function(callback) {
  return new Request(this, 'peers').callback(callback);
};

/**
 * Request connect
 *
 * @param {String} ip
 * @param {Number} port
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestConnect = function(ip, port, callback) {
  var request = new Request(this, 'connect');

  request.message.ip = ip;

  if (port) {
    request.message.port = port;
  }

  request.callback(callback);

  return request;
};

/**
 * Create a Transaction
 *
 * @param {String} TransactionType
 * @param {Object} options
 * @return {Transaction}
 */

Remote.prototype.transaction =
Remote.prototype.createTransaction = function(type, options) {
  if (arguments.length === 0) {
    // Fallback
    return new Transaction(this);
  }

  assert.strictEqual(typeof type, 'string',
    'TransactionType must be a string');
  assert.strictEqual(typeof options, 'object',
    'Transaction options must be an object');

  var transaction = new Transaction(this);

  var transactionTypes = {
    payment: 'payment',
    accountset: 'accountSet',
    trustset: 'trustSet',
    offercreate: 'offerCreate',
    offercancel: 'offerCancel',
    setregularkey: 'setRegularKey',
    sign: 'sign'
  };

  var transactionConstructor = transactionTypes[type.toLowerCase()];

  if (!transactionConstructor) {
    throw new Error('Invalid transaction type: ' + type);
  }

  return transaction[transactionConstructor](options);
};

/**
 * Calculate a transaction fee for a number of tx fee units.
 *
 * This takes into account the last known network and local load fees.
 *
 * @param {Number} fee units
 * @return {Amount} Final fee in XRP for specified number of fee units.
 */

Remote.prototype.feeTx = function(units) {
  var server = this.getServer();

  if (!server) {
    throw new Error('No connected servers');
  }

  return server._feeTx(units);
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
  var server = this.getServer();

  if (!server) {
    throw new Error('No connected servers');
  }

  return server._feeTxUnit();
};

/**
 * Get the current recommended reserve base.
 *
 * Returns the base reserve with load fees and safety margin applied.
 *
 * @param {Number} owner count
 * @return {Amount}
 */

Remote.prototype.reserve = function(owner_count) {
  var server = this.getServer();

  if (!server) {
    throw new Error('No connected servers');
  }

  return server._reserve(owner_count);
};

exports.Remote = Remote;

// vim:sw=2:sts=2:ts=8:et
