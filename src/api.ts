import {EventEmitter} from 'events'
import {Connection, errors, validate} from './common'
import {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion,
  formatLedgerClose
} from './server/server'
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
import getAccountObjects from './ledger/accountobjects'
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
import prepareCheckCreate from './transaction/check-create'
import prepareCheckCancel from './transaction/check-cancel'
import prepareCheckCash from './transaction/check-cash'
import prepareSettings from './transaction/settings'
import sign from './transaction/sign'
import combine from './transaction/combine'
import submit from './transaction/submit'
import {generateAddressAPI} from './offline/generate-address'
import computeLedgerHash from './offline/ledgerhash'
import signPaymentChannelClaim from './offline/sign-payment-channel-claim'
import verifyPaymentChannelClaim from './offline/verify-payment-channel-claim'
import getLedger from './ledger/ledger'

import {
  AccountObjectsRequest, AccountObjectsResponse,
  AccountOffersRequest, AccountOffersResponse,
  AccountInfoRequest, AccountInfoResponse,
  AccountLinesRequest, AccountLinesResponse,
  BookOffersRequest, BookOffersResponse,
  GatewayBalancesRequest, GatewayBalancesResponse,
  LedgerRequest, LedgerResponse,
  LedgerEntryRequest, LedgerEntryResponse
} from './common/types/commands'


import RangeSet from './common/rangeset'
import * as ledgerUtils from './ledger/utils'
import * as schemaValidator from './common/schema-validator'
import {clamp} from './ledger/utils'

export type APIOptions = {
  server?: string,
  feeCushion?: number,
  trace?: boolean,
  proxy?: string,
  timeout?: number
}

/**
 * Get the response key / property name that contains the listed data for a
 * command. This varies from command to command, but we need to know it to
 * properly count across many requests.
 */
function getCollectKeyFromCommand(command: string): string|undefined {
  switch (command) {
    case 'account_offers':
    case 'book_offers':
      return 'offers'
    case 'account_lines':
      return 'lines'
    default:
      return undefined
  }
}

class RippleAPI extends EventEmitter {
  _feeCushion: number

  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  connection: Connection

  // these are exposed only for use by unit tests; they are not part of the API.
  static _PRIVATE = {
    validate: validate,
    RangeSet,
    ledgerUtils,
    schemaValidator
  }

  constructor(options: APIOptions = {}) {
    super()
    validate.apiOptions(options)
    this._feeCushion = options.feeCushion || 1.2
    const serverURL = options.server
    if (serverURL !== undefined) {
      this.connection = new Connection(serverURL, options)
      this.connection.on('ledgerClosed', message => {
        this.emit('ledger', formatLedgerClose(message))
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
      this.connection = new Connection(null, options)
    }
  }


  async request(command: 'account_info', params: AccountInfoRequest):
    Promise<AccountInfoResponse>
  async request(command: 'account_lines', params: AccountLinesRequest):
    Promise<AccountLinesResponse>

  /**
   * Returns objects owned by an account.
   * For an account's trust lines and balances,
   * see `getTrustlines` and `getBalances`.
   */
  async request(command: 'account_objects', params: AccountObjectsRequest):
    Promise<AccountObjectsResponse>

  async request(command: 'account_offers', params: AccountOffersRequest):
  Promise<AccountOffersResponse>
  async request(command: 'book_offers', params: BookOffersRequest):
    Promise<BookOffersResponse>
  async request(command: 'gateway_balances', params: GatewayBalancesRequest):
    Promise<GatewayBalancesResponse>
  async request(command: 'ledger', params: LedgerRequest):
    Promise<LedgerResponse>
  async request(command: 'ledger_entry', params: LedgerEntryRequest):
    Promise<LedgerEntryResponse>

  async request(command: string, params: object):
    Promise<object>

  /**
   * Makes a request to the API with the given command and
   * additional request body parameters.
   */
  async request(command: string, params: object = {}): Promise<object> {
    return this.connection.request({
      ...params,
      command
    })
  }

  /**
   * Returns true if there are more pages of data.
   *
   * When there are more results than contained in the response, the response
   * includes a `marker` field.
   *
   * See https://ripple.com/build/rippled-apis/#markers-and-pagination
   */
  hasNextPage<T extends {marker?: string}>(currentResponse: T): boolean {
    return !!currentResponse.marker
  }

  async requestNextPage<T extends {marker?: string}>(
    command: string,
    params: object = {},
    currentResponse: T
  ): Promise<object> {
    if (!currentResponse.marker) {
      return Promise.reject(
        new errors.NotFoundError('response does not have a next page')
      )
    }
    const nextPageParams = Object.assign({}, params, {
      marker: currentResponse.marker
    })
    return this.request(command, nextPageParams)
  }

  /**
   * Makes multiple paged requests to the API to return a given number of
   * resources. _requestAll() will make multiple requests until the `limit`
   * number of resources is reached (if no `limit` is provided, a single request
   * will be made).
   *
   * If the command is unknown, an additional `collect` property is required to
   * know which response key contains the array of resources.
   *
   * NOTE: This command is used by existing methods and is not recommended for
   * general use. Instead, use rippled's built-in pagination and make multiple
   * requests as needed.
   */
  async _requestAll(command: 'account_offers', params: AccountOffersRequest):
    Promise<AccountOffersResponse[]>
  async _requestAll(command: 'book_offers', params: BookOffersRequest):
    Promise<BookOffersResponse[]>
  async _requestAll(command: 'account_lines', params: AccountLinesRequest):
    Promise<AccountLinesResponse[]>
  async _requestAll(
    command: string,
    params: any = {},
    options: {collect?: string} = {}): Promise<any[]> {
    // The data under collection is keyed based on the command. Fail if command
    // not recognized and collection key not provided.
    const collectKey = options.collect || getCollectKeyFromCommand(command)
    if (!collectKey) {
      throw new errors.ValidationError(`no collect key for command ${command}`)
    }
    // If limit is not provided, fetches all data over multiple requests.
    // NOTE: This may return much more than needed. Set limit when possible.
    const countTo: number =
        (params.limit !== undefined) ? params.limit : Infinity
    let count: number = 0
    let marker: string = params.marker
    let lastBatchLength: number
    const results = []
    do {
      const countRemaining = clamp(countTo - count, 10, 400)
      const repeatProps = {
        ...params,
        limit: countRemaining,
        marker
      }
      const singleResult = await this.request(command, repeatProps)
      const collectedData = singleResult[collectKey]
      marker = singleResult['marker']
      results.push(singleResult)
      // Make sure we handle when no data (not even an empty array) is returned.
      const isExpectedFormat = Array.isArray(collectedData)
      if (isExpectedFormat) {
        count += collectedData.length
        lastBatchLength = collectedData.length
      } else {
        lastBatchLength = 0
      }
    } while(!!marker && count < countTo && lastBatchLength !== 0)
    return results
  }

  connect = connect
  disconnect = disconnect
  isConnected = isConnected
  getServerInfo = getServerInfo
  getFee = getFee
  getLedgerVersion = getLedgerVersion

  getTransaction = getTransaction
  getTransactions = getTransactions
  getTrustlines = getTrustlines
  getBalances = getBalances
  getBalanceSheet = getBalanceSheet
  getPaths = getPaths
  getOrders = getOrders
  getOrderbook = getOrderbook
  getSettings = getSettings
  getAccountInfo = getAccountInfo
  getAccountObjects = getAccountObjects
  getPaymentChannel = getPaymentChannel
  getLedger = getLedger

  preparePayment = preparePayment
  prepareTrustline = prepareTrustline
  prepareOrder = prepareOrder
  prepareOrderCancellation = prepareOrderCancellation
  prepareEscrowCreation = prepareEscrowCreation
  prepareEscrowExecution = prepareEscrowExecution
  prepareEscrowCancellation = prepareEscrowCancellation
  preparePaymentChannelCreate = preparePaymentChannelCreate
  preparePaymentChannelFund = preparePaymentChannelFund
  preparePaymentChannelClaim = preparePaymentChannelClaim
  prepareCheckCreate = prepareCheckCreate
  prepareCheckCash = prepareCheckCash
  prepareCheckCancel = prepareCheckCancel
  prepareSettings = prepareSettings
  sign = sign
  combine = combine
  submit = submit

  generateAddress = generateAddressAPI
  computeLedgerHash = computeLedgerHash
  signPaymentChannelClaim = signPaymentChannelClaim
  verifyPaymentChannelClaim = verifyPaymentChannelClaim
  errors = errors
}

export {
  RippleAPI
}
