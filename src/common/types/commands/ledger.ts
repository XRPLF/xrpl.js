import { Ledger, QueueData } from "../objects";

export interface LedgerRequest {
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  full?: boolean;
  accounts?: boolean;
  transactions?: boolean;
  expand?: boolean;
  owner_funds?: boolean;
  binary?: boolean;
  queue?: boolean;
}

export interface LedgerResponse {
  ledger_index: number;
  ledger_hash: string;
  ledger: Ledger;
  queue_data?: QueueData;
}
