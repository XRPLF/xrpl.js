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

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- Typeguard requires checking if undefined */
/* eslint-disable @typescript-eslint/consistent-type-assertions -- Type assertions needed for typeguard */

/**
 * A typeguard to check if a node is a CreatedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a CreatedNode.
 */
export function isCreatedNode(node: Node): node is CreatedNode {
  return (node as CreatedNode).CreatedNode !== undefined
}

/**
 * A typeguard to check if a node is a ModifiedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a ModifiedNode.
 */
export function isModifiedNode(node: Node): node is ModifiedNode {
  return (node as ModifiedNode).ModifiedNode !== undefined
}

/**
 * A typeguard to check if a node is a DeletedNode.
 *
 * @param node - A node from metadata.
 * @returns whether the given node is a DeletedNode.
 */
export function isDeletedNode(node: Node): node is DeletedNode {
  return (node as DeletedNode).DeletedNode !== undefined
}

/* eslint-enable @typescript-eslint/no-unnecessary-condition -- Done with typeguard functions */
/* eslint-enable @typescript-eslint/consistent-type-assertions -- Done with typeguard functions */

export interface TransactionMetadata {
  AffectedNodes: Node[]
  DeliveredAmount?: Amount
  // "unavailable" possible for transactions before 2014-01-20
  delivered_amount?: Amount | 'unavailable'
  TransactionIndex: number
  TransactionResult: string
}
