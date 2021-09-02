import _ from "lodash";

import { Client, dropsToXrp } from "..";
import { LedgerIndex } from "../models/common";
import { AccountInfoRequest } from "../models/methods";
import {
  AccountLinesRequest,
  AccountLinesResponse,
  Trustline,
} from "../models/methods/accountLines";

interface Balance {
  value: string;
  currency: string;
  issuer?: string;
}

function formatBalances(trustlines: Trustline[]): Balance[] {
  return trustlines.map((trustline) => ({
    value: trustline.balance,
    currency: trustline.currency,
    issuer: trustline.account,
  }));
}

async function getBalances(
  this: Client,
  account: string,
  ledger_hash?: string,
  ledger_index?: LedgerIndex,
  peer?: string,
  limit?: number
): Promise<Balance[]> {
  // 1. Get XRP Balance
  const XRPRequest: AccountInfoRequest = {
    command: "account_info",
    account,
    ledger_index: ledger_index ?? "validated",
    ledger_hash,
  };
  const balance = await this.request(XRPRequest).then(
    (response) => response.result.account_data.Balance
  );
  const xrpBalance = { currency: "XRP", value: dropsToXrp(balance) };
  // 2. Get Non-XRP Balance
  const LinesRequest: AccountLinesRequest = {
    command: "account_lines",
    account,
    ledger_index: ledger_index ?? "validated",
    ledger_hash,
    peer,
    limit,
  };
  const responses: AccountLinesResponse[] = await this.requestAll(LinesRequest);
  const accountLinesBalance: Balance[] = _.flatMap(responses, (response) =>
    formatBalances(response.result.lines)
  );
  return [xrpBalance, ...accountLinesBalance];
}

export default getBalances;
