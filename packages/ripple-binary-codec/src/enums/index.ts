import { serializeUIntN } from "../utils/bytes-utils";
import * as enums from "./definitions.json";

const TYPE_WIDTH = 2;
const LEDGER_ENTRY_WIDTH = 2;
const TRANSACTION_TYPE_WIDTH = 2;
const TRANSACTION_RESULT_WIDTH = 1;

/*
 * @brief: Serialize a field based on type_code and Field.nth
 */
function fieldHeader(type: number, nth: number): Buffer {
  const header: Array<number> = [];
  if (type < 16) {
    if (nth < 16) {
      header.push((type << 4) | nth);
    } else {
      header.push(type << 4, nth);
    }
  } else if (nth < 16) {
    header.push(nth, type);
  } else {
    header.push(0, type, nth);
  }
  return Buffer.from(header);
}

/*
 * @brief: Bytes, name, and ordinal representing one type, ledger_type, transaction type, or result
 */
class Bytes {
  readonly bytes: Uint8Array;

  constructor(
    readonly name: string,
    readonly ordinal: number,
    readonly ordinalWidth: number
  ) {
    this.bytes = serializeUIntN(ordinal, ordinalWidth);
  }

  toJSON(): string {
    return this.name;
  }

  toBytesSink(sink): void {
    sink.put(this.bytes);
  }
}

/*
 * @brief: Collection of Bytes objects, mapping bidirectionally
 */
class BytesLookup {
  constructor(types: { [key: string]: number }, readonly ordinalWidth: number) {
    Object.entries(types).forEach(([k, v]) => {
      this[k] = new Bytes(k, v, ordinalWidth);
      this[v.toString()] = this[k];
    });
  }

  from(value: Bytes | string): Bytes {
    return value instanceof Bytes ? value : (this[value] as Bytes);
  }

  fromParser(parser): Bytes {
    return this.from(parser.readUIntN(this.ordinalWidth).toString());
  }
}

/*
 * type FieldInfo is the type of the objects containing information about each field in definitions.json
 */
interface FieldInfo {
  nth: number;
  isVLEncoded: boolean;
  isSerialized: boolean;
  isSigningField: boolean;
  type: string;
}

interface FieldInstance {
  readonly nth: number;
  readonly isVariableLengthEncoded: boolean;
  readonly isSerialized: boolean;
  readonly isSigningField: boolean;
  readonly type: Bytes;
  readonly ordinal: number;
  readonly name: string;
  readonly header: Buffer;
  readonly associatedType: any;
}

function buildField([name, info]: [string, FieldInfo]): FieldInstance {
  const typeOrdinal = enums.TYPES[info.type];
  const field = fieldHeader(typeOrdinal, info.nth);
  return {
    name: name,
    nth: info.nth,
    isVariableLengthEncoded: info.isVLEncoded,
    isSerialized: info.isSerialized,
    isSigningField: info.isSigningField,
    ordinal: (typeOrdinal << 16) | info.nth,
    type: new Bytes(info.type, typeOrdinal, TYPE_WIDTH),
    header: field,
    associatedType: undefined, // For later assignment in ./types/index.js
  };
}

/*
 * @brief: The collection of all fields as defined in definitions.json
 */
class FieldLookup {
  constructor(fields: Array<[string, FieldInfo]>) {
    fields.forEach(([k, v]) => {
      this[k] = buildField([k, v]);
      this[this[k].ordinal.toString()] = this[k];
    });
  }

  fromString(value: string): FieldInstance {
    return this[value] as FieldInstance;
  }
}

const Type = new BytesLookup(enums.TYPES, TYPE_WIDTH);
const LedgerEntryType = new BytesLookup(
  enums.LEDGER_ENTRY_TYPES,
  LEDGER_ENTRY_WIDTH
);
const TransactionType = new BytesLookup(
  enums.TRANSACTION_TYPES,
  TRANSACTION_TYPE_WIDTH
);
const TransactionResult = new BytesLookup(
  enums.TRANSACTION_RESULTS,
  TRANSACTION_RESULT_WIDTH
);
const Field = new FieldLookup(enums.FIELDS as Array<[string, FieldInfo]>);

export {
  Field,
  FieldInstance,
  Type,
  LedgerEntryType,
  TransactionResult,
  TransactionType,
};
