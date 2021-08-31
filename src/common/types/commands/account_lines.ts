import { Trustline } from "../objects";

export interface AccountLinesRequest {
  account: string;
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  peer?: string;
  limit?: number;
  marker?: unknown;
}

export interface AccountLinesResponse {
  account: string;
  lines: Trustline[];
  ledger_current_index?: number;
  ledger_index?: number;
  ledger_hash?: string;
  marker?: unknown;
}
