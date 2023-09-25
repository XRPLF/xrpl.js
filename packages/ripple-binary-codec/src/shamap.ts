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
 * A prehashed item where you only have the hash, not the contents
 */
export interface Prehashed {
  prehashed: Hash256
}

export type ShaMapItem = Hashable | Prehashed

/**
 * Abstract class describing a SHAMapNode
 */
abstract class ShaMapNode implements Hashable {
  abstract hashPrefix(): Buffer

  abstract isLeaf(): boolean

  abstract isInner(): boolean

  abstract toBytesSink(list: BytesList): void

  abstract hash(): Hash256
}

function assert(cond: boolean, message = '') {
  if (!cond) {
    throw new Error(message)
  }
}

function assertIsHashable(item: ShaMapItem): asserts item is Hashable {
  const hashable = item as Hashable
  assert(
    hashable &&
      typeof hashable.hashPrefix === 'function' &&
      typeof hashable.toBytesSink === 'function',
  )
}

/**
 * Class describing a Leaf of SHAMap
 */
class ShaMapLeaf extends ShaMapNode {
  private prehashed?: Hash256
  private hashable: Hashable

  constructor(public index: Hash256, item: ShaMapItem) {
    super()
    this.prehashed = (item as Prehashed).prehashed ?? undefined
    if (!this.prehashed) {
      assertIsHashable(item)
    }
    this.hashable = item as Hashable
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

  /**
   * Get the prefix of the this.item
   *
   * @returns The hash prefix
   */
  hashPrefix(): Buffer {
    assert(!this.prehashed)
    return this.hashable.hashPrefix()
  }

  /**
   * Hash the bytes representation of this
   *
   * @returns hash of this.item concatenated with this.index
   */
  hash(): Hash256 {
    if (this.prehashed) {
      return this.prehashed
    }
    const hash = Sha512Half.put(this.hashPrefix())
    this.toBytesSink(hash)
    return hash.finish()
  }

  /**
   * Write the bytes representation of this to a BytesList
   * @param list BytesList to write bytes to
   */
  toBytesSink(list: BytesList): void {
    assert(!this.prehashed)
    this.hashable.toBytesSink(list)
    this.index.toBytesSink(list)
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
  private setBranch(slot: number, branch: ShaMapNode): void {
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
    } else if (existing instanceof ShaMapLeaf) {
      const deeper = this.depth + 1
      const newInner = new ShaMapInner(deeper)
      // Set this first in empty inner so addItem can recursively
      // add many inners until indexes diverge.
      newInner.setBranch(existing.index.nibblet(deeper), existing)
      newInner.addItem(index, item)
      this.setBranch(nibble, newInner)
    } else if (existing instanceof ShaMapInner) {
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
      if (b instanceof ShaMapLeaf) {
        onLeaf(b)
      } else if (b instanceof ShaMapInner) {
        b.walkLeaves(onLeaf)
      }
    })
  }
}

class ShaMap extends ShaMapInner {}

export { ShaMap, ShaMapNode, ShaMapLeaf }
