import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  Account,
  validateOptionalField,
  isAccount,
  GlobalFlagsInterface,
} from './common'

/**
 * Transaction Flags for an MPTokenAuthorize Transaction.
 *
 * @category Transaction Flags
 */
export enum MPTokenAuthorizeFlags {
  /**
   * If set and transaction is submitted by a holder, it indicates that the holder no
   * longer wants to hold the MPToken, which will be deleted as a result. If the the holder's
   * MPToken has non-zero balance while trying to set this flag, the transaction will fail. On
   * the other hand, if set and transaction is submitted by an issuer, it would mean that the
   * issuer wants to unauthorize the holder (only applicable for allow-listing),
   * which would unset the lsfMPTAuthorized flag on the MPToken.
   */
  tfMPTUnauthorize = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link MPTokenAuthorize} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface MPTokenAuthorizeFlagsInterface extends GlobalFlagsInterface {
  tfMPTUnauthorize?: boolean
}

/**
 * The MPTokenAuthorize transaction is used to globally lock/unlock a MPTokenIssuance,
 * or lock/unlock an individual's MPToken.
 */
export interface MPTokenAuthorize extends BaseTransaction {
  TransactionType: 'MPTokenAuthorize'
  /**
   * Identifies the MPTokenIssuance
   */
  MPTokenIssuanceID: string
  /**
   * An optional XRPL Address of an individual token holder balance to lock/unlock.
   * If omitted, this transaction will apply to all any accounts holding MPTs.
   */
  Holder?: Account
  Flags?: number | MPTokenAuthorizeFlagsInterface
}

/**
 * Verify the form and type of an MPTokenAuthorize at runtime.
 *
 * @param tx - An MPTokenAuthorize Transaction.
 * @throws When the MPTokenAuthorize is Malformed.
 */
export function validateMPTokenAuthorize(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateOptionalField(tx, 'Holder', isAccount)
}
