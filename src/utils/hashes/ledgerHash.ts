import { ValidationError } from '../../common/errors'
import type { Ledger } from '../../models/ledger'

import {
  computeLedgerHash,
  computeTransactionTreeHash,
  computeStateTreeHash,
} from '.'

interface ComputeLedgerHeaderHashOptions {
  computeTreeHashes?: boolean
}

function hashLedgerHeader(ledger: Ledger): string {
  return computeLedgerHash(ledger)
}

function computeTransactionHash(
  ledger: Ledger,
  options: ComputeLedgerHeaderHashOptions,
): string {
  const { transaction_hash } = ledger

  if (!options.computeTreeHashes) {
    return transaction_hash
  }

  if (ledger.transactions == null) {
    throw new ValidationError('transactions is missing from the ledger')
  }

  const transactionHash = computeTransactionTreeHash(ledger.transactions)

  if (transaction_hash !== transactionHash) {
    throw new ValidationError(
      'transactionHash in header' +
        ' does not match computed hash of transactions',
      {
        transactionHashInHeader: transaction_hash,
        computedHashOfTransactions: transactionHash,
      },
    )
  }
  return transactionHash
}

function computeStateHash(
  ledger: Ledger,
  options: ComputeLedgerHeaderHashOptions,
): string {
  const { account_hash } = ledger

  if (!options.computeTreeHashes) {
    return account_hash
  }

  if (ledger.accountState == null) {
    throw new ValidationError('accountState is missing from the ledger')
  }

  const stateHash = computeStateTreeHash(ledger.accountState)

  if (account_hash !== stateHash) {
    throw new ValidationError(
      'stateHash in header does not match computed hash of state',
    )
  }

  return stateHash
}

/**
 * Compute the hash of a ledger.
 *
 * @param ledger - Ledger to compute the hash for.
 * @param options - Allow client to recompute Transaction and State Hashes.
 * @returns The has of ledger.
 */
function computeLedgerHeaderHash(
  ledger: Ledger,
  options: ComputeLedgerHeaderHashOptions = {},
): string {
  const subhashes = {
    transaction_hash: computeTransactionHash(ledger, options),
    account_hash: computeStateHash(ledger, options),
  }
  return hashLedgerHeader({ ...ledger, ...subhashes })
}

export default computeLedgerHeaderHash
