'use strict';
const _ = require('lodash');
const {EventEmitter} = require('events');
const WebSocket = require('ws');
const parseURL = require('url').parse;
const RangeSet = require('./rangeset').RangeSet;
const {RippledError, DisconnectedError, NotConnectedError,
  TimeoutError, ResponseFormatError, ConnectionError} = require('./errors');

function isStreamMessageType(type) {
  return type === 'ledgerClosed' ||
         type === 'transaction' ||
         type === 'path_find';
}

class Connection extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.setMaxListeners(Infinity);
    this._url = url;
    this._trace = options.trace;
    if (this._trace) {
      // for easier unit testing
      this._console = console;
    }
    this._proxyURL = options.proxy;
    this._proxyAuthorization = options.proxyAuthorization;
    this._authorization = options.authorization;
    this._trustedCertificates = options.trustedCertificates;
    this._key = options.key;
    this._passphrase = options.passphrase;
    this._certificate = options.certificate;
    this._timeout = options.timeout || (20 * 1000);
    this._isReady = false;
    this._ws = null;
    this._ledgerVersion = null;
    this._availableLedgerVersions = new RangeSet();
    this._nextRequestID = 1;
  }

  _updateLedgerVersions(data) {
    this._ledgerVersion = Number(data.ledger_index);
    if (data.validated_ledgers) {
      this._availableLedgerVersions.reset();
      this._availableLedgerVersions.parseAndAddRanges(
        data.validated_ledgers);
    } else {
      this._availableLedgerVersions.addValue(this._ledgerVersion);
    }
  }

  // return value is array of arguments to Connection.emit
  _parseMessage(message) {
    const data = JSON.parse(message);
    if (data.type === 'response') {
      if (!(Number.isInteger(data.id) && data.id >= 0)) {
        throw new ResponseFormatError('valid id not found in response');
      }
      return [data.id.toString(), data];
    } else if (isStreamMessageType(data.type)) {
      if (data.type === 'ledgerClosed') {
        this._updateLedgerVersions(data);
      }
      return [data.type, data];
    } else if (data.type === undefined && data.error) {
      return ['error', data.error, data.error_message, data];  // e.g. slowDown
    }
    throw new ResponseFormatError('unrecognized message type: ' + data.type);
  }

  _onMessage(message) {
    let parameters;
    if (this._trace) {
      this._console.log(message);
    }
    try {
      parameters = this._parseMessage(message);
    } catch (error) {
      this.emit('error', 'badMessage', error.message, message);
      return;
    }
    // we don't want this inside the try/catch or exceptions in listener
    // will be caught
    this.emit(...parameters);
  }

  get _state() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED;
  }

  get _shouldBeConnected() {
    return this._ws !== null;
  }

  isConnected() {
    return this._state === WebSocket.OPEN && this._isReady;
  }

  _onUnexpectedClose(resolve = function() {}, reject = function() {}) {
    this._ws = null;
    this._isReady = false;
    this.connect().then(resolve, reject);
  }

  _onOpen() {
    this._ws.removeListener('close', this._onUnexpectedCloseBound);
    this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this);
    this._ws.once('close', this._onUnexpectedCloseBound);

    const request = {
      command: 'subscribe',
      streams: ['ledger']
    };
    return this.request(request).then(data => {
      this._updateLedgerVersions(data);
      this._isReady = true;
      this.emit('connected');
    });
  }

  _createWebSocket() {
    const options = {};
    if (this._proxyURL !== undefined) {
      const parsedURL = parseURL(this._url);
      const parsedProxyURL = parseURL(this._proxyURL);
      const proxyOverrides = _.omit({
        secureEndpoint: (parsedURL.protocol === 'wss:'),
        secureProxy: (parsedProxyURL.protocol === 'https:'),
        auth: this._proxyAuthorization,
        ca: this._trustedCertificates,
        key: this._key,
        passphrase: this._passphrase,
        cert: this._certificate
      }, _.isUndefined);
      const proxyOptions = _.assign({}, parsedProxyURL, proxyOverrides);
      let HttpsProxyAgent;
      try {
        HttpsProxyAgent = require('https-proxy-agent');
      } catch (error) {
        throw new Error('"proxy" option is not supported in the browser');
      }
      options.agent = new HttpsProxyAgent(proxyOptions);
    }
    if (this._authorization !== undefined) {
      const base64 = new Buffer(this._authorization).toString('base64');
      options.headers = {Authorization: `Basic ${base64}`};
    }
    const optionsOverrides = _.omit({
      ca: this._trustedCertificates,
      key: this._key,
      passphrase: this._passphrase,
      cert: this._certificate
    }, _.isUndefined);
    const websocketOptions = _.assign({}, options, optionsOverrides);
    const websocket = new WebSocket(this._url, null, websocketOptions);
    // we will have a listener for each outstanding request,
    // so we have to raise the limit (the default is 10)
    if (typeof websocket.setMaxListeners === 'function') {
      websocket.setMaxListeners(Infinity);
    }
    return websocket;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (!this._url) {
        reject(new ConnectionError(
          'Cannot connect because no server was specified'));
      }
      if (this._state === WebSocket.OPEN) {
        resolve();
      } else if (this._state === WebSocket.CONNECTING) {
        this._ws.once('open', resolve);
      } else {
        this._ws = this._createWebSocket();
        // when an error causes the connection to close, the close event
        // should still be emitted; the "ws" documentation says: "The close
        // event is also emitted when then underlying net.Socket closes the
        // connection (end or close)."
        this._ws.on('error', error =>
          this.emit('error', 'websocket', error.message, error));
        this._ws.on('message', this._onMessage.bind(this));
        // in browser close event can came before open event, so we must
        // resolve connect's promise after reconnect in that case.
        // after open event we will rebound _onUnexpectedCloseBound
        // without resolve and reject functions
        this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this,
          resolve, reject);
        this._ws.once('close', this._onUnexpectedCloseBound);
        this._ws.once('open', () => this._onOpen().then(resolve, reject));
      }
    });
  }

  disconnect() {
    return new Promise(resolve => {
      if (this._state === WebSocket.CLOSED) {
        resolve();
      } else if (this._state === WebSocket.CLOSING) {
        this._ws.once('close', resolve);
      } else {
        this._ws.removeListener('close', this._onUnexpectedCloseBound);
        this._ws.once('close', () => {
          this._ws = null;
          this._isReady = false;
          resolve();
        });
        this._ws.close();
      }
    });
  }

  reconnect() {
    return this.disconnect().then(() => this.connect());
  }

  _whenReady(promise) {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError());
      } else if (this._state === WebSocket.OPEN && this._isReady) {
        promise.then(resolve, reject);
      } else {
        this.once('connected', () => promise.then(resolve, reject));
      }
    });
  }

  getLedgerVersion() {
    return this._whenReady(Promise.resolve(this._ledgerVersion));
  }

  hasLedgerVersions(lowLedgerVersion, highLedgerVersion) {
    return this._whenReady(Promise.resolve(
      this._availableLedgerVersions.containsRange(
        lowLedgerVersion, highLedgerVersion || this._ledgerVersion)));
  }

  hasLedgerVersion(ledgerVersion) {
    return this.hasLedgerVersions(ledgerVersion, ledgerVersion);
  }

  _send(message) {
    if (this._trace) {
      this._console.log(message);
    }
    return new Promise((resolve, reject) => {
      this._ws.send(message, undefined, (error, result) => {
        if (error) {
          reject(new DisconnectedError(error.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  request(request, timeout) {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError());
      }

      let timer = null;
      const self = this;
      const id = this._nextRequestID;
      this._nextRequestID += 1;
      const eventName = id.toString();

      function onDisconnect() {
        clearTimeout(timer);
        self.removeAllListeners(eventName);
        reject(new DisconnectedError());
      }

      function cleanup() {
        clearTimeout(timer);
        self.removeAllListeners(eventName);
        if (self._ws !== null) {
          self._ws.removeListener('close', onDisconnect);
        }
      }

      function _resolve(response) {
        cleanup();
        resolve(response);
      }

      function _reject(error) {
        cleanup();
        reject(error);
      }

      this.once(eventName, response => {
        if (response.status === 'error') {
          _reject(new RippledError(response.error));
        } else if (response.status === 'success') {
          _resolve(response.result);
        } else {
          _reject(new ResponseFormatError(
            'unrecognized status: ' + response.status));
        }
      });

      this._ws.once('close', onDisconnect);

      // JSON.stringify automatically removes keys with value of 'undefined'
      const message = JSON.stringify(Object.assign({}, request, {id}));

      this._whenReady(this._send(message)).then(() => {
        const delay = timeout || this._timeout;
        timer = setTimeout(() => _reject(new TimeoutError()), delay);
      }).catch(_reject);
    });
  }
}

module.exports = Connection;
