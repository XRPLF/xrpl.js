import {EventEmitter} from 'events'
import {
  Connection,
  errors,
  validate,
  xrpToDrops,
  dropsToXrp,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  txFlags,
  ensureClassicAddress
} from './common'
import {
  connect,
  disconnect,
  isConnected,
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
import {getOrderbook, formatBidsAndAsks} from './ledger/orderbook'
import {getSettings, parseAccountFlags} from './ledger/settings'
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
import {
  generateAddressAPI,
  GenerateAddressOptions,
  GeneratedAddress
} from './offline/generate-address'
import {deriveKeypair, deriveAddress, deriveXAddress} from './offline/derive'
import computeLedgerHash from './offline/ledgerhash'
import signPaymentChannelClaim from './offline/sign-payment-channel-claim'
import verifyPaymentChannelClaim from './offline/verify-payment-channel-claim'
import getLedger from './ledger/ledger'

import {
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountLinesRequest,
  AccountLinesResponse,
  BookOffersRequest,
  BookOffersResponse,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
  LedgerRequest,
  LedgerResponse,
  LedgerDataRequest,
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
  ServerInfoRequest,
  ServerInfoResponse
} from './common/types/commands'

import RangeSet from './common/rangeset'
import * as ledgerUtils from './ledger/utils'
import * as transactionUtils from './transaction/utils'
import * as schemaValidator from './common/schema-validator'
import {getServerInfo, getFee} from './common/serverinfo'
import {clamp, renameCounterpartyToIssuer} from './ledger/utils'
import {TransactionJSON, Instructions, Prepare} from './transaction/types'
import {ConnectionUserOptions} from './common/connection'
import {isValidXAddress, isValidClassicAddress} from 'ripple-address-codec'
import {
  computeBinaryTransactionHash,
  computeTransactionHash,
  computeBinaryTransactionSigningHash,
  computeAccountLedgerObjectID,
  computeSignerListLedgerObjectID,
  computeOrderID,
  computeTrustlineHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
  computeEscrowHash,
  computePaymentChannelHash
} from './common/hashes'

export interface APIOptions extends ConnectionUserOptions {
  server?: string
  feeCushion?: number
  maxFeeXRP?: string
  proxy?: string
  timeout?: number
}

/**
 * Get the response key / property name that contains the listed data for a
 * command. This varies from command to command, but we need to know it to
 * properly count across many requests.
 */
function getCollectKeyFromCommand(command: string): string | undefined {
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
  _maxFeeXRP: string

  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  connection: Connection

  // these are exposed only for use by unit tests; they are not part of the API.
  static _PRIVATE = {
    validate,
    RangeSet,
    ledgerUtils,
    schemaValidator
  }

  static renameCounterpartyToIssuer = renameCounterpartyToIssuer
  static formatBidsAndAsks = formatBidsAndAsks

  constructor(options: APIOptions = {}) {
    super()
    validate.apiOptions(options)
    this._feeCushion = options.feeCushion || 1.2
    this._maxFeeXRP = options.maxFeeXRP || '2'
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
        let finalCode = code
        // 1005: This is a backwards-compatible fix for this change in the ws library: https://github.com/websockets/ws/issues/1257
        // 4000: Connection uses a 4000 code internally to indicate a manual disconnect/close
        // TODO: Remove in next major, breaking version
        if (finalCode === 1005 || finalCode === 4000) {
          finalCode = 1000
        }
        this.emit('disconnected', finalCode)
      })
    } else {
      // use null object pattern to provide better error message if user
      // tries to call a method that requires a connection
      this.connection = new Connection(null, options)
    }
  }

  /**
   * Makes a request to the API with the given command and
   * additional request body parameters.
   */
  async request(
    command: 'account_info',
    params: AccountInfoRequest
  ): Promise<AccountInfoResponse>
  async request(
    command: 'account_lines',
    params: AccountLinesRequest
  ): Promise<AccountLinesResponse>
  async request(
    command: 'account_objects',
    params: AccountObjectsRequest
  ): Promise<AccountObjectsResponse>
  async request(
    command: 'account_offers',
    params: AccountOffersRequest
  ): Promise<AccountOffersResponse>
  async request(
    command: 'book_offers',
    params: BookOffersRequest
  ): Promise<BookOffersResponse>
  async request(
    command: 'gateway_balances',
    params: GatewayBalancesRequest
  ): Promise<GatewayBalancesResponse>
  async request(
    command: 'ledger',
    params: LedgerRequest
  ): Promise<LedgerResponse>
  async request(
    command: 'ledger_data',
    params?: LedgerDataRequest
  ): Promise<LedgerDataResponse>
  async request(
    command: 'ledger_entry',
    params: LedgerEntryRequest
  ): Promise<LedgerEntryResponse>
  async request(
    command: 'server_info',
    params?: ServerInfoRequest
  ): Promise<ServerInfoResponse>
  async request(command: string, params: any): Promise<any>
  async request(command: string, params: any = {}): Promise<any> {
    return this.connection.request({
      ...params,
      command,
      account: params.account ? ensureClassicAddress(params.account) : undefined
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
  ): Promise<T> {
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
   * Prepare a transaction.
   *
   * You can later submit the transaction with a `submit` request.
   */
  async prepareTransaction(
    txJSON: TransactionJSON,
    instructions: Instructions = {}
  ): Promise<Prepare> {
    return transactionUtils.prepareTransaction(txJSON, this, instructions)
  }

  /**
   * Convert a string to hex.
   *
   * This can be used to generate `MemoData`, `MemoType`, and `MemoFormat`.
   *
   * @param string string to convert to hex
   */
  convertStringToHex(string: string): string {
    return transactionUtils.convertStringToHex(string)
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
  async _requestAll(
    command: 'account_offers',
    params: AccountOffersRequest
  ): Promise<AccountOffersResponse[]>
  async _requestAll(
    command: 'book_offers',
    params: BookOffersRequest
  ): Promise<BookOffersResponse[]>
  async _requestAll(
    command: 'account_lines',
    params: AccountLinesRequest
  ): Promise<AccountLinesResponse[]>
  async _requestAll(
    command: string,
    params: any = {},
    options: {collect?: string} = {}
  ): Promise<any[]> {
    // The data under collection is keyed based on the command. Fail if command
    // not recognized and collection key not provided.
    const collectKey = options.collect || getCollectKeyFromCommand(command)
    if (!collectKey) {
      throw new errors.ValidationError(`no collect key for command ${command}`)
    }
    // If limit is not provided, fetches all data over multiple requests.
    // NOTE: This may return much more than needed. Set limit when possible.
    const countTo: number = params.limit !== undefined ? params.limit : Infinity
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
    } while (!!marker && count < countTo && lastBatchLength !== 0)
    return results
  }

  // @deprecated Use X-addresses instead
  generateAddress(options: GenerateAddressOptions = {}): GeneratedAddress {
    return generateAddressAPI({...options, includeClassicAddress: true})
  }

  generateXAddress(options: GenerateAddressOptions = {}): GeneratedAddress {
    return generateAddressAPI(options)
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
  getOrderbook = getOrderbook
  getOrders = getOrders
  getSettings = getSettings
  getAccountInfo = getAccountInfo
  getAccountObjects = getAccountObjects
  getPaymentChannel = getPaymentChannel
  getLedger = getLedger
  parseAccountFlags = parseAccountFlags

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

  submit = submit // @deprecated Use api.request('submit', { tx_blob: signedTransaction }) instead

  deriveKeypair = deriveKeypair
  deriveAddress = deriveAddress
  computeLedgerHash = computeLedgerHash
  signPaymentChannelClaim = signPaymentChannelClaim
  verifyPaymentChannelClaim = verifyPaymentChannelClaim
  errors = errors

  static deriveXAddress = deriveXAddress

  // RippleAPI.deriveClassicAddress (static) is a new name for api.deriveAddress
  static deriveClassicAddress = deriveAddress

  static isValidXAddress = isValidXAddress
  static isValidClassicAddress = isValidClassicAddress

  /**
   * Static methods that replace functionality from the now-deprecated ripple-hashes library
   */
  // Compute the hash of a binary transaction blob.
  static computeBinaryTransactionHash = computeBinaryTransactionHash // (txBlobHex: string): string
  // Compute the hash of a transaction in txJSON format.
  static computeTransactionHash = computeTransactionHash // (txJSON: any): string
  static computeBinaryTransactionSigningHash = computeBinaryTransactionSigningHash // (txBlobHex: string): string
  // Compute the hash of an account, given the account's classic address (starting with `r`).
  static computeAccountLedgerObjectID = computeAccountLedgerObjectID // (address: string): string
  // Compute the hash (ID) of an account's SignerList.
  static computeSignerListLedgerObjectID = computeSignerListLedgerObjectID // (address: string): string
  // Compute the hash of an order, given the owner's classic address (starting with `r`) and the account sequence number of the `OfferCreate` order transaction.
  static computeOrderID = computeOrderID // (address: string, sequence: number): string
  // Compute the hash of a trustline, given the two parties' classic addresses (starting with `r`) and the currency code.
  static computeTrustlineHash = computeTrustlineHash // (address1: string, address2: string, currency: string): string
  static computeTransactionTreeHash = computeTransactionTreeHash // (transactions: any[]): string
  static computeStateTreeHash = computeStateTreeHash // (entries: any[]): string
  // Compute the hash of a ledger.
  static computeLedgerHash = computeLedgerHash // (ledgerHeader): string
  // Compute the hash of an escrow, given the owner's classic address (starting with `r`) and the account sequence number of the `EscrowCreate` escrow transaction.
  static computeEscrowHash = computeEscrowHash // (address, sequence): string
  // Compute the hash of a payment channel, given the owner's classic address (starting with `r`), the classic address of the destination, and the account sequence number of the `PaymentChannelCreate` payment channel transaction.
  static computePaymentChannelHash = computePaymentChannelHash // (address, dstAddress, sequence): string

  xrpToDrops = xrpToDrops
  dropsToXrp = dropsToXrp
  rippleTimeToISO8601 = rippleTimeToISO8601
  iso8601ToRippleTime = iso8601ToRippleTime
  txFlags = txFlags

  isValidAddress = schemaValidator.isValidAddress
  isValidSecret = schemaValidator.isValidSecret
}

export {RippleAPI}
