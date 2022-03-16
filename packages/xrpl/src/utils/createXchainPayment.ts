import { convertStringToHex } from './stringConversion'
import { Payment } from '../models'
import { Memo } from '../models/common'
import { XrplError } from '../errors'

/**
 * Computes the complete list of every balance that changed in the ledger
 * as a result of the given transaction.
 *
 * @param payment - The initial payment transaction. If the transaction is
 * signed, then it will need to be re-signed. There must be no more than 2
 * memos, since one memo is used for the sidechain destination account.
 * @param destAccount - the destination account on the sidechain.
 * @returns A cross-chain payment transaction, where the mainchain door account
 * is the `Destination` and the destination account on the sidechain is encoded
 * in the memos.
 * @throws XrplError - if there are more than 2 memos.
 * @category Utilities
 */
export default function createXchainPayment(
  payment: Payment,
  destAccount: string,
): Payment {
  const destAccountHex = convertStringToHex(destAccount)
  const destAccountMemo: Memo = { Memo: { MemoData: destAccountHex } }

  const memos = payment.Memos || []
  if (memos.length > 2) {
    throw new XrplError(
      'Cannot have more than 2 memos in a cross-chain transaction.',
    )
  }
  const newMemos = [destAccountMemo, ...memos]

  const newPayment = { ...payment, Memos: newMemos }
  delete newPayment.TxnSignature

  return newPayment
}
