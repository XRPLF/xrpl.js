import {HASH_INNER_NODE, HASH_INNER_NODE_V2, HASH_TX_ID, HASH_TX_NODE, HASH_LEAF_NODE} from './hashprefix'
import hash from './sha512hash'
const HEX_ZERO = '0000000000000000000000000000000000000000000000000000000000000000'
export const TYPE_INNER = 1
export const TYPE_TRANSACTION_NM = 2
export const TYPE_TRANSACTION_MD = 3
export const TYPE_ACCOUNT_STATE = 4

/**
 * Abstract class representing a node in a SHAMap tree.
 *
 * Can be either SHAMapTreeNodeInner, SHAMapTreeNodeInnerV2
 * or SHAMapTreeNodeLeaf.
 *
 * @class
 */
export abstract class Node {
  public constructor() {}
  public add_item(_tag: string, _node: Node): void {
    throw new Error('Called unimplemented virtual method SHAMapTreeNode#add_item.')
  }
  public get hash(): string|void {
    throw new Error('Called unimplemented virtual method SHAMapTreeNode#hash.');
  }
}

/**
 * Inner (non-leaf) node in a SHAMap tree.
 * @param {Number} depth (i.e. how many parent inner nodes)
 * @class
 */
export class InnerNode extends Node {
  public leaves: object
  public type: 1 | 2 | 3 |4
  public depth: number
  public empty: boolean
  public constructor(depth: number = 0) {
    super()
    this.leaves = {}
    this.type = TYPE_INNER
    this.depth = depth
    this.empty = true
  }
  /**
   * @param {String} tag (equates to a ledger entry `index`)
   * @param {Node} node (to add)
   * @return {void}
   */  
  public add_item(tag: string, node: Node): void {
    const existing_node = this.get_node(tag[this.depth])
    if (existing_node) {
      // A node already exists in this slot
      if (existing_node instanceof InnerNode) {
        // There is an inner node, so we need to go deeper
        existing_node.add_item(tag, node)
      } else if (existing_node instanceof Leaf) {
        if (existing_node.tag === tag) {
          // Collision
          throw new Error(
              'Tried to add a node to a SHAMap that was already in there.')
        } else {
          // Turn it into an inner node
          var new_inner_node = new InnerNode(this.depth + 1)
    
          // Parent new and existing node
          new_inner_node.add_item(existing_node.tag, existing_node)
          new_inner_node.add_item(tag, node)
    
          // And place the newly created inner node in the slot
          this.set_node(tag[this.depth], new_inner_node)
        }
      }
    } else {
      // Neat, we have a nice open spot for the new node
      this.set_node(tag[this.depth], node)
    }
  }
  /**
   * Overwrite the node that is currently in a given slot.
   * @param {String} slot (a character 0-F)
   * @param {Node} node (to place)
   * @return {void}
   */  
  public set_node(slot: string, node: Node): void {
    this.leaves[slot] = node
    this.empty = false
  }
  public get_node(slot: string): Node {
    return this.leaves[slot]
  }
  public get hash(): string {
    if (this.empty) return HEX_ZERO
    let hex = ''
    for (let i = 0; i < 16; i++) {
      const slot = i.toString(16).toUpperCase()
      hex += this.leaves[slot] ? this.leaves[slot].hash : HEX_ZERO
    }
    const prefix = HASH_INNER_NODE.toString(16)
    return hash(prefix + hex)
  }  
}

/**
 * V2 inner (non-leaf) node in a SHAMap tree.
 * @param {Number} depth ()
 * @class
 */
export class InnerNodeV2 extends InnerNode {
  public common: string
  public constructor(depth: number = 0) {
    super(depth)
    this.common = ''
  }
  /**
   * @param {String} key (equates to a ledger entry `index`)
   * @return {Number} (common prefix depth)
   */
  public get_common_prefix(key: string): number {
    let depth = 0
    for (let i = 0; i < this.depth; i++) {
      if (this.common[i] === key[i]) {
        depth++
      }
    }
    return depth
  }
  /**
   * @param {String} key (equates to a ledger entry `index`)
   * @return {bool} (returns true if common prefix exists)
   */  
  public has_common_prefix (key: string): boolean {
    for (let i = 0; i < this.depth; i++) {
      if (this.common[i] !== key[i]) {
        return false
      }
    }
    return true
  }
  /**
   * @param {String} tag (equates to a ledger entry `index`)
   * @param {Node} node (to add)
   * @return {void}
   */
  public add_item (tag: string, node: Node): void {
    var existing_node = this.get_node(tag[this.depth])
  
    if (existing_node) {
      // A node already exists in this slot
      if (existing_node instanceof InnerNodeV2) {
        if (existing_node.has_common_prefix(tag)) {
          // There is an inner node, so we need to go deeper
          existing_node.add_item(tag, node)
        } else {
          // Create new inner node and move existing node under it
          var new_depth = existing_node.get_common_prefix(tag)
          var new_inner_node = new InnerNodeV2(new_depth)
          new_inner_node.common = tag.slice(0, new_depth - 64)
  
          // Parent new and existing node
          new_inner_node.set_node(existing_node.common[new_depth], existing_node)
          new_inner_node.add_item(tag, node)
  
          // And place the newly created inner node in the slot
          this.set_node(tag[this.depth], new_inner_node)
        }
      } else if (existing_node instanceof Leaf) {
        if (existing_node.tag === tag) {
          // Collision
          throw new Error(
              'Tried to add a node to a SHAMap that was already in there.')
        } else {
          // Turn it into an inner node
          var new_inner_node = new InnerNodeV2(0)
    
          for (var i = 0; tag[i] === existing_node.tag[i]; i++) {
            new_inner_node.common += tag[i]
            new_inner_node.depth++
          }
    
          // Parent new and existing node
          new_inner_node.add_item(existing_node.tag, existing_node)
          new_inner_node.add_item(tag, node)
    
          // And place the newly created inner node in the slot
          this.set_node(tag[this.depth], new_inner_node)
        }
      }
    } else {
      // Neat, we have a nice open spot for the new node
      this.set_node(tag[this.depth], node)
    }
  }
  public get hash(): string {
    if (this.empty) return HEX_ZERO
    let hex = ''
    for (var i = 0; i < 16; i++) {
      var slot = i.toString(16).toUpperCase()
      hex += this.leaves[slot] ? this.leaves[slot].hash : HEX_ZERO
    }
    if (this.depth < 16) {
      hex += '0'
    }
    hex += this.depth.toString(16).toUpperCase()
    hex += this.common
    if (this.common.length % 2) {
      hex += '0'
    }
    const prefix = HASH_INNER_NODE_V2.toString(16)
    return hash(prefix + hex)
  }
}

/**
 * Leaf node in a SHAMap tree.
 * @param {String} tag (equates to a ledger entry `index`)
 * @param {String} data (hex of account state, transaction etc)
 * @param {Number} type (one of TYPE_ACCOUNT_STATE, TYPE_TRANSACTION_MD etc)
 * @class
 */
export class Leaf extends Node {
  public tag: string
  public type: 1 | 2 | 3 | 4
  public data: string
  public constructor(tag: string, data: string, type: 1 | 2 | 3 | 4) {
    super()
    this.tag = tag
    this.type = type
    this.data = data
  }
  public get hash(): string|void {
    switch (this.type) {
      case TYPE_ACCOUNT_STATE:
        var leafPrefix = HASH_LEAF_NODE.toString(16)
        return hash(leafPrefix + this.data + this.tag)
      case TYPE_TRANSACTION_NM:
        var txPrefix = HASH_TX_ID.toString(16)
        return hash(txPrefix + this.data)
      case TYPE_TRANSACTION_MD:
        var txPrefix = HASH_TX_NODE.toString(16)
        return hash(txPrefix + this.data + this.tag)
      default:
        throw new Error('Tried to hash a SHAMap node of unknown type.')
    }
  }  
}

/**
 * SHAMap tree.
 * @param {Number} version (inner node version number)
 * @class
 */
export class SHAMap {
  public root: InnerNode | InnerNodeV2
  public constructor(version: number = 0) {
    this.root = version === 1 ? new InnerNode(0) : new InnerNodeV2(0)
  }
  public add_item(tag: string, data: string, type: 1 | 2 | 3 | 4): void {
    this.root.add_item(tag, new Leaf(tag, data, type))
  }
  public get hash(): string {
    return this.root.hash
  }
}