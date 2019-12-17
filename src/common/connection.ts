import * as _ from 'lodash'
import {EventEmitter} from 'events'
import {parse as parseUrl} from 'url'
import WebSocket from 'ws'
import RangeSet from './rangeset'
import {
  RippledError,
  DisconnectedError,
  NotConnectedError,
  TimeoutError,
  ResponseFormatError,
  ConnectionError,
  RippledNotInitializedError
} from './errors'

/**
 * ConnectionOptions is the configuration for the configuration object.
 */
export interface ConnectionOptions {
  trace?: boolean | ((id: string, message: string) => void)
  proxy?: string
  proxyAuthorization?: string
  authorization?: string
  trustedCertificates?: string[]
  key?: string
  passphrase?: string
  certificate?: string
  timeout: number
  connectionTimeout: number
}

/**
 * ConnectionUserOptions is the user-provided configuration object. All configuration
 * is optional, so any ConnectionOptions configuration that has a default value is
 * still optional for the user to provide.
 */
export type ConnectionUserOptions = Partial<ConnectionOptions>

/**
 * Ledger is used to store and reference ledger information that has been
 * captured by the Connection class.
 */
class Ledger {
  private availableVersions = new RangeSet()
  latestVersion: null | number = null
  feeBase: null | number = null
  feeRef: null | number = null

  hasVersions(lowVersion: number, highVersion: number): boolean {
    return this.availableVersions.containsRange(lowVersion, highVersion)
  }

  hasVersion(version: number): boolean {
    return this.availableVersions.containsValue(version)
  }

  update(data: {
    ledger_index?: string
    validated_ledgers?: string
    fee_base?: string
    fee_ref?: string
  }) {
    this.latestVersion = Number(data.ledger_index)
    if (data.validated_ledgers) {
      this.availableVersions.reset()
      this.availableVersions.parseAndAddRanges(data.validated_ledgers)
    } else {
      this.availableVersions.addValue(this.latestVersion)
    }
    if (data.fee_base) {
      this.feeBase = Number(data.fee_base)
    }
    if (data.fee_ref) {
      this.feeRef = Number(data.fee_ref)
    }
  }
}

class Connection extends EventEmitter {
  private _url: string
  private _isReady: boolean = false
  private _ws: null | WebSocket = null
  private _nextRequestID: number = 1
  private _retry: number = 0
  private _connectTimer: null | NodeJS.Timeout = null
  private _retryTimer: null | NodeJS.Timeout = null
  private _heartbeatInterval: null | NodeJS.Timeout = null
  private _onOpenErrorBound: null | null | ((...args: any[]) => void) = null
  private _onUnexpectedCloseBound: null | ((...args: any[]) => void) = null

  private _trace: (id: string, message: string) => void = () => {}
  private _config: ConnectionOptions
  private _ledger: Ledger

  constructor(url?: string, options: ConnectionUserOptions = {}) {
    super()
    this.setMaxListeners(Infinity)
    this._url = url
    this._ledger = new Ledger()
    this._config = {
      timeout: 20 * 1000,
      connectionTimeout: 2 * 1000,
      ...options
    }
    if (typeof options.trace === 'function') {
      this._trace = options.trace
    } else if (options.trace === true) {
      this._trace = console.log
    }
  }

  // return value is array of arguments to Connection.emit
  _parseMessage(message): [string, Object] | ['error', string, string, Object] {
    const data = JSON.parse(message)
    if (data.type === 'response') {
      if (!(Number.isInteger(data.id) && data.id >= 0)) {
        throw new ResponseFormatError('valid id not found in response', data)
      }
      return [data.id.toString(), data]
    } else if (data.type === undefined && data.error) {
      return ['error', data.error, data.error_message, data] // e.g. slowDown
    }

    // Possible `data.type` values include 'ledgerClosed',
    // 'transaction', 'path_find', and many others.
    if (data.type === 'ledgerClosed') {
      this._ledger.update(data)
    }
    return [data.type, data]
  }

  _onMessage(message) {
    this._trace('receive', message)
    let parameters
    try {
      parameters = this._parseMessage(message)
    } catch (error) {
      this.emit('error', 'badMessage', error.message, message)
      return
    }
    // we don't want this inside the try/catch or exceptions in listener
    // will be caught
    this.emit.apply(this, parameters)
  }

  get _state() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED
  }

  get _shouldBeConnected() {
    return this._ws !== null
  }

  isConnected() {
    return this._state === WebSocket.OPEN && this._isReady
  }

  _onUnexpectedClose(beforeOpen, resolve, reject, code) {
    if (this._onOpenErrorBound) {
      this._ws!.removeListener('error', this._onOpenErrorBound)
      this._onOpenErrorBound = null
    }
    // just in case
    this._ws!.removeAllListeners('open')
    this._ws = null
    this._isReady = false
    if (beforeOpen) {
      // connection was closed before it was properly opened, so we must return
      // error to connect's caller
      this.connect().then(resolve, reject)
    } else {
      // if first parameter ws lib sends close code,
      // but sometimes it forgots about it, so default to 1006 - CLOSE_ABNORMAL
      this.emit('disconnected', code || 1006)
      this._retryConnect()
    }
  }

  _calculateTimeout(retriesCount) {
    return retriesCount < 40
      ? // First, for 2 seconds: 20 times per second
        1000 / 20
      : retriesCount < 40 + 60
      ? // Then, for 1 minute: once per second
        1000
      : retriesCount < 40 + 60 + 60
      ? // Then, for 10 minutes: once every 10 seconds
        10 * 1000
      : // Then: once every 30 seconds
        30 * 1000
  }

  _retryConnect() {
    this._retry += 1
    const retryTimeout = this._calculateTimeout(this._retry)
    this._retryTimer = setTimeout(() => {
      this.emit('reconnecting', this._retry)
      this.connect().catch(this._retryConnect.bind(this))
    }, retryTimeout)
  }

  _clearReconnectTimer() {
    if (this._retryTimer !== null) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
    }
  }

  _clearConnectTimer() {
    if (this._connectTimer !== null) {
      clearTimeout(this._connectTimer)
      this._connectTimer = null
    }
  }

  _onOpen() {
    if (!this._ws) {
      return Promise.reject(new DisconnectedError())
    }
    if (this._onOpenErrorBound) {
      this._ws.removeListener('error', this._onOpenErrorBound)
      this._onOpenErrorBound = null
    }

    const request = {
      command: 'subscribe',
      streams: ['ledger']
    }
    return this.request(request).then((data: any) => {
      if (_.isEmpty(data) || !data.ledger_index) {
        // rippled instance doesn't have validated ledgers
        return this._disconnect(false).then(() => {
          throw new RippledNotInitializedError('Rippled not initialized')
        })
      }

      this._ledger.update(data)
      this._rebindOnUnexpectedClose()

      this._retry = 0
      this._ws.on('error', error => {
        this.emit('error', 'websocket', error.message, error)
      })

      this._isReady = true
      this.emit('connected')

      return undefined
    })
  }

  _rebindOnUnexpectedClose() {
    if (this._onUnexpectedCloseBound) {
      this._ws.removeListener('close', this._onUnexpectedCloseBound)
    }
    this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(
      this,
      false,
      null,
      null
    )
    this._ws.once('close', this._onUnexpectedCloseBound)
  }

  _unbindOnUnexpectedClose() {
    if (this._onUnexpectedCloseBound) {
      this._ws.removeListener('close', this._onUnexpectedCloseBound)
    }
    this._onUnexpectedCloseBound = null
  }

  _onOpenError(reject, error) {
    this._onOpenErrorBound = null
    this._unbindOnUnexpectedClose()
    reject(new NotConnectedError(error.message, error))
  }

  _createWebSocket(): WebSocket {
    const options: WebSocket.ClientOptions = {}
    if (this._config.proxy !== undefined) {
      const parsedURL = parseUrl(this._url)
      const parsedProxyURL = parseUrl(this._config.proxy)
      const proxyOverrides = _.omitBy(
        {
          secureEndpoint: parsedURL.protocol === 'wss:',
          secureProxy: parsedProxyURL.protocol === 'https:',
          auth: this._config.proxyAuthorization,
          ca: this._config.trustedCertificates,
          key: this._config.key,
          passphrase: this._config.passphrase,
          cert: this._config.certificate
        },
        _.isUndefined
      )
      const proxyOptions = _.assign({}, parsedProxyURL, proxyOverrides)
      let HttpsProxyAgent
      try {
        HttpsProxyAgent = require('https-proxy-agent')
      } catch (error) {
        throw new Error('"proxy" option is not supported in the browser')
      }
      options.agent = new HttpsProxyAgent(proxyOptions)
    }
    if (this._config.authorization !== undefined) {
      const base64 = Buffer.from(this._config.authorization).toString('base64')
      options.headers = {Authorization: `Basic ${base64}`}
    }
    const optionsOverrides = _.omitBy(
      {
        ca: this._config.trustedCertificates,
        key: this._config.key,
        passphrase: this._config.passphrase,
        cert: this._config.certificate
      },
      _.isUndefined
    )
    const websocketOptions = _.assign({}, options, optionsOverrides)
    const websocket = new WebSocket(this._url, null, websocketOptions)
    // we will have a listener for each outstanding request,
    // so we have to raise the limit (the default is 10)
    if (typeof websocket.setMaxListeners === 'function') {
      websocket.setMaxListeners(Infinity)
    }
    return websocket
  }

  connect(): Promise<void> {
    this._clearConnectTimer()
    this._clearReconnectTimer()
    this._clearHeartbeatInterval()
    return (
      new Promise<void>((_resolve, reject) => {
        this._connectTimer = setTimeout(() => {
          reject(
            new ConnectionError(
              `Error: connect() timed out after ${this._config.connectionTimeout} ms. ` +
                `If your internet connection is working, the rippled server may be blocked or inaccessible.`
            )
          )
        }, this._config.connectionTimeout)
        if (!this._url) {
          reject(
            new ConnectionError(
              'Cannot connect because no server was specified'
            )
          )
        }
        const resolve = () => {
          this._startHeartbeatInterval()
          _resolve()
        }
        if (this._state === WebSocket.OPEN) {
          resolve()
        } else if (this._state === WebSocket.CONNECTING) {
          this._ws.once('open', () => resolve)
        } else {
          this._ws = this._createWebSocket()
          // when an error causes the connection to close, the close event
          // should still be emitted; the "ws" documentation says: "The close
          // event is also emitted when then underlying net.Socket closes the
          // connection (end or close)."
          // In case if there is connection error (say, server is not responding)
          // we must return this error to connection's caller. After successful
          // opening, we will forward all errors to main api object.
          this._onOpenErrorBound = this._onOpenError.bind(this, reject)
          this._ws.once('error', this._onOpenErrorBound)
          this._ws.on('message', this._onMessage.bind(this))
          // in browser close event can came before open event, so we must
          // resolve connect's promise after reconnect in that case.
          // after open event we will rebound _onUnexpectedCloseBound
          // without resolve and reject functions
          this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(
            this,
            true,
            resolve,
            reject
          )
          this._ws.once('close', this._onUnexpectedCloseBound)
          this._ws.once('open', () => {
            return this._onOpen().then(resolve, reject)
          })
        }
      })
        // Once we have a resolution or rejection, clear the timeout timer as no
        // longer needed.
        .then(() => {
          this._clearConnectTimer()
        })
        .catch(err => {
          this._clearConnectTimer()
          throw err
        })
    )
  }

  disconnect(): Promise<void> {
    return this._disconnect(true)
  }

  _disconnect(calledByUser): Promise<void> {
    this._clearHeartbeatInterval()
    if (calledByUser) {
      this._clearConnectTimer()
      this._clearReconnectTimer()
      this._retry = 0
    }
    return new Promise(resolve => {
      if (this._state === WebSocket.CLOSED) {
        resolve()
      } else if (this._state === WebSocket.CLOSING) {
        this._ws.once('close', resolve)
      } else {
        if (this._onUnexpectedCloseBound) {
          this._ws.removeListener('close', this._onUnexpectedCloseBound)
          this._onUnexpectedCloseBound = null
        }
        this._ws.once('close', code => {
          this._ws = null
          this._isReady = false
          if (calledByUser) {
            this.emit('disconnected', code || 1000) // 1000 - CLOSE_NORMAL
          }
          resolve()
        })
        this._ws.close()
      }
    })
  }

  reconnect() {
    // NOTE: We currently have a "reconnecting" event, but that only triggers through
    // _retryConnect, which was written in a way that is required to run as an internal
    // part of the post-disconnect connect() flow.
    // See: https://github.com/ripple/ripple-lib/pull/1101#issuecomment-565360423
    this.emit('reconnect')
    return this.disconnect().then(() => this.connect())
  }

  private _clearHeartbeatInterval = () => {
    clearInterval(this._heartbeatInterval)
  }

  private _startHeartbeatInterval = () => {
    this._clearHeartbeatInterval()
    this._heartbeatInterval = setInterval(() => this._heartbeat(), 1000 * 60)
  }

  /**
   * A heartbeat is just a "ping" command, sent on an interval.
   * If this succeeds, we're good. If it fails, disconnect so that the consumer can reconnect, if desired.
   */
  private _heartbeat = () => {
    return this.request({command: 'ping'}).catch(() => this.reconnect())
  }

  /**
   * Wait for a valid connection before resolving. Useful for deferring methods
   * until a connection has been established.
   */
  private _waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError())
      } else if (this._state === WebSocket.OPEN && this._isReady) {
        resolve()
      } else {
        this.once('connected', () => resolve())
      }
    })
  }

  async getLedgerVersion(): Promise<number> {
    await this._waitForReady()
    return this._ledger.latestVersion!
  }

  async getFeeBase(): Promise<number> {
    await this._waitForReady()
    return this._ledger.feeBase!
  }

  async getFeeRef(): Promise<number> {
    await this._waitForReady()
    return this._ledger.feeRef!
  }

  async hasLedgerVersions(
    lowLedgerVersion: number,
    highLedgerVersion: number | undefined
  ): Promise<boolean> {
    // You can call hasVersions with a potentially unknown upper limit, which
    // will just act as a check on the lower limit.
    if (!highLedgerVersion) {
      return this.hasLedgerVersion(lowLedgerVersion)
    }
    await this._waitForReady()
    return this._ledger.hasVersions(lowLedgerVersion, highLedgerVersion)
  }

  async hasLedgerVersion(ledgerVersion: number): Promise<boolean> {
    await this._waitForReady()
    return this._ledger.hasVersion(ledgerVersion)
  }

  _send(message: string): Promise<void> {
    this._trace('send', message)
    return new Promise((resolve, reject) => {
      this._ws.send(message, undefined, error => {
        if (error) {
          reject(new DisconnectedError(error.message, error))
        } else {
          resolve()
        }
      })
    })
  }

  request(request, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError())
      }

      let timer = null
      const self = this
      const id = this._nextRequestID
      this._nextRequestID += 1
      const eventName = id.toString()

      function onDisconnect() {
        clearTimeout(timer)
        self.removeAllListeners(eventName)
        reject(new DisconnectedError('websocket was closed'))
      }

      function cleanup() {
        clearTimeout(timer)
        self.removeAllListeners(eventName)
        if (self._ws !== null) {
          self._ws.removeListener('close', onDisconnect)
        }
      }

      function _resolve(response) {
        cleanup()
        resolve(response)
      }

      function _reject(error) {
        cleanup()
        reject(error)
      }

      this.once(eventName, response => {
        if (response.status === 'error') {
          _reject(
            new RippledError(response.error_message || response.error, response)
          )
        } else if (response.status === 'success') {
          _resolve(response.result)
        } else {
          _reject(
            new ResponseFormatError(
              'unrecognized status: ' + response.status,
              response
            )
          )
        }
      })

      this._ws.once('close', onDisconnect)

      // JSON.stringify automatically removes keys with value of 'undefined'
      const message = JSON.stringify(Object.assign({}, request, {id}))

      this._send(message)
        .then(() => {
          const delay = timeout || this._config.timeout
          timer = setTimeout(() => _reject(new TimeoutError()), delay)
          // Node.js won't exit if a timer is still running, so we tell Node to ignore (Node will still wait for the request to complete)
          if (timer.unref) {
            timer.unref()
          }
        })
        .catch(_reject)
    })
  }
}

export default Connection
