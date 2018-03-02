import {CheckLedgerEntry} from '../objects'

export interface AccountObjectsRequest {
  account: string,

  // (Optional) Filter results to include only this type of ledger object.
  type?: (
    'check' |
    'escrow' |
    'offer' |
    'payment_channel' |
    'signer_list' |
    'state'
  ),

  // (Optional) A 20-byte hex string for the ledger version to use.
  ledger_hash?: string,

  // (Optional) The sequence number of the ledger to use,
  // or a shortcut string to choose a ledger automatically.
  ledger_index?: number | ('validated' | 'closed' | 'current')
}

export interface AccountObjectsResponse {
  account: string,

  // Array of objects owned by this account.
  account_objects: CheckLedgerEntry | object,

  // (May be omitted) The identifying hash of the ledger
  // that was used to generate this response.
  ledger_hash?: string,

  // (May be omitted) The sequence number of the ledger version
  // that was used to generate this response.
  ledger_index?: number,

  // (May be omitted) The sequence number of the current in-progress ledger
  // version that was used to generate this response.
  ledger_current_index?: number,

  // If true, this information comes from a ledger version
  // that has been validated by consensus.
  validated?: boolean
}
