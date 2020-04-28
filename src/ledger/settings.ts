import * as _ from 'lodash'
import parseFields from './parse/fields'
import {validate, constants, ensureClassicAddress} from '../common'
import {FormattedSettings} from '../common/types/objects'
import {AccountInfoResponse} from '../common/types/commands'
import {RippleAPI} from '..'
import {Settings} from '../common/constants'

const AccountFlags = constants.AccountFlags

export type SettingsOptions = {
  ledgerVersion?: number
}

export function parseAccountFlags(
  value: number,
  options: {excludeFalse?: boolean} = {}
): Settings {
  const settings = {}
  for (const flagName in AccountFlags) {
    if (value & AccountFlags[flagName]) {
      settings[flagName] = true
    } else {
      if (!options.excludeFalse) {
        settings[flagName] = false
      }
    }
  }
  return settings
}

function formatSettings(response: AccountInfoResponse) {
  const data = response.account_data
  const parsedFlags = parseAccountFlags(data.Flags, {excludeFalse: true})
  const parsedFields = parseFields(data)
  return _.assign({}, parsedFlags, parsedFields)
}

export async function getSettings(
  this: RippleAPI,
  address: string,
  options: SettingsOptions = {}
): Promise<FormattedSettings> {
  // 1. Validate
  validate.getSettings({address, options})

  // Only support retrieving settings without a tag,
  // since settings do not distinguish by tag.
  address = ensureClassicAddress(address)

  // 2. Make Request
  const response = await this.request('account_info', {
    account: address,
    ledger_index: options.ledgerVersion || 'validated',
    signer_lists: true
  })
  // 3. Return Formatted Response
  return formatSettings(response)
}
