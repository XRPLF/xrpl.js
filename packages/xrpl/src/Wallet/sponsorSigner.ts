import stringify from 'fast-json-stable-stringify'
import { encode } from 'ripple-binary-codec'

import { ValidationError } from '../errors'
import { Signer, Transaction, validate } from '../models'
import { areAddressesEqual, SponsorFlags } from '../models/transactions/common'
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
// eslint-disable-next-line max-lines-per-function, complexity -- for extensive validations
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
  if (
    (tx.TxnSignature == null || tx.SigningPubKey == null) &&
    (tx.Signers == null || tx.Signers.length === 0)
  ) {
    throw new ValidationError(
      'Transaction must be first signed by the account.',
    )
  }

  // Validate that SponsorFlags is present on the transaction
  if (tx.SponsorFlags === undefined) {
    throw new ValidationError(
      'Transaction must have SponsorFlags field set before sponsor can sign.',
    )
  }

  // Validate that the Sponsor field is present
  if (tx.Sponsor === undefined) {
    throw new ValidationError(
      'Transaction must have Sponsor field set before sponsor can sign.',
    )
  }

  let multisignAddress: boolean | string = false
  if (typeof opts.multisign === 'string') {
    multisignAddress = opts.multisign
  } else if (opts.multisign) {
    multisignAddress = wallet.classicAddress
  }

  // For single-signing, validate that the Sponsor field matches the wallet
  if (
    !multisignAddress &&
    !areAddressesEqual(tx.Sponsor, wallet.classicAddress)
  ) {
    throw new ValidationError(
      `Transaction Sponsor field (${tx.Sponsor}) does not match the signing wallet address (${wallet.classicAddress}).`,
    )
  }

  // Prevent self-sponsorship - the sponsor cannot be the same as the account.
  // Use tx.Sponsor (not wallet.classicAddress) and areAddressesEqual to handle
  // X-address vs classic address equivalence.
  if (areAddressesEqual(tx.Account, tx.Sponsor)) {
    throw new ValidationError(
      'signAsSponsor: Sponsor cannot be the same as the transaction Account (self-sponsorship not allowed).',
    )
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

  // Validate the final signed transaction (after SponsorSignature is attached)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(tx as unknown as Record<string, unknown>)

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
 * @throws {ValidationError} If:
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

  validateSponsorTransactionEquivalence(decodedTransactions)

  const tx = getTransactionWithAllSponsorSigners(decodedTransactions)

  return {
    tx,
    tx_blob: encode(tx),
  }
}

function validateSponsorTransactionEquivalence(
  transactions: Transaction[],
): void {
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
    throw new ValidationError('Sponsor transactions are not the same.')
  }
}

function getTransactionWithAllSponsorSigners(
  transactions: Transaction[],
): Transaction {
  // Signers must be sorted in the combined transaction - See compareSigners' documentation for more details
  const sortedSigners: Signer[] = transactions
    .flatMap((tx) => tx.SponsorSignature?.Signers ?? [])
    .sort((signer1, signer2) => compareSigners(signer1.Signer, signer2.Signer))

  // Deduplicate signers by Account (keeping the first occurrence after sorting).
  // Duplicate Signer.Account entries are not allowed by rippled and will be rejected.
  const seenAccounts = new Set<string>()
  const uniqueSigners: Signer[] = []
  for (const signer of sortedSigners) {
    if (!seenAccounts.has(signer.Signer.Account)) {
      seenAccounts.add(signer.Signer.Account)
      uniqueSigners.push(signer)
    }
  }

  return {
    ...transactions[0],
    SponsorSignature: { Signers: uniqueSigners },
  }
}

/**
 * Adds sponsor fields to a transaction for use with pre-funded sponsorships.
 *
 * This function is used when a Sponsorship ledger object already exists on-ledger
 * with sufficient balance to cover the transaction. In this case, no sponsor
 * signature is required - only the Sponsor and SponsorFlags fields are needed.
 *
 * @param transaction - The transaction to add sponsor fields to.
 * @param sponsorAddress - The address of the sponsor account (must match an
 *                         existing Sponsorship object on the ledger).
 * @param sponsorFlags - Flags indicating what the sponsor is paying for
 *                       (spfSponsorFee = 0x00000001, spfSponsorReserve = 0x00000002).
 * @returns A new transaction object with Sponsor and SponsorFlags fields added.
 *
 * @throws {ValidationError} If:
 *   - Sponsor and Account are the same (self-sponsorship not allowed)
 *   - SponsorFlags is missing or invalid
 *
 * @example
 * ```typescript
 * import { SponsorFlags } from 'xrpl'
 *
 * const sponsoredTx = addPreFundedSponsor(
 *   payment,
 *   'rSponsorAddress123...',
 *   SponsorFlags.spfSponsorFee
 * )
 * ```
 */
export function addPreFundedSponsor(
  transaction: Transaction,
  sponsorAddress: string,
  sponsorFlags: number,
): Transaction {
  if (areAddressesEqual(transaction.Account, sponsorAddress)) {
    throw new ValidationError(
      'addPreFundedSponsor: Sponsor and Account cannot be the same (self-sponsorship not allowed)',
    )
  }

  if (!Number.isInteger(sponsorFlags)) {
    throw new ValidationError(
      'addPreFundedSponsor: SponsorFlags must be a valid integer',
    )
  }

  /* eslint-disable no-bitwise -- bitwise operations required for flag validation */
  const validFlags = SponsorFlags.spfSponsorFee | SponsorFlags.spfSponsorReserve
  if ((sponsorFlags & ~validFlags) !== 0) {
    throw new ValidationError(
      'addPreFundedSponsor: SponsorFlags contains invalid flags',
    )
  }

  if (sponsorFlags === 0) {
    throw new ValidationError(
      'addPreFundedSponsor: SponsorFlags must have at least one flag set',
    )
  }
  /* eslint-enable no-bitwise */

  return {
    ...transaction,
    Sponsor: sponsorAddress,
    SponsorFlags: sponsorFlags,
  }
}
