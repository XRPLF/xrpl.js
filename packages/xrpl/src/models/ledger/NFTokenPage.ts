import { ModifiedNode, Node } from '../transactions/metadata'

import BaseLedgerEntry from './BaseLedgerEntry'

export interface NFToken {
  Flags: number
  Issuer: string
  NFTokenID: string
  NFTokenTaxon: number
  URI?: string
}

export interface NFTokenWrapper {
  NFToken: NFToken
}

export interface NFTokenPage extends BaseLedgerEntry {
  LedgerEntryType: 'NFTokenPage'
  NextPageMin?: string
  NFTokens: NFTokenWrapper[]
  PreviousPageMin?: string
  PreviousTxnID?: string
  PreviousTxnLgrSeq?: number
}

export function isNFTokenPage(
  ledgerEntry: BaseLedgerEntry,
): ledgerEntry is NFTokenPage {
  return Object.prototype.hasOwnProperty.call(ledgerEntry, `NFTokens`)
}
