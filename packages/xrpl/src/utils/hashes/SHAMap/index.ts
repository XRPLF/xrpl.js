import InnerNode from './InnerNode'
import LeafNode from './LeafNode'
import { NodeType } from './node'

/**
 * SHAMap is the hash structure used to model ledgers.
 * If the root hash is equivalent, that means all nodes should be equivalent as well.
 */
class SHAMap {
  public root: InnerNode

  /**
   * SHAMap tree constructor.
   */
  public constructor() {
    this.root = new InnerNode(0)
  }

  /**
   * Get the hash of the SHAMap.
   *
   * @returns The hash of the root of the SHAMap.
   */
  public get hash(): string {
    return this.root.hash
  }

  /**
   * Add an item to the SHAMap.
   *
   * @param tag - Index of the Node to add.
   * @param data - Data to insert into the tree.
   * @param type - Type of the node to add.
   */
  public addItem(tag: string, data: string, type: NodeType): void {
    this.root.addItem(tag, new LeafNode(tag, data, type))
  }
}

export * from './node'
export default SHAMap
