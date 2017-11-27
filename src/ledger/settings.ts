import * as _ from 'lodash'
import parseFields from './parse/fields'
import {validate, constants} from '../common'
const AccountFlags = constants.AccountFlags

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
  emailHash?: string|null,
  messageKey?: string,
  domain?: string,
  transferRate?: number|null,
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

export default getSettings
