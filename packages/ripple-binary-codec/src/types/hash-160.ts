import { makeClass } from "../utils/make-class";
const { Hash } = require("./hash");

const Hash160 = makeClass(
  {
    inherits: Hash,
    statics: { width: 20 },
  },
  undefined
);

export { Hash160 };
