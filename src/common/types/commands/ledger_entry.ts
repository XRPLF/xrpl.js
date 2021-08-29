import { LedgerEntry } from "../objects";

export interface LedgerEntryRequest {
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  index?: string;
  account_root?: string;
  directory?:
    | string
    | {
        sub_index?: number;
        dir_root: string;
      }
    | {
        sub_index?: number;
        owner: string;
      };
  offer?:
    | string
    | {
        account: string;
        seq: number;
      };
  ripple_state?: {
    accounts: [string, string];
    currency: string;
  };
  binary?: boolean;
}

export interface LedgerEntryResponse {
  index: string;
  ledger_index: number;
  node_binary?: string;
  node?: LedgerEntry;
}
