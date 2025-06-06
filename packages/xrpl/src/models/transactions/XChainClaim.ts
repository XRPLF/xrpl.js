import { Amount, XChainBridge } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isNumber,
  isString,
  isXChainBridge,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The XChainClaim transaction completes a cross-chain transfer of value. It
 * allows a user to claim the value on the destination chain - the equivalent
 * of the value locked on the source chain.
 *
 * @category Transaction Models
 */
export interface XChainClaim extends BaseTransaction {
  TransactionType: 'XChainClaim'

  /**
   * The bridge to use for the transfer.
   */
  XChainBridge: XChainBridge

  /**
   * The unique integer ID for the cross-chain transfer that was referenced in the
   * corresponding {@link XChainCommit} transaction.
   */
  XChainClaimID: number | string

  /**
   * The destination account on the destination chain. It must exist or the
   * transaction will fail. However, if the transaction fails in this case, the
   * sequence number and collected signatures won't be destroyed, and the
   * transaction can be rerun with a different destination.
   */
  Destination: Account

  /**
   * An integer destination tag.
   */
  DestinationTag?: number

  /**
   * The amount to claim on the destination chain. This must match the amount
   * attested to on the attestations associated with this XChainClaimID.
   */
  Amount: Amount
}

/**
 * Verify the form and type of an XChainClaim at runtime.
 *
 * @param tx - An XChainClaim Transaction.
 * @throws When the XChainClaim is malformed.
 */
export function validateXChainClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(
    tx,
    'XChainClaimID',
    (inp: unknown): inp is number | string => isNumber(inp) || isString(inp),
  )

  validateRequiredField(tx, 'Destination', isAccount)

  validateOptionalField(tx, 'DestinationTag', isNumber)

  validateRequiredField(tx, 'Amount', isAmount)
}
