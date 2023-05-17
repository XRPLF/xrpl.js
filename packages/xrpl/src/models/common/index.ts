export type LedgerIndex = number | ('validated' | 'closed' | 'current')

interface XRP {
  currency: 'XRP'
}

interface IssuedCurrency {
  currency: string
  issuer: string
}

export type Currency = IssuedCurrency | XRP

export interface IssuedCurrencyAmount extends IssuedCurrency {
  value: string
}

export type Amount = IssuedCurrencyAmount | string

export interface Signer {
  Signer: {
    Account: string
    TxnSignature: string
    SigningPubKey: string
  }
}

export interface Memo {
  Memo: {
    MemoData?: string
    MemoType?: string
    MemoFormat?: string
  }
}

export type StreamType =
  | 'consensus'
  | 'ledger'
  | 'manifests'
  | 'peer_status'
  | 'transactions'
  | 'transactions_proposed'
  | 'server'
  | 'validations'

interface PathStep {
  account?: string
  currency?: string
  issuer?: string
}

export type Path = PathStep[]

/**
 * The object that describes the grant in HookGrants.
 */
export interface HookGrant {
  /**
   * The object that describes the grant in HookGrants.
   */
  HookGrant: {
    /**
     * The hook hash of the grant.
     */
    HookHash: string
    /**
     * The account authorized on the grant.
     */
    Authorize?: string
  }
}

/**
 * The object that describes the parameter in HookParameters.
 */
export interface HookParameter {
  /**
   * The object that describes the parameter in HookParameters.
   */
  HookParameter: {
    /**
     * The name of the parameter.
     */
    HookParameterName: string
    /**
     * The value of the parameter.
     */
    HookParameterValue: string
  }
}

/**
 * The object that describes the hook in Hooks.
 */
export interface Hook {
  /**
   * The object that describes the hook in Hooks.
   */
  Hook: {
    HookHash?: string
    /**
     * The code that is executed when the hook is triggered.
     */
    CreateCode?: string
    /**
     * The flags that are set on the hook.
     */
    Flags?: number
    /**
     * The transactions that triggers the hook. Represented as a 256Hash
     */
    HookOn?: string
    /**
     * The namespace of the hook.
     */
    HookNamespace?: string
    /**
     * The API version of the hook.
     */
    HookApiVersion?: number
    /**
     * The parameters of the hook.
     */
    HookParameters?: HookParameter[]
    /**
     * The grants of the hook.
     */
    HookGrants?: HookGrant[]
  }
}

/**
 * The object that describes the signer in SignerEntries.
 */
export interface SignerEntry {
  /**
   * The object that describes the signer in SignerEntries.
   */
  SignerEntry: {
    /**
     * An XRP Ledger address whose signature contributes to the multi-signature.
     * It does not need to be a funded address in the ledger.
     */
    Account: string
    /**
     * The weight of a signature from this signer.
     * A multi-signature is only valid if the sum weight of the signatures provided meets
     * or exceeds the signer list's SignerQuorum value.
     */
    SignerWeight: number
    /**
     * An arbitrary 256-bit (32-byte) field that can be used to identify the signer, which
     * may be useful for smart contracts, or for identifying who controls a key in a large
     * organization.
     */
    WalletLocator?: string
  }
}

/**
 * This information is added to Transactions in request responses, but is not part
 * of the canonical Transaction information on ledger. These fields are denoted with
 * lowercase letters to indicate this in the rippled responses.
 */
export interface ResponseOnlyTxInfo {
  /**
   * The date/time when this transaction was included in a validated ledger.
   */
  date?: number
  /**
   * An identifying hash value unique to this transaction, as a hex string.
   */
  hash?: string
  /**
   * The sequence number of the ledger that included this transaction.
   */
  ledger_index?: number
  /**
   * @deprecated Alias for ledger_index.
   */
  inLedger?: number
}

/**
 * One offer that might be returned from either an {@link NFTBuyOffersRequest}
 * or an {@link NFTSellOffersRequest}.
 *
 * @category Responses
 */
export interface NFTOffer {
  amount: Amount
  flags: number
  nft_offer_index: string
  owner: string
  destination?: string
  expiration?: number
}
