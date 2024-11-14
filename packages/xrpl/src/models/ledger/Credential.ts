import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 *
 * A Credential object describes a credential, similar to a passport, which is an issuable identity verifier
 * that can be used as a prerequisite for other transactions
 *
 * @category Ledger Entries
 */
export default interface Credential extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Credential'
  /**
   * A bit-map of boolean flags. No flags are defined for Credentials, so this value
   * is always 0.
   */
  Flags: number

  /** The account that the credential is for. */
  Subject: string

  /** The issuer of the credential. */
  Issuer: string

  /** A (hex-encoded) value to identify the type of credential from the issuer. */
  CredentialType: string

  /** Optional credential expiration. */
  Expiration?: number

  /** Optional additional data about the credential (such as a link to the VC document). */
  URI: string

  /** A hint indicating which page of the subject's owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  SubjectNode: string

  /** A hint indicating which page of the issuer's owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  IssuerNode: string

  /** The identifying hash of the transaction that most recently modified this object. */
  PreviousTxnID: string

  /** The index of the ledger that contains the transaction that most recently modified this object. */
  PreviousTxnLgrSeqNumber: number
}
