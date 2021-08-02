export interface DirectoryNode {
  LedgerEntryType: 'DirectoryNode'
  Flags: number
  RootIndex: string
  Indexes: string[]
  IndexNext?: number
  IndexPrevious?: number
  Owner?: string
  TakerPaysCurrency?: string
  TakerPaysIssuer?: string
  TakerGetsCurrency?: string
  TakerGetsIssuer?: string
}