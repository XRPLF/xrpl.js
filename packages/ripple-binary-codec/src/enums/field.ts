import { Bytes } from './bytes'
import { SerializedType } from '../types/serialized-type'
import { TYPE_WIDTH } from './constants'

/**
 * Encoding information for a rippled field, often used in transactions.
 * See the enums [README.md](https://github.com/XRPLF/xrpl.js/tree/main/packages/ripple-binary-codec/src/enums) for more details on what each means.
 */
export interface FieldInfo {
  nth: number
  isVLEncoded: boolean
  isSerialized: boolean
  isSigningField: boolean
  type: string
}

export interface FieldInstance {
  readonly nth: number
  readonly isVariableLengthEncoded: boolean
  readonly isSerialized: boolean
  readonly isSigningField: boolean
  readonly type: Bytes
  readonly ordinal: number
  readonly name: string
  readonly header: Uint8Array
  readonly associatedType: typeof SerializedType
}

/*
 * @brief: Serialize a field based on type_code and Field.nth
 */
function fieldHeader(type: number, nth: number): Uint8Array {
  const header: Array<number> = []
  if (type < 16) {
    if (nth < 16) {
      header.push((type << 4) | nth)
    } else {
      header.push(type << 4, nth)
    }
  } else if (nth < 16) {
    header.push(nth, type)
  } else {
    header.push(0, type, nth)
  }
  return Uint8Array.from(header)
}

function buildField(
  [name, info]: [string, FieldInfo],
  typeOrdinal: number,
): FieldInstance {
  const field = fieldHeader(typeOrdinal, info.nth)
  return {
    name: name,
    nth: info.nth,
    isVariableLengthEncoded: info.isVLEncoded,
    isSerialized: info.isSerialized,
    isSigningField: info.isSigningField,
    ordinal: (typeOrdinal << 16) | info.nth,
    type: new Bytes(info.type, typeOrdinal, TYPE_WIDTH),
    header: field,
    associatedType: SerializedType, // For later assignment in ./types/index.js or Definitions.updateAll(...)
  }
}

/*
 * @brief: The collection of all fields as defined in definitions.json
 */
export class FieldLookup {
  constructor(
    fields: Array<[string, FieldInfo]>,
    types: Record<string, number>,
  ) {
    fields.forEach(([name, field_info]) => {
      const typeOrdinal = types[field_info.type]
      this[name] = buildField([name, field_info], typeOrdinal)
      this[this[name].ordinal.toString()] = this[name]
    })
  }

  fromString(value: string): FieldInstance {
    return this[value] as FieldInstance
  }
}
