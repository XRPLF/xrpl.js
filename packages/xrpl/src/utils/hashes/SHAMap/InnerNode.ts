import { XrplError } from '../../../errors'
import HashPrefix from '../HashPrefix'
import sha512Half from '../sha512Half'

import LeafNode from './LeafNode'
import { NodeType, Node } from './node'

const HEX_ZERO =
  '0000000000000000000000000000000000000000000000000000000000000000'

const SLOT_MAX = 15
const HEX = 16

/**
 * Class for SHAMap InnerNode.
 */
class InnerNode extends Node {
  public leaves: { [slot: number]: Node | undefined }
  public type: NodeType
  public depth: number
  public empty: boolean

  /**
   * Define an Inner (non-leaf) node in a SHAMap tree.
   *
   * @param depth - I.e. How many parent inner nodes.
   */
  public constructor(depth = 0) {
    super()
    this.leaves = {}
    this.type = NodeType.INNER
    this.depth = depth
    this.empty = true
  }

  /**
   * Get the hash of a LeafNode.
   *
   * @returns Hash of the LeafNode.
   */
  public get hash(): string {
    if (this.empty) {
      return HEX_ZERO
    }
    let hex = ''
    for (let iter = 0; iter <= SLOT_MAX; iter++) {
      const child = this.leaves[iter]
      const hash: string = child == null ? HEX_ZERO : child.hash
      hex += hash
    }

    const prefix = HashPrefix.INNER_NODE.toString(HEX)
    return sha512Half(prefix + hex)
  }

  /**
   * Adds an item to the InnerNode.
   *
   * @param tag - Equates to a ledger entry `index`.
   * @param node - Node to add.
   * @throws If there is a index collision.
   */
  public addItem(tag: string, node: Node): void {
    const existingNode = this.getNode(parseInt(tag[this.depth], HEX))

    if (existingNode === undefined) {
      this.setNode(parseInt(tag[this.depth], HEX), node)
      return
    }

    // A node already exists in this slot
    if (existingNode instanceof InnerNode) {
      // There is an inner node, so we need to go deeper
      existingNode.addItem(tag, node)
    } else if (existingNode instanceof LeafNode) {
      if (existingNode.tag === tag) {
        // Collision
        throw new XrplError(
          'Tried to add a node to a SHAMap that was already in there.',
        )
      } else {
        const newInnerNode = new InnerNode(this.depth + 1)

        // Parent new and existing node
        newInnerNode.addItem(existingNode.tag, existingNode)
        newInnerNode.addItem(tag, node)

        // And place the newly created inner node in the slot
        this.setNode(parseInt(tag[this.depth], HEX), newInnerNode)
      }
    }
  }

  /**
   * Overwrite the node that is currently in a given slot.
   *
   * @param slot - A number 0-15.
   * @param node - To place.
   * @throws If slot is out of range.
   */
  public setNode(slot: number, node: Node): void {
    if (slot < 0 || slot > SLOT_MAX) {
      throw new XrplError('Invalid slot: slot must be between 0-15.')
    }
    this.leaves[slot] = node
    this.empty = false
  }

  /**
   * Get the node that is currently in a given slot.
   *
   * @param slot - A number 0-15.
   * @returns Node currently in a slot.
   * @throws If slot is out of range.
   */
  public getNode(slot: number): Node | undefined {
    if (slot < 0 || slot > SLOT_MAX) {
      throw new XrplError('Invalid slot: slot must be between 0-15.')
    }
    return this.leaves[slot]
  }
}

export default InnerNode
