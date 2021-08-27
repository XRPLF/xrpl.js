import {
  AccountRootLedgerEntry,
  SignerListLedgerEntry,
  QueueData,
} from "../objects";

export interface AccountInfoRequest {
  account: string;
  strict?: boolean;
  queue?: boolean;
  ledger_hash?: string;
  ledger_index?: number | ("validated" | "closed" | "current");
  signer_lists?: boolean;
}

export interface AccountInfoResponse {
  account_data: AccountRootLedgerEntry;
  signer_lists?: SignerListLedgerEntry[];
  ledger_current_index?: number;
  ledger_index?: number;
  queue_data?: QueueData;
  validated?: boolean;
}
