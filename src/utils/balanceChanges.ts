import BigNumber from 'bignumber.js'
import _ from 'lodash'

import TransactionMetadata, { Node } from '../models/transactions/metadata'

import { dropsToXrp } from './xrpConversion'

interface NormalizedNode {
  // 'CreatedNode' | 'ModifiedNode' | 'DeletedNode'
  NodeType: string
  LedgerEntryType: string
  LedgerIndex: string
  NewFields?: { [field: string]: unknown }
  FinalFields?: { [field: string]: unknown }
  PreviousFields?: { [field: string]: unknown }
  PreviousTxnID?: string
  PreviouTxnLgrSeq?: number
}

function normalizeNode(affectedNode: Node): NormalizedNode {
  const diffType = Object.keys(affectedNode)[0]
  const node = affectedNode[diffType] as NormalizedNode
  return {
    ...node,
    NodeType: diffType,
    LedgerEntryType: node.LedgerEntryType,
    LedgerIndex: node.LedgerIndex,
    NewFields: node.NewFields ?? {},
    FinalFields: node.FinalFields ?? {},
    PreviousFields: node.PreviousFields ?? {},
  }
}

function normalizeNodes(metadata: TransactionMetadata): NormalizedNode[] {
  if (metadata.AffectedNodes.length === 0) {
    return []
  }
  return metadata.AffectedNodes.map(normalizeNode)
}

function groupByAddress(balanceChanges) {
  const grouped = _.groupBy(balanceChanges, function (node) {
    return node.address
  })
  return _.mapValues(grouped, function (group) {
    return _.map(group, function (node) {
      return node.balance
    })
  })
}

function parseValue(value: number | string): BigNumber {
  return new BigNumber(value)
}

function computeBalanceChange(node: NormalizedNode): BigNumber | null {
  let value: BigNumber | null = null
  if (node.NewFields?.Balance) {
    value = parseValue(node.NewFields.Balance as string)
  } else if (node.PreviousFields?.Balance && node.FinalFields?.Balance) {
    value = parseValue(node.FinalFields.Balance as string).minus(
      parseValue(node.PreviousFields.Balance as string),
    )
  }
  if (value === null || value.isZero()) {
    return null
  }
  return value
}

function getFinalBalance(node: NormalizedNode) {
  if (node.NewFields?.Balance) {
    return parseValue(node.NewFields.Balance as string)
  }
  if (node.FinalFields?.Balance) {
    return parseValue(node.FinalFields.Balance as string)
  }
  return null
}

function parseXRPQuantity(
  node: NormalizedNode,
  valueParser: (NormalizedNode) => BigNumber | null,
) {
  const value = valueParser(node)

  if (value === null) {
    return null
  }

  return {
    address: node.FinalFields?.Account || node.NewFields?.Account,
    balance: {
      currency: 'XRP',
      value: dropsToXrp(value).toString(),
    },
  }
}

function flipTrustlinePerspective(quantity) {
  const negatedBalance = new BigNumber(quantity.balance.value).negated()
  return {
    address: quantity.balance.counterparty,
    balance: {
      counterparty: quantity.address,
      currency: quantity.balance.currency,
      value: negatedBalance.toString(),
    },
  }
}

function parseTrustlineQuantity(node: NormalizedNode, valueParser) {
  const value = valueParser(node)

  if (value === null) {
    return null
  }

  // A trustline can be created with a non-zero starting balance
  // If an offer is placed to acquire an asset with no existing trustline,
  // the trustline can be created when the offer is taken.
  const fields = _.isEmpty(node.newFields) ? node.finalFields : node.newFields

  // the balance is always from low node's perspective
  const result = {
    address: fields.LowLimit.issuer,
    balance: {
      counterparty: fields.HighLimit.issuer,
      currency: fields.Balance.currency,
      value: value.toString(),
    },
  }
  return [result, flipTrustlinePerspective(result)]
}

function getQuantities(metadata: TransactionMetadata, valueParser) {
  const values = normalizeNodes(metadata).map(function (node) {
    if (node.LedgerEntryType === 'AccountRoot') {
      return [parseXRPQuantity(node, valueParser)]
    }
    if (node.LedgerEntryType === 'RippleState') {
      return parseTrustlineQuantity(node, valueParser)
    }
    return []
  })
  return groupByAddress(_.compact(_.flatten(values)))
}

/**
 *  Computes the complete list of every balance that changed in the ledger
 *  as a result of the given transaction.
 *
 *  @param metadata - Transaction metada.
 *  @returns Parsed balance changes.
 */
export function getBalanceChanges(metadata: TransactionMetadata) {
  return getQuantities(metadata, computeBalanceChange)
}

/**
 *  Computes the complete list of every final balance in the ledger
 *  as a result of the given transaction.
 *
 *  @param metadata - Transaction metada.
 *  @returns Parsed balances.
 */
export function getFinalBalances(metadata: TransactionMetadata) {
  return getQuantities(metadata, getFinalBalance)
}
