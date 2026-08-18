import BigNumber from 'bignumber.js'

import type { Client } from '../client'
import { XrplError } from '../errors'
import type Sponsorship from '../models/ledger/Sponsorship'
import { SponsorshipFlags } from '../models/ledger/Sponsorship'
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
 * Validates a transaction's sponsorship (`Sponsor` + `SponsorFlags`) against any
 * Sponsorship ledger entry between the sponsor and sponsee.
 *
 * This should be called before submitting any sponsored transaction, whether
 * pre-funded (no `SponsorSignature`) or co-signed by the sponsor. Whenever a
 * Sponsorship ledger entry exists for the sponsor/sponsee pair, rippled's
 * `checkReserve`/`getFeePayer` always validate against its budget -- `FeeAmount`,
 * `MaxFee`, `RemainingOwnerCount` -- regardless of whether the transaction is
 * also co-signed (XLS-68 section 8.3.2/8.3.3; rippled's `Transactor::checkSponsor`
 * only skips the *existence* check for a co-signed transaction, not the budget
 * checks in `checkReserve`/`getFeePayer`). If no Sponsorship entry exists, a
 * sponsor signature alone is sufficient authorization (matching rippled), and
 * this only validates that one is present.
 *
 * For reserve sponsorship, this only checks that `RemainingOwnerCount` is at
 * least 1 (i.e. the transaction consumes exactly one reserve unit, matching
 * rippled's `checkReserve`). It does not account for transactions that may
 * consume more than one reserve unit, nor does it check the sponsor account's
 * own XRP balance against its own reserve requirement (rippled checks that too,
 * but only server-side).
 *
 * @param client - The XRPL client to use for querying the ledger.
 * @param tx - The transaction to validate sponsorship for.
 * @param estimatedFee - Optional estimated fee in drops. If not provided, uses tx.Fee.
 * @returns A promise that resolves to the validation result.
 *
 * @example
 * ```typescript
 * const result = await validateSponsorship(client, payment, '100')
 * if (!result.valid) {
 *   console.error(`Sponsorship validation failed: ${result.error}`)
 * }
 * ```
 */
// eslint-disable-next-line max-lines-per-function, complexity, max-statements -- necessary for validation
export async function validateSponsorship(
  client: Client,
  tx: Transaction,
  estimatedFee?: string,
): Promise<SponsorshipValidationResult> {
  if (!tx.Sponsor || !tx.SponsorFlags) {
    return {
      valid: false,
      error: 'Transaction does not have Sponsor and SponsorFlags fields',
    }
  }

  const fee = estimatedFee ?? tx.Fee ?? '0'
  const isCoSigned = tx.SponsorSignature != null

  // For delegated transactions, rippled's Transactor::checkSponsor looks up the
  // Sponsorship object between the sponsor and the delegate (STTx::getInitiator()
  // returns sfDelegate when present), not the transaction's Account.
  const sponsee = tx.Delegate ?? tx.Account

  try {
    // Query for the Sponsorship ledger entry
    const sponsorship = await getSponsorshipEntry(client, tx.Sponsor, sponsee)

    if (!sponsorship) {
      // rippled's Transactor::checkSponsor only requires a Sponsorship object
      // to exist for pre-funded (non-co-signed) sponsorship -- a sponsor
      // signature alone is sufficient authorization otherwise.
      if (!isCoSigned) {
        return {
          valid: false,
          error: `No Sponsorship ledger entry found for sponsor ${tx.Sponsor} and sponsee ${sponsee}`,
        }
      }

      return {
        valid: true,
        estimatedFee: fee,
      }
    }

    /* eslint-disable no-bitwise -- bitwise operations required for flag checking */
    const isSponsoringFee = (tx.SponsorFlags & SponsorFlags.spfSponsorFee) !== 0
    const isSponsoringReserve =
      (tx.SponsorFlags & SponsorFlags.spfSponsorReserve) !== 0
    /* eslint-enable no-bitwise */

    // rippled's Transactor::checkSponsor rejects pre-funded (non-co-signed) sponsorship
    // when the Sponsorship object requires the sponsee to sign for that category.
    // A sponsor signature, when present, always satisfies this requirement.
    if (!isCoSigned) {
      /* eslint-disable no-bitwise -- bitwise operations required for flag checking */
      const requiresSignForFee =
        (sponsorship.Flags &
          SponsorshipFlags.lsfSponsorshipRequireSignForFee) !==
        0
      const requiresSignForReserve =
        (sponsorship.Flags &
          SponsorshipFlags.lsfSponsorshipRequireSignForReserve) !==
        0
      /* eslint-enable no-bitwise */

      if (isSponsoringFee && requiresSignForFee) {
        return {
          valid: false,
          error:
            'Sponsorship requires the sponsee to sign for fee sponsorship (lsfSponsorshipRequireSignForFee is set)',
          sponsorship,
          estimatedFee: fee,
        }
      }

      if (isSponsoringReserve && requiresSignForReserve) {
        return {
          valid: false,
          error:
            'Sponsorship requires the sponsee to sign for reserve sponsorship (lsfSponsorshipRequireSignForReserve is set)',
          sponsorship,
          estimatedFee: fee,
        }
      }
    }

    // Whenever a Sponsorship object exists, rippled's checkReserve/getFeePayer
    // always validate against its budget, even when the transaction is also
    // co-signed by the sponsor (XLS-68 section 8.3.2/8.3.3).
    if (isSponsoringReserve) {
      // Validate the sponsor has budget for the reserve unit this
      // transaction will consume (rippled's checkReserve requires
      // RemainingOwnerCount >= the tx's ownerCountDelta), regardless of
      // whether fee sponsorship is also requested.
      if (
        sponsorship.RemainingOwnerCount == null ||
        sponsorship.RemainingOwnerCount < 1
      ) {
        return {
          valid: false,
          error: `Sponsorship RemainingOwnerCount (${String(sponsorship.RemainingOwnerCount)}) is insufficient to cover this reserve-sponsored transaction`,
          sponsorship,
          estimatedFee: fee,
        }
      }
    }

    if (!isSponsoringFee) {
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
          'Sponsorship FeeAmount is required when spfSponsorFee flag is set',
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
    if (
      error instanceof XrplError &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'error' in error.data &&
      error.data.error === 'entryNotFound'
    ) {
      return null
    }
    throw error
  }
}
