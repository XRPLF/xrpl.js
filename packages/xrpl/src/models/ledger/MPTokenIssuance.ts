import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPTokenIssuance extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPTokenIssuance'
  Flags: number
  Issuer: string
  AssetScale?: number
  MaximumAmount?: string
  OutstandingAmount: string
  TransferFee?: number
  MPTokenMetadata?: string
  OwnerNode?: string
  LockedAmount?: string
  DomainID?: string
  MutableFlags: number
}

export interface MPTokenIssuanceFlagsInterface {
  lsfMPTLocked?: boolean
  lsfMPTCanLock?: boolean
  lsfMPTRequireAuth?: boolean
  lsfMPTCanEscrow?: boolean
  lsfMPTCanTrade?: boolean
  lsfMPTCanTransfer?: boolean
  lsfMPTCanClawback?: boolean

  /**
   * Indicates flag lsfMPTCanLock can be changed
   */
  lsfMPTCanMutateCanLock?: boolean
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lsfMPTCanMutateRequireAuth?: boolean
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lsfMPTCanMutateCanEscrow?: boolean
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lsfMPTCanMutateCanTrade?: boolean
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lsfMPTCanMutateCanTransfer?: boolean
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lsfMPTCanMutateCanClawback?: boolean
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lsfMPTCanMutateMetadata?: boolean
  /**
   * Allows field TransferFee to be modified
   */
  lsfMPTCanMutateTransferFee?: boolean
}

export enum MPTokenIssuanceFlags {
  lsfMPTLocked = 0x00000001,
  lsfMPTCanLock = 0x00000002,
  lsfMPTRequireAuth = 0x00000004,
  lsfMPTCanEscrow = 0x00000008,
  lsfMPTCanTrade = 0x00000010,
  lsfMPTCanTransfer = 0x00000020,
  lsfMPTCanClawback = 0x00000040,

  /**
   * Indicates flag lsfMPTCanLock can be changed
   */
  lsfMPTCanMutateCanLock = 0x00000002,
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lsfMPTCanMutateRequireAuth = 0x00000004,
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lsfMPTCanMutateCanEscrow = 0x00000008,
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lsfMPTCanMutateCanTrade = 0x00000010,
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lsfMPTCanMutateCanTransfer = 0x00000020,
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lsfMPTCanMutateCanClawback = 0x00000040,
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lsfMPTCanMutateMetadata = 0x00010000,
  /**
   * Allows field TransferFee to be modified
   */
  lsfMPTCanMutateTransferFee = 0x00020000,
}
