import { AccountObjectType } from '../../../models/common';
import {
  CheckLedgerEntry,
  RippleStateLedgerEntry,
  OfferLedgerEntry,
  SignerListLedgerEntry,
  EscrowLedgerEntry,
  PayChannelLedgerEntry,
  DepositPreauthLedgerEntry
} from '../objects'

export interface GetAccountObjectsOptions {
  type?: AccountObjectType
  ledgerHash?: string
  ledgerIndex?: number | ('validated' | 'closed' | 'current')
  limit?: number
  marker?: string
}

export interface AccountObjectsRequest {
  account: string

  // (Optional) Filter results to include only this type of ledger object.
  type?:
    | string
    | (
        | 'check'
        | 'escrow'
        | 'offer'
        | 'payment_channel'
        | 'signer_list'
        | 'state'
      )

  // (Optional) A 20-byte hex string for the ledger version to use.
  ledger_hash?: string

  // (Optional) The sequence number of the ledger to use,
  // or a shortcut string to choose a ledger automatically.
  ledger_index?: number | ('validated' | 'closed' | 'current')

  limit?: number

  marker?: string
}

export interface AccountObjectsResponse {
  account: string

  // Array of objects owned by this account.
  // from the getAccountObjects section of the dev center
  account_objects: Array<
    | CheckLedgerEntry
    | RippleStateLedgerEntry
    | OfferLedgerEntry
    | SignerListLedgerEntry
    | EscrowLedgerEntry
    | PayChannelLedgerEntry
    | DepositPreauthLedgerEntry
  >

  // (May be omitted) The identifying hash of the ledger
  // that was used to generate this response.
  ledger_hash?: string

  // (May be omitted) The sequence number of the ledger version
  // that was used to generate this response.
  ledger_index?: number

  // (May be omitted) The sequence number of the current in-progress ledger
  // version that was used to generate this response.
  ledger_current_index?: number

  // The limit that was used in this request, if any.
  limit?: number

  // Server-defined value indicating the response is paginated. Pass this
  // to the next call to resume where this call left off. Omitted when there
  // are no additional pages after this one.
  marker?: string

  // If true, this information comes from a ledger version
  // that has been validated by consensus.
  validated?: boolean
}
