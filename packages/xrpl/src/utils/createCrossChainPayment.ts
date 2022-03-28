import { XrplError } from '../errors'
import { Payment } from '../models'
import { Memo } from '../models/common'

import { convertStringToHex } from './stringConversion'

/**
 * Creates a cross-chain payment transaction.
 *
 * @param payment - The initial payment transaction. If the transaction is
 * signed, then it will need to be re-signed. There must be no more than 2
 * memos, since one memo is used for the sidechain destination account. The
 * destination must be the sidechain's door account.
 * @param destAccount - the destination account on the sidechain.
 * @returns A cross-chain payment transaction, where the mainchain door account
 * is the `Destination` and the destination account on the sidechain is encoded
 * in the memos.
 * @throws XrplError - if there are more than 2 memos.
 * @category Utilities
 */
export default function createCrossChainPayment(
  payment: Payment,
  destAccount: string,
): Payment {
  const destAccountHex = convertStringToHex(destAccount)
  const destAccountMemo: Memo = { Memo: { MemoData: destAccountHex } }

  const memos = payment.Memos ?? []
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
