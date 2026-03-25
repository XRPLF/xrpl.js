import stringify from 'fast-json-stable-stringify'
import { encode } from 'ripple-binary-codec'

import { ValidationError } from '../errors'
import { Signer, Transaction, validate } from '../models'
import { hashSignedTx } from '../utils/hashes'

import {
  compareSigners,
  computeSignature,
  getDecodedTransaction,
} from './utils'

import type { Wallet } from '.'

/**
 * Signs a transaction as the sponsor.
 *
 * This function adds a sponsor signature to a transaction that has already been
 * signed by the account. The sponsor uses their wallet to sign the transaction,
 * which allows them to pay the transaction fees and/or reserves on behalf of the
 * sponsee (the Account field).
 *
 * @param wallet - The sponsor's wallet used for signing the transaction.
 * @param transaction - The transaction to sign as sponsor. Can be either:
 *   - A transaction object that has been signed by the account
 *   - A serialized transaction blob (string) in hex format
 * @param opts - (Optional) Options for signing the transaction.
 * @param opts.multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
 *                       The actual address is only needed in the case of regular key usage.
 * @returns An object containing:
 *   - `tx`: The signed transaction object with SponsorSignature
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 *   - `hash`: The transaction hash (useful for tracking the transaction)
 *
 * @throws {ValidationError} If:
 *   - The transaction is already signed by the sponsor
 *   - The transaction has not been signed by the account yet
 *   - The transaction fails validation
 */
// eslint-disable-next-line max-lines-per-function -- for extensive validations
export function signAsSponsor(
  wallet: Wallet,
  transaction: Transaction | string,
  opts: { multisign?: boolean | string } = {},
): {
  tx: Transaction
  tx_blob: string
  hash: string
} {
  const tx = getDecodedTransaction(transaction)

  if (tx.SponsorSignature) {
    throw new ValidationError('Transaction is already signed by the sponsor.')
  }
  if (tx.TxnSignature == null || tx.SigningPubKey == null) {
    throw new ValidationError(
      'Transaction must be first signed by the account.',
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
    tx.SponsorSignature = {
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
    tx.SponsorSignature = {
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
 * Combines multiple transactions signed by the sponsor into a single transaction.
 *
 * @param transactions - An array of signed transactions (in object or blob form) to combine.
 * @returns An object containing:
 *   - `tx`: The combined transaction object
 *   - `tx_blob`: The serialized transaction blob (hex string) ready to submit to the ledger
 * @throws ValidationError if:
 *   - There are no transactions to combine
 *   - Any of the transactions do not have Signers in SponsorSignature
 *   - Any of the transactions do not have an account signature
 */
export function combineSponsorSigners(
  transactions: Array<Transaction | string>,
): {
  tx: Transaction
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

    if (
      tx.SponsorSignature?.Signers == null ||
      tx.SponsorSignature.Signers.length === 0
    ) {
      throw new ValidationError('SponsorSignature must have Signers.')
    }

    if (tx.TxnSignature == null || tx.SigningPubKey == null) {
      throw new ValidationError(
        'Transaction must be first signed by the account.',
      )
    }
  })

  validateTransactionEquivalence(decodedTransactions)

  const tx = getTransactionWithAllSponsorSigners(decodedTransactions)

  return {
    tx,
    tx_blob: encode(tx),
  }
}

function validateTransactionEquivalence(transactions: Transaction[]): void {
  const exampleTransaction = stringify({
    ...transactions[0],
    SponsorSignature: {
      ...transactions[0].SponsorSignature,
      Signers: null,
    },
  })

  if (
    transactions.slice(1).some(
      (tx) =>
        stringify({
          ...tx,
          SponsorSignature: {
            ...tx.SponsorSignature,
            Signers: null,
          },
        }) !== exampleTransaction,
    )
  ) {
    throw new ValidationError('Transactions are not the same.')
  }
}

function getTransactionWithAllSponsorSigners(
  transactions: Transaction[],
): Transaction {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: Signer[] = transactions
    .flatMap((tx) => tx.SponsorSignature?.Signers ?? [])
    .sort((signer1, signer2) => compareSigners(signer1.Signer, signer2.Signer))

  return {
    ...transactions[0],
    SponsorSignature: { Signers: sortedSigners },
  }
}
