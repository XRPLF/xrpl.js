/* eslint-disable import/max-dependencies -- Client needs a lot of dependencies by definition */
/* eslint-disable @typescript-eslint/member-ordering -- TODO: remove when instance methods aren't members */
/* eslint-disable max-lines -- This might not be necessary later, but this file needs to be big right now */
import { EventEmitter } from "events";

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
  decodeXAddress,
} from "ripple-address-codec";

import { constants, errors, txFlags, ensureClassicAddress } from "../common";
import { RippledError, ValidationError } from "../common/errors";
import { getFee } from "../common/fee";
import getBalances from "../ledger/balances";
import { getOrderbook, formatBidsAndAsks } from "../ledger/orderbook";
import getPaths from "../ledger/pathfind";
import getTrustlines from "../ledger/trustlines";
import { clamp } from "../ledger/utils";
import {
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
  RandomResponse,
} from "../models/methods";
import { BaseRequest, BaseResponse } from "../models/methods/baseMethod";
import prepareCheckCancel from "../transaction/check-cancel";
import prepareCheckCash from "../transaction/check-cash";
import prepareCheckCreate from "../transaction/check-create";
import combine from "../transaction/combine";
import prepareEscrowCancellation from "../transaction/escrow-cancellation";
import prepareEscrowCreation from "../transaction/escrow-creation";
import prepareEscrowExecution from "../transaction/escrow-execution";
import prepareOrder from "../transaction/order";
import prepareOrderCancellation from "../transaction/ordercancellation";
import preparePayment from "../transaction/payment";
import preparePaymentChannelClaim from "../transaction/payment-channel-claim";
import preparePaymentChannelCreate from "../transaction/payment-channel-create";
import preparePaymentChannelFund from "../transaction/payment-channel-fund";
import prepareSettings from "../transaction/settings";
import { sign } from "../transaction/sign";
import prepareTicketCreate from "../transaction/ticket";
import prepareTrustline from "../transaction/trustline";
import { TransactionJSON, Instructions, Prepare } from "../transaction/types";
import * as transactionUtils from "../transaction/utils";
import { deriveAddress, deriveXAddress } from "../utils/derive";
import generateFaucetWallet from "../wallet/generateFaucetWallet";

import {
  Connection,
  ConnectionUserOptions,
  INTENTIONAL_DISCONNECT_CODE,
} from "./connection";

export interface ClientOptions extends ConnectionUserOptions {
  feeCushion?: number;
  maxFeeXRP?: string;
  proxy?: string;
  timeout?: number;
}

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
    case "account_channels":
      return "channels";
    case "account_lines":
      return "lines";
    case "account_objects":
      return "account_objects";
    case "account_tx":
      return "transactions";
    case "account_offers":
    case "book_offers":
      return "offers";
    case "ledger_data":
      return "state";
    default:
      return null;
  }
}

interface MarkerRequest extends BaseRequest {
  limit?: number;
  marker?: unknown;
}

interface MarkerResponse extends BaseResponse {
  result: {
    marker?: unknown;
  };
}

const DEFAULT_FEE_CUSHION = 1.2;
const DEFAULT_MAX_FEE_XRP = "2";

const MIN_LIMIT = 10;
const MAX_LIMIT = 400;

class Client extends EventEmitter {
  // New in > 0.21.0
  // non-validated ledger versions are allowed, and passed to rippled as-is.
  public readonly connection: Connection;

  // Factor to multiply estimated fee by to provide a cushion in case the
  // required fee rises during submission of a transaction. Defaults to 1.2.
  public readonly feeCushion: number;
  // Maximum fee to use with transactions, in XRP. Must be a string-encoded
  // number. Defaults to '2'.
  public readonly maxFeeXRP: string;

  /**
   * Creates a new Client with a websocket connection to a rippled server.
   *
   * @param server - URL of the server to connect to.
   * @param options - Options for client settings.
   */
  public constructor(server: string, options: ClientOptions = {}) {
    super();
    if (typeof server !== "string" || !/wss?(?:\+unix)?:\/\//u.exec(server)) {
      throw new ValidationError(
        "server URI must start with `wss://`, `ws://`, `wss+unix://`, or `ws+unix://`."
      );
    }

    this.feeCushion = options.feeCushion ?? DEFAULT_FEE_CUSHION;
    this.maxFeeXRP = options.maxFeeXRP ?? DEFAULT_MAX_FEE_XRP;

    this.connection = new Connection(server, options);

    this.connection.on("error", (errorCode, errorMessage, data) => {
      this.emit("error", errorCode, errorMessage, data);
    });

    this.connection.on("connected", () => {
      this.emit("connected");
    });

    this.connection.on("disconnected", (code: number) => {
      let finalCode = code;
      // 4000: Connection uses a 4000 code internally to indicate a manual disconnect/close
      // Since 4000 is a normal disconnect reason, we convert this to the standard exit code 1000
      if (finalCode === INTENTIONAL_DISCONNECT_CODE) {
        finalCode = 1000;
      }
      this.emit("disconnected", finalCode);
    });
  }

  /**
   * Returns true if there are more pages of data.
   *
   * When there are more results than contained in the response, the response
   * includes a `marker` field.
   *
   * See https://ripple.com/build/rippled-apis/#markers-and-pagination.
   *
   * @param response - Response to check for more pages on.
   * @returns Whether the response has more pages of data.
   */
  public static hasNextPage(response: MarkerResponse): boolean {
    return Boolean(response.result.marker);
  }

  public async request(
    r: AccountChannelsRequest
  ): Promise<AccountChannelsResponse>;
  public async request(
    r: AccountCurrenciesRequest
  ): Promise<AccountCurrenciesResponse>;
  public async request(r: AccountInfoRequest): Promise<AccountInfoResponse>;
  public async request(r: AccountLinesRequest): Promise<AccountLinesResponse>;
  public async request(
    r: AccountObjectsRequest
  ): Promise<AccountObjectsResponse>;
  public async request(r: AccountOffersRequest): Promise<AccountOffersResponse>;
  public async request(r: AccountTxRequest): Promise<AccountTxResponse>;
  public async request(r: BookOffersRequest): Promise<BookOffersResponse>;
  public async request(r: ChannelVerifyRequest): Promise<ChannelVerifyResponse>;
  public async request(
    r: DepositAuthorizedRequest
  ): Promise<DepositAuthorizedResponse>;
  public async request(r: FeeRequest): Promise<FeeResponse>;
  public async request(
    r: GatewayBalancesRequest
  ): Promise<GatewayBalancesResponse>;
  public async request(r: LedgerRequest): Promise<LedgerResponse>;
  public async request(r: LedgerClosedRequest): Promise<LedgerClosedResponse>;
  public async request(r: LedgerCurrentRequest): Promise<LedgerCurrentResponse>;
  public async request(r: LedgerDataRequest): Promise<LedgerDataResponse>;
  public async request(r: LedgerEntryRequest): Promise<LedgerEntryResponse>;
  public async request(r: ManifestRequest): Promise<ManifestResponse>;
  public async request(r: NoRippleCheckRequest): Promise<NoRippleCheckResponse>;
  public async request(r: PathFindRequest): Promise<PathFindResponse>;
  public async request(r: PingRequest): Promise<PingResponse>;
  public async request(r: RandomRequest): Promise<RandomResponse>;
  public async request(
    r: RipplePathFindRequest
  ): Promise<RipplePathFindResponse>;
  public async request(r: ServerInfoRequest): Promise<ServerInfoResponse>;
  public async request(r: ServerStateRequest): Promise<ServerStateResponse>;
  public async request(r: SubmitRequest): Promise<SubmitResponse>;
  public async request(
    r: SubmitMultisignedRequest
  ): Promise<SubmitMultisignedResponse>;
  public async request(
    r: TransactionEntryRequest
  ): Promise<TransactionEntryResponse>;
  public async request(r: TxRequest): Promise<TxResponse>;
  /**
   * Makes a request to the client with the given command and
   * additional request body parameters.
   *
   * @param req - Request to send to the server.
   * @returns The response from the server.
   */
  public async request<R extends BaseRequest, T extends BaseResponse>(
    req: R
  ): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Necessary for overloading
    return this.connection.request({
      ...req,
      account: req.account
        ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Must be string
          ensureClassicAddress(req.account as string)
        : undefined,
    }) as unknown as T;
  }

  public async requestNextPage(
    req: AccountChannelsRequest,
    resp: AccountChannelsResponse
  ): Promise<AccountChannelsResponse>;
  public async requestNextPage(
    req: AccountLinesRequest,
    resp: AccountLinesResponse
  ): Promise<AccountLinesResponse>;
  public async requestNextPage(
    req: AccountObjectsRequest,
    resp: AccountObjectsResponse
  ): Promise<AccountObjectsResponse>;
  public async requestNextPage(
    req: AccountOffersRequest,
    resp: AccountOffersResponse
  ): Promise<AccountOffersResponse>;
  public async requestNextPage(
    req: AccountTxRequest,
    resp: AccountTxResponse
  ): Promise<AccountTxResponse>;
  public async requestNextPage(
    req: LedgerDataRequest,
    resp: LedgerDataResponse
  ): Promise<LedgerDataResponse>;
  /**
   * Requests the next page of data.
   *
   * @param req - Request to send.
   * @param resp - Response with the marker to use in the request.
   * @returns The response with the next page of data.
   */
  public async requestNextPage<
    T extends MarkerRequest,
    U extends MarkerResponse
  >(req: T, resp: U): Promise<U> {
    if (!resp.result.marker) {
      return Promise.reject(
        new errors.NotFoundError("response does not have a next page")
      );
    }
    const nextPageRequest = { ...req, marker: resp.result.marker };
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Necessary for overloading
    return this.connection.request(nextPageRequest) as unknown as U;
  }

  /**
   * Prepare a transaction.
   *
   * You can later submit the transaction with a `submit` request.
   *
   * @param txJSON - TODO: will be deleted.
   * @param instructions - TODO: will be deleted.
   * @returns TODO: will be deleted.
   */
  public async prepareTransaction(
    txJSON: TransactionJSON,
    instructions: Instructions = {}
  ): Promise<Prepare> {
    return transactionUtils.prepareTransaction(txJSON, this, instructions);
  }

  public async requestAll(
    req: AccountChannelsRequest
  ): Promise<AccountChannelsResponse[]>;
  public async requestAll(
    req: AccountLinesRequest
  ): Promise<AccountLinesResponse[]>;
  public async requestAll(
    req: AccountObjectsRequest
  ): Promise<AccountObjectsResponse[]>;
  public async requestAll(
    req: AccountOffersRequest
  ): Promise<AccountOffersResponse[]>;
  public async requestAll(req: AccountTxRequest): Promise<AccountTxResponse[]>;
  public async requestAll(
    req: BookOffersRequest
  ): Promise<BookOffersResponse[]>;
  public async requestAll(
    req: LedgerDataRequest
  ): Promise<LedgerDataResponse[]>;
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
   * @param request - The initial request to send to the server.
   * @param collect - (Optional) the param to use to collect the array of resources (only needed if command is unknown).
   * @returns The array of all responses.
   * @throws ValidationError if there is no collection key (either from a known command or for the unknown command).
   */
  public async requestAll<T extends MarkerRequest, U extends MarkerResponse>(
    request: T,
    collect?: string
  ): Promise<U[]> {
    // The data under collection is keyed based on the command. Fail if command
    // not recognized and collection key not provided.
    const collectKey = collect ?? getCollectKeyFromCommand(request.command);
    if (!collectKey) {
      throw new ValidationError(
        `no collect key for command ${request.command}`
      );
    }
    // If limit is not provided, fetches all data over multiple requests.
    // NOTE: This may return much more than needed. Set limit when possible.
    const countTo: number = request.limit == null ? Infinity : request.limit;
    let count = 0;
    let marker: unknown = request.marker;
    let lastBatchLength: number;
    const results: U[] = [];
    do {
      const countRemaining = clamp(countTo - count, MIN_LIMIT, MAX_LIMIT);
      const repeatProps = {
        ...request,
        limit: countRemaining,
        marker,
      };
      // eslint-disable-next-line no-await-in-loop -- Necessary for this, it really has to wait
      const singleResponse = await this.connection.request(repeatProps);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Should be true
      const singleResult = (singleResponse as U).result;
      if (!(collectKey in singleResult)) {
        throw new RippledError(`${collectKey} not in result`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Should be true
      const collectedData = singleResult[collectKey];
      marker = singleResult.marker;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Should be true
      results.push(singleResponse as U);
      // Make sure we handle when no data (not even an empty array) is returned.
      if (Array.isArray(collectedData)) {
        count += collectedData.length;
        lastBatchLength = collectedData.length;
      } else {
        lastBatchLength = 0;
      }
    } while (Boolean(marker) && count < countTo && lastBatchLength !== 0);
    return results;
  }

  /**
   * Tells the Client instance to connect to its rippled server.
   *
   * @returns A promise that resolves with a void value when a connection is established.
   */
  public async connect(): Promise<void> {
    return this.connection.connect();
  }

  /**
   * Tells the Client instance to disconnect from it's rippled server.
   *
   * @returns A promise that resolves with a void value when a connection is destroyed.
   */
  public async disconnect(): Promise<void> {
    // backwards compatibility: connection.disconnect() can return a number, but
    // this method returns nothing. SO we await but don't return any result.
    await this.connection.disconnect();
  }

  /**
   * Checks if the Client instance is connected to its rippled server.
   *
   * @returns Whether the client instance is connected.
   */
  public isConnected(): boolean {
    return this.connection.isConnected();
  }

  public getFee = getFee;

  public getTrustlines = getTrustlines;
  public getBalances = getBalances;
  public getPaths = getPaths;
  public getOrderbook = getOrderbook;

  public preparePayment = preparePayment;
  public prepareTrustline = prepareTrustline;
  public prepareOrder = prepareOrder;
  public prepareOrderCancellation = prepareOrderCancellation;
  public prepareEscrowCreation = prepareEscrowCreation;
  public prepareEscrowExecution = prepareEscrowExecution;
  public prepareEscrowCancellation = prepareEscrowCancellation;
  public preparePaymentChannelCreate = preparePaymentChannelCreate;
  public preparePaymentChannelFund = preparePaymentChannelFund;
  public preparePaymentChannelClaim = preparePaymentChannelClaim;
  public prepareCheckCreate = prepareCheckCreate;
  public prepareCheckCash = prepareCheckCash;
  public prepareCheckCancel = prepareCheckCancel;
  public prepareTicketCreate = prepareTicketCreate;
  public prepareSettings = prepareSettings;
  public sign = sign;
  public combine = combine;

  public generateFaucetWallet = generateFaucetWallet;

  public errors = errors;

  public static deriveXAddress = deriveXAddress;

  // Client.deriveClassicAddress (static) is a new name for client.deriveAddress
  public static deriveClassicAddress = deriveAddress;

  public static formatBidsAndAsks = formatBidsAndAsks;

  /**
   * Static methods to expose ripple-address-codec methods.
   */
  public static classicAddressToXAddress = classicAddressToXAddress;
  public static xAddressToClassicAddress = xAddressToClassicAddress;
  public static isValidXAddress = isValidXAddress;
  public static isValidClassicAddress = isValidClassicAddress;
  public static encodeSeed = encodeSeed;
  public static decodeSeed = decodeSeed;
  public static encodeAccountID = encodeAccountID;
  public static decodeAccountID = decodeAccountID;
  public static encodeNodePublic = encodeNodePublic;
  public static decodeNodePublic = decodeNodePublic;
  public static encodeAccountPublic = encodeAccountPublic;
  public static decodeAccountPublic = decodeAccountPublic;
  public static encodeXAddress = encodeXAddress;
  public static decodeXAddress = decodeXAddress;

  public txFlags = txFlags;
  public static txFlags = txFlags;
  public accountSetFlags = constants.AccountSetFlags;
  public static accountSetFlags = constants.AccountSetFlags;
}

export { Client, Connection };
