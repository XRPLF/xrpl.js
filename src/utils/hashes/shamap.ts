import hashPrefix from "./hashPrefix";
import sha512Half from "./sha512Half";

const HEX_ZERO =
  "0000000000000000000000000000000000000000000000000000000000000000";

export enum NodeType {
  INNER = 1,
  TRANSACTION_NO_METADATA = 2,
  TRANSACTION_METADATA = 3,
  ACCOUNT_STATE = 4,
}

export abstract class Node {
  /**
   * Abstract constructor representing a node in a SHAMap tree.
   * Can be either InnerNode or Leaf.
   *
   * @class
   */
  public constructor() {}

  public addItem(_tag: string, _node: Node): void {
    throw new Error(
      "Called unimplemented virtual method SHAMapTreeNode#addItem."
    );
  }

  public get hash(): string | void {
    throw new Error("Called unimplemented virtual method SHAMapTreeNode#hash.");
  }
}

export class InnerNode extends Node {
  public leaves: { [slot: number]: Node };
  public type: NodeType;
  public depth: number;
  public empty: boolean;

  /**
   * Define an Inner (non-leaf) node in a SHAMap tree.
   *
   * @param depth - I.e. How many parent inner nodes.
   * @class
   */
  public constructor(depth = 0) {
    super();
    this.leaves = {};
    this.type = NodeType.INNER;
    this.depth = depth;
    this.empty = true;
  }

  /**
   * @param {string} tag - Equates to a ledger entry `index`.
   * @param {Node} node - To add.
   * @returns {void}
   */

  public addItem(tag: string, node: Node): void {
    const existingNode = this.getNode(parseInt(tag[this.depth], 16));
    if (existingNode) {
      // A node already exists in this slot
      if (existingNode instanceof InnerNode) {
        // There is an inner node, so we need to go deeper
        existingNode.addItem(tag, node);
      } else if (existingNode instanceof Leaf) {
        if (existingNode.tag === tag) {
          // Collision
          throw new Error(
            "Tried to add a node to a SHAMap that was already in there."
          );
        } else {
          // Turn it into an inner node
          const newInnerNode = new InnerNode(this.depth + 1);

          // Parent new and existing node
          newInnerNode.addItem(existingNode.tag, existingNode);
          newInnerNode.addItem(tag, node);

          // And place the newly created inner node in the slot
          this.setNode(parseInt(tag[this.depth], 16), newInnerNode);
        }
      }
    } else {
      // Neat, we have a nice open spot for the new node
      this.setNode(parseInt(tag[this.depth], 16), node);
    }
  }

  /**
   * Overwrite the node that is currently in a given slot.
   *
   * @param slot - A number 0-15.
   * @param node - To place.
   * @returns
   */
  public setNode(slot: number, node: Node): void {
    if (slot < 0 || slot > 15) {
      throw new Error("Invalid slot: slot must be between 0-15.");
    }
    this.leaves[slot] = node;
    this.empty = false;
  }

  /**
   * Get the node that is currently in a given slot.
   *
   * @param slot - A number 0-15.
   * @returns
   */
  public getNode(slot: number): Node {
    if (slot < 0 || slot > 15) {
      throw new Error("Invalid slot: slot must be between 0-15.");
    }
    return this.leaves[slot];
  }

  public get hash(): string {
    if (this.empty) {
      return HEX_ZERO;
    }
    let hex = "";
    for (let i = 0; i < 16; i++) {
      hex += this.leaves[i] ? this.leaves[i].hash : HEX_ZERO;
    }
    const prefix = hashPrefix.INNER_NODE.toString(16);
    return sha512Half(prefix + hex);
  }
}

export class Leaf extends Node {
  public tag: string;
  public type: NodeType;
  public data: string;

  /**
   * Leaf node in a SHAMap tree.
   *
   * @param tag - Equates to a ledger entry `index`.
   * @param data - Hex of account state, transaction etc.
   * @param type - One of TYPE_ACCOUNT_STATE, TYPE_TRANSACTION_MD etc.
   * @class
   */
  public constructor(tag: string, data: string, type: NodeType) {
    super();
    this.tag = tag;
    this.type = type;
    this.data = data;
  }

  public get hash(): string | void {
    switch (this.type) {
      case NodeType.ACCOUNT_STATE: {
        const leafPrefix = hashPrefix.LEAF_NODE.toString(16);
        return sha512Half(leafPrefix + this.data + this.tag);
      }
      case NodeType.TRANSACTION_NO_METADATA: {
        const txIDPrefix = hashPrefix.TRANSACTION_ID.toString(16);
        return sha512Half(txIDPrefix + this.data);
      }
      case NodeType.TRANSACTION_METADATA: {
        const txNodePrefix = hashPrefix.TRANSACTION_NODE.toString(16);
        return sha512Half(txNodePrefix + this.data + this.tag);
      }
      default:
        throw new Error("Tried to hash a SHAMap node of unknown type.");
    }
  }
}

export class SHAMap {
  public root: InnerNode;

  /**
   * SHAMap tree.
   *
   * @class
   */
  public constructor() {
    this.root = new InnerNode(0);
  }

  public addItem(tag: string, data: string, type: NodeType): void {
    this.root.addItem(tag, new Leaf(tag, data, type));
  }

  public get hash(): string {
    return this.root.hash;
  }
}
