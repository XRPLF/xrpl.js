import BigNumber from 'bignumber.js'

import {
  Amount,
  Balance,
  IssuedCurrencyAmount,
  TransactionMetadata,
  Node,
} from '../models'

import { groupBy } from './collections'
import { dropsToXrp } from './xrpConversion'

interface BalanceChange {
  account: string
  balance: Balance
}
interface Fields {
  Account?: string
  Balance?: Amount
  LowLimit?: IssuedCurrencyAmount
  HighLimit?: IssuedCurrencyAmount
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
  PreviousTxnLgrSeq?: number
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
    NewFields: node.NewFields,
    FinalFields: node.FinalFields,
    PreviousFields: node.PreviousFields,
  }
}

function normalizeNodes(metadata: TransactionMetadata): NormalizedNode[] {
  if (metadata.AffectedNodes.length === 0) {
    return []
  }
  return metadata.AffectedNodes.map(normalizeNode)
}

function groupByAccount(balanceChanges: BalanceChange[]): Array<{
  account: string
  balances: Balance[]
}> {
  const grouped = groupBy(balanceChanges, (node) => node.account)
  return Object.entries(grouped).map(([account, items]) => {
    return { account, balances: items.map((item) => item.balance) }
  })
}

function getValue(balance: Amount): BigNumber {
  if (typeof balance === 'string') {
    return new BigNumber(balance)
  }
  return new BigNumber(balance.value)
}

function computeBalanceChange(node: NormalizedNode): BigNumber | null {
  let value: BigNumber | null = null
  if (node.NewFields?.Balance) {
    value = getValue(node.NewFields.Balance)
  } else if (node.PreviousFields?.Balance && node.FinalFields?.Balance) {
    value = getValue(node.FinalFields.Balance).minus(
      getValue(node.PreviousFields.Balance),
    )
  }
  if (value === null || value.isZero()) {
    return null
  }
  return value
}

function getXRPQuantity(
  node: NormalizedNode,
): { account: string; balance: Balance } | null {
  const value = computeBalanceChange(node)

  if (value === null) {
    return null
  }

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- okay here
    account: (node.FinalFields?.Account ?? node.NewFields?.Account) as string,
    balance: {
      currency: 'XRP',
      value: dropsToXrp(value).toString(),
    },
  }
}

function flipTrustlinePerspective(balanceChange: BalanceChange): BalanceChange {
  const negatedBalance = new BigNumber(balanceChange.balance.value).negated()
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know this is true
    account: balanceChange.balance.issuer as string,
    balance: {
      issuer: balanceChange.account,
      currency: balanceChange.balance.currency,
      value: negatedBalance.toString(),
    },
  }
}

function getTrustlineQuantity(node: NormalizedNode): BalanceChange[] | null {
  const value = computeBalanceChange(node)

  if (value === null) {
    return null
  }

  /*
   * A trustline can be created with a non-zero starting balance.
   * If an offer is placed to acquire an asset with no existing trustline,
   * the trustline can be created when the offer is taken.
   */
  const fields = node.NewFields == null ? node.FinalFields : node.NewFields

  // the balance is always from low node's perspective
  const result = {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know that this is true
    account: fields?.LowLimit?.issuer as string,
    balance: {
      issuer: fields?.HighLimit?.issuer,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know that this is true
      currency: (fields?.Balance as IssuedCurrencyAmount).currency,
      value: value.toString(),
    },
  }
  return [result, flipTrustlinePerspective(result)]
}

/**
 * Computes the complete list of every balance that changed in the ledger
 * as a result of the given transaction.
 *
 * @param metadata - Transaction metadata.
 * @returns Parsed balance changes.
 * @category Utilities
 */
export default function getBalanceChanges(
  metadata: TransactionMetadata,
): Array<{
  account: string
  balances: Balance[]
}> {
  const quantities = normalizeNodes(metadata).map((node) => {
    if (node.LedgerEntryType === 'AccountRoot') {
      const xrpQuantity = getXRPQuantity(node)
      if (xrpQuantity == null) {
        return []
      }
      return [xrpQuantity]
    }
    if (node.LedgerEntryType === 'RippleState') {
      const trustlineQuantity = getTrustlineQuantity(node)
      if (trustlineQuantity == null) {
        return []
      }
      return trustlineQuantity
    }
    return []
  })
  return groupByAccount(quantities.flat())
}
