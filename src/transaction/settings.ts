import * as assert from 'assert'
import BigNumber from 'bignumber.js'
import * as utils from './utils'
const validate = utils.common.validate
const AccountFlagIndices = utils.common.constants.AccountFlagIndices
const AccountFields = utils.common.constants.AccountFields
import {Instructions, Prepare, SettingsTransaction} from './types'
import {FormattedSettings, WeightedSigner} from '../common/types/objects'
import {RippleAPI} from '..'

function setTransactionFlags(txJSON: utils.TransactionJSON, values: FormattedSettings) {
  const keys = Object.keys(values)
  assert.ok(keys.length === 1, 'ERROR: can only set one setting per transaction')
  const flagName = keys[0]
  const value = values[flagName]
  const index = AccountFlagIndices[flagName]
  if (index !== undefined) {
    if (value) {
      txJSON.SetFlag = index
    } else {
      txJSON.ClearFlag = index
    }
  }
}

// Sets `null` fields to their `default`.
function setTransactionFields(txJSON: utils.TransactionJSON, input: FormattedSettings) {
  const fieldSchema = AccountFields
  for (const fieldName in fieldSchema) {
    const field = fieldSchema[fieldName]
    let value = input[field.name]

    if (value === undefined) {
      continue
    }

    // The value required to clear an account root field varies
    if (value === null && field.hasOwnProperty('defaults')) {
      value = field.defaults
    }

    if (field.encoding === 'hex' && !field.length) {
      // This is currently only used for Domain field
      value = Buffer.from(value, 'ascii').toString('hex').toUpperCase()
    }

    txJSON[fieldName] = value
  }
}

/**
 *  Note: A fee of 1% requires 101% of the destination to be sent for the
 *        destination to receive 100%.
 *  The transfer rate is specified as the input amount as fraction of 1.
 *  To specify the default rate of 0%, a 100% input amount, specify 1.
 *  To specify a rate of 1%, a 101% input amount, specify 1.01
 *
 *  @param {Number|String} transferRate
 *
 *  @returns {Number|String} numbers will be converted while strings
 *                           are returned
 */

function convertTransferRate(transferRate: number): number {
  return (new BigNumber(transferRate)).shiftedBy(9).toNumber()
}

function formatSignerEntry(signer: WeightedSigner): object {
  return {
    SignerEntry: {
      Account: signer.address,
      SignerWeight: signer.weight
    }
  }
}

function createSettingsTransactionWithoutMemos(
  account: string, settings: FormattedSettings
): SettingsTransaction {
  if (settings.regularKey !== undefined) {
    const removeRegularKey = {
      TransactionType: 'SetRegularKey',
      Account: account
    }
    if (settings.regularKey === null) {
      return removeRegularKey
    }
    return Object.assign({}, removeRegularKey, {RegularKey: settings.regularKey})
  }

  if (settings.signers !== undefined) {
    const setSignerList = {
      TransactionType: 'SignerListSet',
      Account: account,
      SignerEntries: [],
      SignerQuorum: settings.signers.threshold
    };

    if (settings.signers.weights !== undefined) {
        setSignerList.SignerEntries = settings.signers.weights.map(formatSignerEntry);
    }
    return setSignerList;
  }

  const txJSON: SettingsTransaction = {
    TransactionType: 'AccountSet',
    Account: account
  }

  const settingsWithoutMemos = Object.assign({}, settings)
  delete settingsWithoutMemos.memos
  setTransactionFlags(txJSON, settingsWithoutMemos)
  setTransactionFields(txJSON, settings) // Sets `null` fields to their `default`.

  if (txJSON.TransferRate !== undefined) {
    txJSON.TransferRate = convertTransferRate(txJSON.TransferRate)
  }
  return txJSON
}

function createSettingsTransaction(account: string, settings: FormattedSettings
): SettingsTransaction {
  const txJSON = createSettingsTransactionWithoutMemos(account, settings)
  if (settings.memos !== undefined) {
    txJSON.Memos = settings.memos.map(utils.convertMemo)
  }
  return txJSON
}

function prepareSettings(this: RippleAPI, address: string, settings: FormattedSettings,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareSettings({address, settings, instructions})
    const txJSON = createSettingsTransaction(address, settings)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareSettings
