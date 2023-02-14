export enum NodeType {
  INNER = 1,
  TRANSACTION_NO_METADATA = 2,
  TRANSACTION_METADATA = 3,
  ACCOUNT_STATE = 4,
}

/**
 * Abstract base class for SHAMapNode.
 */
export abstract class Node {
  public abstract get hash(): string
  public abstract addItem(_tag: string, _node: Node): void
}
