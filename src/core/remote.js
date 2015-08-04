'use strict';

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

const util = require('util');
const assert = require('assert');
const _ = require('lodash');
const LRU = require('lru-cache');
const async = require('async');
const EventEmitter = require('events').EventEmitter;
const Server = require('./server').Server;
const Request = require('./request').Request;
const Amount = require('./amount').Amount;
const Currency = require('./currency').Currency;
const UInt160 = require('./uint160').UInt160;
const UInt256 = require('./uint256').UInt256;
const Transaction = require('./transaction').Transaction;
const Account = require('./account').Account;
const Meta = require('./meta').Meta;
const OrderBook = require('./orderbook').OrderBook;
const PathFind = require('./pathfind').PathFind;
const SerializedObject = require('./serializedobject').SerializedObject;
const RippleError = require('./rippleerror').RippleError;
const utils = require('./utils');
const hashprefixes = require('./hashprefixes');
const log = require('./log').internal.sub('remote');

/**
 * Interface to manage connections to rippled servers
 *
 * @param {Object} Options
 */

function Remote(options = {}) {
  EventEmitter.call(this);

  const self = this;

  _.merge(this, _.defaults(options, Remote.DEFAULTS));

  this.state = 'offline'; // 'online', 'offline'
  this._server_fatal = false; // server exited
  this._stand_alone = undefined;
  this._testnet = undefined;

  this._ledger_current_index = undefined;
  this._ledger_hash = undefined;
  this._ledger_time = undefined;

  this._connection_count = 0;
  this._connected = false;
  this._should_connect = true;

  this._transaction_listeners = 0;
  this._received_tx = new LRU({max: 100});
  this._cur_path_find = null;

  if (this.local_signing) {
    // Local signing implies local fees and sequences
    this.local_sequence = true;
    this.local_fee = true;
  }

  this._servers = [ ];
  this._primary_server = undefined;

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
  if (typeof this.automatic_resubmission !== 'boolean') {
    throw new TypeError('automatic_resubmission must be a boolean');
  }
  if (typeof this.last_ledger_offset !== 'number') {
    throw new TypeError('last_ledger_offset must be a number');
  }
  if (!Array.isArray(this.servers)) {
    throw new TypeError('servers must be an array');
  }

  this.setMaxListeners(this.max_listeners);

  this.servers.forEach(function(serverOptions) {
    const server = self.addServer(serverOptions);
    server.setMaxListeners(self.max_listeners);
  });

  function listenersModified(action, event) {
    // Automatically subscribe and unsubscribe to orderbook
    // on the basis of existing event listeners
    if (_.contains(Remote.TRANSACTION_EVENTS, event)) {
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
  }

  this.on('newListener', function(event) {
    listenersModified('add', event);
  });

  this.on('removeListener', function(event) {
    listenersModified('remove', event);
  });
}

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
  automatic_resubmission: true,
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
    DisableMaster: 0x00100000,  // force regular key
    NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
    GlobalFreeze: 0x00400000, // trustlines globally frozen
    DefaultRipple: 0x00800000
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
  this.trace = (trace === undefined || trace);
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

Remote.prototype.addServer = function(options) {
  const self = this;
  const server = new Server(this, options);

  function serverMessage(data) {
    self._handleMessage(data, server);
  }

  server.on('message', serverMessage);

  function serverConnect() {
    self._connection_count += 1;

    if (options.primary) {
      self._setPrimaryServer(server);
    }
    if (self._connection_count === 1) {
      self._setState('online');
    }
    if (self._connection_count === self._servers.length) {
      self.emit('ready');
    }
  }

  server.on('connect', serverConnect);

  function serverDisconnect() {
    self._connection_count--;
    if (self._connection_count === 0) {
      self._setState('offline');
    }
  }

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

Remote.prototype.disconnect = function(callback_) {
  if (!this._servers.length) {
    throw new Error('No servers available, not disconnecting');
  }

  const callback = _.isFunction(callback_)
  ? callback_
  : function() {};

  this._should_connect = false;

  if (!this.isConnected()) {
    callback();
    return this;
  }

  this.once('disconnect', callback);

  this._servers.forEach(function(server) {
    server.disconnect();
  });

  this._setState('offline');

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
  if (!Remote.isValidMessage(message)) {
    // Unexpected response from remote.
    const error = new RippleError('remoteUnexpected',
      'Unexpected response from remote: ' + JSON.stringify(message));

    this.emit('error', error);
    log.error(error);
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
    case 'validationReceived':
      this._handleValidationReceived(message, server);
      break;
    default:
      if (this.trace) {
        log.info(message.type + ': ', message);
      }
      break;
  }
};

Remote.prototype.getLedgerSequence = function() {
  if (!this._ledger_current_index) {
    throw new Error('Ledger sequence has not yet been initialized');
  }
  // the "current" ledger is the one after the most recently closed ledger
  return this._ledger_current_index - 1;
};

/**
 * Handle server ledger_closed event
 *
 * @param {Object} message
 */

Remote.prototype._handleLedgerClosed = function(message, server) {
  const self = this;

  // XXX If not trusted, need to verify we consider ledger closed.
  // XXX Also need to consider a slow server or out of order response.
  // XXX Be more defensive fields could be missing or of wrong type.
  // YYY Might want to do some cache management.
  if (!Remote.isValidLedgerData(message)) {
    return;
  }

  const ledgerAdvanced = message.ledger_index >= this._ledger_current_index;

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
 * Handle server validation_received event
 *
 * @param {Object} message
 */

Remote.prototype._handleValidationReceived = function(message, server) {
  this.emit('validation_received', message, server);
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
  const transactionHash = message.transaction.hash;

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

  const metadata = message.meta || message.metadata;

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
    // XX
    ['Account', 'Destination'].forEach(function(prop) {
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
  return this._servers.filter(function(server) {
    return server.isConnected();
  });
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

  const connectedServers = this.getConnectedServers();
  if (connectedServers.length === 0 || !connectedServers[0]) {
    return null;
  }

  let server = connectedServers[0];
  let cScore = server._score + server._fee;

  for (let i = 1; i < connectedServers.length; i++) {
    const _server = connectedServers[i];
    const bScore = _server._score + _server._fee;
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
    const prefix = /^request_/.test(request) ? '' : 'request_';
    const requestName = prefix + request;
    const methodName = requestName.replace(/(\_\w)/g, m => m[1].toUpperCase());

    if (typeof this[methodName] === 'function') {
      const args = _.slice(arguments, 1);
      return this[methodName].apply(this, args);
    }

    throw new Error('Command does not exist: ' + requestName);
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

  const server = request.server || this.getServer();
  if (server) {
    server._request(request);
  } else {
    request.emit('error', new Error('No servers available'));
  }
};

/**
 *  Create options object from positional function arguments
 *
 * @param {Array} params function parameters
 * @param {Array} args function arguments
 * @return {Object} keyed options
 */

function makeOptions(command, params, args) {
  const result = {};

  log.warn(
    'DEPRECATED: First argument to ' + command
    + ' request constructor must be an object containing'
    + ' request properties: '
    + params.join(', ')
  );

  if (_.isFunction(_.last(args))) {
    result.callback = args.pop();
  }

  return _.merge(result, _.zipObject(params, args));
}

/**
 * Request ping
 *
 * @param [String] server host
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.ping =
Remote.prototype.requestPing = function(host, callback_) {
  const request = new Request(this, 'ping');
  let callback = callback_;

  switch (typeof host) {
    case 'function':
      callback = host;
      break;
    case 'string':
      request.setServer(host);
      break;
  }

  const then = Date.now();

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

Remote.prototype.requestLedger = function(options, callback_) {
  // XXX This is a bad command. Some variants don't scale.
  // XXX Require the server to be trusted.
  // utils.assert(this.trusted);

  const request = new Request(this, 'ledger');
  let callback = callback_;

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
            request.message[o] = options[o] ? true : false;
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
 * @property {Boolean} [options.binary]- Flag which determines if rippled
 * returns binary or parsed JSON
 * @property {String|Number} [options.ledger] - Hash or sequence of a ledger
 * to get contents for
 * @property {Number} [options.limit] - Number of contents to retrieve
 * from the ledger
 * @property {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {LedgerData} ledgerData
 *
 * @return {Request} request
 */

Remote.prototype.requestLedgerData = function(options, callback) {
  const request = new Request(this, 'ledger_data');

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
    }

    function complete(err, state) {
      if (err) {
        request.emit('error', err);
      } else {
        res.state = state;
        request.emit('state', res);
      }
    }

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

Remote.prototype.requestLedgerEntry = function(type, callback_) {
  // utils.assert(this.trusted);
  // If not trusted, need to check proof, maybe talk packet protocol.

  const self = this;

  const request = new Request(this, 'ledger_entry');
  const callback = _.isFunction(type) ? type : callback_;

  // Transparent caching. When .request() is invoked, look in the Remote object
  // for the result.  If not found, listen, cache result, and emit it.
  //
  // Transparent caching:
  if (type === 'account_root') {
    request.request_default = request.request;

    request.request = function() {
      // Intercept default request.
      let bDefault = true;

      if (!self._ledger_hash && type === 'account_root') {
        let cache = self.ledgers.current.account_root;

        if (!cache) {
          cache = self.ledgers.current.account_root = {};
        }

        const node = self.ledgers.current
        .account_root[request.message.account_root];

        if (node) {
          // Emulate fetch of ledger entry.
          // YYY Missing lots of fields.
          request.emit('success', {node: node});
          bDefault = false;
        } else { // Was not cached.
          // XXX Only allow with trusted mode.  Must sync response with advance
          switch (type) {
            case 'account_root':
              request.once('success', function(message) {
                // Cache node.
                self.ledgers.current
                .account_root[message.node.Account] = message.node;
              });
              break;

            default:
              // This type not cached.
          }
        }
      }

      if (bDefault) {
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
  const request = new Request(this, 'subscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [streams];
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
  const request = new Request(this, 'unsubscribe');

  if (streams) {
    request.message.streams = Array.isArray(streams) ? streams : [streams];
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

Remote.prototype.requestTransactionEntry = function(options_, callback_) {
  // If not trusted, need to check proof, maybe talk packet protocol.
  // utils.assert(this.trusted);
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, {
      ledger: options_.ledger_index || options_.ledger_hash
    }, options_);
  } else {
    _.merge(options, makeOptions(
      'transaction_entry',
    ['hash', 'ledger'],
    _.slice(arguments)));
  }

  const request = new Request(this, 'transaction_entry');
  request.txHash(options.hash);

  switch (typeof options.ledger) {
    case 'string':
    case 'number':
      request.selectLedger(options.ledger);
      break;
    case 'undefined':
      request.ledgerIndex('validated');
      break;
    default:
      throw new Error('ledger must be a ledger index or hash');
  }

  request.callback(options.callback);

  return request;
};

/**
 * Request tx
 *
 * @param {Object|String} hash
 * @property {String} hash.hash           - Transaction hash
 * @property {Boolean} [hash.binary=true] - Flag which determines if rippled
 * returns binary or parsed JSON
 * @param [Function] callback
 * @return {Request} request
 */

Remote.prototype.requestTransaction =
Remote.prototype.requestTx = function(options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'tx',
      ['hash', 'binary'],
      _.slice(arguments)
    ));
  }

  const request = new Request(this, 'tx');
  request.message.binary = options.binary !== false;
  request.message.transaction = options.hash;

  request.once('success', function(res) {
    if (options.binary === false) {
      request.emit('transaction', res);
    } else {
      request.emit('transaction', Remote.parseBinaryTransaction(res));
    }
  });

  request.callback(options.callback, 'transaction');

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
 * @param {String} command - request command, e.g. 'account_lines'
 * @param {Object} options - all optional
 *   @param {String} account - ripple address
 *   @param {String} peer - ripple address
 *   @param [String|Number] ledger identifier
 *   @param [Number] limit - max results per response
 *   @param {String} marker - start position in response paging
 * @param [Function] callback
 * @return {Request}
 * @throws {Error} if a marker is provided, but no ledger_index or ledger_hash
 */

Remote.accountRequest = function(command, options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      command,
      ['account', 'ledger', 'peer', 'limit', 'marker'],
      _.slice(arguments, 1)));
  }

  // if a marker is given, we need a ledger
  // check if a valid ledger_index or ledger_hash is provided
  if (options.marker) {
    if (!(Number(options.ledger) > 0) && !UInt256.is_valid(options.ledger)) {
      throw new Error(
        'A ledger_index or ledger_hash must be provided when using a marker');
    }
  }

  const request = new Request(this, command);

  request.message.account = UInt160.json_rewrite(options.account);
  request.selectLedger(options.ledger);

  if (UInt160.is_valid(options.peer)) {
    request.message.peer = UInt160.json_rewrite(options.peer);
  }

  if (!isNaN(options.limit)) {
    let _limit = Number(options.limit);

    // max for 32-bit unsigned int is 4294967295
    // we'll clamp to 1e9
    if (_limit > 1e9) {
      _limit = 1e9;
    }
    // min for 32-bit unsigned int is 0
    // we'll clamp to 0
    if (_limit < 0) {
      _limit = 0;
    }

    request.message.limit = _limit;
  }

  if (options.marker) {
    request.message.marker = options.marker;
  }

  request.callback(options.callback);

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

Remote.prototype.requestAccountInfo = function(...args) {
  const options = ['account_info', ...args];
  return Remote.accountRequest.apply(this, options);
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

Remote.prototype.requestAccountCurrencies = function(...args) {
  const options = ['account_currencies', ...args];
  return Remote.accountRequest.apply(this, options);
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

Remote.prototype.requestAccountLines = function(...args) {
  // XXX Does this require the server to be trusted?
  // utils.assert(this.trusted);
  let options = ['account_lines'];

  if (_.isPlainObject(args[0])) {
    options = options.concat(args);
  } else {
    const [account, peer, ledger] = args;
    options = options.concat([
      account,
      ledger,
      peer,
      ...args.slice(3)
    ]);
  }

  return Remote.accountRequest.apply(this, options);
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

Remote.prototype.requestAccountOffers = function(...args) {
  const options = ['account_offers', ...args];
  return Remote.accountRequest.apply(this, options);
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

  const request = new Request(this, 'account_tx');

  options.binary = options.binary !== false;

  if (options.min_ledger !== undefined) {
    options.ledger_index_min = options.min_ledger;
  }

  if (options.max_ledger !== undefined) {
    options.ledger_index_max = options.max_ledger;
  }

  if (options.binary && options.parseBinary === undefined) {
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
    }

    function complete(err, transactions) {
      if (err) {
        request.emit('error', err);
      } else {
        res.transactions = transactions;
        request.emit('transactions', res);
      }
    }

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
  const tx_obj = new SerializedObject(transaction.tx_blob);
  const tx_obj_json = tx_obj.to_json();
  const meta = new SerializedObject(transaction.meta).to_json();

  const tx_result = {
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
  const tx_obj = new SerializedObject(transaction.tx).to_json();
  const meta = new SerializedObject(transaction.meta).to_json();

  const tx_result = tx_obj;

  tx_result.date = transaction.date;
  tx_result.hash = transaction.hash;
  tx_result.inLedger = transaction.inLedger;
  tx_result.ledger_index = transaction.ledger_index;
  tx_result.meta = meta;
  tx_result.validated = transaction.validated;

  switch (typeof meta.DeliveredAmount) {
    case 'string':
    case 'object':
      tx_result.meta.delivered_amount = meta.DeliveredAmount;
      break;
    default:
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
  const data = new SerializedObject(ledgerData.data).to_json();
  data.index = ledgerData.index;
  return data;
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
Remote.prototype.requestTxHistory = function(start_, callback_) {
  // XXX Does this require the server to be trusted?
  // utils.assert(this.trusted);

  const request = new Request(this, 'tx_history');
  const options = {start: start_, callback: callback_};

  if (_.isPlainObject(start_)) {
    _.merge(options, start_);
  } else {
    _.merge(options, makeOptions(
      'tx_history', ['start'], _.slice(arguments)));
  }

  request.message.start = options.start;
  request.callback(options.callback);

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

Remote.prototype.requestBookOffers = function(options_, callback_) {
  const options = {callback: callback_};

  if (options_.gets || options_.taker_gets) {
    _.merge(options, {
      pays: options_.taker_pays,
      gets: options_.taker_gets
    }, options_);
  } else {
    _.merge(options, makeOptions(
      'book_offers',
      ['gets', 'pays', 'taker', 'ledger', 'limit'],
      _.slice(arguments)
    ));
  }

  const {gets, pays, taker, ledger, limit} = options;
  const request = new Request(this, 'book_offers');

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
    let _limit = Number(limit);

    // max for 32-bit unsigned int is 4294967295
    // we'll clamp to 1e9
    if (_limit > 1e9) {
      _limit = 1e9;
    }
    // min for 32-bit unsigned int is 0
    // we'll clamp to 0
    if (_limit < 0) {
      _limit = 0;
    }

    request.message.limit = _limit;
  }

  request.callback(options.callback);
  return request;
};

/**
 * Request wallet_accounts
 *
 * @param {String} seed
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestWalletAccounts = function(options_, callback_) {
  utils.assert(this.trusted); // Don't send secrets.

  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'wallet_accounts',
      ['seed'],
      _.slice(arguments)
    ));
  }

  const request = new Request(this, 'wallet_accounts');
  request.message.seed = options.seed;
  request.callback(options.callback);

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

Remote.prototype.requestSign = function(options_, callback_) {
  utils.assert(this.trusted); // Don't send secrets.

  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'sign',
      ['secret', 'tx_json'],
      _.slice(arguments)
    ));
  }

  const request = new Request(this, 'sign');
  request.message.secret = options.secret;
  request.message.tx_json = options.tx_json;
  request.callback(options.callback);

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

Remote.prototype._serverPrepareSubscribe = function(server, callback_) {
  const self = this;
  const feeds = ['ledger', 'server'];
  const callback = _.isFunction(server) ? server : callback_;

  if (this._transaction_listeners) {
    feeds.push('transactions');
  }

  const request = this.requestSubscribe(feeds);

  function serverSubscribed(message) {
    self._stand_alone = !!message.stand_alone;
    self._testnet = !!message.testnet;
    self._handleLedgerClosed(message, server);
    self.emit('subscribed');
  }

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
  /* eslint-disable consistent-return */
  const request = new Request(this, 'ledger_accept');

  if (!this._stand_alone) {
    // XXX This should emit error on the request
    this.emit('error', new RippleError('notStandAlone'));
    return;
  }

  this.once('ledger_closed', function(ledger) {
    request.emit('ledger_closed', ledger);
  });

  request.callback(callback, 'ledger_closed');
  request.request();

  return request;
  /* eslint-enable consistent-return */
};

/**
 * Account root request abstraction
 *
 * @this Remote
 * @api private
 */

Remote.accountRootRequest = function(command, filter, options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      command,
      ['account', 'ledger'],
      _.slice(arguments, 2)));
  }

  const request = this.requestLedgerEntry('account_root');
  request.accountRoot(options.account);
  request.selectLedger(options.ledger);

  request.once('success', function(message) {
    request.emit(command, filter(message));
  });

  request.callback(options.callback, command);

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

Remote.prototype.requestAccountBalance = function(...args) {
  function responseFilter(message) {
    return Amount.from_json(message.node.Balance);
  }

  const options = ['account_balance', responseFilter, ...args];
  return Remote.accountRootRequest.apply(this, options);
};

/**
 * Request account flags
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestAccountFlags = function(...args) {
  function responseFilter(message) {
    return message.node.Flags;
  }

  const options = ['account_flags', responseFilter, ...args];
  return Remote.accountRootRequest.apply(this, options);
};

/**
 * Request owner count
 *
 * @param {String} account
 * @param [String|Number] ledger
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestOwnerCount = function(...args) {
  function responseFilter(message) {
    return message.node.OwnerCount;
  }

  const options = ['owner_count', responseFilter, ...args];
  return Remote.accountRootRequest.apply(this, options);
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
  const account = new Account(this, accountID);

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
  const account = this.getAccount(accountID);
  return account ? account : this.addAccount(accountID);
};

/**
 * Create a pathfind
 *
 * @param {Object} options
 * @return {PathFind}
 */

function createPathFind(options_) {
  const options = {};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'pathfind',
      ['src_account', 'dst_account', 'dst_amount', 'src_currencies'],
      _.slice(arguments)
    ));
  }

  const pathFind = new PathFind(this,
    options.src_account, options.dst_account,
    options.dst_amount, options.src_currencies);

  if (this._cur_path_find) {
    this._cur_path_find.notify_superceded();
  }

  pathFind.create();

  this._cur_path_find = pathFind;

  return pathFind;
}

Remote.prototype.pathFind = Remote.prototype.createPathFind = createPathFind;

Remote.prepareTrade = function(currency, issuer) {
  const suffix = Currency.from_json(currency).is_native() ? '' : ('/' + issuer);
  return currency + suffix;
};

/**
 * Create an OrderBook if it does not exist, return
 * the order book
 *
 * @param {Object} options
 * @return {OrderBook}
 */

Remote.prototype.book = Remote.prototype.createOrderBook = function(options_) {
  const options = {};

  if (arguments.length === 1) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'orderbook',
      ['currency_gets', 'issuer_gets', 'currency_pays', 'issuer_pays'],
      _.slice(arguments)
    ));
  }

  const gets = Remote.prepareTrade(options.currency_gets, options.issuer_gets);
  const pays = Remote.prepareTrade(options.currency_pays, options.issuer_pays);
  const key = gets + ':' + pays;

  if (this._books.hasOwnProperty(key)) {
    return this._books[key];
  }

  const book = new OrderBook(this,
    options.currency_gets, options.issuer_gets,
    options.currency_pays, options.issuer_pays,
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
Remote.prototype.getAccountSequence = function(account_, advance) {
  const account = UInt160.json_rewrite(account_);
  const accountInfo = this.accounts[account];

  if (!accountInfo) {
    return NaN;
  }

  const seq = accountInfo.seq;
  const change = {ADVANCE: 1, REWIND: -1}[advance.toUpperCase()] || 0;

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
Remote.prototype.setAccountSeq = function(account_, sequence) {
  const account = UInt160.json_rewrite(account_);

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

Remote.prototype.accountSeqCache = function(options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'accountseqcache',
      ['account', 'ledger']
    ));
  }

  if (!this.accounts.hasOwnProperty(options.account)) {
    this.accounts[options.account] = { };
  }

  const account_info = this.accounts[options.account];
  let request = account_info.caching_seq_request;

  function accountRootSuccess(message) {
    delete account_info.caching_seq_request;

    const seq = message.node.Sequence;
    account_info.seq = seq;

    request.emit('success_cache', message);
  }

  function accountRootError(message) {
    delete account_info.caching_seq_request;

    request.emit('error_cache', message);
  }

  if (!request) {
    request = this.requestLedgerEntry('account_root');
    request.accountRoot(options.account);

    if (!_.isUndefined(options.ledger)) {
      request.selectLedger(options.ledger);
    }

    request.once('success', accountRootSuccess);
    request.once('error', accountRootError);

    account_info.caching_seq_request = request;
  }

  request.callback(options.callback, 'success_cache', 'error_cache');

  return request;
};

/**
 * Mark an account's root node as dirty.
 *
 * @param {String} account
 */

Remote.prototype.dirtyAccountRoot = function(account_) {
  const account = UInt160.json_rewrite(account_);
  delete this.ledgers.current.account_root[account];
};

/**
 * Get an Offer from the ledger
 *
 * @param {Object} options
 *   @param {String|Number} options.ledger
 *   @param {String} [options.account]  - Required unless using options.index
 *   @param {Number} [options.sequence] - Required unless using options.index
 *   @param {String} [options.index]    - Required only if options.account and
 *   options.sequence not provided
 *
 * @callback
 * @param {Error} error
 * @param {Object} message
 *
 * @return {Request}
 */

Remote.prototype.requestOffer = function(options, callback) {
  const request = this.requestLedgerEntry('offer');

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

Remote.prototype.requestRippleBalance = function(options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, options_);
  } else {
    _.merge(options, makeOptions(
      'ripplebalance',
      ['account', 'issuer', 'currency', 'ledger'],
      _.slice(arguments)
    ));

  }

  // YYY Could be cached per ledger.
  const request = this.requestLedgerEntry('ripple_state');
  request.rippleState(options.account, options.issuer, options.currency);

  if (!_.isUndefined(options.ledger)) {
    request.selectLedger(options.ledger);
  }

  function rippleState(message) {
    const node = message.node;
    const lowLimit = Amount.from_json(node.LowLimit);
    const highLimit = Amount.from_json(node.HighLimit);

    // The amount the low account holds of issuer.
    const balance = Amount.from_json(node.Balance);

    // accountHigh implies for account: balance is negated.  highLimit is the
    // limit set by account.
    const accountHigh = UInt160.from_json(options.account)
    .equals(highLimit.issuer());

    request.emit('ripple_state', {
      account_balance: (accountHigh
        ? balance.negate()
        : balance.clone()).parse_issuer(options.account),
      peer_balance: (!accountHigh
        ? balance.negate()
        : balance.clone()).parse_issuer(options.issuer),
      account_limit: (accountHigh
        ? highLimit
        : lowLimit).clone().parse_issuer(options.issuer),
      peer_limit: (!accountHigh
        ? highLimit
        : lowLimit).clone().parse_issuer(options.account),
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
  }

  request.once('success', rippleState);
  request.callback(options.callback, 'ripple_state');

  return request;
};

Remote.prepareCurrency =
Remote.prepareCurrencies = function(currency) {
  const newCurrency = { };

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

Remote.prototype.requestRipplePathFind = function(options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, {
      source_account: options_.src_account,
      destination_account: options_.dst_account,
      destination_amount: options_.dst_amount,
      source_currencies: options_.src_currencies
      }, options_);
  } else {
    _.merge(options, makeOptions(
      'ripple_path_find',
      /* eslint-disable max-len */
      ['source_account', 'destination_account', 'destination_amount', 'source_currencies'],
      /* eslint-enable max-len */
      _.slice(arguments)
    ));
  }

  const request = new Request(this, 'ripple_path_find');

  request.message.source_account = UInt160.json_rewrite(options.source_account);

  request.message.destination_account =
    UInt160.json_rewrite(options.destination_account);

  request.message.destination_amount =
    Amount.json_rewrite(options.destination_amount);

  if (Array.isArray(options.source_currencies)) {
    request.message.source_currencies =
      options.source_currencies.map(Remote.prepareCurrency);
  }

  request.callback(options.callback);

  return request;
};

/**
 * Request path_find/create
 *
 * @param {Object} options
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestPathFindCreate = function(options_, callback_) {
  const options = {callback: callback_};

  if (_.isPlainObject(options_)) {
    _.merge(options, {
      source_account: options_.src_account,
      destination_account: options_.dst_account,
      destination_amount: options_.dst_amount,
      source_currencies: options_.src_currencies
      }, options_);
  } else {
    _.merge(options, makeOptions(
      'path_find',
      /* eslint-disable max-len */
      ['source_account', 'destination_account', 'destination_amount', 'source_currencies'],
      /* eslint-enable max-len */
      _.slice(arguments)
    ));
  }

  const request = new Request(this, 'path_find');
  request.message.subcommand = 'create';

  request.message.source_account = UInt160.json_rewrite(options.source_account);

  request.message.destination_account =
    UInt160.json_rewrite(options.destination_account);

  request.message.destination_amount =
    Amount.json_rewrite(options.destination_amount);

  if (Array.isArray(options.source_currencies)) {
    request.message.source_currencies =
      options.source_currencies.map(Remote.prepareCurrency);
  }

  request.callback(options.callback);

  return request;
};

/**
 * Request path_find/close
 *
 * @param [Function] callback
 * @return {Request}
 */

Remote.prototype.requestPathFindClose = function(callback) {
  const request = new Request(this, 'path_find');

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
  const request = new Request(this, 'unl_add');

  request.message.node = address;

  if (comment) {
    // note is not specified anywhere, should remove?
    request.message.comment = undefined;
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
  const request = new Request(this, 'unl_delete');

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
  const request = new Request(this, 'connect');

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
Remote.prototype.createTransaction = function(type, options = {}) {
  const transaction = new Transaction(this);

  if (arguments.length === 0) {
    // Fallback
    return transaction;
  }

  assert.strictEqual(typeof type, 'string', 'TransactionType must be a string');

  const constructorMap = {
    Payment: transaction.payment,
    AccountSet: transaction.accountSet,
    TrustSet: transaction.trustSet,
    OfferCreate: transaction.offerCreate,
    OfferCancel: transaction.offerCancel,
    SetRegularKey: transaction.setRegularKey
  };

  const transactionConstructor = constructorMap[type];

  if (!transactionConstructor) {
    throw new Error('TransactionType must be a valid transaction type');
  }

  return transactionConstructor.call(transaction, options);
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
  const server = this.getServer();

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
  const server = this.getServer();

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
  const server = this.getServer();

  if (!server) {
    throw new Error('No connected servers');
  }

  return server._reserve(owner_count);
};

exports.Remote = Remote;

// vim:sw=2:sts=2:ts=8:et
