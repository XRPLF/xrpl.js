import { BytesList } from "../serdes/binary-serializer";
const { bytesToHex, slice } = require("../utils/bytes-utils");

/**
 * The base class for all binary-codec types
 */
class SerializedTypeClass {
  protected readonly bytes: Buffer = Buffer.alloc(0);

  constructor(bytes: Buffer) {
    this.bytes = bytes ?? Buffer.alloc(0);
  }

  /**
   * Write the bytes representation of a SerializedType to a BytesList
   *
   * @param list The BytesList to write SerializedType bytes to
   */
  toBytesSink(list: BytesList): void {
    list.put(this.bytes);
  }

  /**
   * Get the hex representation of a SerializedType's bytes
   *
   * @returns hex String of this.bytes
   */
  toHex(): string {
    return this.toBytes().toString("hex").toUpperCase();
  }

  /**
   * Get the bytes representation of a SerializedType
   *
   * @returns A buffer of the bytes
   */
  toBytes(): Buffer {
    if (this.bytes) {
      return this.bytes;
    }
    const bytes = new BytesList();
    this.toBytesSink(bytes);
    return bytes.toBytes();
  }

  /**
   * Return the JSON representation of a SerializedType
   *
   * @returns any type, if not overloaded returns hexString representation of bytes
   */
  toJSON(): any {
    return this.toHex();
  }

  /**
   * @returns hexString representation of this.bytes
   */
  toString(): string {
    return this.toHex();
  }
}

/**
 * Base class for SerializedTypes that are comparable
 */
class ComparableClass extends SerializedTypeClass {
  lt(other: ComparableClass): boolean {
    return this.compareTo(other) < 0;
  }

  eq(other: ComparableClass): boolean {
    return this.compareTo(other) === 0;
  }

  gt(other: ComparableClass): boolean {
    return this.compareTo(other) > 0;
  }

  gte(other: ComparableClass): boolean {
    return this.compareTo(other) > -1;
  }

  lte(other: ComparableClass): boolean {
    return this.compareTo(other) < 1;
  }

  /**
   * Overload this method to define how two Comparable SerializedTypes are compared
   *
   * @param other The comparable object to compare this to
   * @returns A number denoting the relationship of this and other
   */
  compareTo(other: ComparableClass): number {
    throw new Error("cannot compare " + this + " and " + other);
  }
}

const Comparable = {
  lt(other) {
    return this.compareTo(other) < 0;
  },
  eq(other) {
    return this.compareTo(other) === 0;
  },
  gt(other) {
    return this.compareTo(other) > 0;
  },
  gte(other) {
    return this.compareTo(other) > -1;
  },
  lte(other) {
    return this.compareTo(other) < 1;
  },
};

const SerializedType = {
  toBytesSink(sink) {
    sink.put(this._bytes);
  },
  toHex() {
    return bytesToHex(this.toBytes());
  },
  toBytes() {
    if (this._bytes) {
      return slice(this._bytes);
    }
    const bl = new BytesList();
    this.toBytesSink(bl);
    return bl.toBytes();
  },
  toJSON() {
    return this.toHex();
  },
  toString() {
    return this.toHex();
  },
};

function ensureArrayLikeIs(Type, arrayLike) {
  return {
    withChildren(Child) {
      if (arrayLike instanceof Type) {
        return arrayLike;
      }
      const obj = new Type();
      for (let i = 0; i < arrayLike.length; i++) {
        obj.push(Child.from(arrayLike[i]));
      }
      return obj;
    },
  };
}

export {
  ensureArrayLikeIs,
  SerializedType,
  SerializedTypeClass,
  Comparable,
  ComparableClass,
};
