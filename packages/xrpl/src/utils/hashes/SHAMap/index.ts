import InnerNode from './InnerNode'
import LeafNode from './LeafNode'
import { NodeType } from './node'

class SHAMap {
  public root: InnerNode

  /**
   * SHAMap tree constructor.
   */
  public constructor() {
    this.root = new InnerNode(0)
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

  /**
   * Get the hash of the SHAMap.
   *
   * @returns The hash of the root of the SHAMap.
   */
  public get hash(): string {
    return this.root.hash
  }
}

export * from './node'
export default SHAMap
