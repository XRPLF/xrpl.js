import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link XChainModifyBridge} transaction flags.
 *
 * @category Transaction Flags
 */
export enum XChainModifyBridgeFlags {
  /** Clears the MinAccountCreateAmount of the bridge. */
  tfClearAccountCreateAmount = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link XChainModifyBridge} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface XChainModifyBridgeFlagsInterface extends GlobalFlagsInterface {
  /** Clears the MinAccountCreateAmount of the bridge. */
  tfClearAccountCreateAmount?: boolean
}

/**
 * The XChainModifyBridge transaction allows bridge managers to modify the parameters
 * of the bridge.
 *
 * @category Transaction Models
 */
export interface XChainModifyBridge extends BaseTransaction {
  TransactionType: 'XChainModifyBridge'

  /**
   * The bridge to modify.
   */
  XChainBridge: XChainBridge

  /**
   * The signature reward split between the witnesses for submitting attestations.
   */
  SignatureReward?: Amount

  /**
   * The minimum amount, in XRP, required for a {@link XChainAccountCreateCommit}
   * transaction. If this is not present, the {@link XChainAccountCreateCommit}
   * transaction will fail. This field can only be present on XRP-XRP bridges.
   */
  MinAccountCreateAmount?: Amount

  Flags?: number | XChainModifyBridgeFlagsInterface
}

/**
 * Verify the form and type of an XChainModifyBridge at runtime.
 *
 * @param tx - An XChainModifyBridge Transaction.
 * @throws When the XChainModifyBridge is malformed.
 */
export function validateXChainModifyBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateOptionalField(tx, 'SignatureReward', isAmount)

  validateOptionalField(tx, 'MinAccountCreateAmount', isAmount)
}
