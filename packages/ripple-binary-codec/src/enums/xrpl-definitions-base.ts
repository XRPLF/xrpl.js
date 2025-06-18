import { SerializedType } from '../types/serialized-type'
import { Bytes, BytesLookup } from './bytes'
import { FieldInfo, FieldLookup, FieldInstance } from './field'
import {
  TYPE_WIDTH,
  LEDGER_ENTRY_WIDTH,
  TRANSACTION_TYPE_WIDTH,
  TRANSACTION_RESULT_WIDTH,
  DELEGATABLE_PERMISSIONS_WIDTH,
} from './constants'

interface DefinitionsData {
  TYPES: Record<string, number>
  LEDGER_ENTRY_TYPES: Record<string, number>
  FIELDS: (string | FieldInfo)[][]
  TRANSACTION_RESULTS: Record<string, number>
  TRANSACTION_TYPES: Record<string, number>
}

/**
 * Stores the various types and fields for rippled to be used to encode/decode information later on.
 * XrplDefinitions should be instantiated instead of this class.
 */
class XrplDefinitionsBase {
  // A collection of fields that can be included in transactions
  field: FieldLookup
  // A collection of ids corresponding to types of ledger objects
  ledgerEntryType: BytesLookup
  // A collection of type flags used to determine how to serialize a field's data
  type: BytesLookup
  // Errors and result codes for transactions
  transactionResult: BytesLookup
  // Defined transactions that can be submitted to the ledger
  transactionType: BytesLookup
  // Valid transaction names
  transactionNames: string[]
  // Maps serializable types to their TypeScript class implementation
  dataTypes: Record<string, typeof SerializedType>
  // Maps granular permissions names to their corresponding integer ids
  granularPermissions: Record<string, number>
  // Defined delegatable permissions
  delegatablePermissions: BytesLookup

  /**
   * Present rippled types in a typed and updatable format.
   * For an example of the input format see `definitions.json`.
   * To generate a new definitions file from rippled source code, use the tool at
   * `packages/ripple-binary-codec/tools/generateDefinitions.js`.
   *
   * See the definitions.test.js file for examples of how to create your own updated definitions.json.
   *
   * @param enums - A json encoding of the core types, transaction types, transaction results, transaction names, and fields.
   * @param types - A list of type objects with the same name as the fields defined.
   *              You can use the coreTypes object if you are not adding new types.
   */
  constructor(
    enums: DefinitionsData,
    types: Record<string, typeof SerializedType>,
  ) {
    this.type = new BytesLookup(enums.TYPES, TYPE_WIDTH)
    this.ledgerEntryType = new BytesLookup(
      enums.LEDGER_ENTRY_TYPES,
      LEDGER_ENTRY_WIDTH,
    )
    this.transactionType = new BytesLookup(
      enums.TRANSACTION_TYPES,
      TRANSACTION_TYPE_WIDTH,
    )
    this.transactionResult = new BytesLookup(
      enums.TRANSACTION_RESULTS,
      TRANSACTION_RESULT_WIDTH,
    )
    this.field = new FieldLookup(
      enums.FIELDS as Array<[string, FieldInfo]>,
      enums.TYPES,
    )
    this.transactionNames = Object.entries(enums.TRANSACTION_TYPES)
      .filter(([_key, value]) => value >= 0)
      .map(([key, _value]) => key)

    this.dataTypes = {} // Filled in via associateTypes
    this.associateTypes(types)

    this.granularPermissions = {
      TrustlineAuthorize: 65537,
      TrustlineFreeze: 65538,
      TrustlineUnfreeze: 65539,
      AccountDomainSet: 65540,
      AccountEmailHashSet: 65541,
      AccountMessageKeySet: 65542,
      AccountTransferRateSet: 65543,
      AccountTickSizeSet: 65544,
      PaymentMint: 65545,
      PaymentBurn: 65546,
      MPTokenIssuanceLock: 65547,
      MPTokenIssuanceUnlock: 65548,
    }

    const incrementedTransactionTypes = Object.fromEntries(
      Object.entries(enums.TRANSACTION_TYPES).map(([key, value]) => [
        key,
        value + 1,
      ]),
    )
    const combinedPermissions = {
      ...this.granularPermissions,
      ...incrementedTransactionTypes,
    }
    this.delegatablePermissions = new BytesLookup(
      combinedPermissions,
      DELEGATABLE_PERMISSIONS_WIDTH,
    )
  }

  /**
   * Associates each Field to a corresponding class that TypeScript can recognize.
   *
   * @param types a list of type objects with the same name as the fields defined.
   *              Defaults to xrpl.js's core type definitions.
   */
  public associateTypes(types: Record<string, typeof SerializedType>): void {
    // Overwrite any existing type definitions with the given types
    this.dataTypes = Object.assign({}, this.dataTypes, types)

    Object.values(this.field).forEach((field) => {
      field.associatedType = this.dataTypes[field.type.name]
    })

    this.field['TransactionType'].associatedType = this.transactionType
    this.field['TransactionResult'].associatedType = this.transactionResult
    this.field['LedgerEntryType'].associatedType = this.ledgerEntryType
    if (this.field['PermissionValue']) {
      this.field['PermissionValue'].associatedType = this.delegatablePermissions
    }
  }

  public getAssociatedTypes(): Record<string, typeof SerializedType> {
    return this.dataTypes
  }
}

export {
  DefinitionsData,
  XrplDefinitionsBase,
  FieldLookup,
  FieldInfo,
  FieldInstance,
  Bytes,
  BytesLookup,
}
