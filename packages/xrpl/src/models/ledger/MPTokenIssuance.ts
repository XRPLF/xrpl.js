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
  lsmfMPTCanMutateCanLock?: boolean
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lsmfMPTCanMutateRequireAuth?: boolean
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lsmfMPTCanMutateCanEscrow?: boolean
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lsmfMPTCanMutateCanTrade?: boolean
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lsmfMPTCanMutateCanTransfer?: boolean
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lsmfMPTCanMutateCanClawback?: boolean
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lsmfMPTCanMutateMetadata?: boolean
  /**
   * Allows field TransferFee to be modified
   */
  lsmfMPTCanMutateTransferFee?: boolean
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
  lsmfMPTCanMutateCanLock = 0x00000002,
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lsmfMPTCanMutateRequireAuth = 0x00000004,
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lsmfMPTCanMutateCanEscrow = 0x00000008,
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lsmfMPTCanMutateCanTrade = 0x00000010,
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lsmfMPTCanMutateCanTransfer = 0x00000020,
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lsmfMPTCanMutateCanClawback = 0x00000040,
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lsmfMPTCanMutateMetadata = 0x00010000,
  /**
   * Allows field TransferFee to be modified
   */
  lsmfMPTCanMutateTransferFee = 0x00020000,
}
