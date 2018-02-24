import * as assert from 'assert'
import {parseTimestamp} from './utils'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parseCheckCreate(tx: any): Object {
  assert(tx.TransactionType === 'CheckCreate')

  return removeUndefined({

    // account that can cash the check.
    destination: tx.Destination,

    // amount the check is allowed to debit the sender,
    // including transfer fees on non-XRP currencies.
    sendMax: parseAmount(tx.SendMax),

    // (Optional) identifies the reason for the check, or a hosted recipient.
    destinationTag: tx.DestinationTag,

    // (Optional) time in seconds since the Ripple Epoch.
    expiration: tx.Expiration && parseTimestamp(tx.Expiration),

    // (Optional) 256-bit hash representing a specific reason or identifier.
    invoiceID: tx.InvoiceID
  })
}

export default parseCheckCreate
