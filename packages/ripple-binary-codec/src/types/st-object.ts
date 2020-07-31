import { Field, FieldInstance } from "../enums";
import { SerializedType, JsonObject } from "./serialized-type";
import { BinaryParser } from "../serdes/binary-parser";
import { BinarySerializer, BytesList } from "../serdes/binary-serializer";

const OBJECT_END_MARKER = Buffer.from([0xe1]);
const OBJECT_END_MARKER_NAME = "ObjectEndMarker";
const OBJECT_FIELD_TYPE_NAME = "STObject";

/**
 * Class for Serializing/Deserializing objects
 */
class STObject extends SerializedType {
  /**
   * Construct a STObject from a BinaryParser
   *
   * @param parser BinaryParser to read STObject from
   * @returns A STObject object
   */
  static fromParser(parser: BinaryParser): STObject {
    const list: BytesList = new BytesList();
    const bytes: BinarySerializer = new BinarySerializer(list);

    while (!parser.end()) {
      const field = parser.readField();
      if (field.name === OBJECT_END_MARKER_NAME) {
        break;
      }

      const associatedValue = parser.readFieldValue(field);

      bytes.writeFieldAndValue(field, associatedValue);
      if (field.type.name === OBJECT_FIELD_TYPE_NAME) {
        bytes.put(OBJECT_END_MARKER);
      }
    }

    return new STObject(list.toBytes());
  }

  /**
   * Construct a STObject from a JSON object
   *
   * @param value An object to include
   * @param filter optional, denote which field to include in serialized object
   * @returns a STObject object
   */
  static from<T extends STObject | JsonObject>(
    value: T,
    filter?: (...any) => boolean
  ): STObject {
    if (value instanceof STObject) {
      return value;
    }

    const list: BytesList = new BytesList();
    const bytes: BinarySerializer = new BinarySerializer(list);

    let sorted = Object.keys(value)
      .map((f: string): FieldInstance => Field[f] as FieldInstance)
      .filter((f: FieldInstance): boolean => f !== undefined && f.isSerialized)
      .sort((a, b) => {
        return a.ordinal - b.ordinal;
      });

    if (filter !== undefined) {
      sorted = sorted.filter(filter);
    }

    sorted.forEach((field) => {
      const associatedValue = field.associatedType.from(value[field.name]);

      bytes.writeFieldAndValue(field, associatedValue);
      if (field.type.name === OBJECT_FIELD_TYPE_NAME) {
        bytes.put(OBJECT_END_MARKER);
      }
    });

    return new STObject(list.toBytes());
  }

  /**
   * Get the JSON interpretation of this.bytes
   *
   * @returns a JSON object
   */
  toJSON(): JsonObject {
    const objectParser = new BinaryParser(this.toString());
    const accumulator = {};

    while (!objectParser.end()) {
      const field = objectParser.readField();
      if (field.name === OBJECT_END_MARKER_NAME) {
        break;
      }
      accumulator[field.name] = objectParser.readFieldValue(field).toJSON();
    }

    return accumulator;
  }
}

export { STObject };
