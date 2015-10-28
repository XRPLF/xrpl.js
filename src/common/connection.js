'use strict';
const {EventEmitter} = require('events');
const WebSocket = require('ws');
// temporary: RangeSet will be moved to api/common soon
const RangeSet = require('./rangeset').RangeSet;
const {RippledError, DisconnectedError, NotConnectedError,
  TimeoutError, ResponseFormatError} = require('./errors');

function isStreamMessageType(type) {
  return type === 'ledgerClosed' ||
         type === 'transaction' ||
         type === 'path_find';
}

class Connection extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this._url = url;
    this._timeout = options.timeout || (20 * 1000);
    this._isReady = false;
    this._ws = null;
    this._ledgerVersion = null;
    this._availableLedgerVersions = new RangeSet();
    this._nextRequestID = 1;
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
        this._ledgerVersion = Number(data.ledger_index);
        this._availableLedgerVersions.reset();
        this._availableLedgerVersions.parseAndAddRanges(
          data.validated_ledgers);
      }
      return [data.type, data];
    } else if (data.type === undefined && data.error) {
      return ['error', data.error, data.error_message];  // e.g. slowDown
    }
    throw new ResponseFormatError('unrecognized message type: ' + data.type);
  }

  _onMessage(message) {
    let parameters;
    try {
      parameters = this._parseMessage(message);
    } catch (error) {
      this.emit('error', 'badMessage', message);
      return;
    }
    // we don't want this inside the try/catch or exceptions in listener
    // will be caught
    this.emit.apply(this, parameters);
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

  _onUnexpectedClose() {
    this._isReady = false;
    this.connect().then();
  }

  _onOpen() {
    const request = {
      command: 'subscribe',
      streams: ['ledger']
    };
    return this.request(request).then(response => {
      this._ledgerVersion = Number(response.ledger_index);
      this._availableLedgerVersions.parseAndAddRanges(
        response.validated_ledgers);
      this._isReady = true;
      this.emit('connected');
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this._state === WebSocket.OPEN) {
        resolve();
      } else if (this._state === WebSocket.CONNECTING) {
        this._ws.once('open', resolve);
      } else {
        this._ws = new WebSocket(this._url);
        this._ws.on('message', this._onMessage.bind(this));
        this._ws.once('close', () => this._onUnexpectedClose);
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
        this._ws.removeListener('close', this._onUnexpectedClose);
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
