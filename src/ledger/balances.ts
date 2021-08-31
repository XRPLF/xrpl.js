import { Client, dropsToXrp } from "..";
import { LedgerIndex } from "../models/common";
import { AccountInfoRequest, AccountLinesRequest } from "../models/methods";
// import { validate, ensureClassicAddress } from "../common";
// import { FormattedTrustline } from "../common/types/objects/trustlines";

// interface Balance {
//   value: string;
//   currency: string;
//   counterparty?: string;
// }

// type GetBalances = Balance[];

// function getTrustlineBalanceAmount(trustline: FormattedTrustline): Balance {
//   return {
//     currency: trustline.specification.currency,
//     counterparty: trustline.specification.counterparty,
//     value: trustline.state.balance,
//   };
// }

// function formatBalances(
//   options: GetTrustlinesOptions,
//   balances: { xrp: string; trustlines: FormattedTrustline[] }
// ) {
//   const result = balances.trustlines.map(getTrustlineBalanceAmount);
//   if (
//     !(options.counterparty || (options.currency && options.currency !== "XRP"))
//   ) {
//     const xrpBalance = {
//       currency: "XRP",
//       value: balances.xrp,
//     };
//     result.unshift(xrpBalance);
//   }
//   if (options.limit && result.length > options.limit) {
//     const toRemove = result.length - options.limit;
//     result.splice(-toRemove, toRemove);
//   }
//   return result;
// }

// function getLedgerVersionHelper(
//   client: Client,
//   optionValue?: number
// ): Promise<number> {
//   if (optionValue != null && optionValue !== null) {
//     return Promise.resolve(optionValue);
//   }
//   return connection
//     .request({
//       command: "ledger",
//       ledger_index: "validated",
//     })
//     .then((response) => response.result.ledger_index);
// }

// function getBalances(
//   this: Client,
//   address: string,
//   options: GetTrustlinesOptions = {}
// ): Promise<GetBalances> {
//   validate.getTrustlines({ address, options });

//   // Only support retrieving balances without a tag,
//   // since we currently do not calculate balances
//   // on a per-tag basis. Apps must interpret and
//   // use tags independent of the XRP Ledger, comparing
//   // with the XRP Ledger's balance as an accounting check.
//   address = ensureClassicAddress(address);

//   return Promise.all([
//     getLedgerVersionHelper(this.connection, options.ledgerVersion).then(
//       (ledgerVersion) => utils.getXRPBalance(this, address, ledgerVersion)
//     ),
//     this.getTrustlines(address, options),
//   ]).then((results) =>
//     formatBalances(options, { xrp: results[0], trustlines: results[1] })
//   );
// }

// export default getBalances;

interface Balance {
  value: string;
  currency: string;
  counterparty?: string;
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
  const ledgerVersion = await this.request({
    command: "ledger",
    ledger_index: "validated",
  }).then((response) => response.result.ledger_index);
  const XRPRequest: AccountInfoRequest = {
    command: "account_info",
    account,
    ledger_index: ledger_index ?? ledgerVersion,
    ledger_hash,
  };
  const balance = await this.request(XRPRequest).then(
    (response) => response.result.account_data.Balance
  );
  const xrpBalance = { currency: "XRP", value: balance };
  // 2. Get Non-XRP Balance
  const LinesRequest: AccountLinesRequest = {
    command: "account_lines",
    account,
    ledger_index: ledger_index ?? ledgerVersion,
    ledger_hash,
    peer,
    limit,
  };
  const data = await this.request(LinesRequest).then(
    (response) => response.result
  );
  return [xrpBalance, data];
}

export default getBalances;
