import { RippledAmount } from "../objects";

export interface AccountOffersRequest {
  account: string;
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  limit?: number;
  marker?: unknown;
}

export interface AccountOffersResponse {
  account: string;
  ledger_hash?: string;
  ledger_current_index?: number;
  ledger_index?: number;
  marker?: unknown;
  offers?: AccountOffer[];
}

export interface AccountOffer {
  seq: number;
  flags: number;
  taker_gets: RippledAmount;
  taker_pays: RippledAmount;
  quality: string;
  expiration?: number;
}
