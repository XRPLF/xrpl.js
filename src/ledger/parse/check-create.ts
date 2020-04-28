import * as assert from 'assert'
import {parseTimestamp} from './utils'
import {removeUndefined} from '../../common'
import parseAmount from './amount'
import {Amount} from '../../common/types/objects'

export type FormattedCheckCreate = {
  // account that can cash the check.
  destination: string

  // amount the check is allowed to debit the sender,
  // including transfer fees on non-XRP currencies.
  sendMax: Amount

  // (Optional) identifies the reason for the check, or a hosted recipient.
  destinationTag?: string

  // (Optional) time in seconds since the Ripple Epoch.
  expiration?: string

  // (Optional) 256-bit hash representing a specific reason or identifier.
  invoiceID?: string
}

function parseCheckCreate(tx: any): FormattedCheckCreate {
  assert.ok(tx.TransactionType === 'CheckCreate')

  return removeUndefined({
    destination: tx.Destination,
    sendMax: parseAmount(tx.SendMax),
    destinationTag: tx.DestinationTag,
    expiration: tx.Expiration && parseTimestamp(tx.Expiration),
    invoiceID: tx.InvoiceID
  })
}

export default parseCheckCreate
