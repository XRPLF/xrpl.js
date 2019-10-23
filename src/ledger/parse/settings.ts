import * as _ from 'lodash'
import * as assert from 'assert'
import {constants} from '../../common'
const AccountFlags = constants.AccountFlags
import parseFields from './fields'

function getAccountRootModifiedNode(tx: any) {
  const modifiedNodes = tx.meta.AffectedNodes.filter(node =>
    node.ModifiedNode.LedgerEntryType === 'AccountRoot')
  assert.ok(modifiedNodes.length === 1)
  return modifiedNodes[0].ModifiedNode
}

function parseFlags(tx: any): any {
  const settings: any = {}
  if (tx.TransactionType !== 'AccountSet') {
    return settings
  }

  const node = getAccountRootModifiedNode(tx)
  const oldFlags = _.get(node.PreviousFields, 'Flags')
  const newFlags = _.get(node.FinalFields, 'Flags')

  if (oldFlags !== undefined && newFlags !== undefined) {
    const changedFlags = oldFlags ^ newFlags
    const setFlags = newFlags & changedFlags
    const clearedFlags = oldFlags & changedFlags
    _.forEach(AccountFlags, (flagValue, flagName) => {
      if (setFlags & flagValue) {
        settings[flagName] = true
      } else if (clearedFlags & flagValue) {
        settings[flagName] = false
      }
    })
  }

  // enableTransactionIDTracking requires a special case because it
  // does not affect the Flags field; instead it adds/removes a field called
  // "AccountTxnID" to/from the account root.

  const oldField = _.get(node.PreviousFields, 'AccountTxnID')
  const newField = _.get(node.FinalFields, 'AccountTxnID')
  if (newField && !oldField) {
    settings.enableTransactionIDTracking = true
  } else if (oldField && !newField) {
    settings.enableTransactionIDTracking = false
  }

  return settings
}

function parseSettings(tx: any) {
  const txType = tx.TransactionType
  assert.ok(txType === 'AccountSet' || txType === 'SetRegularKey' ||
         txType === 'SignerListSet')

  return _.assign({}, parseFlags(tx), parseFields(tx))
}

export default parseSettings
