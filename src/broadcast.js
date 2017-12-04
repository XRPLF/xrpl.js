
import * as _ from 'lodash'
import {RippleAPI} from './api'

class RippleAPIBroadcast extends RippleAPI {
  constructor(servers, options) {
    super(options)
    this.ledgerVersion = 0

    const apis = servers.map(server => new RippleAPI(
      _.assign({}, options, {server})
    ))

    // exposed for testing
    this._apis = apis

    this.getMethodNames().forEach(name => {
      this[name] = function() { // eslint-disable-line no-loop-func
        return Promise.race(apis.map(api => api[name](...arguments)))
      }
    })

    // connection methods must be overridden to apply to all api instances
    this.connect = function() {
      return Promise.all(apis.map(api => api.connect()))
    }
    this.disconnect = function() {
      return Promise.all(apis.map(api => api.disconnect()))
    }
    this.isConnected = function() {
      return _.every(apis.map(api => api.isConnected()))
    }

    // synchronous methods are all passed directly to the first api instance
    const defaultAPI = apis[0]
    const syncMethods = ['sign', 'generateAddress', 'computeLedgerHash']
    syncMethods.forEach(name => {
      this[name] = defaultAPI[name].bind(defaultAPI)
    })

    apis.forEach(api => {
      api.on('ledger', this.onLedgerEvent.bind(this))
      api.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data))
    })
  }

  onLedgerEvent(ledger) {
    if (ledger.ledgerVersion > this.ledgerVersion) {
      this.ledgerVersion = ledger.ledgerVersion
      this.emit('ledger', ledger)
    }
  }

  getMethodNames() {
    const methodNames = []
    for (const name in RippleAPI.prototype) {
      if (RippleAPI.prototype.hasOwnProperty(name)) {
        if (typeof RippleAPI.prototype[name] === 'function') {
          methodNames.push(name)
        }
      }
    }
    return methodNames
  }
}

export {
  RippleAPIBroadcast
}
