import _ from "lodash";

import { TransactionAndMetadata } from "../../models/transactions";
import { removeUndefined, rippleTimeToISOTime } from "../../utils";

import parseTransaction from "./transaction";

export interface FormattedLedger {
  // TODO: properties in type don't match response object. Fix!
  // closed: boolean,
  stateHash: string;
  closeTime: string;
  closeTimeResolution: number;
  closeFlags: number;
  ledgerHash: string;
  ledgerVersion: number;
  parentLedgerHash: string;
  parentCloseTime: string;
  totalDrops: string;
  transactionHash: string;
  transactions?: object[];
  transactionHashes?: string[];
  rawState?: string;
  stateHashes?: string[];
}

function parseTransactionWrapper(
  ledgerVersion: number,
  tx: TransactionAndMetadata
) {
  // renames metaData to meta and adds ledger_index
  const transaction = {
    ..._.omit(tx, "metadata"),
    meta: tx.metadata,
    ledger_index: ledgerVersion,
  };
  const result = parseTransaction(transaction, true);
  if (!result.outcome.ledgerVersion) {
    result.outcome.ledgerVersion = ledgerVersion;
  }
  return result;
}

function parseTransactions(
  transactions: string[] | TransactionAndMetadata[],
  ledgerVersion: number
) {
  if (_.isEmpty(transactions)) {
    return {};
  }
  if (typeof transactions[0] === "string") {
    return { transactionHashes: transactions as unknown as string[] };
  }
  return {
    transactions: (transactions as unknown as TransactionAndMetadata[]).map(
      _.partial(parseTransactionWrapper, ledgerVersion)
    ),
  };
}

function parseState(state) {
  if (_.isEmpty(state)) {
    return {};
  }
  if (typeof state[0] === "string") {
    return { stateHashes: state };
  }
  return { rawState: JSON.stringify(state) };
}

/**
 * @param ledger - Must be a *closed* ledger with valid `close_time` and `parent_close_time`.
 * @returns Formatted ledger.
 * @throws RangeError: Invalid time value (rippleTimeToISOTime).
 */
export function parseLedger(ledger): FormattedLedger {
  const ledgerVersion = parseInt(ledger.ledger_index, 10);
  return removeUndefined({
    stateHash: ledger.account_hash,
    closeTime: rippleTimeToISOTime(ledger.close_time),
    closeTimeResolution: ledger.close_time_resolution,
    closeFlags: ledger.close_flags,
    ledgerHash: ledger.ledger_hash,
    ledgerVersion,
    parentLedgerHash: ledger.parent_hash,
    parentCloseTime: rippleTimeToISOTime(ledger.parent_close_time),
    totalDrops: ledger.total_coins,
    transactionHash: ledger.transaction_hash,
    ...parseTransactions(ledger.transactions, ledgerVersion),
    ...parseState(ledger.accountState),
  });
}
