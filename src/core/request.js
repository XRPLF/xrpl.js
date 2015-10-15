'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const async = require('async');
const {normalizeCurrency} = require('./currency');
const RippleError = require('./rippleerror').RippleError;

// Request events emitted:
//  'success' : Request successful.
//  'error'   : Request failed.
//  'remoteError'
//  'remoteUnexpected'
//  'remoteDisconnected'

/**
 * Request
 *
 * @param {Remote} remote
 * @param {String} command
 */

function Request(remote, command) {
  EventEmitter.call(this);

  this.remote = remote;
  this.requested = false;
  this.reconnectTimeout = 1000 * 3;
  this.successEvent = 'success';
  this.errorEvent = 'error';
  this.message = {
    command: command,
    id: undefined
  };
  this._timeout = this.remote.submission_timeout;
}

util.inherits(Request, EventEmitter);

// Send the request to a remote.
Request.prototype.request = function(servers, callback_) {
  const callback = typeof servers === 'function' ? servers : callback_;
  const self = this;

  if (this.requested) {
    throw new Error('Already requested');
  }

  this.emit('before');
  // emit handler can set requested flag
  if (this.requested) {
    return this;
  }

  this.requested = true;
  this.callback(callback);

  this.on('error', function() {});
  this.emit('request', this.remote);

  function doRequest() {
    if (Array.isArray(servers)) {
      servers.forEach(function(server) {
        self.setServer(server);
        self.remote.request(self);
      }, self);
    } else {
      self.remote.request(self);
    }
  }

  const timeout = setTimeout(() => {
    if (typeof callback === 'function') {
      callback(new RippleError('tejTimeout'));
    }

    this.emit('timeout');
    // just in case
    this.emit = _.noop;
    this.cancel();
    this.remote.removeListener('connected', doRequest);
  }, this._timeout);

  if (this.remote.isConnected()) {
    this.remote.on('connected', doRequest);
  }

  function onRemoteError(error) {
    self.emit('error', error);
  }
  this.remote.once('error', onRemoteError); // e.g. rate-limiting slowDown error

  this.once('response', () => {
    clearTimeout(timeout);
    this.remote.removeListener('connected', doRequest);
    this.remote.removeListener('error', onRemoteError);
  });

  doRequest();

  return this;
};

function isResponseNotError(res) {
  return typeof res === 'object' && !res.hasOwnProperty('error');
}

/**
 * Broadcast request to all servers, filter responses if a function is
 * provided. Return first response that satisfies the filter. Pre-filter
 * requests by ledger_index (if a ledger_index is set on the request), and
 * automatically retry servers when they reconnect--if they are expected to
 *
 * Whew
 *
 * @param [Function] fn
 */


Request.prototype.filter =
Request.prototype.addFilter =
Request.prototype.broadcast = function(isResponseSuccess = isResponseNotError) {
  const self = this;

  if (!this.requested) {
    // Defer until requested, and prevent the normal request() from executing
    this.once('before', function() {
      self.requested = true;
      self.broadcast(isResponseSuccess);
    });
    return this;
  }

  this.on('error', function() {});
  let lastResponse = new Error('No servers available');
  const connectTimeouts = { };
  const emit = this.emit;

  this.emit = function(event, a, b) {
    // Proxy success/error events
    switch (event) {
      case 'success':
      case 'error':
        emit.call(self, 'proposed', a, b);
        break;
      default:
        emit.apply(self, arguments);
    }
  };

  let serversCallbacks = { };
  let serversTimeouts = { };
  let serversClearConnectHandlers = { };

  function iterator(server, callback) {
    // Iterator is called in parallel

    const serverID = server.getServerID();

    serversCallbacks[serverID] = callback;

    function doRequest() {
      return server._request(self);
    }

    if (server.isConnected()) {
      const timeout = setTimeout(() => {
        lastResponse = new RippleError('tejTimeout',
          JSON.stringify(self.message));

        server.removeListener('connect', doRequest);
        delete serversCallbacks[serverID];
        delete serversClearConnectHandlers[serverID];

        callback(false);
      }, self._timeout);

      serversTimeouts[serverID] = timeout;
      serversClearConnectHandlers[serverID] = function() {
        server.removeListener('connect', doRequest);
      };

      server.on('connect', doRequest);
      return doRequest();
    }

    // Server is disconnected but should reconnect. Wait for it to reconnect,
    // and abort after a timeout
    function serverReconnected() {
      clearTimeout(connectTimeouts[serverID]);
      connectTimeouts[serverID] = null;
      iterator(server, callback);
    }

    connectTimeouts[serverID] = setTimeout(function() {
      server.removeListener('connect', serverReconnected);
      callback(false);
    }, self.reconnectTimeout);

    server.once('connect', serverReconnected);
  }

  // Listen for proxied success/error event and apply filter
  function onProposed(result, server) {
    const serverID = server.getServerID();
    lastResponse = result;

    const callback = serversCallbacks[serverID];
    delete serversCallbacks[serverID];

    clearTimeout(serversTimeouts[serverID]);
    delete serversTimeouts[serverID];

    if (serversClearConnectHandlers[serverID] !== undefined) {
      serversClearConnectHandlers[serverID]();
      delete serversClearConnectHandlers[serverID];
    }

    if (callback !== undefined) {
      callback(isResponseSuccess(result));
    }
  }

  this.on('proposed', onProposed);

  let complete_ = null;

  // e.g. rate-limiting slowDown error
  function onRemoteError(error) {
    serversCallbacks = {};
    _.forEach(serversTimeouts, clearTimeout);
    serversTimeouts = {};
    _.forEach(serversClearConnectHandlers, (handler) => {
      handler();
    });
    serversClearConnectHandlers = {};

    lastResponse = error instanceof RippleError ? error :
      new RippleError(error);
    complete_(false);
  }

  function complete(success) {
    self.removeListener('proposed', onProposed);
    self.remote.removeListener('error', onRemoteError);
    // Emit success if the filter is satisfied by any server
    // Emit error if the filter is not satisfied by any server
    // Include the last response
    emit.call(self, success ? 'success' : 'error', lastResponse);
  }

  complete_ = complete;

  this.remote.once('error', onRemoteError);

  const servers = this.remote._servers.filter(function(server) {
    // Pre-filter servers that are disconnected and should not reconnect
    return (server.isConnected() || server._shouldConnect)
      // Pre-filter servers that do not contain the ledger in request
      && (!self.message.hasOwnProperty('ledger_index')
      || server.hasLedger(self.message.ledger_index))
      && (!self.message.hasOwnProperty('ledger_index_min')
      || self.message.ledger_index_min === -1
      || server.hasLedger(self.message.ledger_index_min))
      && (!self.message.hasOwnProperty('ledger_index_max')
      || self.message.ledger_index_max === -1
      || server.hasLedger(self.message.ledger_index_max));
  });

  // Apply iterator in parallel to connected servers, complete when the
  // supplied filter function is satisfied once by a server's response
  async.some(servers, iterator, complete);

  return this;
};

Request.prototype.cancel = function() {
  this.removeAllListeners();
  this.on('error', function() {});

  return this;
};

Request.prototype.setCallback = function(fn) {
  if (typeof fn === 'function') {
    this.callback(fn);
  }

  return this;
};

Request.prototype.setReconnectTimeout = function(timeout) {
  if (typeof timeout === 'number' && !isNaN(timeout)) {
    this.reconnectTimeout = timeout;
  }

  return this;
};

Request.prototype.callback = function(callback, successEvent, errorEvent) {
  const self = this;

  if (typeof callback !== 'function') {
    return this;
  }

  if (typeof successEvent === 'string') {
    this.successEvent = successEvent;
  }
  if (typeof errorEvent === 'string') {
    this.errorEvent = errorEvent;
  }

  let called = false;

  function requestError(error) {
    if (!called) {
      called = true;

      if (!(error instanceof RippleError)) {
        callback.call(self, new RippleError(error));
      } else {
        callback.call(self, error);
      }
    }
  }

  function requestSuccess(message) {
    if (!called) {
      called = true;
      callback.call(self, null, message);
    }
  }

  this.once(this.successEvent, requestSuccess);
  this.once(this.errorEvent, requestError);

  if (!this.requested) {
    this.request();
  }

  return this;
};

Request.prototype.setTimeout = function(delay) {
  if (!_.isFinite(delay)) {
    throw new Error('delay must be number');
  }
  this._timeout = delay;

  return this;
};

Request.prototype.setServer = function(server) {
  let selected = null;

  if (_.isString(server)) {
    selected = _.find(this.remote._servers, s => s._url === server) || null;
  } else if (_.isObject(server)) {
    selected = server;
  }

  this.server = selected;
  return this;
};

Request.prototype.buildPath = function(build) {
  if (this.remote.local_signing) {
    throw new Error(
      '`build_path` is completely ignored when doing local signing as '
      + '`Paths` is a component of the signed blob. The `tx_blob` is signed,'
      + 'sealed and delivered, and the txn unmodified after');
  }

  if (build) {
    this.message.build_path = true;
  } else {
    // ND: rippled currently intreprets the mere presence of `build_path` as the
    // value being `truthy`
    delete this.message.build_path;
  }

  return this;
};

Request.prototype.ledgerChoose = function(current) {
  if (current) {
    this.message.ledger_index = this.remote._ledger_current_index;
  } else {
    this.message.ledger_hash = this.remote._ledger_hash;
  }

  return this;
};

// Set the ledger for a request.
// - ledger_entry
// - transaction_entry
Request.prototype.ledgerHash = function(hash) {
  this.message.ledger_hash = hash;
  return this;
};

// Set the ledger_index for a request.
// - ledger_entry
Request.prototype.ledgerIndex = function(ledger_index) {
  this.message.ledger_index = ledger_index;
  return this;
};

/**
 * Set either ledger_index or ledger_hash based on heuristic
 *
 * @param {Number|String} ledger - identifier
 * @param {Object} options -
 * @param {Number|String} defaultValue - default if `ledger` unspecifed
 */
Request.prototype.ledgerSelect =
Request.prototype.selectLedger = function(ledger, defaultValue) {
  const selected = ledger || defaultValue;

  switch (selected) {
    case 'current':
    case 'closed':
    case 'validated':
      this.message.ledger_index = selected;
      break;
    default:
      if (Number(selected) && isFinite(Number(selected))) {
        this.message.ledger_index = Number(selected);
      } else if (/^[A-F0-9]{64}$/.test(selected)) {
        this.message.ledger_hash = selected;
      } else if (selected !== undefined) {
        throw new Error('unknown ledger format: ' + selected);
      }
      break;
  }
  return this;
};

Request.prototype.accountRoot = function(account) {
  this.message.account_root = account;
  return this;
};

Request.prototype.index = function(index) {
  this.message.index = index;
  return this;
};

// Provide the information id an offer.
// --> account
// --> seq : sequence number of transaction creating offer (integer)
Request.prototype.offerId = function(account, sequence) {
  this.message.offer = {
    account: account,
    seq: sequence
  };
  return this;
};

// --> index : ledger entry index.
Request.prototype.offerIndex = function(index) {
  this.message.offer = index;
  return this;
};

Request.prototype.secret = function(secret) {
  if (secret) {
    this.message.secret = secret;
  }
  return this;
};

Request.prototype.txHash = function(hash) {
  this.message.tx_hash = hash;
  return this;
};

Request.prototype.txJson = function(json) {
  this.message.tx_json = json;
  return this;
};

Request.prototype.txBlob = function(json) {
  this.message.tx_blob = json;
  return this;
};

Request.prototype.rippleState = function(account, issuer, currency) {
  this.message.ripple_state = {
    currency: currency,
    accounts: [
      account,
      issuer
    ]
  };
  return this;
};

Request.prototype.setAccounts =
Request.prototype.accounts = function(accountsIn, proposed) {
  const accounts = Array.isArray(accountsIn) ? accountsIn : [accountsIn];

  // Process accounts parameters
  const processedAccounts = accounts.map(function(account) {
    return account;
  });

  if (proposed) {
    this.message.accounts_proposed = processedAccounts;
  } else {
    this.message.accounts = processedAccounts;
  }

  return this;
};

Request.prototype.addAccount = function(account, proposed) {
  if (Array.isArray(account)) {
    account.forEach(this.addAccount, this);
    return this;
  }

  const processedAccount = account;
  const prop = proposed === true ? 'accounts_proposed' : 'accounts';
  this.message[prop] = (this.message[prop] || []).concat(processedAccount);

  return this;
};

Request.prototype.setAccountsProposed =
Request.prototype.rtAccounts =
Request.prototype.accountsProposed = function(accounts) {
  return this.accounts(accounts, true);
};

Request.prototype.addAccountProposed = function(account) {
  if (Array.isArray(account)) {
    account.forEach(this.addAccountProposed, this);
    return this;
  }

  return this.addAccount(account, true);
};

Request.prototype.setBooks =
Request.prototype.books = function(books, snapshot) {
  // Reset list of books (this method overwrites the current list)
  this.message.books = [];

  for (let i = 0, l = books.length; i < l; i++) {
    const book = books[i];
    this.addBook(book, snapshot);
  }

  return this;
};

Request.prototype.addBook = function(book, snapshot) {
  if (Array.isArray(book)) {
    book.forEach(this.addBook, this);
    return this;
  }

  const json = { };

  function processSide(side) {
    if (!book[side]) {
      throw new Error('Missing ' + side);
    }

    const obj = json[side] = {
      currency: normalizeCurrency(book[side].currency)
    };

    if (obj.currency !== 'XRP') {
      obj.issuer = book[side].issuer;
    }
  }

  ['taker_gets', 'taker_pays'].forEach(processSide);

  if (typeof snapshot !== 'boolean') {
    json.snapshot = true;
  } else if (snapshot) {
    json.snapshot = true;
  } else {
    delete json.snapshot;
  }

  if (book.both) {
    json.both = true;
  }

  this.message.books = (this.message.books || []).concat(json);

  return this;
};

Request.prototype.addStream = function(stream, values) {
  if (Array.isArray(values)) {
    switch (stream) {
      case 'accounts':
        this.addAccount(values);
        break;
      case 'accounts_proposed':
        this.addAccountProposed(values);
        break;
      case 'books':
        this.addBook(values);
        break;
    }
  } else if (arguments.length > 1) {
    for (const arg in arguments) {
      this.addStream(arguments[arg]);
    }
    return this;
  }

  if (!Array.isArray(this.message.streams)) {
    this.message.streams = [];
  }

  if (this.message.streams.indexOf(stream) === -1) {
    this.message.streams.push(stream);
  }

  return this;
};

exports.Request = Request;
