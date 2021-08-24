import {EventEmitter} from 'events'
import {
  constants,
  errors,
  validate,
  xrpToDrops,
  dropsToXrp,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  txFlags
} from '../common'
import { Connection, ConnectionUserOptions } from './connection'
import getTrustlines from '../ledger/trustlines'
import getBalances from '../ledger/balances'
import getPaths from '../ledger/pathfind'
import {getOrderbook, formatBidsAndAsks} from '../ledger/orderbook'
import preparePayment from '../transaction/payment'
import prepareTrustline from '../transaction/trustline'
import prepareOrder from '../transaction/order'
import prepareOrderCancellation from '../transaction/ordercancellation'
import prepareEscrowCreation from '../transaction/escrow-creation'
import prepareEscrowExecution from '../transaction/escrow-execution'
import prepareEscrowCancellation from '../transaction/escrow-cancellation'
import preparePaymentChannelCreate from '../transaction/payment-channel-create'
import preparePaymentChannelFund from '../transaction/payment-channel-fund'
import preparePaymentChannelClaim from '../transaction/payment-channel-claim'
import prepareCheckCreate from '../transaction/check-create'
import prepareCheckCancel from '../transaction/check-cancel'
import prepareCheckCash from '../transaction/check-cash'
import prepareSettings from '../transaction/settings'
import prepareTicketCreate from '../transaction/ticket'
import {sign} from '../transaction/sign'
import combine from '../transaction/combine'
import { generateAddress, generateXAddress } from '../offline/utils'
import {deriveKeypair, deriveAddress, deriveXAddress} from '../offline/derive'
import computeLedgerHash from '../offline/ledgerhash'
import signPaymentChannelClaim from '../offline/sign-payment-channel-claim'
import verifyPaymentChannelClaim from '../offline/verify-payment-channel-claim'
import {
  Request,
  Response,
  // account methods
  AccountChannelsRequest,
  AccountChannelsResponse,
  AccountCurrenciesRequest,
  AccountCurrenciesResponse,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountLinesRequest,
  AccountLinesResponse,
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountTxRequest,
  AccountTxResponse,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
  NoRippleCheckRequest,
  NoRippleCheckResponse,
  // ledger methods
  LedgerRequest,
  LedgerResponse,
  LedgerClosedRequest,
  LedgerClosedResponse,
  LedgerCurrentRequest,
  LedgerCurrentResponse,
  LedgerDataRequest,
  LedgerDataResponse,
  LedgerEntryRequest,
  LedgerEntryResponse,
  // transaction methods
  SubmitRequest,
  SubmitResponse,
  SubmitMultisignedRequest,
  SubmitMultisignedResponse,
  TransactionEntryRequest,
  TransactionEntryResponse,
  TxRequest,
  TxResponse,
  // path and order book methods
  BookOffersRequest,
  BookOffersResponse,
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
  PathFindRequest,
  PathFindResponse,
  RipplePathFindRequest,
  RipplePathFindResponse,
  // payment channel methods
  ChannelVerifyRequest,
  ChannelVerifyResponse,
  // server info methods
  FeeRequest,
  FeeResponse,
  ManifestRequest,
  ManifestResponse,
  ServerInfoRequest,
  ServerInfoResponse,
  ServerStateRequest,
  ServerStateResponse,
  // utility methods
  PingRequest,
  PingResponse,
  RandomRequest,
  RandomResponse
} from '../models/methods'

import RangeSet from './rangeset'
import * as ledgerUtils from '../ledger/utils'
import * as transactionUtils from '../transaction/utils'
import * as schemaValidator from '../common/schema-validator'
import {getFee} from '../common/fee'
import {ensureClassicAddress} from '../common'
import {clamp} from '../ledger/utils'
import {TransactionJSON, Instructions, Prepare} from '../transaction/types'
import {
  classicAddressToXAddress,
  xAddressToClassicAddress,
  isValidXAddress,
  isValidClassicAddress,
  encodeSeed,
  decodeSeed,
  encodeAccountID,
  decodeAccountID,
  encodeNodePublic,
  decodeNodePublic,
  encodeAccountPublic,
  decodeAccountPublic,
  encodeXAddress,
  decodeXAddress
} from 'ripple-address-codec'
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
} from '../common/hashes'
import generateFaucetWallet from '../wallet/wallet-generation'
import { ValidationError } from '../common/errors'

export interface ClientOptions extends ConnectionUserOptions {
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
function getCollectKeyFromCommand(command: string): string | null {
  switch (command) {
    case 'account_channels':
      return 'channels'
    case 'account_lines':
      return 'lines'
    case 'account_objects':
      return 'account_objects'
    case 'account_tx':
      return 'transactions'
    case 'account_offers':
    case 'book_offers':
      return 'offers'
    case 'ledger_data':
      return 'state'
    default:
      return null
  }
}

type MarkerRequest = AccountChannelsRequest 
                   | AccountLinesRequest 
                   | AccountObjectsRequest 
                   | AccountOffersRequest
                   | AccountTxRequest
                   | LedgerDataRequest

type MarkerResponse = AccountChannelsResponse 
                    | AccountLinesResponse 
                    | AccountObjectsResponse 
                    | AccountOffersResponse
                    | AccountTxResponse
                    | LedgerDataResponse

class Client extends EventEmitter {
  _feeCushion: number
  _maxFeeXRP: string

  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  connection: Connection

  // these are exposed only for use by unit tests; they are not part of the client.
  static _PRIVATE = {
    validate,
    RangeSet,
    ledgerUtils,
    schemaValidator
  }

  constructor(server: string, options: ClientOptions = {}) {
    super()
    if (typeof server !== 'string' || !server.match("^(wss?|wss?\\+unix)://")) {
      throw new ValidationError("server URI must start with `wss://`, `ws://`, `wss+unix://`, or `ws+unix://`.")
    }

    this._feeCushion = options.feeCushion || 1.2
    this._maxFeeXRP = options.maxFeeXRP || '2'

    this.connection = new Connection(server, options)

    this.connection.on('error', (errorCode, errorMessage, data) => {
      this.emit('error', errorCode, errorMessage, data)
    })

    this.connection.on('connected', () => {
      this.emit('connected')
    })
    
    this.connection.on('disconnected', (code) => {
      let finalCode = code
      // 4000: Connection uses a 4000 code internally to indicate a manual disconnect/close
      // Since 4000 is a normal disconnect reason, we convert this to the standard exit code 1000
      if (finalCode === 4000) {
        finalCode = 1000
      }
      this.emit('disconnected', finalCode)
    })
  }

  /**
   * Makes a request to the client with the given command and
   * additional request body parameters.
   */
  public request(r: AccountChannelsRequest): Promise<AccountChannelsResponse>
  public request(r: AccountCurrenciesRequest): Promise<AccountCurrenciesResponse>
  public request(r: AccountInfoRequest): Promise<AccountInfoResponse>
  public request(r: AccountLinesRequest): Promise<AccountLinesResponse>
  public request(r: AccountObjectsRequest): Promise<AccountObjectsResponse>
  public request(r: AccountOffersRequest): Promise<AccountOffersResponse>
  public request(r: AccountTxRequest): Promise<AccountTxResponse>
  public request(r: BookOffersRequest): Promise<BookOffersResponse>
  public request(r: ChannelVerifyRequest): Promise<ChannelVerifyResponse>
  public request(r: DepositAuthorizedRequest): Promise<DepositAuthorizedResponse>
  public request(r: FeeRequest): Promise<FeeResponse>
  public request(r: GatewayBalancesRequest): Promise<GatewayBalancesResponse>
  public request(r: LedgerRequest): Promise<LedgerResponse>
  public request(r: LedgerClosedRequest): Promise<LedgerClosedResponse>
  public request(r: LedgerCurrentRequest): Promise<LedgerCurrentResponse>
  public request(r: LedgerDataRequest): Promise<LedgerDataResponse>
  public request(r: LedgerEntryRequest): Promise<LedgerEntryResponse>
  public request(r: ManifestRequest): Promise<ManifestResponse>
  public request(r: NoRippleCheckRequest): Promise<NoRippleCheckResponse>
  public request(r: PathFindRequest): Promise<PathFindResponse>
  public request(r: PingRequest): Promise<PingResponse>
  public request(r: RandomRequest): Promise<RandomResponse>
  public request(r: RipplePathFindRequest): Promise<RipplePathFindResponse>
  public request(r: ServerInfoRequest): Promise<ServerInfoResponse>
  public request(r: ServerStateRequest): Promise<ServerStateResponse>
  public request(r: SubmitRequest): Promise<SubmitResponse>
  public request(r: SubmitMultisignedRequest): Promise<SubmitMultisignedResponse>
  public request(r: TransactionEntryRequest): Promise<TransactionEntryResponse>
  public request(r: TxRequest): Promise<TxResponse>
  public request<R extends Request, T extends Response>(r: R): Promise<T> {
    // TODO: should this be typed with `extends BaseRequest/BaseResponse`?
    return this.connection.request({
      ...r,
      // @ts-ignore
      account: r.account ? ensureClassicAddress(r.account) : undefined,
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
  hasNextPage(response: MarkerResponse): boolean {
    return !!response.result.marker
  }

  async requestNextPage(req: AccountChannelsRequest, resp: AccountChannelsResponse): Promise<AccountChannelsResponse>
  async requestNextPage(req: AccountLinesRequest, resp: AccountLinesResponse): Promise<AccountLinesResponse>
  async requestNextPage(req: AccountObjectsRequest, resp: AccountObjectsResponse): Promise<AccountObjectsResponse>
  async requestNextPage(req: AccountOffersRequest, resp: AccountOffersResponse): Promise<AccountOffersResponse>
  async requestNextPage(req: AccountTxRequest, resp: AccountTxResponse): Promise<AccountTxResponse>
  async requestNextPage(req: LedgerDataRequest, resp: LedgerDataResponse): Promise<LedgerDataResponse>
  async requestNextPage<T extends MarkerRequest, U extends MarkerResponse>(req: T, resp: U): Promise<U> {
    if (!resp.result.marker) {
      return Promise.reject(
        new errors.NotFoundError('response does not have a next page')
      )
    }
    const nextPageRequest = {...req, marker: resp.result.marker}
    return this.connection.request(nextPageRequest)
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
   * Makes multiple paged requests to the client to return a given number of
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
  async _requestAll(req: AccountChannelsRequest): Promise<AccountChannelsResponse[]>
  async _requestAll(req: AccountLinesRequest): Promise<AccountLinesResponse[]>
  async _requestAll(req: AccountObjectsRequest): Promise<AccountObjectsResponse[]>
  async _requestAll(req: AccountOffersRequest): Promise<AccountOffersResponse[]>
  async _requestAll(req: AccountTxRequest): Promise<AccountTxResponse[]>
  async _requestAll(req: BookOffersRequest): Promise<BookOffersResponse[]>
  async _requestAll(req: LedgerDataRequest): Promise<LedgerDataResponse[]>
  async _requestAll<T extends MarkerRequest, U extends MarkerResponse>(request: T, options: {collect?: string} = {}): Promise<U[]> {
    // The data under collection is keyed based on the command. Fail if command
    // not recognized and collection key not provided.
    const collectKey = options.collect || getCollectKeyFromCommand(request.command)
    if (!collectKey) {
      throw new errors.ValidationError(`no collect key for command ${request.command}`)
    }
    // If limit is not provided, fetches all data over multiple requests.
    // NOTE: This may return much more than needed. Set limit when possible.
    const countTo: number = request.limit != null ? request.limit : Infinity
    let count: number = 0
    let marker: string = request.marker
    let lastBatchLength: number
    const results = []
    do {
      const countRemaining = clamp(countTo - count, 10, 400)
      const repeatProps = {
        ...request,
        limit: countRemaining,
        marker
      }
      const singleResponse = await this.connection.request(repeatProps)
      const singleResult = singleResponse.result
      const collectedData = singleResult[collectKey]
      marker = singleResult['marker']
      results.push(singleResponse)
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

  // @deprecated Use X-addresses instead & Invoke from top-level package instead
  generateAddress = generateAddress
  generateXAddress = generateXAddress // @deprecated Invoke from top-level package instead

  isConnected(): boolean {
    return this.connection.isConnected()
  }
  
  async connect(): Promise<void> {
    return this.connection.connect()
  }
  
  async disconnect(): Promise<void> {
    // backwards compatibility: connection.disconnect() can return a number, but
    // this method returns nothing. SO we await but don't return any result.
    await this.connection.disconnect()
  }

  getFee = getFee

  getTrustlines = getTrustlines
  getBalances = getBalances
  getPaths = getPaths
  getOrderbook = getOrderbook

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
  prepareTicketCreate = prepareTicketCreate
  prepareSettings = prepareSettings
  sign = sign
  combine = combine

  deriveKeypair = deriveKeypair // @deprecated Invoke from top-level package instead
  deriveAddress = deriveAddress // @deprecated Invoke from top-level package instead
  computeLedgerHash = computeLedgerHash // @deprecated Invoke from top-level package instead
  signPaymentChannelClaim = signPaymentChannelClaim // @deprecated Invoke from top-level package instead
  verifyPaymentChannelClaim = verifyPaymentChannelClaim // @deprecated Invoke from top-level package instead

  generateFaucetWallet = generateFaucetWallet

  errors = errors

  static deriveXAddress = deriveXAddress

  // Client.deriveClassicAddress (static) is a new name for client.deriveAddress
  static deriveClassicAddress = deriveAddress

  static formatBidsAndAsks = formatBidsAndAsks

  /**
   * Static methods to expose ripple-address-codec methods
   */
  static classicAddressToXAddress = classicAddressToXAddress
  static xAddressToClassicAddress = xAddressToClassicAddress
  static isValidXAddress = isValidXAddress
  static isValidClassicAddress = isValidClassicAddress
  static encodeSeed = encodeSeed
  static decodeSeed = decodeSeed
  static encodeAccountID = encodeAccountID
  static decodeAccountID = decodeAccountID
  static encodeNodePublic = encodeNodePublic
  static decodeNodePublic = decodeNodePublic
  static encodeAccountPublic = encodeAccountPublic
  static decodeAccountPublic = decodeAccountPublic
  static encodeXAddress = encodeXAddress
  static decodeXAddress = decodeXAddress

  /**
   * Static methods that replace functionality from the now-deprecated ripple-hashes library
   */
  // Compute the hash of a binary transaction blob.
  // @deprecated Invoke from top-level package instead
  static computeBinaryTransactionHash = computeBinaryTransactionHash // (txBlobHex: string): string
  // Compute the hash of a transaction in txJSON format.
  // @deprecated Invoke from top-level package instead
  static computeTransactionHash = computeTransactionHash // (txJSON: any): string
  // @deprecated Invoke from top-level package instead
  static computeBinaryTransactionSigningHash =
    computeBinaryTransactionSigningHash // (txBlobHex: string): string
  // Compute the hash of an account, given the account's classic address (starting with `r`).
  // @deprecated Invoke from top-level package instead
  static computeAccountLedgerObjectID = computeAccountLedgerObjectID // (address: string): string
  // Compute the hash (ID) of an account's SignerList.
  // @deprecated Invoke from top-level package instead
  static computeSignerListLedgerObjectID = computeSignerListLedgerObjectID // (address: string): string
  // Compute the hash of an order, given the owner's classic address (starting with `r`) and the account sequence number of the `OfferCreate` order transaction.
  // @deprecated Invoke from top-level package instead
  static computeOrderID = computeOrderID // (address: string, sequence: number): string
  // Compute the hash of a trustline, given the two parties' classic addresses (starting with `r`) and the currency code.
  // @deprecated Invoke from top-level package instead
  static computeTrustlineHash = computeTrustlineHash // (address1: string, address2: string, currency: string): string
  // @deprecated Invoke from top-level package instead
  static computeTransactionTreeHash = computeTransactionTreeHash // (transactions: any[]): string
  // @deprecated Invoke from top-level package instead
  static computeStateTreeHash = computeStateTreeHash // (entries: any[]): string
  // Compute the hash of a ledger.
  // @deprecated Invoke from top-level package instead
  static computeLedgerHash = computeLedgerHash // (ledgerHeader): string
  // Compute the hash of an escrow, given the owner's classic address (starting with `r`) and the account sequence number of the `EscrowCreate` escrow transaction.
  // @deprecated Invoke from top-level package instead
  static computeEscrowHash = computeEscrowHash // (address, sequence): string
  // Compute the hash of a payment channel, given the owner's classic address (starting with `r`), the classic address of the destination, and the account sequence number of the `PaymentChannelCreate` payment channel transaction.
  // @deprecated Invoke from top-level package instead
  static computePaymentChannelHash = computePaymentChannelHash // (address, dstAddress, sequence): string

  xrpToDrops = xrpToDrops // @deprecated Invoke from top-level package instead
  dropsToXrp = dropsToXrp // @deprecated Invoke from top-level package instead
  rippleTimeToISO8601 = rippleTimeToISO8601 // @deprecated Invoke from top-level package instead
  iso8601ToRippleTime = iso8601ToRippleTime // @deprecated Invoke from top-level package instead
  txFlags = txFlags
  static txFlags = txFlags
  accountSetFlags = constants.AccountSetFlags
  static accountSetFlags = constants.AccountSetFlags

  isValidAddress = schemaValidator.isValidAddress
  isValidSecret = schemaValidator.isValidSecret
}

export {
  Client,
  Connection
}
