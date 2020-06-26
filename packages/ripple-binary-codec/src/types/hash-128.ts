import { makeClass } from "../utils/make-class";
import { Hash } from "./hash";

const Hash128 = makeClass(
  {
    inherits: Hash,
    statics: { width: 16 },
  },
  undefined
);

export { Hash128 };
