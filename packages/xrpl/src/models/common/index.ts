export const RIPPLED_API_V1 = 1
export const RIPPLED_API_V2 = 2
export const DEFAULT_API_VERSION = RIPPLED_API_V2
export type APIVersion = typeof RIPPLED_API_V1 | typeof RIPPLED_API_V2
export type LedgerIndex = number | ('validated' | 'closed' | 'current')

export interface XRP {
  currency: 'XRP'
  issuer?: never
}

export interface IssuedCurrency {
  currency: string
  issuer: string
}

export type Currency = IssuedCurrency | XRP

export interface IssuedCurrencyAmount extends IssuedCurrency {
  value: string
}

export interface MPTAmount {
  mpt_issuance_id: string
  value: string
}

export type Amount = IssuedCurrencyAmount | string

export interface Balance {
  currency: string
  issuer?: string
  value: string
}

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

export interface PathStep {
  account?: string
  currency?: string
  issuer?: string
}

export type Path = PathStep[]

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
   * The hash of the ledger included this transaction.
   */
  ledger_hash?: string
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

/**
 * One NFToken that might be returned from an {@link NFTInfoResponse}
 *
 * @category Responses
 */
export interface NFToken {
  nft_id: string
  ledger_index: number
  owner: string
  is_burned: boolean
  flags: number
  transfer_fee: number
  issuer: string
  nft_taxon: number
  nft_serial: number
  uri: string
}

export interface AuthAccount {
  AuthAccount: {
    Account: string
  }
}

export interface AuthorizeCredential {
  Credential: {
    /** The issuer of the credential. */
    Issuer: string

    /** A hex-encoded value to identify the type of credential from the issuer. */
    CredentialType: string
  }
}

export interface XChainBridge {
  LockingChainDoor: string
  LockingChainIssue: Currency
  IssuingChainDoor: string
  IssuingChainIssue: Currency
}

/**
 * A PriceData object represents the price information for a token pair.
 *
 */
export interface PriceData {
  PriceData: {
    /**
     * The primary asset in a trading pair. Any valid identifier, such as a stock symbol, bond CUSIP, or currency code is allowed.
     * For example, in the BTC/USD pair, BTC is the base asset; in 912810RR9/BTC, 912810RR9 is the base asset.
     */
    BaseAsset: string

    /**
     * The quote asset in a trading pair. The quote asset denotes the price of one unit of the base asset. For example, in the
     * BTC/USD pair,BTC is the base asset; in 912810RR9/BTC, 912810RR9 is the base asset.
     */
    QuoteAsset: string

    /**
     * The asset price after applying the Scale precision level. It's not included if the last update transaction didn't include
     * the BaseAsset/QuoteAsset pair.
     */
    AssetPrice?: number | string

    /**
     * The scaling factor to apply to an asset price. For example, if Scale is 6 and original price is 0.155, then the scaled
     * price is 155000. Valid scale ranges are 0-10. It's not included if the last update transaction didn't include the
     * BaseAsset/QuoteAsset pair.
     */
    Scale?: number
  }
}
