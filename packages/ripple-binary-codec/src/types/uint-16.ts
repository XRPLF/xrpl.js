import { makeClass } from "../utils/make-class";
import { UInt } from "./uint";

const UInt16 = makeClass(
  {
    inherits: UInt,
    statics: { width: 2 },
  },
  undefined
);

export { UInt16 };
