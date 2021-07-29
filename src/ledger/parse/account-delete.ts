import * as assert from 'assert'
import {removeUndefined} from '../../common'
import {classicAddressToXAddress} from 'ripple-address-codec'
import {parseMemos} from './utils'

export type FormattedAccountDelete = {
  // account (address) of an account to receive any leftover XRP after deleting the sending account.
  // Must be a funded account in the ledger, and must not be the sending account.
  destination: string

  // (Optional) Arbitrary destination tag that identifies a hosted recipient or other information
  // for the recipient of the deleted account's leftover XRP. NB: Ensure that the hosted recipient is
  // able to account for AccountDelete transactions; if not, your balance may not be properly credited.
  destinationTag?: number

  // X-address of an account to receive any leftover XRP after deleting the sending account.
  // Must be a funded account in the ledger, and must not be the sending account.
  destinationXAddress: string
}

function parseAccountDelete(tx: any): FormattedAccountDelete {
  assert.ok(tx.TransactionType === 'AccountDelete')

  return removeUndefined({
    memos: parseMemos(tx),
    destination: tx.Destination,
    destinationTag: tx.DestinationTag,
    destinationXAddress: classicAddressToXAddress(
      tx.Destination,
      tx.DestinationTag == null ? false : tx.DestinationTag,
      false
    )
  })
}

export default parseAccountDelete
