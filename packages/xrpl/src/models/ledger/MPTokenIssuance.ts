import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPTokenIssuance extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPTokenIssuance'
  /**
   * A set of flags indicating properties or other options
   * associated with this MPTokenIssuance object.
   */
  Flags: number
  /**
   * The address of the account that controls both the issuance
   * amounts and characteristics of a particular fungible token.
   */
  Issuer: string
  /**
   * A 32-bit unsigned integer that is used to ensure issuances
   * from a given sender may only ever exist once, even if an
   * issuance is later deleted. Whenever a new issuance is
   * created, this value must match the account's current
   * Sequence number.
   */
  Sequence: number
  /**
   * An asset scale is a non-negative integer (0, 1, 2, ...)
   * such that one MPT unit equals 10^(-scale) of a
   * corresponding standard unit.
   */
  AssetScale?: number
  /**
   * An unsigned 64-bit number that specifies the maximum number
   * of MPTs that can be distributed to non-issuing accounts
   * (i.e., minted). The default and maximum value is
   * 0x7FFFFFFFFFFFFFFF.
   */
  MaximumAmount?: string
  /**
   * An unsigned 64-bit number that specifies the sum of all
   * token amounts that have been minted to all token holders.
   * This value is increased whenever an issuer pays MPTs to a
   * non-issuer account, and decreased whenever a non-issuer
   * pays MPTs into the issuing account.
   */
  OutstandingAmount: string
  /**
   * This value specifies the fee, in tenths of a basis point,
   * charged by the issuer for secondary sales of the token, if
   * such sales are allowed at all. Valid values for this field
   * are between 0 and 50,000 inclusive. A value of 1 is
   * equivalent to 1/10 of a basis point or 0.001%, allowing
   * transfer rates between 0% and 50%. A TransferFee of 50,000
   * corresponds to 50%.
   */
  TransferFee?: number
  /**
   * Arbitrary metadata about this issuance, in hex format.
   * The limit for this field is 1024 bytes.
   */
  MPTokenMetadata?: string
  /**
   * Identifies the page in the owner's directory where this
   * item is referenced.
   */
  OwnerNode: string
  /**
   * The total amount of this MPT that is currently locked
   * across all holders via Escrow or PaymentChannel.
   */
  LockedAmount?: string
  /**
   * The PermissionedDomain object ID that gates who may hold
   * this MPT.
   */
  DomainID?: string
  /**
   * Hash256 pointing to the vault pseudo-account's holding for
   * the underlying asset. Present for IOU and MPT-backed
   * vaults. Absent for XRP-backed vaults.
   */
  ReferenceHolding?: string

  /**
   * A set of XLS-94D mutability flags (`lsmfMPT*`) indicating which capabilities
   * or fields may still be enabled or modified via MPTokenIssuanceSet. Absent on
   * issuances created without any mutable flags, and on objects that predate the
   * DynamicMPT amendment.
   */
  MutableFlags?: number
}

export interface MPTokenIssuanceFlagsInterface {
  lsfMPTLocked?: boolean
  lsfMPTCanLock?: boolean
  lsfMPTRequireAuth?: boolean
  lsfMPTCanEscrow?: boolean
  lsfMPTCanTrade?: boolean
  lsfMPTCanTransfer?: boolean
  lsfMPTCanClawback?: boolean
}

export interface MPTokenIssuanceMutableFlagsInterface {
  /**
   * Indicates flag lsfMPTCanLock can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableCanLock?: boolean
  /**
   * Indicates flag lsfMPTRequireAuth can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableRequireAuth?: boolean
  /**
   * Indicates flag lsfMPTCanEscrow can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableCanEscrow?: boolean
  /**
   * Indicates flag lsfMPTCanTrade can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableCanTrade?: boolean
  /**
   * Indicates flag lsfMPTCanTransfer can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableCanTransfer?: boolean
  /**
   * Indicates flag lsfMPTCanClawback can be enabled via MPTokenIssuanceSet
   */
  lsmfMPTCanEnableCanClawback?: boolean
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
}

export enum MPTokenIssuanceMutableFlags {
  lsmfMPTCanEnableCanLock = 0x00000002,
  lsmfMPTCanEnableRequireAuth = 0x00000004,
  lsmfMPTCanEnableCanEscrow = 0x00000008,
  lsmfMPTCanEnableCanTrade = 0x00000010,
  lsmfMPTCanEnableCanTransfer = 0x00000020,
  lsmfMPTCanEnableCanClawback = 0x00000040,
  lsmfMPTCanMutateMetadata = 0x00010000,
  lsmfMPTCanMutateTransferFee = 0x00020000,
}
