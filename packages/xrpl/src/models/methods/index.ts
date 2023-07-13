/* eslint-disable max-lines -- Necessary here */
import {
  AccountChannelsRequest,
  AccountChannelsResponse,
} from './accountChannels'
import {
  AccountCurrenciesRequest,
  AccountCurrenciesResponse,
} from './accountCurrencies'
import { AccountInfoRequest, AccountInfoResponse } from './accountInfo'
import { AccountLinesRequest, AccountLinesResponse } from './accountLines'
import { AccountNFTsRequest, AccountNFTsResponse } from './accountNFTs'
import { AccountObjectsRequest, AccountObjectsResponse } from './accountObjects'
import {
  AccountOffer,
  AccountOffersRequest,
  AccountOffersResponse,
} from './accountOffers'
import { AccountTxRequest, AccountTxResponse } from './accountTx'
import { ErrorResponse } from './baseMethod'
import { BookOffersRequest, BookOffer, BookOffersResponse } from './bookOffers'
import { ChannelVerifyRequest, ChannelVerifyResponse } from './channelVerify'
import {
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
} from './depositAuthorized'
import { FeeRequest, FeeResponse } from './fee'
import {
  GatewayBalancesRequest,
  GatewayBalancesResponse,
} from './gatewayBalances'
import { LedgerRequest, LedgerResponse } from './ledger'
import { LedgerClosedRequest, LedgerClosedResponse } from './ledgerClosed'
import { LedgerCurrentRequest, LedgerCurrentResponse } from './ledgerCurrent'
import { LedgerDataRequest, LedgerDataResponse } from './ledgerData'
import { LedgerEntryRequest, LedgerEntryResponse } from './ledgerEntry'
import { ManifestRequest, ManifestResponse } from './manifest'
import { NFTBuyOffersRequest, NFTBuyOffersResponse } from './nftBuyOffers'
import { NFTHistoryRequest, NFTHistoryResponse } from './nftHistory'
import { NFTInfoRequest, NFTInfoResponse } from './nftInfo'
import { NFTSellOffersRequest, NFTSellOffersResponse } from './nftSellOffers'
import { NoRippleCheckRequest, NoRippleCheckResponse } from './norippleCheck'
import {
  PathFindRequest,
  PathFindCloseRequest,
  PathFindCreateRequest,
  PathFindStatusRequest,
  PathFindResponse,
} from './pathFind'
import { PingRequest, PingResponse } from './ping'
import { RandomRequest, RandomResponse } from './random'
import { RipplePathFindRequest, RipplePathFindResponse } from './ripplePathFind'
import { ServerInfoRequest, ServerInfoResponse } from './serverInfo'
import { ServerStateRequest, ServerStateResponse } from './serverState'
import { SubmitRequest, SubmitResponse } from './submit'
import {
  SubmitMultisignedRequest,
  SubmitMultisignedResponse,
} from './submitMultisigned'
import {
  ConsensusStream,
  LedgerStream,
  OrderBookStream,
  PathFindStream,
  PeerStatusStream,
  Stream,
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
import { UnsubscribeRequest, UnsubscribeResponse } from './unsubscribe'
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
  : T extends GatewayBalancesRequest
  ? GatewayBalancesResponse
  : T extends NoRippleCheckRequest
  ? NoRippleCheckResponse
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
  AccountNFTsRequest,
  AccountNFTsResponse,
  AccountObjectsRequest,
  AccountObjectsResponse,
  AccountOffer,
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
  BookOffer,
  BookOffersResponse,
  DepositAuthorizedRequest,
  DepositAuthorizedResponse,
  PathFindRequest,
  PathFindCreateRequest,
  PathFindCloseRequest,
  PathFindStatusRequest,
  PathFindResponse,
  RipplePathFindRequest,
  RipplePathFindResponse,
  // payment channel methods
  ChannelVerifyRequest,
  ChannelVerifyResponse,
  // Subscribe methods/streams
  SubscribeRequest,
  SubscribeResponse,
  Stream,
  LedgerStream,
  ValidationStream,
  TransactionStream,
  PathFindStream,
  PeerStatusStream,
  OrderBookStream,
  ConsensusStream,
  UnsubscribeRequest,
  UnsubscribeResponse,
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
}
