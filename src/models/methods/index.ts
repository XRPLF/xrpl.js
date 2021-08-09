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

type Request = AccountChannelsRequest 
             | AccountCurrenciesRequest
             | AccountInfoRequest
             | AccountLinesRequest
             | AccountObjectsRequest
             | AccountOffersRequest
             | AccountTxRequest
             | GatewayBalancesRequest
             | NoRippleCheckRequest
             | SubscribeRequest
             | UnsubscribeRequest

type Response = AccountChannelsResponse 
              | AccountCurrenciesResponse
              | AccountInfoResponse
              | AccountLinesResponse
              | AccountObjectsResponse
              | AccountOffersResponse
              | AccountTxResponse
              | GatewayBalancesResponse
              | NoRippleCheckResponse
              | SubscribeResponse
              | UnsubscribeResponse

export {
    // Account methods
    Request,
    Response,
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