import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  isString,
  SponsorSignature,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * A SponsorshipTransfer transaction transfers a sponsor relationship for a
 * particular ledger object's reserve. The sponsor relationship can either be
 * passed on to a new sponsor, or dissolved entirely (with the sponsee taking
 * on the reserve). Either the sponsor or sponsee may submit this transaction
 * at any point in time.
 *
 * There are three valid transfer scenarios:
 * 1. Transferring from sponsor to sponsee (sponsored to unsponsored)
 *    - Either the sponsor or sponsee may submit this transaction.
 * 2. Transferring from sponsee to sponsor (unsponsored to sponsored)
 *    - Only the sponsee may submit this transaction.
 * 3. Transferring from sponsor to new sponsor
 *    - Only the sponsee may submit this transaction.
 *
 * @category Transaction Models
 */
export interface SponsorshipTransfer extends BaseTransaction {
  TransactionType: 'SponsorshipTransfer'
  /**
   * The ID of the ledger object to transfer sponsorship for. If not included,
   * refers to the account sending the transaction.
   */
  ObjectID?: string
  /**
   * The new sponsor of the object. If not included (or if tfSponsorReserve is
   * not set in SponsorFlags), the burden of the reserve will be passed back
   * to the ledger object's owner (the former sponsee).
   */
  Sponsor?: Account
  /**
   * Flags indicating what type of sponsorship this is. Should include
   * tfSponsorReserve (2) if transferring to a new sponsor.
   */
  SponsorFlags?: number
  /**
   * The sponsor's signature information to authorize the sponsorship transfer.
   * Required when transferring to a new sponsor.
   */
  SponsorSignature?: SponsorSignature
}

/**
 * Verify the form and type of a SponsorshipTransfer at runtime.
 *
 * @param tx - A SponsorshipTransfer Transaction.
 * @throws When the SponsorshipTransfer is malformed.
 */
export function validateSponsorshipTransfer(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'ObjectID', isString)
  validateOptionalField(tx, 'Sponsor', isAccount)
  validateOptionalField(tx, 'SponsorFlags', isNumber)
}

