import { Amount, LedgerIndex } from "../common";
import { BaseRequest, BaseResponse } from "./baseMethod";

export interface AccountOffersRequest extends BaseRequest {
  command: "account_offers"
  account: string
  ledger_hash?: string
  ledger_index?: LedgerIndex
  limit?: number
  marker?: any
  strict?: boolean
}

interface AccountOffer {
  flags: number
  seq: number
  taker_gets: Amount
  taker_pays: Amount
  quality: string
  expiration?: number
}

export interface AccountOffersResponse extends BaseResponse {
  result: {
    account: string
    offers?: AccountOffer[]
    ledger_current_index?: number
    ledger_index?: number
    ledger_hash?: string
    marker?: any
  }
}
