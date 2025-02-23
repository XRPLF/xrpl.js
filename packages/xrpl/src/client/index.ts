/* eslint-disable jsdoc/require-jsdoc -- Request has many aliases, but they don't need unique docs */

/* eslint-disable max-lines -- Client is a large file w/ lots of imports/exports */
import { EventEmitter } from 'eventemitter3'

import {
  RippledError,
  NotFoundError,
  ValidationError,
  XrplError,
} from '../errors'
import {
  APIVersion,
  LedgerIndex,
  Balance,
  DEFAULT_API_VERSION,
} from '../models/common'
import {
  Request,
  // account methods
  AccountChannelsRequest,
  AccountChannelsResponse,
  AccountInfoRequest,
  AccountLinesRequest,
  AccountLinesResponse,
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountTxRequest,
  AccountTxResponse,
  // ledger methods
  LedgerDataRequest,
  LedgerDataResponse,
  TxResponse,
} from '../models/methods'
import type {
  RequestResponseMap,
  RequestAllResponseMap,
  MarkerRequest,
  MarkerResponse,
  SubmitResponse,
  SimulateRequest,
} from '../models/methods'
import type { BookOffer, BookOfferCurrency } from '../models/methods/bookOffers'
import {
  SimulateBinaryResponse,
  SimulateJsonResponse,
} from '../models/methods/simulate'
import type {
  EventTypes,
  OnEventToListenerMap,
} from '../models/methods/subscribe'
import type { SubmittableTransaction } from '../models/transactions'
import { convertTxFlagsToNumber } from '../models/utils/flags'
import {
  ensureClassicAddress,
  submitRequest,
  getSignedTx,
  getLastLedgerSequence,
  waitForFinalTransactionOutcome,
} from '../sugar'
import {
  setValidAddresses,
  setNextValidSequenceNumber,
  calculateFeePerTransactionType,
  setLatestValidatedLedgerSequence,
  checkAccountDeleteBlockers,
  txNeedsNetworkID,
} from '../sugar/autofill'
import { formatBalances } from '../sugar/balances'
import {
  validateOrderbookOptions,
  createBookOffersRequest,
  requestAllOffers,
  reverseRequest,
  extractOffers,
  combineOrders,
  separateBuySellOrders,
  sortAndLimitOffers,
} from '../sugar/getOrderbook'
import { dropsToXrp, hashes, isValidClassicAddress } from '../utils'
import { Wallet } from '../Wallet'
import {
  type FaucetRequestBody,
  FundingOptions,
  requestFunding,
} from '../Wallet/fundWallet'

import {
  Connection,
  ConnectionUserOptions,
  INTENTIONAL_DISCONNECT_CODE,
} from './connection'
import {
  handlePartialPayment,
  handleStreamPartialPayment,
} from './partialPayment'

export interface ClientOptions extends ConnectionUserOptions {
  /**
   * Multiplication factor to multiply estimated fee by to provide a cushion in case the
   * required fee rises during submission of a transaction. Defaults to 1.2.
   *
   * @category Fee
   */
  feeCushion?: number
  /**
   * Maximum transaction cost to allow, in decimal XRP. Must be a string-encoded
   * number. Defaults to '2'.
   *
   * @category Fee
   */
  maxFeeXRP?: string
  /**
   * Duration to wait for a request to timeout.
   */
  timeout?: number
}

// Make sure to update both this and `RequestNextPageReturnMap` at the same time
type RequestNextPageType =
  | AccountChannelsRequest
  | AccountLinesRequest
  | AccountObjectsRequest
  | AccountOffersRequest
  | AccountTxRequest
  | LedgerDataRequest

type RequestNextPageReturnMap<T> = T extends AccountChannelsRequest
  ? AccountChannelsResponse
  : T extends AccountLinesRequest
  ? AccountLinesResponse
  : T extends AccountObjectsRequest
  ? AccountObjectsResponse
  : T extends AccountOffersRequest
  ? AccountOffersResponse
  : T extends AccountTxRequest
  ? AccountTxResponse
  : T extends LedgerDataRequest
  ? LedgerDataResponse
  : never

/**
 * Get the response key / property name that contains the listed data for a
 * command. This varies from command to command, but we need to know it to
 * properly count across many requests.
 *
 * @param command - The rippled request command.
 * @returns The property key corresponding to the command.
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

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error('Illegal clamp bounds')
  }
  return Math.min(Math.max(value, min), max)
}

const DEFAULT_FEE_CUSHION = 1.2
const DEFAULT_MAX_FEE_XRP = '2'

const MIN_LIMIT = 10
const MAX_LIMIT = 400

const NORMAL_DISCONNECT_CODE = 1000

/**
 * Client for interacting with rippled servers.
 *
 * @category Clients
 */
class Client extends EventEmitter<EventTypes> {
  /*
   * Underlying connection to rippled.
   */
  public readonly connection: Connection

  /**
   * Factor to multiply estimated fee by to provide a cushion in case the
   * required fee rises during submission of a transaction. Defaults to 1.2.
   *
   * @category Fee
   */
  public readonly feeCushion: number

  /**
   * Maximum transaction cost to allow, in decimal XRP. Must be a string-encoded
   * number. Defaults to '2'.
   *
   * @category Fee
   */
  public readonly maxFeeXRP: string

  /**
   * Network ID of the server this client is connected to
   *
   */
  public networkID: number | undefined

  /**
   * Rippled Version used by the server this client is connected to
   *
   */
  public buildVersion: string | undefined

  /**
   * API Version used by the server this client is connected to
   *
   */
  public apiVersion: APIVersion = DEFAULT_API_VERSION

  /**
   * Creates a new Client with a websocket connection to a rippled server.
   *
   * @param server - URL of the server to connect to.
   * @param options - Options for client settings.
   * @category Constructor
   *
   * @example
   * ```ts
   * import { Client } from "xrpl"
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * ```
   */
  /* eslint-disable max-lines-per-function -- the constructor requires more lines to implement the logic */
  public constructor(server: string, options: ClientOptions = {}) {
    super()
    if (typeof server !== 'string' || !/wss?(?:\+unix)?:\/\//u.exec(server)) {
      throw new ValidationError(
        'server URI must start with `wss://`, `ws://`, `wss+unix://`, or `ws+unix://`.',
      )
    }

    this.feeCushion = options.feeCushion ?? DEFAULT_FEE_CUSHION
    this.maxFeeXRP = options.maxFeeXRP ?? DEFAULT_MAX_FEE_XRP

    this.connection = new Connection(server, options)

    this.connection.on('error', (errorCode, errorMessage, data) => {
      this.emit('error', errorCode, errorMessage, data)
    })

    this.connection.on('reconnect', () => {
      this.connection.on('connected', () => this.emit('connected'))
    })

    this.connection.on('disconnected', (code: number) => {
      let finalCode = code
      /*
       * 4000: Connection uses a 4000 code internally to indicate a manual disconnect/close
       * Since 4000 is a normal disconnect reason, we convert this to the standard exit code 1000
       */
      if (finalCode === INTENTIONAL_DISCONNECT_CODE) {
        finalCode = NORMAL_DISCONNECT_CODE
      }
      this.emit('disconnected', finalCode)
    })

    this.connection.on('ledgerClosed', (ledger) => {
      this.emit('ledgerClosed', ledger)
    })

    this.connection.on('transaction', (tx) => {
      // mutates `tx` to add warnings
      handleStreamPartialPayment(tx, this.connection.trace)
      this.emit('transaction', tx)
    })

    this.connection.on('validationReceived', (validation) => {
      this.emit('validationReceived', validation)
    })

    this.connection.on('manifestReceived', (manifest) => {
      this.emit('manifestReceived', manifest)
    })

    this.connection.on('peerStatusChange', (status) => {
      this.emit('peerStatusChange', status)
    })

    this.connection.on('consensusPhase', (consensus) => {
      this.emit('consensusPhase', consensus)
    })

    this.connection.on('path_find', (path) => {
      this.emit('path_find', path)
    })
  }
  /* eslint-enable max-lines-per-function */

  /**
   * Get the url that the client is connected to.
   *
   * @returns The URL of the server this client is connected to.
   * @category Network
   */
  public get url(): string {
    return this.connection.getUrl()
  }

  /**
   * Makes a request to the client with the given command and
   * additional request body parameters.
   *
   * @category Network
   * @param req - Request to send to the server.
   * @returns The response from the server.
   *
   * @example
   * ```ts
   * const response = await client.request({
   *   command: 'account_info',
   *   account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
   * })
   * console.log(response)
   * ```
   */
  public async request<
    R extends Request,
    V extends APIVersion = typeof DEFAULT_API_VERSION,
    T = RequestResponseMap<R, V>,
  >(req: R): Promise<T> {
    const request = {
      ...req,
      account:
        typeof req.account === 'string'
          ? ensureClassicAddress(req.account)
          : undefined,
      api_version: req.api_version ?? this.apiVersion,
    }
    const response = await this.connection.request<R, T>(request)

    // mutates `response` to add warnings
    handlePartialPayment(req.command, response)

    return response
  }

  /**
   * Requests the next page of data.
   *
   * @category Network
   *
   * @param req - Request to send.
   * @param resp - Response with the marker to use in the request.
   * @returns The response with the next page of data.
   *
   * @example
   * ```ts
   * const response = await client.request({
   *  command: 'account_tx',
   *  account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
   * })
   * console.log(response)
   * const nextResponse = await client.requestNextPage({
   *   command: 'account_tx',
   *   account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
   * },
   * response)
   * console.log(nextResponse)
   * ```
   */
  public async requestNextPage<
    T extends RequestNextPageType,
    U extends RequestNextPageReturnMap<T>,
  >(req: T, resp: U): Promise<RequestNextPageReturnMap<T>> {
    if (!resp.result.marker) {
      return Promise.reject(
        new NotFoundError('response does not have a next page'),
      )
    }
    const nextPageRequest = { ...req, marker: resp.result.marker }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Necessary for overloading
    return this.request(nextPageRequest) as unknown as U
  }

  /**
   * Event handler for subscription streams.
   *
   * @category Network
   *
   * @param eventName - Name of the event. Only forwards streams.
   * @param listener - Function to run on event.
   * @returns This, because it inherits from EventEmitter.
   *
   * * @example
   * ```ts
   * const api = new Client('wss://s.altnet.rippletest.net:51233')
   *
   * api.on('transaction', (tx: TransactionStream) => {
   *  console.log("Received Transaction")
   *  console.log(tx)
   * })
   *
   * await api.connect()
   * const response = await api.request({
   *     command: 'subscribe',
   *     streams: ['transactions_proposed']
   * })
   * ```
   */
  public on<
    T extends EventTypes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needs to be any for overload
    U extends (...args: any[]) => void = OnEventToListenerMap<T>,
  >(eventName: T, listener: U): this {
    return super.on(eventName, listener)
  }

  /**
   * Makes multiple paged requests to the client to return a given number of
   * resources. Multiple paged requests will be made until the `limit`
   * number of resources is reached (if no `limit` is provided, a single request
   * will be made).
   *
   * If the command is unknown, an additional `collect` property is required to
   * know which response key contains the array of resources.
   *
   * NOTE: This command is used by existing methods and is not recommended for
   * general use. Instead, use rippled's built-in pagination and make multiple
   * requests as needed.
   *
   * @category Network
   *
   * @param request - The initial request to send to the server.
   * @param collect - (Optional) the param to use to collect the array of resources (only needed if command is unknown).
   * @returns The array of all responses.
   * @throws ValidationError if there is no collection key (either from a known command or for the unknown command).
   *
   * @example
   * // Request all ledger data pages
   * const allResponses = await client.requestAll({ command: 'ledger_data' });
   * console.log(allResponses);
   *
   * @example
   * // Request all transaction data pages
   * const allResponses = await client.requestAll({ command: 'transaction_data' });
   * console.log(allResponses);
   */

  public async requestAll<
    T extends MarkerRequest,
    U = RequestAllResponseMap<T, APIVersion>,
  >(request: T, collect?: string): Promise<U[]> {
    /*
     * The data under collection is keyed based on the command. Fail if command
     * not recognized and collection key not provided.
     */
    const collectKey = collect ?? getCollectKeyFromCommand(request.command)
    if (!collectKey) {
      throw new ValidationError(`no collect key for command ${request.command}`)
    }
    /*
     * If limit is not provided, fetches all data over multiple requests.
     * NOTE: This may return much more than needed. Set limit when possible.
     */
    const countTo: number = request.limit == null ? Infinity : request.limit
    let count = 0
    let marker: unknown = request.marker
    const results: U[] = []
    do {
      const countRemaining = clamp(countTo - count, MIN_LIMIT, MAX_LIMIT)
      const repeatProps = {
        ...request,
        limit: countRemaining,
        marker,
      }
      // eslint-disable-next-line no-await-in-loop -- Necessary for this, it really has to wait
      const singleResponse = await this.connection.request(repeatProps)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Should be true
      const singleResult = (singleResponse as MarkerResponse<APIVersion>).result
      if (!(collectKey in singleResult)) {
        throw new XrplError(`${collectKey} not in result`)
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Should be true
      const collectedData = singleResult[collectKey]
      marker = singleResult.marker
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Should be true
      results.push(singleResponse as U)
      // Make sure we handle when no data (not even an empty array) is returned.
      if (Array.isArray(collectedData)) {
        count += collectedData.length
      }
    } while (Boolean(marker) && count < countTo)
    return results
  }

  /**
   * Get networkID and buildVersion from server_info
   *
   * @returns void
   * @example
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.getServerInfo()
   * console.log(client.networkID)
   * console.log(client.buildVersion)
   * ```
   */
  public async getServerInfo(): Promise<void> {
    try {
      const response = await this.request({
        command: 'server_info',
      })
      this.networkID = response.result.info.network_id ?? undefined
      this.buildVersion = response.result.info.build_version
    } catch (error) {
      // eslint-disable-next-line no-console -- Print the error to console but allows client to be connected.
      console.error(error)
    }
  }

  /**
   * Tells the Client instance to connect to its rippled server.
   *
   * @example
   *
   * Client.connect() establishes a connection between a Client object and the server.
   *
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * // do something with the client
   * await client.disconnect()
   * ```
   * If you open a client connection, be sure to close it with `await client.disconnect()`
   * before exiting your application.
   * @returns A promise that resolves with a void value when a connection is established.
   * @category Network
   *
   * @example
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * // do something with the client
   * await client.disconnect()
   * ```
   */
  public async connect(): Promise<void> {
    return this.connection.connect().then(async () => {
      await this.getServerInfo()
      this.emit('connected')
    })
  }

  /**
   * Disconnects the XRPL client from the server and cancels all pending requests and subscriptions. Call when
   * you want to disconnect the client from the server, such as when you're finished using the client or when you
   * need to switch to a different server.
   *
   * @example
   *
   * To use the disconnect() method, you first need to create a new Client object and connect it to a server:
   *
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * // do something with the client
   * await client.disconnect()
   * ```
   *
   * @returns A promise that resolves with a void value when a connection is destroyed.
   * @category Network
   */
  public async disconnect(): Promise<void> {
    /*
     * backwards compatibility: connection.disconnect() can return a number, but
     * this method returns nothing. SO we await but don't return any result.
     */
    await this.connection.disconnect()
  }

  /**
   * Checks if the Client instance is connected to its rippled server.
   *
   * @returns Whether the client instance is connected.
   * @category Network
   * @example
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * console.log(client.isConnected())
   * // true
   * await client.disconnect()
   * console.log(client.isConnected())
   * // false
   * ```
   */
  public isConnected(): boolean {
    return this.connection.isConnected()
  }

  /**
   * Autofills fields in a transaction. This will set `Sequence`, `Fee`,
   * `lastLedgerSequence` according to the current state of the server this Client
   * is connected to. It also converts all X-Addresses to classic addresses and
   * flags interfaces into numbers.
   *
   * @category Core
   *
   * @example
   *
   * ```ts
   * const { Client } = require('xrpl')
   *
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   *
   * async function createAndAutofillTransaction() {
   *   const transaction = {
   *     TransactionType: 'Payment',
   *     Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
   *     Destination: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
   *     Amount: '10000000' // 10 XRP in drops (1/1,000,000th of an XRP)
   *   }
   *
   *   try {
   *     const autofilledTransaction = await client.autofill(transaction)
   *     console.log(autofilledTransaction)
   *   } catch (error) {
   *     console.error(`Failed to autofill transaction: ${error}`)
   *   }
   * }
   *
   * createAndAutofillTransaction()
   * ```
   *
   * Autofill helps fill in fields which should be included in a transaction, but can be determined automatically
   * such as `LastLedgerSequence` and `Fee`. If you override one of the fields `autofill` changes, your explicit
   * values will be used instead. By default, this is done as part of `submit` and `submitAndWait` when you pass
   * in an unsigned transaction along with your wallet to be submitted.
   *
   * @template T
   * @param transaction - A {@link SubmittableTransaction} in JSON format
   * @param signersCount - The expected number of signers for this transaction.
   * Only used for multisigned transactions.
   * @returns The autofilled transaction.
   * @throws ValidationError If Amount and DeliverMax fields are not identical in a Payment Transaction
   */

  // eslint-disable-next-line complexity -- handling Payment transaction API v2 requires more logic
  public async autofill<T extends SubmittableTransaction>(
    transaction: T,
    signersCount?: number,
  ): Promise<T> {
    const tx = { ...transaction }

    setValidAddresses(tx)
    tx.Flags = convertTxFlagsToNumber(tx)

    const promises: Array<Promise<void>> = []
    if (tx.NetworkID == null) {
      tx.NetworkID = txNeedsNetworkID(this) ? this.networkID : undefined
    }
    if (tx.Sequence == null) {
      promises.push(setNextValidSequenceNumber(this, tx))
    }
    if (tx.Fee == null) {
      promises.push(calculateFeePerTransactionType(this, tx, signersCount))
    }
    if (tx.LastLedgerSequence == null) {
      promises.push(setLatestValidatedLedgerSequence(this, tx))
    }
    if (tx.TransactionType === 'AccountDelete') {
      promises.push(checkAccountDeleteBlockers(this, tx))
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore type-assertions on the DeliverMax property
    // @ts-expect-error -- DeliverMax property exists only at the RPC level, not at the protocol level
    if (tx.TransactionType === 'Payment' && tx.DeliverMax != null) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- This is a valid null check for Amount
      if (tx.Amount == null) {
        // If only DeliverMax is provided, use it to populate the Amount field
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore type-assertions on the DeliverMax property
        // @ts-expect-error -- DeliverMax property exists only at the RPC level, not at the protocol level
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- DeliverMax is a known RPC-level property
        tx.Amount = tx.DeliverMax
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore type-assertions on the DeliverMax property
      // @ts-expect-error -- DeliverMax property exists only at the RPC level, not at the protocol level
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- This is a valid null check for Amount
      if (tx.Amount != null && tx.Amount !== tx.DeliverMax) {
        return Promise.reject(
          new ValidationError(
            'PaymentTransaction: Amount and DeliverMax fields must be identical when both are provided',
          ),
        )
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore type-assertions on the DeliverMax property
      // @ts-expect-error -- DeliverMax property exists only at the RPC level, not at the protocol level
      delete tx.DeliverMax
    }

    return Promise.all(promises).then(() => tx)
  }

  /**
   * Submits a signed/unsigned transaction.
   * Steps performed on a transaction:
   *    1. Autofill.
   *    2. Sign & Encode.
   *    3. Submit.
   *
   * @category Core
   *
   * @param transaction - A transaction to autofill, sign & encode, and submit.
   * @param opts - (Optional) Options used to sign and submit a transaction.
   * @param opts.autofill - If true, autofill a transaction.
   * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
   * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
   *
   * @returns A promise that contains SubmitResponse.
   * @throws RippledError if submit request fails.
   *
   * @example
   * ```ts
   * const { Client, Wallet } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * const wallet = Wallet.generate()
   * const transaction = {
   *   TransactionType: 'Payment',
   *   Account: wallet.classicAddress,
   *   Destination: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
   *   Amount: '10000000' // 10 XRP in drops (1/1,000,000th of an XRP)
   * }
   * const submitResponse = await client.submit(transaction, { wallet })
   * console.log(submitResponse)
   * ```
   */
  public async submit(
    transaction: SubmittableTransaction | string,
    opts?: {
      // If true, autofill a transaction.
      autofill?: boolean
      // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
      failHard?: boolean
      // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
      wallet?: Wallet
    },
  ): Promise<SubmitResponse> {
    const signedTx = await getSignedTx(this, transaction, opts)
    return submitRequest(this, signedTx, opts?.failHard)
  }

  /**
   * Simulates an unsigned transaction.
   * Steps performed on a transaction:
   *    1. Autofill.
   *    2. Sign & Encode.
   *    3. Submit.
   *
   * @category Core
   *
   * @param transaction - A transaction to autofill, sign & encode, and submit.
   * @param opts - (Optional) Options used to sign and submit a transaction.
   * @param opts.binary - If true, return the metadata in a binary encoding.
   *
   * @returns A promise that contains SimulateResponse.
   * @throws RippledError if the simulate request fails.
   */

  public async simulate<Binary extends boolean = false>(
    transaction: SubmittableTransaction | string,
    opts?: {
      // If true, return the binary-encoded representation of the results.
      binary?: Binary
    },
  ): Promise<
    Binary extends true ? SimulateBinaryResponse : SimulateJsonResponse
  > {
    // send request
    const binary = opts?.binary ?? false
    const request: SimulateRequest =
      typeof transaction === 'string'
        ? { command: 'simulate', tx_blob: transaction, binary }
        : { command: 'simulate', tx_json: transaction, binary }
    return this.request(request)
  }

  /**
   * Asynchronously submits a transaction and verifies that it has been included in a
   * validated ledger (or has errored/will not be included for some reason).
   * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
   *
   * @category Core
   *
   * @example
   *
   * ```ts
   * const { Client, Wallet } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   *
   * async function submitTransaction() {
   *   const senderWallet = client.fundWallet()
   *   const recipientWallet = client.fundWallet()
   *
   *   const transaction = {
   *     TransactionType: 'Payment',
   *     Account: senderWallet.address,
   *     Destination: recipientWallet.address,
   *     Amount: '10'
   *   }
   *
   *   try {
   *     await client.submit(signedTransaction, { wallet: senderWallet })
   *     console.log(result)
   *   } catch (error) {
   *     console.error(`Failed to submit transaction: ${error}`)
   *   }
   * }
   *
   * submitTransaction()
   * ```
   *
   * In this example we submit a payment transaction between two newly created testnet accounts.
   *
   * Under the hood, `submit` will call `client.autofill` by default, and because we've passed in a `Wallet` it
   * Will also sign the transaction for us before submitting the signed transaction binary blob to the ledger.
   *
   * This is similar to `submitAndWait` which does all of the above, but also waits to see if the transaction has been validated.
   * @param transaction - A transaction to autofill, sign & encode, and submit.
   * @param opts - (Optional) Options used to sign and submit a transaction.
   * @param opts.autofill - If true, autofill a transaction.
   * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
   * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
   * @throws Connection errors: If the `Client` object is unable to establish a connection to the specified WebSocket endpoint,
   * an error will be thrown.
   * @throws Transaction errors: If the submitted transaction is invalid or cannot be included in a validated ledger for any
   * reason, the promise returned by `submitAndWait()` will be rejected with an error. This could include issues with insufficient
   * balance, invalid transaction fields, or other issues specific to the transaction being submitted.
   * @throws Ledger errors: If the ledger being used to submit the transaction is undergoing maintenance or otherwise unavailable,
   * an error will be thrown.
   * @throws Timeout errors: If the transaction takes longer than the specified timeout period to be included in a validated
   * ledger, the promise returned by `submitAndWait()` will be rejected with an error.
   * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
   */
  public async submitAndWait<
    T extends SubmittableTransaction = SubmittableTransaction,
  >(
    transaction: T | string,
    opts?: {
      // If true, autofill a transaction.
      autofill?: boolean
      // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
      failHard?: boolean
      // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
      wallet?: Wallet
    },
  ): Promise<TxResponse<T>> {
    const signedTx = await getSignedTx(this, transaction, opts)

    const lastLedger = getLastLedgerSequence(signedTx)
    if (lastLedger == null) {
      throw new ValidationError(
        'Transaction must contain a LastLedgerSequence value for reliable submission.',
      )
    }

    const response = await submitRequest(this, signedTx, opts?.failHard)

    const txHash = hashes.hashSignedTx(signedTx)
    return waitForFinalTransactionOutcome(
      this,
      txHash,
      lastLedger,
      response.result.engine_result,
    )
  }

  /**
   * Deprecated: Use autofill instead, provided for users familiar with v1
   *
   * @param transaction - A {@link Transaction} in JSON format
   * @param signersCount - The expected number of signers for this transaction.
   * Only used for multisigned transactions.
   * @deprecated Use autofill instead, provided for users familiar with v1
   */
  public async prepareTransaction(
    transaction: SubmittableTransaction,
    signersCount?: number,
  ): ReturnType<Client['autofill']> {
    return this.autofill(transaction, signersCount)
  }

  /**
   * Retrieves the XRP balance of a given account address.
   *
   * @category Abstraction
   *
   * @example
   * ```ts
   * const client = new Client(wss://s.altnet.rippletest.net:51233)
   * await client.connect()
   * const balance = await client.getXrpBalance('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn')
   * console.log(balance)
   * await client.disconnect()
   * /// '200'
   * ```
   *
   * @param address - The XRP address to retrieve the balance for.
   * @param [options] - Additional options for fetching the balance (optional).
   * @param [options.ledger_hash] - The hash of the ledger to retrieve the balance from (optional).
   * @param [options.ledger_index] - The index of the ledger to retrieve the balance from (optional).
   * @returns A promise that resolves with the XRP balance as a number.
   */
  public async getXrpBalance(
    address: string,
    options: {
      ledger_hash?: string
      ledger_index?: LedgerIndex
    } = {},
  ): Promise<number> {
    const xrpRequest: AccountInfoRequest = {
      command: 'account_info',
      account: address,
      ledger_index: options.ledger_index ?? 'validated',
      ledger_hash: options.ledger_hash,
    }
    const response = await this.request(xrpRequest)
    return dropsToXrp(response.result.account_data.Balance)
  }

  /**
   * Get XRP/non-XRP balances for an account.
   *
   * @category Abstraction
   *
   * @example
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   *
   * async function getAccountBalances(address) {
   *   try {
   *     const options = {
   *       ledger_index: 'validated',
   *       limit: 10
   *     };
   *
   *     const balances = await xrplClient.getBalances(address, options);
   *
   *     console.log('Account Balances:');
   *     balances.forEach((balance) => {
   *       console.log(`Currency: ${balance.currency}`);
   *       console.log(`Value: ${balance.value}`);
   *       console.log(`Issuer: ${balance.issuer}`);
   *       console.log('---');
   *     });
   *   } catch (error) {
   *     console.error('Error retrieving account balances:', error);
   *   }
   * }
   *
   * const address = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
   * await getAccountBalances(address);
   * await client.disconnect();
   * ```
   *
   * @param address - Address of the account to retrieve balances for.
   * @param options - Allows the client to specify a ledger_hash, ledger_index,
   * filter by peer, and/or limit number of balances.
   * @param options.ledger_index - Retrieve the account balances at a given
   * ledger_index.
   * @param options.ledger_hash - Retrieve the account balances at the ledger with
   * a given ledger_hash.
   * @param options.peer - Filter balances by peer.
   * @param options.limit - Limit number of balances to return.
   * @returns An array of XRP/non-XRP balances for the given account.
   */
  /* eslint-disable max-lines-per-function -- getBalances requires more lines to implement logic */
  public async getBalances(
    address: string,
    options: {
      ledger_hash?: string
      ledger_index?: LedgerIndex
      peer?: string
      limit?: number
    } = {},
  ): Promise<
    Array<{ value: string; currency: string; issuer?: string | undefined }>
  > {
    const balances: Balance[] = []

    // get XRP balance
    let xrpPromise: Promise<number> = Promise.resolve(0)
    if (!options.peer) {
      xrpPromise = this.getXrpBalance(address, {
        ledger_hash: options.ledger_hash,
        ledger_index: options.ledger_index,
      })
    }

    // get non-XRP balances
    const linesRequest: AccountLinesRequest = {
      command: 'account_lines',
      account: address,
      ledger_index: options.ledger_index ?? 'validated',
      ledger_hash: options.ledger_hash,
      peer: options.peer,
      limit: options.limit,
    }
    const linesPromise = this.requestAll(linesRequest)

    // combine results
    await Promise.all([xrpPromise, linesPromise]).then(
      ([xrpBalance, linesResponses]) => {
        const accountLinesBalance = linesResponses.flatMap((response) =>
          formatBalances(response.result.lines),
        )
        if (xrpBalance !== 0) {
          balances.push({ currency: 'XRP', value: xrpBalance.toString() })
        }
        balances.push(...accountLinesBalance)
      },
    )
    return balances.slice(0, options.limit)
  }
  /* eslint-enable max-lines-per-function */

  /**
   * Fetch orderbook (buy/sell orders) between two currency pairs. This checks both sides of the orderbook
   * by making two `order_book` requests (with the second reversing takerPays and takerGets). Returned offers are
   * not normalized in this function, so either currency could be takerGets or takerPays.
   *
   * @category Abstraction
   *
   * @param currency1 - Specification of one currency involved. (With a currency code and optionally an issuer)
   * @param currency2 - Specification of a second currency involved. (With a currency code and optionally an issuer)
   * @param options - Options allowing the client to specify ledger_index,
   * ledger_hash, filter by taker, and/or limit number of orders.
   * @param options.ledger_index - Retrieve the orderbook at a given ledger_index.
   * @param options.ledger_hash - Retrieve the orderbook at the ledger with a
   * given ledger_hash.
   * @param options.taker - Filter orders by taker.
   * @param options.limit - The limit passed into each book_offers request.
   * Can return more than this due to two calls being made. Defaults to 20.
   * @returns An object containing buy and sell objects.
   */

  public async getOrderbook(
    currency1: BookOfferCurrency,
    currency2: BookOfferCurrency,
    options: {
      limit?: number
      ledger_index?: LedgerIndex
      ledger_hash?: string | null
      taker?: string | null
    } = {},
  ): Promise<{
    buy: BookOffer[]
    sell: BookOffer[]
  }> {
    validateOrderbookOptions(options)

    const request = createBookOffersRequest(currency1, currency2, options)

    const directOfferResults = await requestAllOffers(this, request)
    const reverseOfferResults = await requestAllOffers(
      this,
      reverseRequest(request),
    )

    const directOffers = extractOffers(directOfferResults)
    const reverseOffers = extractOffers(reverseOfferResults)

    const orders = combineOrders(directOffers, reverseOffers)

    const { buy, sell } = separateBuySellOrders(orders)

    /*
     * Sort the orders
     * for both buys and sells, lowest quality is closest to mid-market
     * we sort the orders so that earlier orders are closer to mid-market
     */
    return {
      buy: sortAndLimitOffers(buy, options.limit),
      sell: sortAndLimitOffers(sell, options.limit),
    }
  }

  /**
   * Returns the index of the most recently validated ledger.
   *
   * @category Abstraction
   *
   * @returns The most recently validated ledger index.
   *
   * @example
   * ```ts
   * const { Client } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * const ledgerIndex = await client.getLedgerIndex()
   * console.log(ledgerIndex)
   * // 884039
   * ```
   */
  public async getLedgerIndex(): Promise<number> {
    const ledgerResponse = await this.request({
      command: 'ledger',
      ledger_index: 'validated',
    })
    return ledgerResponse.result.ledger_index
  }

  /**
   * The fundWallet() method is used to send an amount of XRP (usually 1000) to a new (randomly generated)
   * or existing XRP Ledger wallet.
   *
   * @category Faucet
   *
   * @example
   *
   * Example 1: Fund a randomly generated wallet
   * const { Client, Wallet } = require('xrpl')
   *
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   * await client.connect()
   * const { balance, wallet } = await client.fundWallet()
   *
   * Under the hood, this will use `Wallet.generate()` to create a new random wallet, then ask a testnet faucet
   * To send it XRP on ledger to make it a real account. If successful, this will return the new account balance in XRP
   * Along with the Wallet object to track the keys for that account. If you'd like, you can also re-fill an existing
   * Account by passing in a Wallet you already have.
   * ```ts
   * const api = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
   * await api.connect()
   * const { wallet, balance } = await api.fundWallet()
   * ```
   *
   * Example 2: Fund wallet using a custom faucet host and known wallet address
   *
   * `fundWallet` will try to infer the url of a faucet API from the network your client is connected to.
   * There are hardcoded default faucets for popular test networks like testnet and devnet.
   * However, if you're working with a newer or more obscure network, you may have to specify the faucetHost
   * And faucetPath so `fundWallet` can ask that faucet to fund your wallet.
   *
   * ```ts
   * const newWallet = Wallet.generate()
   * const { balance, wallet  } = await client.fundWallet(newWallet, {
   *       amount: '10',
   *       faucetHost: 'https://custom-faucet.example.com',
   *       faucetPath: '/accounts'
   *     })
   *     console.log(`Sent 10 XRP to wallet: ${address} from the given faucet. Resulting balance: ${balance} XRP`)
   *   } catch (error) {
   *     console.error(`Failed to fund wallet: ${error}`)
   *   }
   * }
   * ```
   *
   * @param wallet - An existing XRPL Wallet to fund. If undefined or null, a new Wallet will be created.
   * @param options - See below.
   * @param options.faucetHost - A custom host for a faucet server. On devnet,
   * testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
   * attempt to determine the correct server automatically. In other environments,
   * or if you would like to customize the faucet host in devnet or testnet,
   * you should provide the host using this option.
   * @param options.faucetPath - A custom path for a faucet server. On devnet,
   * testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
   * attempt to determine the correct path automatically. In other environments,
   * or if you would like to customize the faucet path in devnet or testnet,
   * you should provide the path using this option.
   * Ex: client.fundWallet(null,{'faucet.altnet.rippletest.net', '/accounts'})
   * specifies a request to 'faucet.altnet.rippletest.net/accounts' to fund a new wallet.
   * @param options.amount - A custom amount to fund, if undefined or null, the default amount will be 1000.
   * @returns A Wallet on the Testnet or Devnet that contains some amount of XRP,
   * and that wallet's balance in XRP.
   * @throws When either Client isn't connected or unable to fund wallet address.
   */
  public async fundWallet(
    this: Client,
    wallet?: Wallet | null,
    options: FundingOptions = {},
  ): Promise<{
    wallet: Wallet
    balance: number
  }> {
    if (!this.isConnected()) {
      throw new RippledError('Client not connected, cannot call faucet')
    }
    const existingWallet = Boolean(wallet)

    // Generate a new Wallet if no existing Wallet is provided or its address is invalid to fund
    const walletToFund =
      wallet && isValidClassicAddress(wallet.classicAddress)
        ? wallet
        : Wallet.generate()

    // Create the POST request body
    const postBody: FaucetRequestBody = {
      destination: walletToFund.classicAddress,
      xrpAmount: options.amount,
      usageContext: options.usageContext,
      userAgent: 'xrpl.js',
    }

    let startingBalance = 0
    if (existingWallet) {
      try {
        startingBalance = Number(
          await this.getXrpBalance(walletToFund.classicAddress),
        )
      } catch {
        /* startingBalance remains what it was previously */
      }
    }

    return requestFunding(
      options,
      this,
      startingBalance,
      walletToFund,
      postBody,
    )
  }
}

export { Client }
