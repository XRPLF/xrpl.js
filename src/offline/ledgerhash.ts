import * as _ from 'lodash'
import {
  computeLedgerHash,
  computeTransactionTreeHash,
  computeStateTreeHash
} from '../common/hashes'
import * as common from '../common'

function convertLedgerHeader(header): any {
  return {
    account_hash: header.stateHash,
    close_time: common.iso8601ToRippleTime(header.closeTime),
    close_time_resolution: header.closeTimeResolution,
    close_flags: header.closeFlags,
    hash: header.ledgerHash,
    ledger_hash: header.ledgerHash,
    ledger_index: header.ledgerVersion.toString(),
    parent_hash: header.parentLedgerHash,
    parent_close_time: common.iso8601ToRippleTime(header.parentCloseTime),
    total_coins: header.totalDrops,
    transaction_hash: header.transactionHash
  }
}

function hashLedgerHeader(ledgerHeader) {
  const header = convertLedgerHeader(ledgerHeader)
  return computeLedgerHash(header)
}

function computeTransactionHash(
  ledger,
  options: ComputeLedgerHeaderHashOptions
) {
  let transactions: any[]
  if (ledger.rawTransactions) {
    transactions = JSON.parse(ledger.rawTransactions)
  } else if (ledger.transactions) {
    try {
      transactions = ledger.transactions.map((tx) =>
        JSON.parse(tx.rawTransaction)
      )
    } catch (e) {
      if (
        e.toString() ===
        'SyntaxError: Unexpected' + ' token u in JSON at position 0'
      ) {
        // one or more of the `tx.rawTransaction`s is undefined
        throw new common.errors.ValidationError(
          'ledger' + ' is missing raw transactions'
        )
      }
    }
  } else {
    if (options.computeTreeHashes) {
      throw new common.errors.ValidationError(
        'transactions' + ' property is missing from the ledger'
      )
    }
    return ledger.transactionHash
  }
  const txs = _.map(transactions, (tx) => {
    const mergeTx = _.assign({}, _.omit(tx, 'tx'), tx.tx || {})
    // rename `meta` back to `metaData`
    const renameMeta = _.assign(
      {},
      _.omit(mergeTx, 'meta'),
      tx.meta ? {metaData: tx.meta} : {}
    )
    return renameMeta
  })
  const transactionHash = computeTransactionTreeHash(txs)
  if (
    ledger.transactionHash !== undefined &&
    ledger.transactionHash !== transactionHash
  ) {
    throw new common.errors.ValidationError(
      'transactionHash in header' +
        ' does not match computed hash of transactions',
      {
        transactionHashInHeader: ledger.transactionHash,
        computedHashOfTransactions: transactionHash
      }
    )
  }
  return transactionHash
}

function computeStateHash(ledger, options: ComputeLedgerHeaderHashOptions) {
  if (ledger.rawState === undefined) {
    if (options.computeTreeHashes) {
      throw new common.errors.ValidationError(
        'rawState' + ' property is missing from the ledger'
      )
    }
    return ledger.stateHash
  }
  const state = JSON.parse(ledger.rawState)
  const stateHash = computeStateTreeHash(state)
  if (ledger.stateHash !== undefined && ledger.stateHash !== stateHash) {
    throw new common.errors.ValidationError(
      'stateHash in header' + ' does not match computed hash of state'
    )
  }
  return stateHash
}

export type ComputeLedgerHeaderHashOptions = {
  computeTreeHashes?: boolean
}

function computeLedgerHeaderHash(
  ledger: any,
  options: ComputeLedgerHeaderHashOptions = {}
): string {
  const subhashes = {
    transactionHash: computeTransactionHash(ledger, options),
    stateHash: computeStateHash(ledger, options)
  }
  return hashLedgerHeader(_.assign({}, ledger, subhashes))
}

export default computeLedgerHeaderHash
