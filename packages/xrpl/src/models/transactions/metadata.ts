import { Amount } from '../common'

import { BaseTransaction } from './common'
import { NFTokenAcceptOffer } from './NFTokenAcceptOffer'
import { NFTokenCancelOffer } from './NFTokenCancelOffer'
import { NFTokenCreateOffer } from './NFTokenCreateOffer'
import { NFTokenMint } from './NFTokenMint'
import { Payment } from './payment'
import type { Transaction } from './transaction'

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

export type TransactionMetadata<T extends BaseTransaction = Transaction> = {
  AffectedNodes: Node[]
  DeliveredAmount?: Amount
  // "unavailable" possible for transactions before 2014-01-20
  delivered_amount?: Amount | 'unavailable'
  TransactionIndex: number
  TransactionResult: string
} & (T extends Payment
  ? {
      delivered_amount?: Amount | 'unavailable'
    }
  : T extends NFTokenMint
  ? {
      // rippled 1.11.0 or later
      nftoken_id?: string
    }
  : T extends NFTokenCreateOffer
  ? {
      // rippled 1.11.0 or later
      offer_id?: string
    }
  : T extends NFTokenAcceptOffer
  ? {
      // rippled 1.11.0 or later
      nftoken_id?: string
    }
  : T extends NFTokenCancelOffer
  ? {
      // rippled 1.11.0 or later
      nftoken_ids?: string[]
    }
  : Record<string, never>)
