import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  validateBaseTransaction,
  isAmount,
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
export interface OfferCreateFlagsInterface extends GlobalFlags {
  tfPassive?: boolean
  tfImmediateOrCancel?: boolean
  tfFillOrKill?: boolean
  tfSell?: boolean
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
}

/**
 * Verify the form and type of an OfferCreate at runtime.
 *
 * @param tx - An OfferCreate Transaction.
 * @throws When the OfferCreate is Malformed.
 */
export function validateOfferCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.TakerGets === undefined) {
    throw new ValidationError('OfferCreate: missing field TakerGets')
  }

  if (tx.TakerPays === undefined) {
    throw new ValidationError('OfferCreate: missing field TakerPays')
  }

  if (typeof tx.TakerGets !== 'string' && !isAmount(tx.TakerGets)) {
    throw new ValidationError('OfferCreate: invalid TakerGets')
  }

  if (typeof tx.TakerPays !== 'string' && !isAmount(tx.TakerPays)) {
    throw new ValidationError('OfferCreate: invalid TakerPays')
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('OfferCreate: invalid Expiration')
  }

  if (tx.OfferSequence !== undefined && typeof tx.OfferSequence !== 'number') {
    throw new ValidationError('OfferCreate: invalid OfferSequence')
  }
}
