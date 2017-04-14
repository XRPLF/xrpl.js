/* @flow */
'use strict' // eslint-disable-line strict

/* eslint-disable max-len */
// Enable core-js polyfills. This allows use of ES6/7 extensions listed here:
// https://github.com/zloirock/core-js/blob/fb0890f32dabe8d4d88a4350d1b268446127132e/shim.js#L1-L103
/* eslint-enable max-len */

// In node.js env, polyfill might be already loaded (from any npm package),
// that's why we do this check.
if (!global._babelPolyfill) {
  require('babel-polyfill')
}

const _ = require('lodash')
const EventEmitter = require('events').EventEmitter
const common = require('./common')
const server = require('./server/server')
const connect = server.connect
const disconnect = server.disconnect
const getServerInfo = server.getServerInfo
const getFee = server.getFee
const isConnected = server.isConnected
const getLedgerVersion = server.getLedgerVersion
const getTransaction = require('./ledger/transaction')
const getTransactions = require('./ledger/transactions')
const getTrustlines = require('./ledger/trustlines')
const getBalances = require('./ledger/balances')
const getBalanceSheet = require('./ledger/balance-sheet')
const getPaths = require('./ledger/pathfind')
const getOrders = require('./ledger/orders')
const getOrderbook = require('./ledger/orderbook')
const getSettings = require('./ledger/settings')
const getAccountInfo = require('./ledger/accountinfo')
const getPaymentChannel = require('./ledger/payment-channel')
const preparePayment = require('./transaction/payment')
const prepareTrustline = require('./transaction/trustline')
const prepareOrder = require('./transaction/order')
const prepareOrderCancellation = require('./transaction/ordercancellation')
const prepareEscrowCreation =
  require('./transaction/escrow-creation')
const prepareEscrowExecution =
  require('./transaction/escrow-execution')
const prepareEscrowCancellation =
  require('./transaction/escrow-cancellation')
const preparePaymentChannelCreate =
  require('./transaction/payment-channel-create')
const preparePaymentChannelFund =
  require('./transaction/payment-channel-fund')
const preparePaymentChannelClaim =
  require('./transaction/payment-channel-claim')
const prepareSettings = require('./transaction/settings')
const sign = require('./transaction/sign')
const combine = require('./transaction/combine')
const submit = require('./transaction/submit')
const errors = require('./common').errors
const generateAddress =
  require('./offline/generate-address').generateAddressAPI
const computeLedgerHash = require('./offline/ledgerhash')
const signPaymentChannelClaim =
  require('./offline/sign-payment-channel-claim')
const verifyPaymentChannelClaim =
  require('./offline/verify-payment-channel-claim')
const getLedger = require('./ledger/ledger')

type APIOptions = {
  server?: string,
  feeCushion?: number,
  trace?: boolean,
  proxy?: string,
  timeout?: number
}

// prevent access to non-validated ledger versions
class RestrictedConnection extends common.Connection {
  request(request, timeout) {
    const ledger_index = request.ledger_index
    if (ledger_index !== undefined && ledger_index !== 'validated') {
      if (!_.isNumber(ledger_index) || ledger_index > this._ledgerVersion) {
        return Promise.reject(new errors.LedgerVersionError(
          `ledgerVersion ${ledger_index} is greater than server\'s ` +
          `most recent validated ledger: ${this._ledgerVersion}`))
      }
    }
    return super.request(request, timeout)
  }
}

class RippleAPI extends EventEmitter {
  constructor(options: APIOptions = {}) {
    common.validate.apiOptions(options)
    super()
    this._feeCushion = options.feeCushion || 1.2
    const serverURL = options.server
    if (serverURL !== undefined) {
      this.connection = new RestrictedConnection(serverURL, options)
      this.connection.on('ledgerClosed', message => {
        this.emit('ledger', server.formatLedgerClose(message))
      })
      this.connection.on('error', (errorCode, errorMessage, data) => {
        this.emit('error', errorCode, errorMessage, data)
      })
      this.connection.on('connected', () => {
        this.emit('connected')
      })
      this.connection.on('disconnected', code => {
        this.emit('disconnected', code)
      })
    } else {
      // use null object pattern to provide better error message if user
      // tries to call a method that requires a connection
      this.connection = new RestrictedConnection(null, options)
    }
  }
}

_.assign(RippleAPI.prototype, {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion,

  getTransaction,
  getTransactions,
  getTrustlines,
  getBalances,
  getBalanceSheet,
  getPaths,
  getOrders,
  getOrderbook,
  getSettings,
  getAccountInfo,
  getPaymentChannel,
  getLedger,

  preparePayment,
  prepareTrustline,
  prepareOrder,
  prepareOrderCancellation,
  prepareEscrowCreation,
  prepareEscrowExecution,
  prepareEscrowCancellation,
  preparePaymentChannelCreate,
  preparePaymentChannelFund,
  preparePaymentChannelClaim,
  prepareSettings,
  sign,
  combine,
  submit,

  generateAddress,
  computeLedgerHash,
  signPaymentChannelClaim,
  verifyPaymentChannelClaim,
  errors
})

// these are exposed only for use by unit tests; they are not part of the API
RippleAPI._PRIVATE = {
  validate: common.validate,
  RangeSet: require('./common/rangeset').RangeSet,
  ledgerUtils: require('./ledger/utils'),
  schemaValidator: require('./common/schema-validator')
}

module.exports = {
  RippleAPI
}
