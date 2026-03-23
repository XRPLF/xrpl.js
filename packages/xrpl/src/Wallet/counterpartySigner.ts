import stringify from 'fast-json-stable-stringify'
import { encode } from 'ripple-binary-codec'

import { ValidationError } from '../errors'
import { LoanSet, Signer, Transaction, validate } from '../models'
import { hashSignedTx } from '../utils/hashes'

import {
  compareSigners,
  computeSignature,
  getDecodedTransaction,
} from './utils'

import type { Wallet } from '.'

/**
 * Signs a LoanSet transaction as the counterparty.
 *
 * This function adds a counterparty signature to a LoanSet transaction that has already been
 * signed by the first party. The counterparty uses their wallet to sign the transaction,
 * which is required for multi-party loan agreements on the XRP Ledger.
 *
 * @param wallet - The counterparty's wallet used for signing the transaction.
 * @param transaction - The LoanSet transaction to sign. Can be either:
 *   - A LoanSet transaction object that has been signed by the first party
 *   - A serialized transaction blob (string) in hex format
 * @param opts - (Optional) Options for signing the transaction.
 * @param opts.multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
 *                       The actual address is only needed in the case of regular key usage.
 * @returns An object containing:
 *   - `tx`: The signed LoanSet transaction object
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 *   - `hash`: The transaction hash (useful for tracking the transaction)
 *
 * @throws {ValidationError} If:
 *   - The transaction is not a LoanSet transaction
 *   - The transaction is already signed by the counterparty
 *   - The transaction has not been signed by the first party yet
 *   - The transaction fails validation
 */
// eslint-disable-next-line max-lines-per-function -- for extensive validations
export function signLoanSetByCounterparty(
  wallet: Wallet,
  transaction: LoanSet | string,
  opts: { multisign?: boolean | string } = {},
): {
  tx: LoanSet
  tx_blob: string
  hash: string
} {
  const tx = getDecodedTransaction(transaction)

  if (tx.TransactionType !== 'LoanSet') {
    throw new ValidationError('Transaction must be a LoanSet transaction.')
  }
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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(tx as unknown as Record<string, unknown>)

  let multisignAddress: boolean | string = false
  if (typeof opts.multisign === 'string') {
    multisignAddress = opts.multisign
  } else if (opts.multisign) {
    multisignAddress = wallet.classicAddress
  }

  if (multisignAddress) {
    tx.CounterpartySignature = {
      Signers: [
        {
          Signer: {
            Account: multisignAddress,
            SigningPubKey: wallet.publicKey,
            TxnSignature: computeSignature(
              tx,
              wallet.privateKey,
              multisignAddress,
            ),
          },
        },
      ],
    }
  } else {
    tx.CounterpartySignature = {
      SigningPubKey: wallet.publicKey,
      TxnSignature: computeSignature(tx, wallet.privateKey),
    }
  }

  const serialized = encode(tx)
  return {
    tx,
    tx_blob: serialized,
    hash: hashSignedTx(serialized),
  }
}

/**
 * Combines multiple LoanSet transactions signed by the counterparty into a single transaction.
 *
 * @param transactions - An array of signed LoanSet transactions (in object or blob form) to combine.
 * @returns An object containing:
 *   - `tx`: The combined LoanSet transaction object
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 * @throws ValidationError if:
 *   - There are no transactions to combine
 *   - Any of the transactions are not LoanSet transactions
 *   - Any of the transactions do not have Signers
 *   - Any of the transactions do not have a first party signature
 */
export function combineLoanSetCounterpartySigners(
  transactions: Array<LoanSet | string>,
): {
  tx: LoanSet
  tx_blob: string
} {
  if (transactions.length === 0) {
    throw new ValidationError('There are 0 transactions to combine.')
  }

  const decodedTransactions: Transaction[] = transactions.map(
    (txOrBlob: string | Transaction) => {
      return getDecodedTransaction(txOrBlob)
    },
  )

  decodedTransactions.forEach((tx) => {
    /*
     * This will throw a more clear error for JS users if any of the supplied transactions has incorrect formatting
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validate(tx as unknown as Record<string, unknown>)

    if (tx.TransactionType !== 'LoanSet') {
      throw new ValidationError('Transaction must be a LoanSet transaction.')
    }

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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
  const loanSetTransactions = decodedTransactions as LoanSet[]

  validateLoanSetTransactionEquivalence(loanSetTransactions)

  const tx =
    getTransactionWithAllLoanSetCounterpartySigners(loanSetTransactions)

  return {
    tx,
    tx_blob: encode(tx),
  }
}

function validateLoanSetTransactionEquivalence(transactions: LoanSet[]): void {
  const exampleTransaction = stringify({
    ...transactions[0],
    CounterpartySignature: {
      ...transactions[0].CounterpartySignature,
      Signers: null,
    },
  })

  if (
    transactions.slice(1).some(
      (tx) =>
        stringify({
          ...tx,
          CounterpartySignature: {
            ...tx.CounterpartySignature,
            Signers: null,
          },
        }) !== exampleTransaction,
    )
  ) {
    throw new ValidationError('LoanSet transactions are not the same.')
  }
}

function getTransactionWithAllLoanSetCounterpartySigners(
  transactions: LoanSet[],
): LoanSet {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: Signer[] = transactions
    .flatMap((tx) => tx.CounterpartySignature?.Signers ?? [])
    .sort((signer1, signer2) => compareSigners(signer1.Signer, signer2.Signer))

  return {
    ...transactions[0],
    CounterpartySignature: { Signers: sortedSigners },
  }
}
