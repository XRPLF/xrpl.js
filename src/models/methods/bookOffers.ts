import { Amount, LedgerIndex } from '../common';
import { Offer } from '../ledger';
import { BaseRequest, BaseResponse } from './baseMethod';

interface TakerAmount {
  currency: string
  issuer?: string
}

export interface BookOffersRequest extends BaseRequest {
  command: "book_offers"
  ledger_hash?: string
  ledger_index?: LedgerIndex
  limit?: number
  taker?: string
  taker_gets: TakerAmount
  taker_pays: TakerAmount
}

interface BookOffer extends Offer {
  owner_funds?: string
  taker_gets_funded?: Amount
  taker_pays_funded?: Amount
  quality?: string
}

export interface BookOffersResponse extends BaseResponse {
  result: {
    ledger_current_index?: number
    ledger_index?: number
    ledger_hash?: string
    offers: BookOffer[]
  }
}
