/* eslint-disable no-inline-comments -- Necessary for important note */
/* eslint-disable max-lines -- There is a lot to export */
import {
  AccountChannelsRequest,
  AccountChannelsResponse,
  Channel,
} from './accountChannels'
import {
  AccountCurrenciesRequest,
  AccountCurrenciesResponse,
} from './accountCurrencies'
import {
  AccountInfoAccountFlags,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountQueueData,
  AccountQueueTransaction,
} from './accountInfo'
import {
  AccountLinesRequest,
  AccountLinesResponse,
  AccountLinesTrustline,
} from './accountLines'
import {
  AccountNFToken,
  AccountNFTsRequest,
  AccountNFTsResponse,
} from './accountNFTs'
import {
  AccountObject,
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountObjectType,
} from './accountObjects'
import {
  AccountOffer,
  AccountOffersRequest,
  AccountOffersResponse,
} from './accountOffers'
import {
  AccountTxRequest,
  AccountTxResponse,
  AccountTxTransaction,
} from './accountTx'
import { AMMInfoRequest, AMMInfoResponse } from './ammInfo'
import {
  BaseRequest,
  BaseResponse,
  ErrorResponse,
  ResponseWarning,
} from './baseMethod'
import {
  BookOffersRequest,
  BookOffer,
  BookOffersResponse,
  BookOfferCurrency,
} from './bookOffers'
import { ChannelVerifyRequest, ChannelVerifyResponse } from './channelVerify'
import {
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
} from './depositAuthorized'
import { FeeRequest, FeeResponse } from './fee'
import {
  GatewayBalance,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
} from './gatewayBalances'
import {
  LedgerBinary,
  LedgerModifiedOfferCreateTransaction,
  LedgerQueueData,
  LedgerRequest,
  LedgerResponse,
  LedgerRequestExpandedTransactionsOnly,
  LedgerResponseExpanded,
  LedgerRequestExpandedAccountsAndTransactions,
  LedgerRequestExpandedAccountsOnly,
  LedgerRequestExpandedTransactionsBinary,
} from './ledger'
import { LedgerClosedRequest, LedgerClosedResponse } from './ledgerClosed'
import { LedgerCurrentRequest, LedgerCurrentResponse } from './ledgerCurrent'
import {
  LedgerDataBinaryLedgerEntry,
  LedgerDataLabeledLedgerEntry,
  LedgerDataLedgerState,
  LedgerDataRequest,
  LedgerDataResponse,
} from './ledgerData'
import { LedgerEntryRequest, LedgerEntryResponse } from './ledgerEntry'
import { ManifestRequest, ManifestResponse } from './manifest'
import { NFTBuyOffersRequest, NFTBuyOffersResponse } from './nftBuyOffers'
import {
  NFTHistoryRequest,
  NFTHistoryResponse,
  NFTHistoryTransaction,
} from './nftHistory'
import { NFTInfoRequest, NFTInfoResponse } from './nftInfo'
import { NFTsByIssuerRequest, NFTsByIssuerResponse } from './nftsByIssuer'
import { NFTSellOffersRequest, NFTSellOffersResponse } from './nftSellOffers'
import { NoRippleCheckRequest, NoRippleCheckResponse } from './norippleCheck'
import {
  PathFindRequest,
  PathFindCloseRequest,
  PathFindCreateRequest,
  PathFindStatusRequest,
  PathFindResponse,
  PathFindPathOption,
} from './pathFind'
import { PingRequest, PingResponse } from './ping'
import { RandomRequest, RandomResponse } from './random'
import {
  RipplePathFindPathOption,
  RipplePathFindRequest,
  RipplePathFindResponse,
  SourceCurrencyAmount,
} from './ripplePathFind'
import {
  ServerDefinitionsRequest,
  ServerDefinitionsResponse,
} from './serverDefinitions'
import {
  JobType,
  ServerInfoRequest,
  ServerInfoResponse,
  ServerState,
  StateAccounting,
  StateAccountingFinal,
} from './serverInfo'
import { ServerStateRequest, ServerStateResponse } from './serverState'
import { SubmitRequest, SubmitResponse } from './submit'
import {
  SubmitMultisignedRequest,
  SubmitMultisignedResponse,
} from './submitMultisigned'
import {
  BooksSnapshot,
  ConsensusStream,
  LedgerStream,
  LedgerStreamResponse,
  OrderBookStream,
  PathFindStream,
  PeerStatusStream,
  Stream,
  SubscribeBook,
  SubscribeRequest,
  SubscribeResponse,
  TransactionStream,
  ValidationStream,
} from './subscribe'
import {
  TransactionEntryRequest,
  TransactionEntryResponse,
} from './transactionEntry'
import { TxRequest, TxResponse } from './tx'
import {
  UnsubscribeBook,
  UnsubscribeRequest,
  UnsubscribeResponse,
} from './unsubscribe'
/**
 * @category Requests
 */
type Request =
  // account methods
  | AccountChannelsRequest
  | AccountCurrenciesRequest
  | AccountInfoRequest
  | AccountLinesRequest
  | AccountNFTsRequest
  | AccountObjectsRequest
  | AccountOffersRequest
  | AccountTxRequest
  | GatewayBalancesRequest
  | NoRippleCheckRequest
  // ledger methods
  | LedgerRequest
  | LedgerClosedRequest
  | LedgerCurrentRequest
  | LedgerDataRequest
  | LedgerEntryRequest
  // transaction methods
  | SubmitRequest
  | SubmitMultisignedRequest
  | TransactionEntryRequest
  | TxRequest
  // path and order book methods
  | BookOffersRequest
  | DepositAuthorizedRequest
  | PathFindRequest
  | RipplePathFindRequest
  // payment channel methods
  | ChannelVerifyRequest
  // subscription methods
  | SubscribeRequest
  | UnsubscribeRequest
  // server info methods
  | FeeRequest
  | ManifestRequest
  | ServerDefinitionsRequest
  | ServerInfoRequest
  | ServerStateRequest
  // utility methods
  | PingRequest
  | RandomRequest
  // NFT methods
  | NFTBuyOffersRequest
  | NFTSellOffersRequest
  // clio only methods
  | NFTInfoRequest
  | NFTHistoryRequest
  | NFTsByIssuerRequest
  // AMM methods
  | AMMInfoRequest

/**
 * @category Responses
 */
type Response =
  // account methods
  | AccountChannelsResponse
  | AccountCurrenciesResponse
  | AccountInfoResponse
  | AccountLinesResponse
  | AccountNFTsResponse
  | AccountObjectsResponse
  | AccountOffersResponse
  | AccountTxResponse
  | GatewayBalancesResponse
  | NoRippleCheckResponse
  // ledger methods
  | LedgerResponse
  | LedgerClosedResponse
  | LedgerCurrentResponse
  | LedgerDataResponse
  | LedgerEntryResponse
  // transaction methods
  | SubmitResponse
  | SubmitMultisignedResponse
  | TransactionEntryResponse
  | TxResponse
  // path and order book methods
  | BookOffersResponse
  | DepositAuthorizedResponse
  | PathFindResponse
  | RipplePathFindResponse
  // payment channel methods
  | ChannelVerifyResponse
  // subscription methods
  | SubscribeResponse
  | UnsubscribeResponse
  // server info methods
  | FeeResponse
  | ManifestResponse
  | ServerDefinitionsResponse
  | ServerInfoResponse
  | ServerStateResponse
  // utility methods
  | PingResponse
  | RandomResponse
  // NFT methods
  | NFTBuyOffersResponse
  | NFTSellOffersResponse
  // clio only methods
  | NFTInfoResponse
  | NFTHistoryResponse
  | NFTsByIssuerResponse
  // AMM methods
  | AMMInfoResponse

export type RequestResponseMap<T> = T extends AccountChannelsRequest
  ? AccountChannelsResponse
  : T extends AccountCurrenciesRequest
  ? AccountCurrenciesResponse
  : T extends AccountInfoRequest
  ? AccountInfoResponse
  : T extends AccountLinesRequest
  ? AccountLinesResponse
  : T extends AccountNFTsRequest
  ? AccountNFTsResponse
  : T extends AccountObjectsRequest
  ? AccountObjectsResponse
  : T extends AccountOffersRequest
  ? AccountOffersResponse
  : T extends AccountTxRequest
  ? AccountTxResponse
  : T extends AMMInfoRequest
  ? AMMInfoResponse
  : T extends GatewayBalancesRequest
  ? GatewayBalancesResponse
  : T extends NoRippleCheckRequest
  ? NoRippleCheckResponse
  : // NOTE: The order of these LedgerRequest types is important
  // to get the proper type matching overrides based on parameters set
  // in the request. For example LedgerRequestExpandedTransactionsBinary
  // should match LedgerRequestExpandedTransactionsOnly, but not
  // LedgerRequestExpandedAccountsOnly. This is because the
  // LedgerRequestExpandedTransactionsBinary type is a superset of
  // LedgerRequestExpandedTransactionsOnly, but not of the other.
  // This is why LedgerRequestExpandedTransactionsBinary is listed
  // first in the type list.
  //
  // Here is an example using real data:
  // LedgerRequestExpandedTransactionsBinary = {
  //   command: 'ledger',
  //   ledger_index: 'validated',
  //   expand: true,
  //   transactions: true,
  //   binary: true,
  // }
  // LedgerRequestExpandedTransactionsOnly = {
  //   command: 'ledger',
  //   ledger_index: 'validated',
  //   expand: true,
  //   transactions: true,
  // }
  // LedgerRequestExpandedAccountsOnly = {
  //   command: 'ledger',
  //   ledger_index: 'validated',
  //   accounts: true,
  //   expand: true,
  // }
  // LedgerRequest = {
  //   command: 'ledger',
  //   ledger_index: 'validated',
  // }
  //
  // The type with the most parameters set should be listed first. In this
  // case LedgerRequestExpandedTransactionsBinary has the most parameters (`expand`, `transactions`, and `binary`)
  // set, so it is listed first. When TypeScript tries to match the type of
  // a request to a response, it will try to match the request type to the
  // response type in the order they are listed. So, if we have a request
  // with the following parameters:
  // {
  //   command: 'ledger',
  //   ledger_index: 'validated',
  //   expand: true,
  //   transactions: true,
  //   binary: true,
  // }
  // TypeScript will first try to match the request type to
  // LedgerRequestExpandedTransactionsBinary, which will succeed. It will
  // then try to match the response type to LedgerResponseExpanded, which
  // will also succeed. If we had listed LedgerRequestExpandedTransactionsOnly
  // first, TypeScript would have tried to match the request type to
  // LedgerRequestExpandedTransactionsOnly, which would have succeeded, but
  // then we'd get the wrong response type, LedgerResponse, instead of
  // LedgerResponseExpanded.
  T extends LedgerRequestExpandedTransactionsBinary
  ? LedgerResponse
  : T extends LedgerRequestExpandedAccountsAndTransactions
  ? LedgerResponseExpanded
  : T extends LedgerRequestExpandedTransactionsOnly
  ? LedgerResponseExpanded
  : T extends LedgerRequestExpandedAccountsOnly
  ? LedgerResponseExpanded
  : T extends LedgerRequest
  ? LedgerResponse
  : T extends LedgerClosedRequest
  ? LedgerClosedResponse
  : T extends LedgerCurrentRequest
  ? LedgerCurrentResponse
  : T extends LedgerDataRequest
  ? LedgerDataResponse
  : T extends LedgerEntryRequest
  ? LedgerEntryResponse
  : T extends SubmitRequest
  ? SubmitResponse
  : T extends SubmitMultisignedRequest
  ? SubmitMultisignedResponse
  : T extends TransactionEntryRequest
  ? TransactionEntryResponse
  : T extends TxRequest
  ? TxResponse
  : T extends BookOffersRequest
  ? BookOffersResponse
  : T extends DepositAuthorizedRequest
  ? DepositAuthorizedResponse
  : T extends PathFindRequest
  ? PathFindResponse
  : T extends RipplePathFindRequest
  ? RipplePathFindResponse
  : T extends ChannelVerifyRequest
  ? ChannelVerifyResponse
  : T extends SubscribeRequest
  ? SubscribeResponse
  : T extends UnsubscribeRequest
  ? UnsubscribeResponse
  : T extends FeeRequest
  ? FeeResponse
  : T extends ManifestRequest
  ? ManifestResponse
  : T extends ServerInfoRequest
  ? ServerInfoResponse
  : T extends ServerStateRequest
  ? ServerStateResponse
  : T extends ServerDefinitionsRequest
  ? ServerDefinitionsResponse
  : T extends PingRequest
  ? PingResponse
  : T extends RandomRequest
  ? RandomResponse
  : T extends NFTBuyOffersRequest
  ? NFTBuyOffersResponse
  : T extends NFTSellOffersRequest
  ? NFTSellOffersResponse
  : T extends NFTInfoRequest
  ? NFTInfoResponse
  : T extends NFTsByIssuerRequest
  ? NFTsByIssuerResponse
  : T extends NFTHistoryRequest
  ? NFTHistoryResponse
  : Response

export type MarkerRequest = Request & {
  limit?: number
  marker?: unknown
}

export type MarkerResponse = Response & {
  result: {
    marker?: unknown
  }
}

export type RequestAllResponseMap<T> = T extends AccountChannelsRequest
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
  : T extends AccountTxRequest
  ? AccountTxResponse
  : T extends BookOffersRequest
  ? BookOffersResponse
  : MarkerResponse

export {
  // Allow users to define their own requests and responses.  This is useful for releasing experimental versions
  BaseRequest,
  BaseResponse,
  Request,
  Response,
  ResponseWarning,
  // account methods with types
  Channel,
  AccountChannelsRequest,
  AccountChannelsResponse,
  AccountCurrenciesRequest,
  AccountCurrenciesResponse,
  AccountInfoAccountFlags,
  AccountInfoRequest,
  AccountInfoResponse,
  AccountQueueData,
  AccountQueueTransaction,
  AccountLinesRequest,
  AccountLinesResponse,
  AccountLinesTrustline,
  AccountNFToken,
  AccountNFTsRequest,
  AccountNFTsResponse,
  AccountObject,
  AccountObjectType,
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffer,
  AccountOffersRequest,
  AccountOffersResponse,
  AccountTxRequest,
  AccountTxResponse,
  AccountTxTransaction,
  GatewayBalance,
  GatewayBalancesRequest,
  GatewayBalancesResponse,
  NoRippleCheckRequest,
  NoRippleCheckResponse,
  // ledger methods
  LedgerRequest,
  LedgerResponse,
  LedgerQueueData,
  LedgerBinary,
  LedgerModifiedOfferCreateTransaction,
  LedgerClosedRequest,
  LedgerClosedResponse,
  LedgerCurrentRequest,
  LedgerCurrentResponse,
  LedgerDataRequest,
  LedgerDataLabeledLedgerEntry,
  LedgerDataBinaryLedgerEntry,
  LedgerDataResponse,
  LedgerDataLedgerState,
  LedgerEntryRequest,
  LedgerEntryResponse,
  // transaction methods with types
  SubmitRequest,
  SubmitResponse,
  SubmitMultisignedRequest,
  SubmitMultisignedResponse,
  TransactionEntryRequest,
  TransactionEntryResponse,
  TxRequest,
  TxResponse,
  // path and order book methods with types
  BookOffersRequest,
  BookOffer,
  BookOfferCurrency,
  BookOffersResponse,
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
  PathFindRequest,
  PathFindCreateRequest,
  PathFindCloseRequest,
  PathFindPathOption,
  PathFindStatusRequest,
  PathFindResponse,
  RipplePathFindPathOption,
  RipplePathFindRequest,
  RipplePathFindResponse,
  SourceCurrencyAmount,
  // payment channel methods
  ChannelVerifyRequest,
  ChannelVerifyResponse,
  // Subscribe methods/streams with types
  SubscribeRequest,
  SubscribeResponse,
  SubscribeBook,
  Stream,
  BooksSnapshot,
  LedgerStream,
  LedgerStreamResponse,
  ValidationStream,
  TransactionStream,
  PathFindStream,
  PeerStatusStream,
  OrderBookStream,
  ConsensusStream,
  UnsubscribeRequest,
  UnsubscribeResponse,
  UnsubscribeBook,
  // server info methods with types
  FeeRequest,
  FeeResponse,
  ManifestRequest,
  ManifestResponse,
  ServerDefinitionsRequest,
  ServerDefinitionsResponse,
  ServerInfoRequest,
  ServerInfoResponse,
  ServerStateRequest,
  ServerStateResponse,
  JobType,
  ServerState,
  StateAccountingFinal,
  StateAccounting,
  // utility methods
  PingRequest,
  PingResponse,
  RandomRequest,
  RandomResponse,
  ErrorResponse,
  // NFT methods
  NFTBuyOffersRequest,
  NFTBuyOffersResponse,
  NFTSellOffersRequest,
  NFTSellOffersResponse,
  // clio only methods
  NFTInfoRequest,
  NFTInfoResponse,
  NFTHistoryRequest,
  NFTHistoryResponse,
  NFTHistoryTransaction,
  NFTsByIssuerRequest,
  NFTsByIssuerResponse,
  // AMM methods
  AMMInfoRequest,
  AMMInfoResponse,
}
