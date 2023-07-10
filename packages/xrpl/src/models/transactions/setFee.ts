import { BaseTransaction } from './common'

export interface SetFeePreAmendment extends BaseTransaction {
  /**
   * The charge, in drops of XRP, for the reference transaction, as hex. (This is the transaction cost before scaling for load.)
   */
  BaseFee: string
  /**
   * The cost, in fee units, of the [reference transaction](https://xrpl.org/transaction-cost.html#reference-transaction-cost)
   */
  ReferenceFeeUnits: number
  /**
   * The base reserve, in drops
   */
  ReserveBase: number
  /**
   * The incremental reserve, in drops
   */
  ReserveIncrement: number
}

export interface SetFeePostAmendment extends BaseTransaction {
  /**
   * The charge, in drops of XRP, for the reference transaction. (This is the transaction cost before scaling for load.)
   */
  BaseFeeDrops: string
  /**
   * The base reserve, in drops
   */
  ReserveBaseDrops: string
  /**
   * The incremental reserve, in drops
   */
  ReserveIncrementDrops: string
}

/**
 * Marks a change in transaction cost or reserve requirements as a result of Fee Voting.
 *
 * The output will be based on the status of the `XRPFees` amendment at the time of this transaction.
 * - Before: {@link SetFeePostAmendment}
 * - After: {@link SetFeePostAmendment}
 *
 * @category Pseudo Transaction Models
 */
export type SetFee = {
  TransactionType: 'SetFee'
} & (SetFeePreAmendment | SetFeePostAmendment)
