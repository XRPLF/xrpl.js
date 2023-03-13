import { Amount } from '../common'

export interface CreatedNode {
  CreatedNode: {
    LedgerEntryType: string
    LedgerIndex: string
    NewFields: { [field: string]: unknown }
  }
}

export interface ModifiedNode {
  ModifiedNode: {
    LedgerEntryType: string
    LedgerIndex: string
    FinalFields?: { [field: string]: unknown }
    PreviousFields?: { [field: string]: unknown }
    PreviousTxnID?: string
    PreviousTxnLgrSeq?: number
  }
}

export interface DeletedNode {
  DeletedNode: {
    LedgerEntryType: string
    LedgerIndex: string
    FinalFields: { [field: string]: unknown }
  }
}

export type Node = CreatedNode | ModifiedNode | DeletedNode

/**
 * A typeguard to check if a node is a CreatedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a CreatedNode.
 */
export function isCreatedNode(node: Node): node is CreatedNode {
  return Object.prototype.hasOwnProperty.call(node, `CreatedNode`)
}

/**
 * A typeguard to check if a node is a ModifiedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a ModifiedNode.
 */
export function isModifiedNode(node: Node): node is ModifiedNode {
  return Object.prototype.hasOwnProperty.call(node, `ModifiedNode`)
}

/**
 * A typeguard to check if a node is a DeletedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a DeletedNode.
 */
export function isDeletedNode(node: Node): node is DeletedNode {
  return Object.prototype.hasOwnProperty.call(node, `DeletedNode`)
}

export interface TransactionMetadata {
  AffectedNodes: Node[]
  DeliveredAmount?: Amount
  // "unavailable" possible for transactions before 2014-01-20
  delivered_amount?: Amount | 'unavailable'
  TransactionIndex: number
  TransactionResult: string
}
