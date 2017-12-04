/* @flow */

import * as _ from 'lodash'
import events from 'events'
import {Connection, errors, validate} from './common'
import * as server from './server/server'
const connect = server.connect
const disconnect = server.disconnect
const getServerInfo = server.getServerInfo
const getFee = server.getFee
const isConnected = server.isConnected
const getLedgerVersion = server.getLedgerVersion
import getTransaction from './ledger/transaction'
import getTransactions from './ledger/transactions'
import getTrustlines from './ledger/trustlines'
import getBalances from './ledger/balances'
import getBalanceSheet from './ledger/balance-sheet'
import getPaths from './ledger/pathfind'
import getOrders from './ledger/orders'
import getOrderbook from './ledger/orderbook'
import getSettings from './ledger/settings'
import getAccountInfo from './ledger/accountinfo'
import getPaymentChannel from './ledger/payment-channel'
import preparePayment from './transaction/payment'
import prepareTrustline from './transaction/trustline'
import prepareOrder from './transaction/order'
import prepareOrderCancellation from './transaction/ordercancellation'
import prepareEscrowCreation from './transaction/escrow-creation'
import prepareEscrowExecution from './transaction/escrow-execution'
import prepareEscrowCancellation from './transaction/escrow-cancellation'
import preparePaymentChannelCreate from './transaction/payment-channel-create'
import preparePaymentChannelFund from './transaction/payment-channel-fund'
import preparePaymentChannelClaim from './transaction/payment-channel-claim'
import prepareSettings from './transaction/settings'
import sign from './transaction/sign'
import combine from './transaction/combine'
import submit from './transaction/submit'
import {generateAddressAPI} from './offline/generate-address'
import computeLedgerHash from './offline/ledgerhash'
import signPaymentChannelClaim from './offline/sign-payment-channel-claim'
import verifyPaymentChannelClaim from './offline/verify-payment-channel-claim'
import getLedger from './ledger/ledger'


import RangeSet from './common/rangeset'
import * as ledgerUtils from './ledger/utils'
import * as schemaValidator from './common/schema-validator'

type APIOptions = {
  server?: string,
  feeCushion?: number,
  trace?: boolean,
  proxy?: string,
  timeout?: number
}

// prevent access to non-validated ledger versions
class RestrictedConnection extends Connection {
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

class RippleAPI extends events.EventEmitter {

  _feeCushion: number
  connection: RestrictedConnection

  // these are exposed only for use by unit tests; they are not part of the API.
  static _PRIVATE = {
    validate: validate,
    RangeSet,
    ledgerUtils,
    schemaValidator
  };

  constructor(options: APIOptions = {}) {
    validate.apiOptions(options)
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

  generateAddress: generateAddressAPI,
  computeLedgerHash,
  signPaymentChannelClaim,
  verifyPaymentChannelClaim,
  errors
})

export {
  RippleAPI
}
