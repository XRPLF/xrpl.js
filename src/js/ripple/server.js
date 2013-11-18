var util         = require('util');
var utils        = require('./utils');
var EventEmitter = require('events').EventEmitter;

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
    throw new Error('Invalid server configuration.');
  }

  var self = this;

  this._remote         = remote;
  this._opts           = opts;
  this._host           = opts.host;
  this._port           = opts.port;
  this._secure         = typeof opts.secure === 'boolean' ? opts.secure : true;
  this._ws             = void(0);
  this._connected      = false;
  this._shouldConnect = false;
  this._state          = void(0);
  this._id             = 0;
  this._retry          = 0;
  this._requests       = { };

  this._opts.url = (opts.secure ? 'wss://' : 'ws://') + opts.host + ':' + opts.port;

  this.on('message', function(message) {
    self._handleMessage(message);
  });

  this.on('response_subscribe', function(message) {
    self._handleResponseSubscribe(message);
  });

  function checkServerActivity() {
    var delta = Date.now() - self._lastLedgerClose;
    if (delta > (1000 * 20)) {
      self.reconnect();
    }
  };

  this.once('connect', function() {
    setInterval(checkServerActivity, 1000);
  });
};

util.inherits(Server, EventEmitter);


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
 */

Server.prototype._setState = function(state) {
  if (state !== this._state) {
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

  this._remote._trace('server: connect: %s', this._opts.url);

  // Ensure any existing socket is given the command to close first.
  if (this._ws) this._ws.close();

  var WebSocket = Server.websocketConstructor();
  var ws = this._ws = new WebSocket(this._opts.url);

  this._shouldConnect = true;

  self.emit('connecting');

  ws.onopen = function() {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self.emit('socket_open');
      // Subscribe to events
      self.request(self._remote._serverPrepareSubscribe());
    }
  };

  ws.onmessage = function onMessage(msg) {
    self.emit('message', msg.data);
  };

  ws.onerror = function(e) {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self.emit('socket_error');
      self._remote._trace('server: onerror: %s', e.data || e);

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
      handleConnectionClose();
    }
  };

  // Failure to open.
  ws.onclose = function() {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self._remote._trace('server: onclose: %s', ws.readyState);
      handleConnectionClose();
    }
  };

  function handleConnectionClose() {
    self.emit('socket_close');
    self._setState('offline');

    // Prevent additional events from this socket
    ws.onopen = ws.onerror = ws.onclose = ws.onmessage = function() {};

    // Should we be connected?
    if (!self._shouldConnect) return;

    // Delay and retry.
    self._retry += 1;

    var retryTimeout = (self._retry < 40)
        ? 1000 / 20            // First, for 2 seconds: 20 times per second
        : (self._retry < 40 + 60)
          ? 1000               // Then, for 1 minute: once per second
          : (self._retry < 40 + 60 + 60)
            ? (10 * 1000)      // Then, for 10 minutes: once every 10 seconds
            : (30 * 1000);     // Then: once every 30 seconds


    function connectionRetry() {
      if (self._shouldConnect) {
        self._remote._trace('server: retry');
        self.connect();
      }
    };

    self._retry_timer = setTimeout(connectionRetry, retryTimeout);
  };
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
 */

Server.prototype.reconnect = function() {
  this.disconnect();
  this.connect();
};

/**
 * Submit a Request object.
 *
 * Requests are indexed by message ID, which is repeated
 * in the response from rippled WebSocket server
 *
 * @param {Request} request
 * @api public
 */

Server.prototype.request = function(request) {
  var self  = this;

  // Only bother if we are still connected.
  if (!this._ws) {
    this._remote._trace('server: request: DROPPING: %s', request.message);
    return;
  }

  request.server = this;
  request.message.id = this._id;

  this._requests[request.message.id] = request;

  // Advance message ID
  this._id++;

  var is_connected = this._connected || (request.message.command === 'subscribe' && this._ws.readyState === 1);

  if (is_connected) {
    this.sendMessage(request.message);
  } else {
    // XXX There are many ways to make this smarter.
    function serverReconnected() {
      self.sendMessage(request.message);
    }
    this.once('connect', serverReconnected);
  }
};

/**
 * Send JSON message to rippled WebSocket server
 *
 * @param {JSON-Stringifiable} message
 */

Server.prototype.sendMessage = function(message) {
  if (this._ws) {
    this._remote._trace('server: request: %s', message);
    this.emit('before_send_message', message)
    this._ws.send(JSON.stringify(message));
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

  var isValid = message && (typeof message === 'object') && (typeof message.type === 'string');

  if (!isValid) return;

  this.emit('before_receive_message', message)

  switch (message.type) {
    case 'server_status':
      // This message is only received when online.
      // As we are connected, it is the definitive final state.
      this._setState(~(Server._onlineStates.indexOf(message.server_status)) ? 'online' : 'offline');
      break;

    case 'ledgerClosed':
      this._lastLedgerClose = Date.now();
      break;

    case 'path_find':
      this._remote._trace('server: path_find: %s', message);
      break;

    case 'response':
      // A response to a request.
      var request = self._requests[message.id];
      delete self._requests[message.id];

      if (!request) {
        this._remote._trace('server: UNEXPECTED: %s', message);
      } else if (message.status === 'success') {
        this._remote._trace('server: response: %s', message);

        request.emit('success', message.result);

        [ self, self._remote ].forEach(function(emitter) {
          emitter.emit('response_' + request.message.command, message.result, request, message);
        });
      } else if (message.error) {
        this._remote._trace('server: error: %s', message);

        request.emit('error', {
          error         : 'remoteError',
          error_message : 'Remote reported an error.',
          remote        : message
        });
      }
      break;
  }
};

/**
 * Handle subscription response messages. Subscription response
 * messages indicate that a connection to the server is ready
 */

Server.prototype._handleResponseSubscribe = function(message) {
  if (~(Server.onlineStates.indexOf(message.server_status))) {
    this._setState('online');
  }
};

exports.Server = Server;

// vim:sw=2:sts=2:ts=8:et
