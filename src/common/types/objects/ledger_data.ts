export interface LedgerData {
  ledger_index: string
  ledger_hash: string
  marker: string
  state: Array<{ data?: string; LedgerEntryType?: string; index: string } & any>
}
