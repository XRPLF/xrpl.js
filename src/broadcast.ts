import {XrplClient, APIOptions} from './api'

class XrplClientBroadcast extends XrplClient {
  ledgerVersion: number | undefined = undefined
  private _apis: XrplClient[]

  constructor(servers, options: APIOptions = {}) {
    super(options)

    const apis: XrplClient[] = servers.map(
      (server) => new XrplClient(Object.assign({}, options, {server}))
    )

    // exposed for testing
    this._apis = apis

    this.getMethodNames().forEach((name) => {
      this[name] = function () {
        // eslint-disable-line no-loop-func
        return Promise.race(apis.map((api) => api[name](...arguments)))
      }
    })

    // connection methods must be overridden to apply to all api instances
    this.connect = async function () {
      await Promise.all(apis.map((api) => api.connect()))
    }
    this.disconnect = async function () {
      await Promise.all(apis.map((api) => api.disconnect()))
    }
    this.isConnected = function () {
      return apis.map((api) => api.isConnected()).every(Boolean)
    }

    // synchronous methods are all passed directly to the first api instance
    const defaultAPI = apis[0]
    const syncMethods = ['sign', 'generateAddress', 'computeLedgerHash']
    syncMethods.forEach((name) => {
      this[name] = defaultAPI[name].bind(defaultAPI)
    })

    apis.forEach((api) => {
      api.on('ledger', this.onLedgerEvent.bind(this))
      api.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data)
      )
    })
  }

  onLedgerEvent(ledger) {
    if (
      ledger.ledgerVersion > this.ledgerVersion ||
      this.ledgerVersion == null
    ) {
      this.ledgerVersion = ledger.ledgerVersion
      this.emit('ledger', ledger)
    }
  }

  getMethodNames() {
    const methodNames: string[] = []
    const XrplClient = this._apis[0]
    for (const name of Object.getOwnPropertyNames(XrplClient)) {
      if (typeof XrplClient[name] === 'function') {
        methodNames.push(name)
      }
    }
    return methodNames
  }
}

export {XrplClientBroadcast}
