import { SerializedType } from "./serialized-type";
import { STObject } from "./st-object";
import { BinaryParser } from "../serdes/binary-parser";

const ARRAY_END_MARKER = Buffer.from([0xf1]);
const ARRAY_END_MARKER_NAME = "ArrayEndMarker";

const OBJECT_END_MARKER = Buffer.from([0xe1]);

/**
 * Class for serializing and deserializing Arrays of Objects
 */
class STArray extends SerializedType {
  /**
   * Construct an STArray from a BinaryParser
   *
   * @param parser BinaryParser to parse an STArray from
   * @returns An STArray Object
   */
  static fromParser(parser: BinaryParser): STArray {
    const bytes: Array<Buffer> = [];

    while (!parser.end()) {
      const field = parser.readField();
      if (field.name === ARRAY_END_MARKER_NAME) {
        break;
      }

      bytes.push(
        field.header,
        parser.readFieldValue(field).toBytes(),
        OBJECT_END_MARKER
      );
    }

    bytes.push(ARRAY_END_MARKER);
    return new STArray(Buffer.concat(bytes));
  }

  /**
   * Construct an STArray from an Array of JSON Objects
   *
   * @param value STArray or Array of Objects to parse into an STArray
   * @returns An STArray object
   */
  static from(value: STArray | Array<object>): STArray {
    if (value instanceof STArray) {
      return value;
    }

    const bytes: Array<Buffer> = [];
    value.forEach((obj) => {
      bytes.push(STObject.from(obj).toBytes());
    });

    bytes.push(ARRAY_END_MARKER);
    return new STArray(Buffer.concat(bytes));
  }

  /**
   * Return the JSON representation of this.bytes
   *
   * @returns An Array of JSON objects
   */
  toJSON(): Array<object> {
    const result: Array<object> = [];

    const arrayParser = new BinaryParser(this.toString());

    while (!arrayParser.end()) {
      const field = arrayParser.readField();
      if (field.name === ARRAY_END_MARKER_NAME) {
        break;
      }

      const outer = {};
      outer[field.name] = STObject.fromParser(arrayParser).toJSON();
      result.push(outer);
    }

    return result;
  }
}

export { STArray };
