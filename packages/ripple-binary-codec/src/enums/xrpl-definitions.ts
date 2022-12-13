import { SerializedType } from '../types/serialized-type'
import { Bytes, BytesLookup } from './bytes'
import { FieldInfo, FieldLookup, FieldInstance } from './field'
import {
  TYPE_WIDTH,
  LEDGER_ENTRY_WIDTH,
  TRANSACTION_TYPE_WIDTH,
  TRANSACTION_RESULT_WIDTH,
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
 *
 */
class XrplDefinitions {
  field: FieldLookup
  ledgerEntryType: BytesLookup
  type: BytesLookup
  transactionResult: BytesLookup
  transactionType: BytesLookup
  transactionNames: string[]
  dataTypes: Record<string, typeof SerializedType>

  /**
   * Present rippled types in a typed and updatable format.
   * For an example of the input format see `definitions.json`
   * To generate a new definitions file from rippled source code, use this tool: https://github.com/RichardAH/xrpl-codec-gen
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
    // Helps catch errors early in JavaScript code.
    if (types == undefined) {
      throw new TypeError(
        'You passed in an undefined `types` parameter, but `types` must be defined since it contains logic for encoding/decoding transaction data.' +
          ' If you have NOT added/modified any data types, you can import and use `coreTypes` from the types folder.',
      )
    }

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
  }

  public getAssociatedTypes(): Record<string, typeof SerializedType> {
    return this.dataTypes
  }
}

export {
  XrplDefinitions,
  FieldLookup,
  FieldInfo,
  FieldInstance,
  Bytes,
  BytesLookup,
}
