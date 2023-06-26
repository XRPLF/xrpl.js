import { BaseTransaction } from './common'

export interface SetFeeBase extends BaseTransaction {
  TransactionType: 'SetFee'
}

export interface SetFeePreAmendment extends SetFeeBase {
  /**
   * The charge, in drops of XRP, for the reference transaction, as hex. (This is the transaction cost before scaling for load.)
   */
  BaseFee: string
  /**
   * The cost, in fee units, of the reference transaction
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

  BaseFeeDrops?: never
  ReserveBaseDrops?: never
  ReserveIncrementDrops?: never
}

export interface SetFeePostAmendment extends SetFeeBase {
  BaseFee?: never
  ReferenceFeeUnits?: never
  ReserveBase?: never
  ReserveIncrement?: never

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
 * @interface
 *
 * @category Pseudo Transaction Models
 */
export type SetFee = SetFeePreAmendment | SetFeePostAmendment
