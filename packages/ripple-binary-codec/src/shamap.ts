import { HashPrefix } from './hash-prefixes'
import { Sha512Half } from './hashes'
import { Hash256 } from './types'
import { BytesList } from './serdes/binary-serializer'
import { Buffer } from 'buffer/'

/**
 * Represents an object which can be hashed.
 * e.g. transaction/ledger entry items, ShaMap nodes
 */
export interface Hashable {
  hashPrefix: () => Buffer

  toBytesSink: (list: BytesList) => void
}

/**
 * A pre-hashed item where you only have the hash, not the contents
 */
export interface PreHashed {
  preHashed: Hash256
}

export type ShaMapItem = Hashable | PreHashed

/**
 * Abstract class describing a SHAMapNode
 */
abstract class ShaMapNode {
  abstract isLeaf(): this is ShaMapLeaf

  abstract isInner(): this is ShaMapInner

  abstract hash(): Hash256
}

/**
 * Returns a function to hash a given Hashable variant of ShaMapItem and its index when called.
 *
 * @param item - Hashable The item to be hashed.
 * @param index - Hash256 key/index for the item in the SHAMap.
 * @returns A function that computes and returns the hash when called.
 */
function hashableItemHashGetter(item: Hashable, index: Hash256): () => Hash256 {
  return () => {
    const hash = Sha512Half.put(item.hashPrefix())
    item.toBytesSink(hash)
    index.toBytesSink(hash)
    return hash.finish()
  }
}

/**
 * Class describing a Leaf of SHAMap
 */
class ShaMapLeaf extends ShaMapNode {
  private readonly getHash: () => Hash256

  constructor(public index: Hash256, item: ShaMapItem) {
    super()
    if ('preHashed' in item) {
      this.getHash = () => item.preHashed
    } else if ('hashPrefix' in item && 'toBytesSink' in item) {
      this.getHash = hashableItemHashGetter(item, index)
    } else {
      throw new Error('invalid_item: must be either Hashable or PreHashed')
    }
  }

  /**
   * Get the hash for this node
   *
   * @returns hash of Hashable or PreHashed item
   */
  hash(): Hash256 {
    return this.getHash()
  }

  /**
   * @returns true as ShaMapLeaf is a leaf node
   */
  isLeaf(): boolean {
    return true
  }

  /**
   * @returns false as ShaMapLeaf is not an inner node
   */
  isInner(): boolean {
    return false
  }
}

/**
 * Class defining an Inner Node of a SHAMap
 */
class ShaMapInner extends ShaMapNode {
  private slotBits = 0
  private branches: Array<ShaMapNode> = Array(16)

  constructor(private depth: number = 0) {
    super()
  }

  /**
   * @returns true as ShaMapInner is an inner node
   */
  isInner(): boolean {
    return true
  }

  /**
   * @returns false as ShaMapInner is not a leaf node
   */
  isLeaf(): boolean {
    return false
  }

  /**
   * Get the hash prefix for this node
   *
   * @returns hash prefix describing an inner node
   */
  hashPrefix(): Buffer {
    return HashPrefix.innerNode
  }

  /**
   * Set a branch of this node to be another node
   *
   * @param slot Slot to add branch to this.branches
   * @param branch Branch to add
   */
  setBranch(slot: number, branch: ShaMapNode): void {
    this.slotBits = this.slotBits | (1 << slot)
    this.branches[slot] = branch
  }

  /**
   * @returns true if node is empty
   */
  empty(): boolean {
    return this.slotBits === 0
  }

  /**
   * Compute the hash of this node
   *
   * @returns The hash of this node
   */
  hash(): Hash256 {
    if (this.empty()) {
      return Hash256.ZERO_256
    }
    const hash = Sha512Half.put(this.hashPrefix())
    this.toBytesSink(hash)
    return hash.finish()
  }

  /**
   * Writes the bytes representation of this node to a BytesList
   *
   * @param list BytesList to write bytes to
   */
  toBytesSink(list: BytesList): void {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const hash = branch ? branch.hash() : Hash256.ZERO_256
      hash.toBytesSink(list)
    }
  }

  /**
   * Add item to the SHAMap
   *
   * @param index Hash of the index of the item being inserted
   * @param item Item to insert in the map
   */
  addItem(index: Hash256, item: ShaMapItem): void {
    const nibble = index.nibblet(this.depth)
    const existing = this.branches[nibble]
    if (existing === undefined) {
      this.setBranch(nibble, new ShaMapLeaf(index, item))
    } else if (existing.isLeaf()) {
      const deeper = this.depth + 1
      const newInner = new ShaMapInner(deeper)
      // Set this first in empty inner so addItem can recursively
      // add many inners until indexes diverge.
      newInner.setBranch(existing.index.nibblet(deeper), existing)
      newInner.addItem(index, item)
      this.setBranch(nibble, newInner)
    } else if (existing.isInner()) {
      existing.addItem(index, item)
    } else {
      throw new Error('invalid ShaMap.addItem call')
    }
  }

  /**
   * Depth first walking of ShaMap
   * @param onLeaf callback to be executed for each leaf
   */
  walkLeaves(onLeaf: (leaf: ShaMapLeaf) => void) {
    this.branches.forEach((b) => {
      if (b.isLeaf()) {
        onLeaf(b)
      } else if (b.isInner()) {
        b.walkLeaves(onLeaf)
      }
    })
  }
}

class ShaMap extends ShaMapInner {}

export { ShaMap, ShaMapNode, ShaMapLeaf }
