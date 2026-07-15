import BigNumber from 'bignumber.js'

import type { Client } from '../client'
import { XrplError } from '../errors'
import type Sponsorship from '../models/ledger/Sponsorship'
import type { LedgerEntryRequest } from '../models/methods/ledgerEntry'
import type { Transaction } from '../models/transactions'
import { SponsorFlags } from '../models/transactions/common'

/**
 * Validation result for a pre-funded sponsorship.
 */
export interface SponsorshipValidationResult {
  /** Whether the sponsorship is valid */
  valid: boolean
  /** Error message if validation failed */
  error?: string
  /** The Sponsorship ledger entry if found */
  sponsorship?: Sponsorship
  /** The estimated transaction fee in drops */
  estimatedFee?: string
}

/**
 * Validates that a pre-funded Sponsorship ledger entry exists and has sufficient
 * balance to cover the sponsored transaction.
 *
 * This helper should be called before submitting a transaction that uses pre-funded
 * sponsorship (i.e., has Sponsor and SponsorFlags but no SponsorSignature).
 *
 * @param client - The XRPL client to use for querying the ledger.
 * @param tx - The transaction to validate sponsorship for.
 * @param estimatedFee - Optional estimated fee in drops. If not provided, uses tx.Fee.
 * @returns A promise that resolves to the validation result.
 *
 * @example
 * ```typescript
 * const result = await validatePreFundedSponsorship(client, payment, '100')
 * if (!result.valid) {
 *   console.error(`Sponsorship validation failed: ${result.error}`)
 * }
 * ```
 */
// eslint-disable-next-line max-lines-per-function, complexity, max-statements -- necessary for validation
export async function validatePreFundedSponsorship(
  client: Client,
  tx: Transaction,
  estimatedFee?: string,
): Promise<SponsorshipValidationResult> {
  // Only validate if transaction has Sponsor and SponsorFlags but no SponsorSignature
  if (!tx.Sponsor || !tx.SponsorFlags) {
    return {
      valid: false,
      error: 'Transaction does not have Sponsor and SponsorFlags fields',
    }
  }

  if (tx.SponsorSignature) {
    return {
      valid: false,
      error:
        'Transaction has SponsorSignature - this validation is only for pre-funded sponsorships',
    }
  }

  const fee = estimatedFee ?? tx.Fee ?? '0'

  try {
    // Query for the Sponsorship ledger entry
    const sponsorship = await getSponsorshipEntry(
      client,
      tx.Sponsor,
      tx.Account,
    )

    if (!sponsorship) {
      return {
        valid: false,
        error: `No Sponsorship ledger entry found for sponsor ${tx.Sponsor} and sponsee ${tx.Account}`,
      }
    }

    // Check if sponsorship is for fee payment
    /* eslint-disable no-bitwise -- bitwise operations required for flag checking */
    const isSponsoringFee = (tx.SponsorFlags & SponsorFlags.tfSponsorFee) !== 0
    /* eslint-enable no-bitwise */

    if (!isSponsoringFee) {
      // Only reserve sponsorship, no fee validation needed
      return {
        valid: true,
        sponsorship,
        estimatedFee: fee,
      }
    }

    // When sponsoring fee, FeeAmount must be present
    if (sponsorship.FeeAmount == null) {
      return {
        valid: false,
        error:
          'Sponsorship FeeAmount is required when tfSponsorFee flag is set',
        sponsorship,
        estimatedFee: fee,
      }
    }

    // Validate FeeAmount has sufficient balance
    if (sponsorship.FeeAmount) {
      const feeAmount = new BigNumber(sponsorship.FeeAmount)
      const txFee = new BigNumber(fee)

      if (feeAmount.isLessThan(txFee)) {
        return {
          valid: false,
          error: `Sponsorship FeeAmount (${sponsorship.FeeAmount} drops) is insufficient for transaction fee (${fee} drops)`,
          sponsorship,
          estimatedFee: fee,
        }
      }
    }

    // Validate MaxFee if set
    if (sponsorship.MaxFee) {
      const maxFee = new BigNumber(sponsorship.MaxFee)
      const txFee = new BigNumber(fee)

      if (txFee.isGreaterThan(maxFee)) {
        return {
          valid: false,
          error: `Transaction fee (${fee} drops) exceeds sponsorship MaxFee (${sponsorship.MaxFee} drops)`,
          sponsorship,
          estimatedFee: fee,
        }
      }
    }

    return {
      valid: true,
      sponsorship,
      estimatedFee: fee,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Retrieves a Sponsorship ledger entry from the ledger.
 *
 * @param client - The XRPL client.
 * @param sponsor - The sponsor account address.
 * @param sponsee - The sponsee account address.
 * @returns The Sponsorship ledger entry, or null if not found.
 */
async function getSponsorshipEntry(
  client: Client,
  sponsor: string,
  sponsee: string,
): Promise<Sponsorship | null> {
  try {
    const request: LedgerEntryRequest = {
      command: 'ledger_entry',
      sponsorship: {
        sponsor,
        sponsee,
      },
    }

    const response = await client.request(request)
    const entry = response.result.node

    if (
      typeof entry === 'object' &&
      'LedgerEntryType' in entry &&
      entry.LedgerEntryType === 'Sponsorship'
    ) {
      return entry
    }

    return null
  } catch (error) {
    if (error instanceof XrplError && error.message.includes('entryNotFound')) {
      return null
    }
    throw error
  }
}
