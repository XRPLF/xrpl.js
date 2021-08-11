import {EventEmitter} from 'events'
import {
  errors,
} from '../common'
import { Connection, ConnectionUserOptions } from './connection'
import {
  formatLedgerClose
} from '../client/utils'
// import {sign} from '../transaction/sign'
// import combine from '../transaction/combine'
// import submit from '../transaction/submit'
// import { generateAddress, generateXAddress } from '../offline/utils'
// import {deriveKeypair, deriveAddress, deriveXAddress} from '../offline/derive'
// import computeLedgerHash from '../offline/ledgerhash'
// import signPaymentChannelClaim from '../offline/sign-payment-channel-claim'
// import verifyPaymentChannelClaim from '../offline/verify-payment-channel-claim'
// import getLedger from '../ledger/ledger'

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
  // Subscribe methods/streams
  LedgerStream,
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
import {ensureClassicAddress} from '../common'
import {clamp} from '../ledger/utils'

export interface ClientOptions extends ConnectionUserOptions {
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
  // _feeCushion: number
  // _maxFeeXRP: string

  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  connection: Connection

  // // these are exposed only for use by unit tests; they are not part of the client.
  // static _PRIVATE = {
  //   validate,
  //   RangeSet,
  //   ledgerUtils,
  //   schemaValidator
  // }

  constructor(options: ClientOptions = {}) {
    super()
    // validate.apiOptions(options)
    // this._feeCushion = options.feeCushion || 1.2
    // this._maxFeeXRP = options.maxFeeXRP || '2'
    const serverURL = options.server
    if (serverURL != null) {
      this.connection = new Connection(serverURL, options)
      this.connection.on('ledgerClosed', (message: LedgerStream) => {
        this.emit('ledger', formatLedgerClose(message))
      })
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
    } else {
      // use null object pattern to provide better error message if user
      // tries to call a method that requires a connection
      this.connection = new Connection(null, options)
    }
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
}

export {
  Client,
  Connection
}
