/* @flow */

import * as _ from 'lodash'
import assert from 'assert'
import BigNumber from 'bignumber.js'
import * as utils from './utils'
const validate = utils.common.validate
const AccountFlagIndices = utils.common.constants.AccountFlagIndices
const AccountFields = utils.common.constants.AccountFields
import type {Instructions, Prepare} from './types'

type Settings = {
  passwordSpent?: boolean,
  requireDestinationTag?: boolean,
  requireAuthorization?: boolean,
  disallowIncomingXRP?: boolean,
  disableMasterKey?: boolean,
  enableTransactionIDTracking?: boolean,
  noFreeze?: boolean,
  globalFreeze?: boolean,
  defaultRipple?: boolean,
  emailHash?: ?string,
  messageKey?: string,
  domain?: string,
  transferRate?: ?number,
  regularKey?: string,
  signers?: {
    threshold?: number,
    weights: {address: string, weight: number}[],
  },
}

// Emptry string passed to setting will clear it
const CLEAR_SETTING = null

function setTransactionFlags(txJSON: Object, values: Settings) {
  const keys = Object.keys(values)
  assert(keys.length === 1, 'ERROR: can only set one setting per transaction')
  const flagName = keys[0]
  const value = (values: Object)[flagName]
  const index = AccountFlagIndices[flagName]
  if (index !== undefined) {
    if (value) {
      txJSON.SetFlag = index
    } else {
      txJSON.ClearFlag = index
    }
  }
}

function setTransactionFields(txJSON: Object, input: Settings) {
  const fieldSchema = AccountFields
  for (const fieldName in fieldSchema) {
    const field = fieldSchema[fieldName]
    let value = input[field.name]

    if (value === undefined) {
      continue
    }

    // The value required to clear an account root field varies
    if (value === CLEAR_SETTING && field.hasOwnProperty('defaults')) {
      value = field.defaults
    }

    if (field.encoding === 'hex' && !field.length) {
      // This is currently only used for Domain field
      value = new Buffer(value, 'ascii').toString('hex').toUpperCase()
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

function convertTransferRate(transferRate: number | string): number | string {
  return (new BigNumber(transferRate)).shift(9).toNumber()
}

function formatSignerEntry(signer: Object): Object {
  return {
    SignerEntry: {
      Account: signer.address,
      SignerWeight: signer.weight
    }
  }
}

function createSettingsTransactionWithoutMemos(
  account: string, settings: Settings
): Object {
  if (settings.regularKey !== undefined) {
    const removeRegularKey = {
      TransactionType: 'SetRegularKey',
      Account: account
    }
    if (settings.regularKey === null) {
      return removeRegularKey
    }
    return _.assign({}, removeRegularKey, {RegularKey: settings.regularKey})
  }

  if (settings.signers !== undefined) {
    return {
      TransactionType: 'SignerListSet',
      Account: account,
      SignerQuorum: settings.signers.threshold,
      SignerEntries: _.map(settings.signers.weights, formatSignerEntry)
    }
  }

  const txJSON: Object = {
    TransactionType: 'AccountSet',
    Account: account
  }

  setTransactionFlags(txJSON, _.omit(settings, 'memos'))
  setTransactionFields(txJSON, settings)

  if (txJSON.TransferRate !== undefined) {
    txJSON.TransferRate = convertTransferRate(txJSON.TransferRate)
  }
  return txJSON
}

function createSettingsTransaction(account: string, settings: Settings
): Object {
  const txJSON = createSettingsTransactionWithoutMemos(account, settings)
  if (settings.memos !== undefined) {
    txJSON.Memos = _.map(settings.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareSettings(address: string, settings: Settings,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareSettings({address, settings, instructions})
  const txJSON = createSettingsTransaction(address, settings)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareSettings
