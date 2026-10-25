import stringify from 'fast-json-stable-stringify'
import { encode, XrplDefinitionsBase } from 'ripple-binary-codec'

import { ValidationError } from '../errors'
import {
  BaseTransaction,
  FirewallDelete,
  FirewallSet,
  LoanSet,
  Signer,
  Transaction,
  validate,
  WithdrawPreauth,
} from '../models'
import { hashSignedTx } from '../utils/hashes'

import {
  compareSigners,
  computeSignature,
  getDecodedTransaction,
} from './utils'

import type { Wallet } from '.'

/**
 * A transaction type that carries a `CounterpartySignature`. rippled verifies
 * that signature with the counterparty signing prefix for any transaction
 * (STTx::checkSign); LoanSet and the Firewall transactions require it.
 */
export type CounterpartySignedTransaction =
  LoanSet | FirewallSet | FirewallDelete | WithdrawPreauth

const COUNTERPARTY_SIGNED_TYPES = [
  'LoanSet',
  'FirewallSet',
  'FirewallDelete',
  'WithdrawPreauth',
]

/** Options of {@link signByCounterparty}. */
export interface CounterpartySignOptions {
  /**
   * Specify true/false to use multisign or actual address (classic/x-address)
   * to make multisign tx request. The actual address is only needed in the
   * case of regular key usage.
   */
  multisign?: boolean | string
  /**
   * Custom rippled types to encode with, for transaction types the bundled
   * definitions.json does not carry yet.
   */
  definitions?: XrplDefinitionsBase
}

/**
 * Throws unless the transaction type carries a CounterpartySignature.
 *
 * @param tx - The transaction.
 * @throws ValidationError for any other transaction type.
 */
function assertCounterpartySignedType(
  tx: BaseTransaction,
): asserts tx is CounterpartySignedTransaction {
  if (!COUNTERPARTY_SIGNED_TYPES.includes(tx.TransactionType)) {
    throw new ValidationError(
      `Transaction type ${tx.TransactionType} does not carry a CounterpartySignature.`,
    )
  }
}

/**
 * Throws unless the first party has signed and the counterparty has not.
 *
 * @param tx - The transaction.
 * @throws ValidationError when the signatures are not in that state.
 */
function assertReadyForCounterparty(tx: Transaction): void {
  if (tx.CounterpartySignature) {
    throw new ValidationError(
      'Transaction is already signed by the counterparty.',
    )
  }
  if (tx.TxnSignature == null || tx.SigningPubKey == null) {
    throw new ValidationError(
      'Transaction must be first signed by first party.',
    )
  }
}

/**
 * The account a multi-signature is made as, or false for a single signature.
 *
 * @param wallet - The signing wallet.
 * @param multisign - The `multisign` option.
 * @returns The account, or false.
 */
function getMultisignAddress(
  wallet: Wallet,
  multisign: boolean | string | undefined,
): string | false {
  if (typeof multisign === 'string') {
    return multisign
  }
  return (multisign ?? false) ? wallet.classicAddress : false
}

/**
 * The counterparty's signature object over a transaction.
 *
 * @param wallet - The counterparty's wallet.
 * @param tx - The transaction, signed by the first party.
 * @param opts - The signing options.
 * @returns A single signature, or a Signers array holding one signer.
 */
function buildCounterpartySignature(
  wallet: Wallet,
  tx: Transaction,
  opts: CounterpartySignOptions,
): NonNullable<CounterpartySignedTransaction['CounterpartySignature']> {
  const multisignAddress = getMultisignAddress(wallet, opts.multisign)
  const signature = computeSignature(
    tx,
    wallet.privateKey,
    multisignAddress === false ? undefined : multisignAddress,
    'counterparty',
    opts.definitions,
  )
  if (multisignAddress === false) {
    return { SigningPubKey: wallet.publicKey, TxnSignature: signature }
  }
  return {
    Signers: [
      {
        Signer: {
          Account: multisignAddress,
          SigningPubKey: wallet.publicKey,
          TxnSignature: signature,
        },
      },
    ],
  }
}

/**
 * Signs a transaction as its counterparty: a LoanSet, or a FirewallSet update,
 * FirewallDelete or WithdrawPreauth (signed by the counterparty recorded on
 * the account's Firewall).
 *
 * @param wallet - The counterparty's wallet used for signing the transaction.
 * @param transaction - The transaction, already signed by the first party, as
 * an object or a serialized blob.
 * @param opts - (Optional) Options for signing the transaction.
 * @returns An object containing:
 *   - `tx`: The signed transaction object
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 *   - `hash`: The transaction hash (useful for tracking the transaction)
 * @throws {ValidationError} If:
 *   - The transaction type does not carry a CounterpartySignature
 *   - The transaction is already signed by the counterparty
 *   - The transaction has not been signed by the first party yet
 *   - The signed transaction fails validation
 */
export function signByCounterparty(
  wallet: Wallet,
  transaction: BaseTransaction | string,
  opts: CounterpartySignOptions = {},
): {
  tx: CounterpartySignedTransaction
  tx_blob: string
  hash: string
} {
  if (typeof transaction !== 'string') {
    assertCounterpartySignedType(transaction)
  }
  const tx = getDecodedTransaction(transaction, opts.definitions)
  assertCounterpartySignedType(tx)
  assertReadyForCounterparty(tx)

  tx.CounterpartySignature = buildCounterpartySignature(wallet, tx, opts)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(tx as unknown as Record<string, unknown>)

  const serialized = encode(tx, opts.definitions)
  return {
    tx,
    tx_blob: serialized,
    hash: hashSignedTx(serialized, opts.definitions),
  }
}

/**
 * Signs a LoanSet transaction as the counterparty. See {@link signByCounterparty}.
 *
 * @param wallet - The counterparty's wallet used for signing the transaction.
 * @param transaction - The LoanSet transaction to sign, signed by the first party.
 * @param opts - (Optional) Options for signing the transaction.
 * @param opts.multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
 * @returns The signed transaction, its blob and its hash.
 * @throws {ValidationError} If the transaction is not a LoanSet transaction,
 * or as {@link signByCounterparty} throws.
 */
export function signLoanSetByCounterparty(
  wallet: Wallet,
  transaction: LoanSet | string,
  opts: { multisign?: boolean | string } = {},
): {
  tx: LoanSet
  tx_blob: string
  hash: string
} {
  if (getDecodedTransaction(transaction).TransactionType !== 'LoanSet') {
    throw new ValidationError('Transaction must be a LoanSet transaction.')
  }
  const signed = signByCounterparty(wallet, transaction, opts)
  if (signed.tx.TransactionType !== 'LoanSet') {
    throw new ValidationError('Transaction must be a LoanSet transaction.')
  }
  return { ...signed, tx: signed.tx }
}

/**
 * Throws unless every transaction is a multi-signed counterparty transaction
 * of the same type, signed by the first party.
 *
 * @param transactions - The decoded transactions.
 * @throws ValidationError when one is not.
 */
function assertCombinable(
  transactions: Transaction[],
): asserts transactions is CounterpartySignedTransaction[] {
  transactions.forEach((tx) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validate(tx as unknown as Record<string, unknown>)
    assertCounterpartySignedType(tx)

    if (
      tx.CounterpartySignature?.Signers == null ||
      tx.CounterpartySignature.Signers.length === 0
    ) {
      throw new ValidationError('CounterpartySignature must have Signers.')
    }

    if (tx.TxnSignature == null || tx.SigningPubKey == null) {
      throw new ValidationError(
        'Transaction must be first signed by first party.',
      )
    }
  })
}

/**
 * Combines transactions multi-signed by counterparty signers into a single
 * transaction carrying every signer, sorted as rippled requires.
 *
 * @param transactions - The signed transactions (objects or blobs) to combine.
 * @param definitions - Custom rippled types to encode and decode with.
 * @returns An object containing:
 *   - `tx`: The combined transaction object
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 * @throws ValidationError if:
 *   - There are no transactions to combine
 *   - Any transaction type does not carry a CounterpartySignature
 *   - Any of the transactions do not have Signers
 *   - Any of the transactions do not have a first party signature
 *   - The transactions differ other than in their counterparty Signers
 */
export function combineCounterpartySigners(
  transactions: Array<CounterpartySignedTransaction | string>,
  definitions?: XrplDefinitionsBase,
): {
  tx: CounterpartySignedTransaction
  tx_blob: string
} {
  if (transactions.length === 0) {
    throw new ValidationError('There are 0 transactions to combine.')
  }

  const decodedTransactions: Transaction[] = transactions.map((txOrBlob) =>
    getDecodedTransaction(txOrBlob, definitions),
  )
  assertCombinable(decodedTransactions)
  validateTransactionEquivalence(decodedTransactions)

  const tx = getTransactionWithAllCounterpartySigners(decodedTransactions)
  return {
    tx,
    tx_blob: encode(tx, definitions),
  }
}

/**
 * Combines multiple LoanSet transactions signed by the counterparty into a
 * single transaction. See {@link combineCounterpartySigners}.
 *
 * @param transactions - An array of signed LoanSet transactions (in object or blob form) to combine.
 * @returns The combined LoanSet transaction and its blob.
 * @throws ValidationError if any transaction is not a LoanSet transaction, or
 * as {@link combineCounterpartySigners} throws.
 */
export function combineLoanSetCounterpartySigners(
  transactions: Array<LoanSet | string>,
): {
  tx: LoanSet
  tx_blob: string
} {
  transactions.forEach((txOrBlob) => {
    if (getDecodedTransaction(txOrBlob).TransactionType !== 'LoanSet') {
      throw new ValidationError('Transaction must be a LoanSet transaction.')
    }
  })
  const combined = combineCounterpartySigners(transactions)
  if (combined.tx.TransactionType !== 'LoanSet') {
    throw new ValidationError('Transaction must be a LoanSet transaction.')
  }
  return { ...combined, tx: combined.tx }
}

/**
 * A transaction as stable JSON with its counterparty Signers removed.
 *
 * @param tx - The transaction.
 * @returns The JSON string.
 */
function stringifyWithoutSigners(tx: CounterpartySignedTransaction): string {
  return stringify({
    ...tx,
    CounterpartySignature: {
      ...tx.CounterpartySignature,
      Signers: null,
    },
  })
}

/**
 * Throws unless the transactions are identical apart from their counterparty
 * Signers.
 *
 * @param transactions - The transactions to compare.
 * @throws ValidationError when they differ.
 */
function validateTransactionEquivalence(
  transactions: CounterpartySignedTransaction[],
): void {
  const exampleTransaction = stringifyWithoutSigners(transactions[0])

  if (
    transactions
      .slice(1)
      .some((tx) => stringifyWithoutSigners(tx) !== exampleTransaction)
  ) {
    throw new ValidationError(
      `${transactions[0].TransactionType} transactions are not the same.`,
    )
  }
}

/**
 * The first transaction with the sorted counterparty Signers of all of them.
 *
 * @param transactions - The transactions to merge.
 * @returns The merged transaction.
 */
function getTransactionWithAllCounterpartySigners<
  T extends CounterpartySignedTransaction,
>(transactions: T[]): T {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: Signer[] = transactions
    .flatMap((tx) => tx.CounterpartySignature?.Signers ?? [])
    .sort((signer1, signer2) => compareSigners(signer1.Signer, signer2.Signer))

  return {
    ...transactions[0],
    CounterpartySignature: { Signers: sortedSigners },
  }
}
