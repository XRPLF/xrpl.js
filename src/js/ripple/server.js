var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var utils        = require('./utils');

/**
 *  @constructor Server
 *  @param  remote    The Remote object
 *  @param  opts       Configuration parameters.
 *
 *  Keys for cfg:
 *  url
 */ 

function Server(remote, opts) {
  EventEmitter.call(this);

  if (typeof opts !== 'object' || typeof opts.url !== 'string') {
    throw new Error('Invalid server configuration.');
  }

  var self = this;

  this._remote         = remote;
  this._opts           = opts;
  this._ws             = void(0);
  this._connected      = false;
  this._should_connect = false;
  this._state          = void(0);
  this._id             = 0;
  this._retry          = 0;
  this._requests       = { };

  this.on('message', function(message) {
    self._handle_message(message);
  });

  this.on('response_subscribe', function(message) {
    self._handle_response_subscribe(message);
  });
}

util.inherits(Server, EventEmitter);

/**
 * Server states that we will treat as the server being online.
 *
 * Our requirements are that the server can process transactions and notify
 * us of changes.
 */
Server.online_states = [
    'syncing'
  , 'tracking'
  , 'proposing'
  , 'validating'
  , 'full'
];

Server.prototype._is_online = function (status) {
  return Server.online_states.indexOf(status) !== -1;
};

Server.prototype._set_state = function (state) {
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

Server.prototype._trace = function() {
  if (this._remote.trace) {
    utils.logObject.apply(utils, arguments);
  }
};

Server.prototype._remote_address = function() {
  try { var address = this._ws._socket.remoteAddress; } catch (e) { }
  return address;
};

Server.prototype.connect = function () {
  var self = this;

  // We don't connect if we believe we're already connected. This means we have
  // recently received a message from the server and the WebSocket has not
  // reported any issues either. If we do fail to ping or the connection drops,
  // we will automatically reconnect.
  if (this._connected) {
    return;
  }

  this._trace('server: connect: %s', this._opts.url);

  // Ensure any existing socket is given the command to close first.
  if (this._ws) {
    this._ws.close();
  }

  // We require this late, because websocket shims may be loaded after
  // ripple-lib.
  var WebSocket = require('ws');
  var ws = this._ws = new WebSocket(this._opts.url);

  this._should_connect = true;

  self.emit('connecting');

  ws.onopen = function () {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self.emit('socket_open');
      // Subscribe to events
      var request = self._remote._server_prepare_subscribe();
      self.request(request);
    }
  };

  ws.onerror = function (e) {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self._trace('server: onerror: %s', e.data || e);

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
  ws.onclose = function () {
    // If we are no longer the active socket, simply ignore any event
    if (ws === self._ws) {
      self._trace('server: onclose: %s', ws.readyState);
      handleConnectionClose();
    }
  };

  function handleConnectionClose() {
    self.emit('socket_close');
    self._set_state('offline');

    // Prevent additional events from this socket
    ws.onopen = ws.onerror = ws.onclose = ws.onmessage = function () {};

    // Should we be connected?
    if (!self._should_connect) {
      return;
    }

    // Delay and retry.
    self._retry      += 1;
    self._retry_timer = setTimeout(function () {
      self._trace('server: retry');
      if (!self._should_connect) {
        return;
      }
      self.connect();
    }, self._retry < 40
        ? 1000/20           // First, for 2 seconds: 20 times per second
        : self._retry < 40+60
          ? 1000            // Then, for 1 minute: once per second
          : self._retry < 40+60+60
            ? 10*1000       // Then, for 10 minutes: once every 10 seconds
            : 30*1000);     // Then: once every 30 seconds
  }

  ws.onmessage = function (msg) {
    self.emit('message', msg.data);
  };
};

Server.prototype.disconnect = function () {
  this._should_connect = false;
  this._set_state('offline');
  if (this._ws) {
    this._ws.close();
  }
};

Server.prototype.send_message = function (message) {
  if (this._ws) {
    this._ws.send(JSON.stringify(message));
  }
};

/**
 * Submit a Request object to this server.
 */
Server.prototype.request = function (request) {
  var self  = this;

  // Only bother if we are still connected.
  if (this._ws) {
    request.server     = this;
    request.message.id = this._id;

    this._requests[request.message.id] = request;

    // Advance message ID
    this._id++;

    var is_connected = this._connected || (request.message.command === 'subscribe' && this._ws.readyState === 1);
    
    if (is_connected) {
      this._trace('server: request: %s', request.message);
      this.send_message(request.message);
    } else {
      // XXX There are many ways to make this smarter.
      function server_reconnected() {
        self._trace('server: request: %s', request.message);
        self.send_message(request.message);
      }
      this.once('connect', server_reconnected);
    }
  } else {
    this._trace('server: request: DROPPING: %s', request.message);
  }
};

Server.prototype._handle_message = function (message) {
  var self = this;

  try { message = JSON.parse(message); } catch(e) { }

  var unexpected = typeof message !== 'object' || typeof message.type !== 'string';

  if (unexpected) {
    return; 
  }

  switch (message.type) {
    case 'response':
      // A response to a request.
      var request = self._requests[message.id];
      delete self._requests[message.id];

      if (!request) {
        this._trace('server: UNEXPECTED: %s', message);
      } else if ('success' === message.status) {
        this._trace('server: response: %s', message);

        request.emit('success', message.result);

        [ self, self._remote ].forEach(function(emitter) {
          emitter.emit('response_' + request.message.command, message.result, request, message);
        });
      } else if (message.error) {
        this._trace('server: error: %s', message);

        request.emit('error', {
          error         : 'remoteError',
          error_message : 'Remote reported an error.',
          remote        : message
        });
      }
      break;

    case 'serverStatus':
      // This message is only received when online. As we are connected, it is the definative final state.
      this._set_state(this._is_online(message.server_status) ? 'online' : 'offline');
      break;
  }
}

Server.prototype._handle_response_subscribe = function (message) {
  this._server_status = message.server_status;
  if (this._is_online(message.server_status)) {
    this._set_state('online');
  }
}

exports.Server = Server;

// vim:sw=2:sts=2:ts=8:et
