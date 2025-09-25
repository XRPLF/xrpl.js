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
  lmfMPTCanMutateCanLock?: boolean
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lmfMPTCanMutateRequireAuth?: boolean
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lmfMPTCanMutateCanEscrow?: boolean
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lmfMPTCanMutateCanTrade?: boolean
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lmfMPTCanMutateCanTransfer?: boolean
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lmfMPTCanMutateCanClawback?: boolean
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lmfMPTCanMutateMetadata?: boolean
  /**
   * Allows field TransferFee to be modified
   */
  lmfMPTCanMutateTransferFee?: boolean
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
  lmfMPTCanMutateCanLock = 0x00000002,
  /**
   * Indicates flag lsfMPTRequireAuth can be changed
   */
  lmfMPTCanMutateRequireAuth = 0x00000004,
  /**
   * Indicates flag lsfMPTCanEscrow can be changed
   */
  lmfMPTCanMutateCanEscrow = 0x00000008,
  /**
   * Indicates flag lsfMPTCanTrade can be changed
   */
  lmfMPTCanMutateCanTrade = 0x00000010,
  /**
   * Indicates flag lsfMPTCanTransfer can be changed
   */
  lmfMPTCanMutateCanTransfer = 0x00000020,
  /**
   * Indicates flag lsfMPTCanClawback can be changed
   */
  lmfMPTCanMutateCanClawback = 0x00000040,
  /**
   * Allows field MPTokenMetadata to be modified
   */
  lmfMPTCanMutateMetadata = 0x00010000,
  /**
   * Allows field TransferFee to be modified
   */
  lmfMPTCanMutateTransferFee = 0x00020000,
}
