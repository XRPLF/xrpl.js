import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { hasFlag } from '../utils'
import { amountValue, isSameAsset } from '../utils/amount'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  validateBaseTransaction,
  isAmount,
  isNumber,
  validateOptionalField,
  validateRequiredField,
  isDomainID,
} from './common'

/**
 * Transaction Flags for an OfferCreate Transaction.
 *
 * @category Transaction Flags
 */
export enum OfferCreateFlags {
  /**
   * If enabled, the offer does not consume offers that exactly match it, and
   * instead becomes an Offer object in the ledger. It still consumes offers
   * that cross it.
   */
  tfPassive = 0x00010000,
  /**
   * Treat the offer as an Immediate or Cancel order. If enabled, the offer
   * never becomes a ledger object: it only tries to match existing offers in
   * the ledger. If the offer cannot match any offers immediately, it executes
   * "successfully" without trading any currency. In this case, the transaction
   * has the result code tesSUCCESS, but creates no Offer objects in the ledger.
   */
  tfImmediateOrCancel = 0x00020000,
  /**
   * Treat the offer as a Fill or Kill order . Only try to match existing
   * offers in the ledger, and only do so if the entire TakerPays quantity can
   * be obtained. If the fix1578 amendment is enabled and the offer cannot be
   * executed when placed, the transaction has the result code tecKILLED;
   * otherwise, the transaction uses the result code tesSUCCESS even when it was
   * killed without trading any currency.
   */
  tfFillOrKill = 0x00040000,
  /**
   * Exchange the entire TakerGets amount, even if it means obtaining more than
   * the TakerPays amount in exchange.
   */
  tfSell = 0x00080000,
  /**
   * Indicates the offer is hybrid. (meaning it is part of both a domain and open order book)
   * This flag cannot be set if the offer doesn't have a DomainID
   */
  tfHybrid = 0x00100000,
  /**
   * (OfferQualifiers) Fill the offer completely or not at all, at placement and
   * whenever it is later crossed. Cannot be combined with tfImmediateOrCancel,
   * tfFillOrKill or a MinQuantity.
   */
  tfAllOrNone = 0x00200000,
  /**
   * (OfferQualifiers) Never take liquidity: the offer fails with tecWOULD_CROSS
   * instead of crossing an existing offer. Cannot be combined with
   * tfImmediateOrCancel, tfFillOrKill or tfSell.
   */
  tfPostOnly = 0x00400000,
}

/**
 * Map of flags to boolean values representing {@link OfferCreate} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const tx: OfferCreate = {
 * Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * TakerGets: '43000.51',
 * TakerPays: '12928290425',
 * TransactionType: 'OfferCreate',
 * Flags: {
 *   tfPassive: true,
 *   tfFillOrKill: true,
 *  },
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(tx)
 * console.log(autofilledTx)
 * // {
 * // Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * // TakerGets: '43000.51',
 * // TakerPays: '12928290425',
 * // TransactionType: 'OfferCreate',
 * // Flags: 327680,
 * // Sequence: 21970384,
 * // Fee: '12',
 * // LastLedgerSequence: 21970404
 * // }
 * ```
 */
export interface OfferCreateFlagsInterface extends GlobalFlagsInterface {
  tfPassive?: boolean
  tfImmediateOrCancel?: boolean
  tfFillOrKill?: boolean
  tfSell?: boolean
  tfHybrid?: boolean
  tfAllOrNone?: boolean
  tfPostOnly?: boolean
}

/**
 * An OfferCreate transaction is effectively a limit order . It defines an
 * intent to exchange currencies, and creates an Offer object if not completely.
 * Fulfilled when placed. Offers can be partially fulfilled.
 *
 * @category Transaction Models
 */
export interface OfferCreate extends BaseTransaction {
  TransactionType: 'OfferCreate'
  Flags?: number | OfferCreateFlagsInterface
  /**
   * Time after which the offer is no longer active, in seconds since the.
   * Ripple Epoch.
   */
  Expiration?: number
  /** An offer to delete first, specified in the same way as OfferCancel. */
  OfferSequence?: number
  /** The amount and type of currency being provided by the offer creator. */
  TakerGets: Amount
  /** The amount and type of currency being requested by the offer creator. */
  TakerPays: Amount
  /** The domain that the offer must be a part of. */
  DomainID?: string
  /**
   * (OfferQualifiers) The smallest amount of TakerGets any single fill may
   * deliver. Must be in the TakerGets asset, greater than 0 and no more than
   * TakerGets. Cannot be combined with tfAllOrNone.
   */
  MinQuantity?: Amount | MPTAmount
}

/**
 * Verify the form and type of an OfferCreate at runtime.
 *
 * @param tx - An OfferCreate Transaction.
 * @throws When the OfferCreate is Malformed.
 */
export function validateOfferCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'TakerGets', isAmount)
  validateRequiredField(tx, 'TakerPays', isAmount)
  validateOptionalField(tx, 'Expiration', isNumber)
  validateOptionalField(tx, 'OfferSequence', isNumber)

  validateOptionalField(tx, 'DomainID', isDomainID, {
    txType: 'OfferCreate',
    paramName: 'DomainID',
  })

  if (
    tx.DomainID == null &&
    hasFlag(tx, OfferCreateFlags.tfHybrid, 'tfHybrid')
  ) {
    throw new ValidationError(
      'OfferCreate: tfHybrid flag cannot be set if DomainID is not present',
    )
  }

  validateOfferQualifiers(tx)
}

/**
 * Check the OfferQualifiers rules: tfAllOrNone excludes tfImmediateOrCancel,
 * tfFillOrKill and MinQuantity; tfPostOnly excludes tfImmediateOrCancel,
 * tfFillOrKill and tfSell; MinQuantity is in the TakerGets asset, greater than 0
 * and no more than TakerGets.
 *
 * @param tx - An OfferCreate Transaction.
 * @throws When a qualifier rule is broken.
 */
function validateOfferQualifiers(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'MinQuantity', isAmount)

  const isTakeOnly =
    hasFlag(tx, OfferCreateFlags.tfImmediateOrCancel, 'tfImmediateOrCancel') ||
    hasFlag(tx, OfferCreateFlags.tfFillOrKill, 'tfFillOrKill')
  const isAllOrNone = hasFlag(tx, OfferCreateFlags.tfAllOrNone, 'tfAllOrNone')

  if (isAllOrNone && isTakeOnly) {
    throw new ValidationError(
      'OfferCreate: tfAllOrNone cannot be combined with tfImmediateOrCancel or tfFillOrKill',
    )
  }

  if (
    hasFlag(tx, OfferCreateFlags.tfPostOnly, 'tfPostOnly') &&
    (isTakeOnly || hasFlag(tx, OfferCreateFlags.tfSell, 'tfSell'))
  ) {
    throw new ValidationError(
      'OfferCreate: tfPostOnly cannot be combined with tfImmediateOrCancel, tfFillOrKill or tfSell',
    )
  }

  if (tx.MinQuantity === undefined) {
    return
  }

  if (isAllOrNone) {
    throw new ValidationError(
      'OfferCreate: MinQuantity cannot be set together with tfAllOrNone',
    )
  }

  validateMinQuantity(tx.MinQuantity, tx.TakerGets)
}

/**
 * Check that MinQuantity is in the TakerGets asset, greater than 0 and no more
 * than TakerGets.
 *
 * @param minQuantity - The MinQuantity amount.
 * @param takerGets - The TakerGets amount.
 * @throws When MinQuantity is in another asset or out of range.
 */
function validateMinQuantity(
  minQuantity: Amount | MPTAmount,
  takerGets: unknown,
): void {
  if (!isAmount(takerGets) || !isSameAsset(minQuantity, takerGets)) {
    throw new ValidationError(
      'OfferCreate: MinQuantity must be in the TakerGets asset',
    )
  }

  const value = amountValue(minQuantity)
  if (!value.isGreaterThan(0) || value.isGreaterThan(amountValue(takerGets))) {
    throw new ValidationError(
      'OfferCreate: MinQuantity must be greater than 0 and no more than TakerGets',
    )
  }
}
