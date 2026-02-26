import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Flags for the MPTokenIssuance ledger entry.
 */
export enum MPTokenIssuanceFlags {
  /**
   * If set, indicates that the issuer can lock tokens.
   */
  lsfMPTCanLock = 0x00000001,

  /**
   * If set, indicates that the issuer requires authorization.
   */
  lsfMPTRequireAuth = 0x00000002,

  /**
   * If set, indicates that tokens can be escrowed.
   */
  lsfMPTCanEscrow = 0x00000004,

  /**
   * If set, indicates that tokens can be traded.
   */
  lsfMPTCanTrade = 0x00000008,

  /**
   * If set, indicates that tokens can be transferred.
   */
  lsfMPTCanTransfer = 0x00000010,

  /**
   * If set, indicates that the issuer can clawback tokens.
   */
  lsfMPTCanClawback = 0x00000020,

  /**
   * If set, indicates that confidential (privacy-preserving) transfers are enabled.
   * This allows holders to send/receive tokens without revealing amounts publicly.
   */
  lsfMPTCanPrivacy = 0x00000080,
}

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

  /**
   * The permissioned domain ID associated with this issuance, if any.
   */
  DomainID?: string

  /**
   * Flags controlling which settings can be changed after issuance.
   */
  MutableFlags?: number

  /**
   * The issuer's ElGamal public key for confidential transfers.
   * Required if confidential transfers are enabled.
   */
  IssuerElGamalPublicKey?: string

  /**
   * The auditor's ElGamal public key for confidential transfers.
   * Optional; allows an auditor to decrypt confidential balances.
   */
  AuditorElGamalPublicKey?: string

  /**
   * The encrypted outstanding amount for confidential transfers.
   * Tracks total confidential MPT in circulation.
   */
  ConfidentialOutstandingAmount?: string
}
