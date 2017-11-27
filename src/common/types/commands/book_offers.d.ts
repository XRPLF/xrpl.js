import {TakerRequestAmount} from '../objects/amounts'
import {OfferCreateTransaction} from '../objects/transactions'

export interface BookOffersRequest {
  taker?: string;
  taker_gets: TakerRequestAmount;
  taker_pays: TakerRequestAmount;
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  limit?: number;
  marker?: any;
}

export interface BookOffersResponse {
  account: string;
  offers: OfferCreateTransaction[];
  ledger_hash?: string;
  ledger_current_index?: number;
  ledger_index?: number;
  marker?: any;
}