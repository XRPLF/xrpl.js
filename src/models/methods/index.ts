import { AccountChannelsRequest, AccountChannelsResponse } from "./accountChannels";
import { AccountCurrenciesRequest, AccountCurrenciesResponse } from "./accountCurrencies";
import { AccountInfoRequest, AccountInfoResponse } from "./accountInfo";
import { AccountLinesRequest, AccountLinesResponse } from "./accountLines";
import { AccountObjectsRequest, AccountObjectsResponse } from "./accountObjects";
import { AccountOffersRequest, AccountOffersResponse } from "./accountOffers";
import { AccountTxRequest, AccountTxResponse } from "./accountTx";
import { GatewayBalancesRequest, GatewayBalancesResponse } from "./gatewayBalances";
import { NoRippleCheckRequest, NoRippleCheckResponse } from "./norippleCheck";

type Request = AccountChannelsRequest 
             | AccountCurrenciesRequest
             | AccountInfoRequest
             | AccountLinesRequest
             | AccountObjectsRequest
             | AccountOffersRequest
             | AccountTxRequest
             | GatewayBalancesRequest
             | NoRippleCheckRequest

type Response = AccountChannelsResponse 
              | AccountCurrenciesResponse
              | AccountInfoResponse
              | AccountLinesResponse
              | AccountObjectsResponse
              | AccountOffersResponse
              | AccountTxResponse
              | GatewayBalancesResponse
              | NoRippleCheckResponse

export {
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
    NoRippleCheckResponse
}