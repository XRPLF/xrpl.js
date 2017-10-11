/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const parseFields = require('./parse/fields')
const {validate} = utils.common
const AccountFlags = utils.common.constants.AccountFlags

type SettingsOptions = {
  ledgerVersion?: number
}

type GetSettings = {
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
  regularKey?: string
}


function parseFlags(value) {
  const settings = {}
  for (const flagName in AccountFlags) {
    if (value & AccountFlags[flagName]) {
      settings[flagName] = true
    }
  }
  return settings
}

function formatSettings(response) {
  const data = response.account_data
  const parsedFlags = parseFlags(data.Flags)
  const parsedFields = parseFields(data)
  return _.assign({}, parsedFlags, parsedFields)
}

function getSettings(address: string, options: SettingsOptions = {}
): Promise<GetSettings> {
  validate.getSettings({address, options})

  const request = {
    command: 'account_info',
    account: address,
    ledger_index: options.ledgerVersion || 'validated',
    signer_lists: true
  }

  return this.connection.request(request).then(formatSettings)
}

module.exports = getSettings
