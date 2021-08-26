import { AccountObjectType, LedgerIndex } from "../common";
import {
  Check,
  DepositPreauth,
  Escrow,
  Offer,
  PayChannel,
  RippleState,
  SignerList,
  Ticket,
} from "../ledger";

import { BaseRequest, BaseResponse } from "./baseMethod";

export interface AccountObjectsRequest extends BaseRequest {
  command: "account_objects";
  account: string;
  type?: AccountObjectType;
  deletion_blockers_only?: boolean;
  ledger_hash?: string;
  ledger_index?: LedgerIndex;
  limit?: number;
  marker?: any;
}

type AccountObject =
  | Check
  | DepositPreauth
  | Escrow
  | Offer
  | PayChannel
  | SignerList
  | Ticket
  | RippleState;

export interface AccountObjectsResponse extends BaseResponse {
  result: {
    account: string;
    account_objects: AccountObject[];
    ledger_hash?: string;
    ledger_index?: number;
    ledger_current_index?: number;
    limit?: number;
    marker?: string;
    validated?: boolean;
  };
}
