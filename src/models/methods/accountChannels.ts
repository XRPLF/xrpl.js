import { LedgerIndex } from "../common";

import { BaseRequest, BaseResponse } from "./baseMethod";

interface Channel {
  account: string;
  amount: string;
  balance: string;
  channel_id: string;
  destination_account: string;
  settle_delay: number;
  public_key?: string;
  public_key_hex?: string;
  expiration?: number;
  cancel_after?: number;
  source_tab?: number;
  destination_tag?: number;
}

export interface AccountChannelsRequest extends BaseRequest {
  command: "account_channels";
  account: string;
  destination_account?: string;
  ledger_hash?: string;
  ledger_index?: LedgerIndex;
  limit: number;
  marker?: any;
}

export interface AccountChannelsResponse extends BaseResponse {
  result: {
    account: string;
    channels: Channel[];
    ledger_hash: string;
    ledger_index: number;
    validated?: boolean;
    limit?: number;
    marker?: any;
  };
}
