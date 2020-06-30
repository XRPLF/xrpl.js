import { makeClass } from "../utils/make-class";
import { ensureArrayLikeIs, SerializedType } from "./serialized-type";
import { STObject } from "./st-object";

const STArray = makeClass(
  {
    mixins: SerializedType,
    inherits: Array,
    statics: {
      fromParser(parser) {
        const array = new STArray();
        while (!parser.end()) {
          const field = parser.readField();
          if (field.name === "ArrayEndMarker") {
            break;
          }
          const outer = new STObject();
          outer[field.name] = parser.readFieldValue(field);
          array.push(outer);
        }
        return array;
      },
      from(value) {
        return ensureArrayLikeIs(STArray, value).withChildren(STObject);
      },
    },
    toJSON() {
      return this.map((v) => v.toJSON());
    },
    toBytesSink(sink) {
      this.forEach((so) => so.toBytesSink(sink));
    },
  },
  undefined
);

export { STArray };
