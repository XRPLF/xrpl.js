var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Transaction = require('./transaction').Transaction;
var Amount       = require('./amount').Amount;
var utils        = require('./utils');
var log          = require('./log').internal.sub('server');

/**
 *  @constructor Server
 *  @param {Remote} Reference to a Remote object
 *  @param {Object} Options
 *
 *    host:   String
 *    port:   String or Number
 *    secure: Boolean
 */

function Server(remote, opts) {
  EventEmitter.call(this);

  if (typeof opts !== 'object') {
    throw new TypeError('Server configuration is not an Object');
  }

  if (!opts.host) opts.host     = opts.websocket_ip;
  if (!opts.port) opts.port     = opts.websocket_port;
  if (!opts.secure) opts.secure = opts.websocket_ssl;

  if (typeof opts.secure === 'undefined') {
    opts.secure = false;
  }

  var domainRE = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;

  if (!domainRE.test(opts.host)) {
    throw new Error('Server host is malformed, use "host" and "port" server configuration');
  }

  if (isNaN(opts.port)) {
    throw new TypeError('Server configuration "port" is not a Number');
  }

  if (typeof opts.secure !== 'boolean') {
    throw new TypeError('Server "secure" configuration is not a Boolean');
  }

  var self = this;

  this._remote        = remote;
  this._opts          = opts;
  this._host          = opts.host;
  this._port          = opts.port;
  this._secure        = opts.secure;
  this._ws            = void(0);
  this._connected     = false;
  this._shouldConnect = false;
  this._state         = 'offline';
  this._id            = 0;
  this._retry         = 0;
  this._requests      = { };
  this._load_base    = 256;
  this._load_factor  = 256;
  this._fee_ref      = 10;
  this._fee_base     = 10;
  this._reserve_base = void(0);
  this._reserve_inc  = void(0);
  this._fee_cushion  = this._remote.fee_cushion;

  this._opts.url = (opts.secure ? 'wss://' : 'ws://') + opts.host + ':' + opts.port;

  this.on('message', function(message) {
    self._handleMessage(message);
  });

  this.on('response_subscribe', function(message) {
    self._handleResponseSubscribe(message);
  });

  function checkServerActivity() {
    if (isNaN(self._lastLedgerClose)) return;

    var delta = (Date.now() - self._lastLedgerClose);

    if (delta > (1000 * 20)) {
      self.reconnect();
    }
  };

  function setActivityInterval() {
    self._activityInterval = setInterval(checkServerActivity, 1000);
  };

  this.on('disconnect', function onDisconnect() {
    clearInterval(self._activityInterval);
    //self.once('ledger_closed', setActivityInterval);
  });

  this.once('ledger_closed', function() {
    //setActiviyInterval();
  });
};

util.inherits(Server, EventEmitter);

/**
 * Server states that we will treat as the server being online.
 *
 * Our requirements are that the server can process transactions and notify
 * us of changes.
 */

Server.onlineStates = [
  'syncing',
  'tracking',
  'proposing',
  'validating',
  'full'
];

/**
 * Set server state
 *
 * @param {String} state
 * @api private
 */

Server.prototype._setState = function(state) {
  if (state !== this._state) {
    this._remote.trace && log.info('set_state:', state);
    this._state = state;
    this.emit('state', state);

    switch (state) {
      case 'online':
        this._connected = true;
        this.emit('connect');
        break;
      case 'offline':
        this._connected = false;
        this.emit('disconnect');
        break;
    }
  }
};

/**
 * Get the remote address for a server.
 * Incompatible with ripple-lib client build
 */

Server.prototype._remoteAddress = function() {
  try { var address = this._ws._socket.remoteAddress; } catch (e) { }
  return address;
};

/** This is the final interface between client code and a socket connection to a
 * `rippled` server. As such, this is a decent hook point to allow a WebSocket
 * interface conforming object to be used as a basis to mock rippled. This
 * avoids the need to bind a websocket server to a port and allows a more
 * synchronous style of code to represent a client <-> server message sequence.
 * We can also use this to log a message sequence to a buffer.
 *
 * @api private
 */

Server.websocketConstructor = function() {
  // We require this late, because websocket shims may be loaded after
  // ripple-lib in the browser
  return require('ws');
};

/**
 * Disconnect from rippled WebSocket server
 *
 * @api public
 */

Server.prototype.disconnect = function() {
  this._shouldConnect = false;
  this._setState('offline');
  if (this._ws) this._ws.close();
};

/**
 * Reconnect to rippled WebSocket server
 *
 * @api public
 */

Server.prototype.reconnect = function() {
  if (this._ws) {
    this.once('disconnect', this.connect.bind(this));
    this.disconnect();
  }
};

/**
 * Connect to rippled WebSocket server and subscribe to events that are
 * internally requisite. Automatically retry connections with a gradual
 * back-off
 *
 * @api public
 */

Server.prototype.connect = function() {
  var self = this;

  // We don't connect if we believe we're already connected. This means we have
  // recently received a message from the server and the WebSocket has not
  // reported any issues either. If we do fail to ping or the connection drops,
  // we will automatically reconnect.
  if (this._connected) return;

  this._remote.trace && log.info('connect:', this._opts.url);

  // Ensure any existing socket is given the command to close first.
  if (this._ws) this._ws.close();

  var WebSocket = Server.websocketConstructor();

  if (!WebSocket) {
    throw new Error('No websocket support detected!');
  }

  var ws = this._ws = new WebSocket(this._opts.url);

  this._shouldConnect = true;

  self.emit('connecting');

  ws.onmessage = function onMessage(msg) {
    self.emit('message', msg.data);
  };

  ws.onopen = function onOpen() {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self.emit('socket_open');
      // Subscribe to events
      self.request(self._remote._serverPrepareSubscribe());
    }
  };

  ws.onerror = function onError(e) {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self.emit('socket_error');
      self._remote.trace && log.info('onerror:', self._opts.url, e.data || e);

      // Most connection errors for WebSockets are conveyed as 'close' events with
      // code 1006. This is done for security purposes and therefore unlikely to
      // ever change.

      // This means that this handler is hardly ever called in practice. If it is,
      // it probably means the server's WebSocket implementation is corrupt, or
      // the connection is somehow producing corrupt data.

      // Most WebSocket applications simply log and ignore this error. Once we
      // support for multiple servers, we may consider doing something like
      // lowering this server's quality score.

      // However, in Node.js this event may be triggered instead of the close
      // event, so we need to handle it.
      self._handleClose();
    }
  };

  // Failure to open.
  ws.onclose = function onClose() {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self._remote.trace && log.info('onclose:', self._opts.url, ws.readyState);
      self._handleClose();
    }
  };
};

/**
 * Retry connection to rippled server
 *
 * @api private
 */

Server.prototype._retryConnect = function() {
  var self = this;

  this._retry += 1;

  var retryTimeout = (this._retry < 40)
  ? (1000 / 20)           // First, for 2 seconds: 20 times per second
  : (this._retry < 40 + 60)
  ? (1000)                // Then, for 1 minute: once per second
  : (this._retry < 40 + 60 + 60)
  ? (10 * 1000)           // Then, for 10 minutes: once every 10 seconds
  : (30 * 1000);          // Then: once every 30 seconds

  function connectionRetry() {
    if (self._shouldConnect) {
      self._remote.trace && log.info('retry', self._opts.url);
      self.connect();
    }
  };

  this._retryTimer = setTimeout(connectionRetry, retryTimeout);
};

/**
 * Handle connection closes
 *
 * @api private
 */

Server.prototype._handleClose = function() {
  var self = this;
  var ws = this._ws;

  this.emit('socket_close');
  this._setState('offline');

  // Prevent additional events from this socket
  ws.onopen = ws.onerror = ws.onclose = ws.onmessage = function noOp() {};

  if (self._shouldConnect) {
    this._retryConnect();
  }
};

/**
 * Handle incoming messages from rippled WebSocket server
 *
 * @param {JSON-parseable} message
 * @api private
 */

Server.prototype._handleMessage = function(message) {
  var self = this;

  try { message = JSON.parse(message); } catch(e) { }

  if (!Server.isValidMessage(message)) return;

  switch (message.type) {
    case 'ledgerClosed':
      this._lastLedgerClose = Date.now();
      this.emit('ledger_closed', message);
      break;

    case 'serverStatus':
      // This message is only received when online.
      // As we are connected, it is the definitive final state.

      this._setState(~(Server.onlineStates.indexOf(message.server_status)) ? 'online' : 'offline');

      if (Server.isLoadStatus(message)) {
        self.emit('load', message, self);
        self._remote.emit('load', message, self);

        var loadChanged = ((message.load_base !== self._load_base) ||
                           (message.load_factor !== self._load_factor));

        if (loadChanged) {
          self._load_base   = message.load_base;
          self._load_factor = message.load_factor;
          self.emit('load_changed', message, self);
          self._remote.emit('load_changed', message, self);
        }
      }
      break;

    case 'response':
      // A response to a request.
      var request = self._requests[message.id];
      delete self._requests[message.id];

      if (!request) {
        this._remote.trace && log.info('UNEXPECTED:', self._opts.url, message);
      } else if (message.status === 'success') {
        this._remote.trace && log.info('response:', self._opts.url, message);

        request.emit('success', message.result);

        [ self, self._remote ].forEach(function(emitter) {
          emitter.emit('response_' + request.message.command, message.result, request, message);
        });
      } else if (message.error) {
        this._remote.trace && log.info('error:', self._opts.url, message);

        request.emit('error', {
          error         : 'remoteError',
          error_message : 'Remote reported an error.',
          remote        : message
        });
      }
      break;

    case 'path_find':
      this._remote.trace && log.info('path_find:', self._opts.url, message);
      break;

  }
};

/**
 * Check that received message from rippled is valid
 *
 * @api private
 */

Server.isValidMessage = function(message) {
  return (typeof message === 'object')
      && (typeof message.type === 'string');
};

/**
 * Check that received serverStatus message contains
 * load status information
 *
 * @api private
 */

Server.isLoadStatus = function(message) {
  return (typeof message.load_base === 'number')
      && (typeof message.load_factor === 'number');
};

/**
 * Handle subscription response messages. Subscription response
 * messages indicate that a connection to the server is ready
 *
 * @api private
 */

Server.prototype._handleResponseSubscribe = function(message) {
  if (~(Server.onlineStates.indexOf(message.server_status))) {
    this._setState('online');
  }
  if (Server.isLoadStatus(message)) {
    this._load_base     = message.load_base || 256;
    this._load_factor   = message.load_factor || 256;
    this._fee_ref       = message.fee_ref;
    this._fee_base      = message.fee_base;
    this._reserve_base  = message.reserve_base;
    this._reserve_inc   = message.reserve_inc;
  }
};

/**
 * Send JSON message to rippled WebSocket server
 *
 * @param {JSON-Stringifiable} message
 * @api private
 */

Server.prototype.sendMessage = function(message) {
  if (this._ws) {
    this._remote.trace && log.info('request:', this._opts.url, message);
    this._ws.send(JSON.stringify(message));
  }
};

/**
 * Submit a Request object.
 *
 * Requests are indexed by message ID, which is repeated
 * in the response from rippled WebSocket server
 *
 * @param {Request} request
 * @api private
 */

Server.prototype.request = function(request) {
  var self  = this;

  // Only bother if we are still connected.
  if (!this._ws) {
    this._remote.trace && log.info('request: DROPPING:', self._opts.url, request.message);
    return;
  }

  request.server = this;
  request.message.id = this._id;

  this._requests[request.message.id] = request;

  // Advance message ID
  this._id++;

  if (this._isConnected(request)) {
    this.sendMessage(request.message);
  } else {
    // XXX There are many ways to make this smarter.
    function serverReconnected() {
      self.sendMessage(request.message);
    }
    this.once('connect', serverReconnected);
  }
};

Server.prototype._isConnected = function(request) {
  var isSubscribeRequest = request
  && request.message.command === 'subscribe'
  && this._ws.readyState === 1;

  return this._connected || (this._ws && isSubscribeRequest);
};

/**
 * Calculate transaction fee
 *
 * @param {Transaction|Number} Fee units for a provided transaction
 * @return {Number} Final fee in XRP for specified number of fee units
 * @api private
 */

Server.prototype.computeFee = function(transaction) {
  var units;

  if (transaction instanceof Transaction) {
    units = transaction.feeUnits();
  } else if (typeof transaction === 'number') {
    units = transaction;
  } else {
    throw new Error('Invalid argument');
  }

  return this.feeTx(units).to_json();
};

/**
 * Calculate a transaction fee for a number of tx fee units.
 *
 * This takes into account the last known network and local load fees.
 *
 * @param {Number} Fee units for a provided transaction
 * @return {Amount} Final fee in XRP for specified number of fee units.
 */

Server.prototype.feeTx = function(units) {
  var fee_unit = this.feeTxUnit();
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

Server.prototype.feeTxUnit = function() {
  var fee_unit = this._fee_base / this._fee_ref;

  // Apply load fees
  fee_unit *= this._load_factor / this._load_base;

  // Apply fee cushion (a safety margin in case fees rise since we were last updated)
  fee_unit *= this._fee_cushion;

  return fee_unit;
};

/**
 * Get the current recommended reserve base.
 *
 * Returns the base reserve with load fees and safety margin applied.
 */

Server.prototype.reserve = function(owner_count) {
  var reserve_base = Amount.from_json(String(this._reserve_base));
  var reserve_inc  = Amount.from_json(String(this._reserve_inc));
  var owner_count  = owner_count || 0;

  if (owner_count < 0) {
    throw new Error('Owner count must not be negative.');
  }

  return reserve_base.add(reserve_inc.product_human(owner_count));
};

exports.Server = Server;

// vim:sw=2:sts=2:ts=8:et
