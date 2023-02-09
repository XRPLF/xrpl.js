import {
  type DefinitionsData,
  XrplDefinitionsBase,
} from './xrpl-definitions-base'
import { coreTypes } from '../types'
import { SerializedType } from '../types/serialized-type'

/**
 * Stores the various types and fields for rippled to be used to encode/decode information later on.
 * Should be used instead of XrplDefinitionsBase since this defines default `types` for serializing/deserializing
 * ledger data.
 */
export class XrplDefinitions extends XrplDefinitionsBase {
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
    types: Record<string, typeof SerializedType> = coreTypes,
  ) {
    super(enums, types)
  }
}
