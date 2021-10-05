import BigNumber from 'bignumber.js'
import _ from 'lodash'

import TransactionMetadata, { Node } from '../models/transactions/metadata'

import { dropsToXrp } from './xrpConversion'

interface Balance {
  currency: string
  issuer?: string
  value: string
}

interface BalanceChange {
  address: string
  balance: Balance
}

interface BalanceChanges {
  address: string
  balances: Balance[]
}

interface Fields {
  Account?: string
  Balance?: string
  // eslint-disable-next-line @typescript-eslint/member-ordering -- okay here, just some of the fields are typed to make it easier
  [field: string]: unknown
}

interface NormalizedNode {
  // 'CreatedNode' | 'ModifiedNode' | 'DeletedNode'
  NodeType: string
  LedgerEntryType: string
  LedgerIndex: string
  NewFields?: Fields
  FinalFields?: Fields
  PreviousFields?: Fields
  PreviousTxnID?: string
  PreviouTxnLgrSeq?: number
}

function normalizeNode(affectedNode: Node): NormalizedNode {
  const diffType = Object.keys(affectedNode)[0]
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- not quite right, but close enough
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

function groupByAddress(balanceChanges: BalanceChange[]): BalanceChanges[] {
  const grouped = _.groupBy(balanceChanges, (node) => node.address)
  return Object.entries(grouped).map(([address, items]) => {
    return { address, balances: items.map((item) => item.balance) }
  })
  // return _.mapValues(grouped, function (group) {
  //   return group.map((node) => node.balance))
  // })
}

function computeBalanceChange(node: NormalizedNode): BigNumber | null {
  let value: BigNumber | null = null
  if (node.NewFields?.Balance) {
    value = new BigNumber(node.NewFields.Balance)
  } else if (node.PreviousFields?.Balance && node.FinalFields?.Balance) {
    value = new BigNumber(node.FinalFields.Balance).minus(
      new BigNumber(node.PreviousFields.Balance),
    )
  }
  if (value === null || value.isZero()) {
    return null
  }
  return value
}

// function getFinalBalance(node: NormalizedNode) {
//   if (node.NewFields?.Balance) {
//     return parseValue(node.NewFields.Balance as string)
//   }
//   if (node.FinalFields?.Balance) {
//     return parseValue(node.FinalFields.Balance as string)
//   }
//   return null
// }

function parseXRPQuantity(
  node: NormalizedNode,
): { address: string; balance: Balance } | null {
  const value = computeBalanceChange(node)

  if (value === null) {
    return null
  }

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- okay here
    address: (node.FinalFields?.Account ?? node.NewFields?.Account) as string,
    balance: {
      currency: 'XRP',
      value: dropsToXrp(value).toString(),
    },
  }
}

// function flipTrustlinePerspective(quantity) {
//   const negatedBalance = new BigNumber(quantity.balance.value).negated()
//   return {
//     address: quantity.balance.issuer,
//     balance: {
//       issuer: quantity.address,
//       currency: quantity.balance.currency,
//       value: negatedBalance.toString(),
//     },
//   }
// }

// function parseTrustlineQuantity(node: NormalizedNode, valueParser) {
//   const value = valueParser(node)

//   if (value === null) {
//     return null
//   }

//   // A trustline can be created with a non-zero starting balance
//   // If an offer is placed to acquire an asset with no existing trustline,
//   // the trustline can be created when the offer is taken.
//   const fields =
//     node.NewFields == null || node.NewFields.length === 0
//       ? node.FinalFields
//       : node.NewFields

//   // the balance is always from low node's perspective
//   const result = {
//     address: fields?.LowLimit.issuer,
//     balance: {
//       issuer: fields?.HighLimit?.issuer,
//       currency: fields?.Balance?.currency,
//       value: value.toString(),
//     },
//   }
//   return [result, flipTrustlinePerspective(result)]
// }

/**
 *  Computes the complete list of every balance that changed in the ledger
 *  as a result of the given transaction.
 *
 *  @param metadata - Transaction metada.
 *  @returns Parsed balance changes.
 */
export default function getBalanceChanges(
  metadata: TransactionMetadata,
): BalanceChanges[] {
  const quantities = normalizeNodes(metadata).map((node) => {
    if (node.LedgerEntryType === 'AccountRoot') {
      const xrpQuantity = parseXRPQuantity(node)
      if (xrpQuantity == null) {
        return []
      }
      return [xrpQuantity]
    }
    // if (node.LedgerEntryType === 'RippleState') {
    //   return parseTrustlineQuantity(node, valueParser)
    // }
    return []
  })
  return groupByAddress(_.flatten(quantities))
}
