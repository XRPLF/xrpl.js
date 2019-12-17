import * as constants from './constants'
import * as errors from './errors'
import * as validate from './validate'
import * as serverInfo from './serverinfo'
import {xAddressToClassicAddress, isValidXAddress} from 'ripple-address-codec'

export function ensureClassicAddress(account: string): string {
  if (isValidXAddress(account)) {
    const {classicAddress, tag} = xAddressToClassicAddress(account)

    // Except for special cases, X-addresses used for requests
    // must not have an embedded tag. In other words,
    // `tag` should be `false`.
    if (tag !== false) {
      throw new Error(
        'This command does not support the use of a tag. Use an address without a tag.'
      )
    }

    // For rippled requests that use an account, always use a classic address.
    return classicAddress
  } else {
    return account
  }
}

export {constants, errors, validate, serverInfo}
export {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  removeUndefined,
  convertKeysFromSnakeCaseToCamelCase,
  iso8601ToRippleTime,
  rippleTimeToISO8601
} from './utils'
export {default as Connection} from './connection'
export {txFlags} from './txflags'
