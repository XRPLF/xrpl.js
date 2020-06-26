import { strict as assert } from "assert";
import { makeClass } from "./utils/make-class";
import { coreTypes } from "./types";
import { HashPrefix } from "./hash-prefixes";
import { Sha512Half } from "./hashes";

const ShaMapNode = makeClass(
  {
    virtuals: {
      hashPrefix() {},
      isLeaf() {},
      isInner() {},
    },
    cached: {
      hash() {
        const hasher = Sha512Half.put(this.hashPrefix());
        this.toBytesSink(hasher);
        return hasher.finish();
      },
    },
  },
  undefined
);

const ShaMapLeaf = makeClass(
  {
    inherits: ShaMapNode,
    ShaMapLeaf(index, item) {
      ShaMapNode.call(this);
      this.index = index;
      this.item = item;
    },
    isLeaf() {
      return true;
    },
    isInner() {
      return false;
    },
    hashPrefix() {
      return this.item.hashPrefix();
    },
    toBytesSink(sink) {
      this.item.toBytesSink(sink);
      this.index.toBytesSink(sink);
    },
  },
  undefined
);

const $uper = ShaMapNode.prototype;

const ShaMapInner = makeClass(
  {
    inherits: ShaMapNode,
    ShaMapInner(depth = 0) {
      ShaMapNode.call(this);
      this.depth = depth;
      this.slotBits = 0;
      this.branches = Array(16);
    },
    isInner() {
      return true;
    },
    isLeaf() {
      return false;
    },
    hashPrefix() {
      return HashPrefix.innerNode;
    },
    setBranch(slot, branch) {
      this.slotBits = this.slotBits | (1 << slot);
      this.branches[slot] = branch;
    },
    empty() {
      return this.slotBits === 0;
    },
    hash() {
      if (this.empty()) {
        return coreTypes.Hash256.ZERO_256;
      }
      return $uper.hash.call(this);
    },
    toBytesSink(sink) {
      for (let i = 0; i < this.branches.length; i++) {
        const branch = this.branches[i];
        const hash = branch ? branch.hash() : coreTypes.Hash256.ZERO_256;
        hash.toBytesSink(sink);
      }
    },
    addItem(index, item, leaf) {
      assert(index instanceof coreTypes.Hash256);
      const nibble = index.nibblet(this.depth);
      const existing = this.branches[nibble];
      if (!existing) {
        this.setBranch(nibble, leaf || new ShaMapLeaf(index, item));
      } else if (existing.isLeaf()) {
        const newInner = new ShaMapInner(this.depth + 1);
        newInner.addItem(existing.index, null, existing);
        newInner.addItem(index, item, leaf);
        this.setBranch(nibble, newInner);
      } else if (existing.isInner()) {
        existing.addItem(index, item, leaf);
      } else {
        assert(false);
      }
    },
  },
  undefined
);

const ShaMap = makeClass(
  {
    inherits: ShaMapInner,
  },
  undefined
);

export { ShaMap };
