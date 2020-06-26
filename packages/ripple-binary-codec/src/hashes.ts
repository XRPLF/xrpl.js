import { makeClass } from "./utils/make-class";
import { HashPrefix } from "./hash-prefixes";
import { coreTypes } from "./types";
import { parseBytes } from "./utils/bytes-utils";
import * as createHash from "create-hash";

const Sha512Half = makeClass(
  {
    Sha512Half() {
      this.hash = createHash("sha512");
    },
    statics: {
      put(bytes) {
        return new this().put(bytes);
      },
    },
    put(bytes) {
      this.hash.update(parseBytes(bytes, Buffer));
      return this;
    },
    finish256() {
      const bytes = this.hash.digest();
      return bytes.slice(0, 32);
    },
    finish() {
      return new coreTypes.Hash256(this.finish256());
    },
  },
  undefined
);

function sha512Half(...args) {
  const hash = new Sha512Half();
  args.forEach((a) => hash.put(a));
  return parseBytes(hash.finish256(), Uint8Array);
}

function transactionID(serialized) {
  return new coreTypes.Hash256(
    sha512Half(HashPrefix.transactionID, serialized)
  );
}

export { Sha512Half, sha512Half, transactionID };
