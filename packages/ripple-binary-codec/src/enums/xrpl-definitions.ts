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
   * To generate a new definitions file from rippled source code, use the tool at
   * `packages/ripple-binary-codec/tools/generateDefinitions.js`.
   *
   * See the definitions.test.js file for examples of how to create your own updated definitions.json.
   *
   * @param enums - A json encoding of the core types, transaction types, transaction results, transaction names, and fields.
   * @param additionalTypes - A list of SerializedType objects with the same name as the fields defined.
   *              These types will be included in addition to the coreTypes used on mainnet.
   */
  constructor(
    enums: DefinitionsData,
    additionalTypes?: Record<string, typeof SerializedType>,
  ) {
    const types = Object.assign({}, coreTypes, additionalTypes)
    super(enums, types)
  }
}
