import { LedgerIndex } from "../common";

import { BaseRequest, BaseResponse } from "./baseMethod";

export interface AccountCurrenciesRequest extends BaseRequest {
  command: "account_currencies";
  account: string;
  destination_account?: string;
  ledger_hash?: string;
  ledger_index?: LedgerIndex;
  strict?: boolean;
}

export interface AccountCurrenciesResponse extends BaseResponse {
  result: {
    ledger_hash?: string;
    ledger_index: number;
    receive_currencies: string[];
    send_currencies: string[];
    validated: boolean;
  };
}
