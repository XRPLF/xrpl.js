import { Currency } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `vault_info` method gets information about a Vault instance.
 * Returns an {@link VaultInfoResponse}.
 *
 * @category Requests
 */
export interface VaultInfoRequest extends BaseRequest {
  command: 'vault_info'

  /**
   * The object ID of the Vault to be returned.
   */
  vault_id?: string

  /**
   * ID of the Vault Owner account.
   */
  owner?: string

  /**
   * Sequence number of the vault entry.
   */
  seq?: number
}

/**
 * Response expected from an {@link VaultInfoRequest}.
 *
 * @category Responses
 */
export interface VaultInfoResponse extends BaseResponse {
  result: {
    vault: {
      /**
       * The pseudo-account ID of the vault.
       */
      Account: string

      /**
       * Object representing the asset held in the vault.
       */
      Asset: Currency

      /**
       * Amount of assets currently available for withdrawal.
       */
      AssetsAvailable: string

      /**
       * Total amount of assets in the vault.
       */
      AssetsTotal: string

      /**
       * Ledger entry type, always "Vault".
       */
      LedgerEntryType: 'Vault'

      /**
       * ID of the Vault Owner account.
       */
      Owner: string

      /**
       * Transaction ID of the last modification to this vault.
       */
      PreviousTxnID: string

      /**
       * Ledger sequence number of the last transaction modifying this vault.
       */
      PreviousTxnLgrSeq: number

      /**
       * Sequence number of the vault entry.
       */
      Sequence: number

      /**
       * Unique index of the vault ledger entry.
       */
      index: string

      /**
       * Object containing details about issued shares.
       */
      shares: {
        /**
         * The ID of the Issuer of the Share. It will always be the pseudo-account ID.
         */
        Issuer: string

        /**
         * Ledger entry type, always "MPTokenIssuance".
         */
        LedgerEntryType: string

        /**
         * Total outstanding shares issued.
         */
        OutstandingAmount: string

        /**
         * Transaction ID of the last modification to the shares issuance.
         */
        PreviousTxnID: string

        /**
         * Ledger sequence number of the last transaction modifying the shares issuance.
         */
        PreviousTxnLgrSeq: number

        /**
         * Sequence number of the shares issuance entry.
         */
        Sequence: number

        /**
         * Unique index of the shares ledger entry.
         */
        index: string

        /**
         * Identifier for the owner node of the shares.
         */
        OwnerNode?: string

        /**
         * The ID of the MPTokenIssuance object. It will always be equal to vault.ShareMPTID.
         */
        mpt_issuance_id?: string

        /**
         * The PermissionedDomain object ID associated with the shares of this Vault.
         */
        DomainID?: string

        /**
         * Bit-field flags associated with the shares issuance.
         */
        Flags?: number
      }

      /**
       * Unrealized loss associated with the vault.
       */
      LossUnrealized?: string

      /**
       * Identifier for the owner node in the ledger tree.
       */
      OwnerNode?: string

      /**
       * Multi-purpose token ID associated with this vault.
       */
      ShareMPTID?: string

      /**
       * Policy defining withdrawal conditions.
       */
      WithdrawalPolicy?: number

      /**
       * Flags
       */
      Flags?: number
    }

    /**
     * The identifying hash of the ledger that was used to generate this
     * response.
     */
    ledger_hash?: string

    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index?: number

    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
