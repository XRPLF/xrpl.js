import hashPrefix from './hash-prefix'
import hash from './sha512hash'
const HEX_ZERO = '0000000000000000000000000000000000000000000000000000000000000000'

export enum NodeTypes {
  INNER = 1,
  TRANSACTION_NM = 2,
  TRANSACTION_MD = 3,
  ACCOUNT_STATE = 4
}

export abstract class Node {
  /**
   * Abstract constructor representing a node in a SHAMap tree.
   * Can be either InnerNode, InnerNodeV2 or Leaf.
   * @constructor
   */
  public constructor() {}

  public addItem(_tag: string, _node: Node): void {
    throw new Error('Called unimplemented virtual method SHAMapTreeNode#addItem.')
  }
  public get hash(): string|void {
    throw new Error('Called unimplemented virtual method SHAMapTreeNode#hash.');
  }
}

export class InnerNode extends Node {
  public leaves: { [slot: string]: Node }
  public type: NodeTypes
  public depth: number
  public empty: boolean

  /**
   * Define an Inner (non-leaf) node in a SHAMap tree.
   * @param {number} depth i.e. how many parent inner nodes
   * @constructor
   */
  public constructor(depth: number = 0) {
    super()
    this.leaves = {}
    this.type = NodeTypes.INNER
    this.depth = depth
    this.empty = true
  }

  /**
   * @param {string} tag equates to a ledger entry `index`
   * @param {Node} node to add
   * @return {void}
   */  
  public addItem(tag: string, node: Node): void {
    const existingNode = this.getNode(tag[this.depth])
    if (existingNode) {
      // A node already exists in this slot
      if (existingNode instanceof InnerNode) {
        // There is an inner node, so we need to go deeper
        existingNode.addItem(tag, node)
      } else if (existingNode instanceof Leaf) {
        if (existingNode.tag === tag) {
          // Collision
          throw new Error(
              'Tried to add a node to a SHAMap that was already in there.')
        } else {
          // Turn it into an inner node
          const newInnerNode = new InnerNode(this.depth + 1)
    
          // Parent new and existing node
          newInnerNode.addItem(existingNode.tag, existingNode)
          newInnerNode.addItem(tag, node)
    
          // And place the newly created inner node in the slot
          this.setNode(tag[this.depth], newInnerNode)
        }
      }
    } else {
      // Neat, we have a nice open spot for the new node
      this.setNode(tag[this.depth], node)
    }
  }

  /**
   * Overwrite the node that is currently in a given slot.
   * @param {string} slot a character 0-F
   * @param {Node} node to place
   * @return {void}
   */
  public setNode(slot: string, node: Node): void {
    this.leaves[slot] = node
    this.empty = false
  }

  /**
   * Get the node that is currently in a given slot.
   * @param {string} slot a character 0-F
   * @return {Node}
   */
  public getNode(slot: string): Node {
    return this.leaves[slot]
  }

  public get hash(): string {
    if (this.empty) return HEX_ZERO
    let hex = ''
    for (let i = 0; i < 16; i++) {
      const slot = i.toString(16).toUpperCase()
      hex += this.leaves[slot] ? this.leaves[slot].hash : HEX_ZERO
    }
    const prefix = hashPrefix.INNER_NODE.toString(16)
    return hash(prefix + hex)
  } 
}

export class InnerNodeV2 extends InnerNode {
  public common: string

  /**
   * V2 inner (non-leaf) node in a SHAMap tree.
   * @param {number} depth
   * @constructor
   */
  public constructor(depth: number = 0) {
    super(depth)
    this.common = ''
  }

  /**
   * @param {string} key equates to a ledger entry `index`
   * @return {number} common prefix depth
   */
  public getCommonPrefix(key: string): number {
    let depth = 0
    for (let i = 0; i < this.depth; i++) {
      if (this.common[i] === key[i]) {
        depth++
      }
    }
    return depth
  }

  /**
   * @param {string} key equates to a ledger entry `index`
   * @return {boolean} returns true if common prefix exists
   */  
  public hasCommonPrefix (key: string): boolean {
    for (let i = 0; i < this.depth; i++) {
      if (this.common[i] !== key[i]) {
        return false
      }
    }
    return true
  }

  /**
   * @param {string} tag equates to a ledger entry `index`
   * @param {Node} node to add
   * @return {void}
   */
  public addItem (tag: string, node: Node): void {
    const existingNode = this.getNode(tag[this.depth])
  
    if (existingNode) {
      // A node already exists in this slot
      if (existingNode instanceof InnerNodeV2) {
        if (existingNode.hasCommonPrefix(tag)) {
          // There is an inner node, so we need to go deeper
          existingNode.addItem(tag, node)
        } else {
          // Create new inner node and move existing node under it
          const newDepth = existingNode.getCommonPrefix(tag)
          const newInnerNode = new InnerNodeV2(newDepth)
          newInnerNode.common = tag.slice(0, newDepth - 64)
  
          // Parent new and existing node
          newInnerNode.setNode(existingNode.common[newDepth], existingNode)
          newInnerNode.addItem(tag, node)
  
          // And place the newly created inner node in the slot
          this.setNode(tag[this.depth], newInnerNode)
        }
      } else if (existingNode instanceof Leaf) {
        if (existingNode.tag === tag) {
          // Collision
          throw new Error(
              'Tried to add a node to a SHAMap that was already in there.')
        } else {
          // Turn it into an inner node
          const newInnerNode = new InnerNodeV2(0)
    
          for (let i = 0; tag[i] === existingNode.tag[i]; i++) {
            newInnerNode.common += tag[i]
            newInnerNode.depth++
          }
    
          // Parent new and existing node
          newInnerNode.addItem(existingNode.tag, existingNode)
          newInnerNode.addItem(tag, node)
    
          // And place the newly created inner node in the slot
          this.setNode(tag[this.depth], newInnerNode)
        }
      }
    } else {
      // Neat, we have a nice open spot for the new node
      this.setNode(tag[this.depth], node)
    }
  }

  public get hash(): string {
    if (this.empty) return HEX_ZERO
    let hex = ''
    for (let i = 0; i < 16; i++) {
      const slot = i.toString(16).toUpperCase()
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
    const prefix = hashPrefix.INNER_NODE_V2.toString(16)
    return hash(prefix + hex)
  }
}

export class Leaf extends Node {
  public tag: string
  public type: NodeTypes
  public data: string

  /**
   * Leaf node in a SHAMap tree.
   * @param {string} tag equates to a ledger entry `index`
   * @param {string} data hex of account state, transaction etc
   * @param {number} type one of TYPE_ACCOUNT_STATE, TYPE_TRANSACTION_MD etc
   * @constructor
   */
  public constructor(tag: string, data: string, type: NodeTypes) {
    super()
    this.tag = tag
    this.type = type
    this.data = data
  }

  public get hash(): string|void {
    switch (this.type) {
      case NodeTypes.ACCOUNT_STATE:
        const leafPrefix = hashPrefix.LEAF_NODE.toString(16)
        return hash(leafPrefix + this.data + this.tag)
      case NodeTypes.TRANSACTION_NM:
        const txIDPrefix = hashPrefix.TX_ID.toString(16)
        return hash(txIDPrefix + this.data)
      case NodeTypes.TRANSACTION_MD:
        const txNodePrefix = hashPrefix.TX_NODE.toString(16)
        return hash(txNodePrefix + this.data + this.tag)
      default:
        throw new Error('Tried to hash a SHAMap node of unknown type.')
    }
  }  
}

export class SHAMap {
  public root: InnerNode | InnerNodeV2

  /**
   * SHAMap tree.
   * @param {number} version inner node version number
   * @constructor
   */
  public constructor(version: number = 0) {
    this.root = version === 1 ? new InnerNode(0) : new InnerNodeV2(0)
  }

  public addItem(tag: string, data: string, type: NodeTypes): void {
    this.root.addItem(tag, new Leaf(tag, data, type))
  }

  public get hash(): string {
    return this.root.hash
  }
}
