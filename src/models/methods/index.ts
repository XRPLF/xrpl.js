/* eslint-disable import/max-dependencies -- All methods need to be exported */

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
import { AccountObjectsRequest, AccountObjectsResponse } from './accountObjects'
import { AccountOffersRequest, AccountOffersResponse } from './accountOffers'
import { AccountTxRequest, AccountTxResponse } from './accountTx'
import { BookOffersRequest, BookOffersResponse } from './bookOffers'
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
import { NoRippleCheckRequest, NoRippleCheckResponse } from './norippleCheck'
import { PathFindRequest, PathFindResponse } from './pathFind'
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

// account methods
type Request =
  | AccountChannelsRequest
  | AccountCurrenciesRequest
  | AccountInfoRequest
  | AccountLinesRequest
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

// account methods
type Response =
  | AccountChannelsResponse
  | AccountCurrenciesResponse
  | AccountInfoResponse
  | AccountLinesResponse
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
}
