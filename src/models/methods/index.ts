import { AccountChannelsRequest, AccountChannelsResponse } from "./accountChannels";
import { AccountCurrenciesRequest, AccountCurrenciesResponse } from "./accountCurrencies";
import { AccountInfoRequest, AccountInfoResponse } from "./accountInfo";
import { AccountLinesRequest, AccountLinesResponse } from "./accountLines";
import { AccountObjectsRequest, AccountObjectsResponse } from "./accountObjects";
import { AccountOffersRequest, AccountOffersResponse } from "./accountOffers";
import { AccountTxRequest, AccountTxResponse } from "./accountTx";
import { GatewayBalancesRequest, GatewayBalancesResponse } from "./gatewayBalances";
import { NoRippleCheckRequest, NoRippleCheckResponse } from "./norippleCheck";
import { ConsensusStream, LedgerStream, OrderBookStream, PeerStatusStream, Stream, SubscribeRequest, SubscribeResponse, TransactionStream, ValidationStream } from "./subscribe";
import { UnsubscribeRequest, UnsubscribeResponse } from "./unsubscribe";
import { BookOffersRequest, BookOffersResponse } from "./bookOffers";
import { DepositAuthorizedRequest, DepositAuthorizedResponse } from "./depositAuthorized";
import { PathFindRequest, PathFindResponse } from "./pathFind";
import { RipplePathFindRequest, RipplePathFindResponse } from "./ripplePathFind";

type Request = // account methods
               AccountChannelsRequest 
             | AccountCurrenciesRequest
             | AccountInfoRequest
             | AccountLinesRequest
             | AccountObjectsRequest
             | AccountOffersRequest
             | AccountTxRequest
             | GatewayBalancesRequest
             | NoRippleCheckRequest
               // path and order book methods
             | BookOffersRequest
             | DepositAuthorizedRequest
             | PathFindRequest
             | RipplePathFindRequest
               // subscription methods
             | SubscribeRequest
             | UnsubscribeRequest

type Response = // account methods
                AccountChannelsResponse 
              | AccountCurrenciesResponse
              | AccountInfoResponse
              | AccountLinesResponse
              | AccountObjectsResponse
              | AccountOffersResponse
              | AccountTxResponse
              | GatewayBalancesResponse
              | NoRippleCheckResponse
                // path and order book methods
              | BookOffersResponse
              | DepositAuthorizedResponse
              | PathFindResponse
              | RipplePathFindResponse
                // subscription methods
              | SubscribeResponse
              | UnsubscribeResponse

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
    // path and order book methods
    BookOffersRequest,
    BookOffersResponse,
    DepositAuthorizedRequest,
    DepositAuthorizedResponse,
    PathFindRequest,
    PathFindResponse,
    RipplePathFindRequest,
    RipplePathFindResponse,
    // Subscribe methods/streams
    SubscribeRequest,
    SubscribeResponse,
    Stream,
    LedgerStream,
    ValidationStream,
    TransactionStream,
    PeerStatusStream,
    OrderBookStream,
    ConsensusStream,
    UnsubscribeRequest,
    UnsubscribeResponse
}