import * as constants from './constants'
import * as errors from './errors'
import * as validate from './validate'
import * as serverInfo from './serverinfo'
import {xAddressToClassicAddress} from 'ripple-address-codec'

export function ensureClassicAddress(account: string): string {
  // For rippled requests that use an account: always use a classic address.
  // Except for special cases, X-addresses used for requests
  // must not have an embedded tag. In other words,
  // `tag` should be `false`.
  try {
    const {
      classicAddress,
      tag
    } = xAddressToClassicAddress(account)
    if (tag !== false) {
      throw new Error('This command does not support the use of a tag. Use an address without a tag.')
    }
    return classicAddress
  } catch (_) {
    // `account` is already a classic address
    return account
  }
}

export {
  constants,
  errors,
  validate,
  serverInfo
}
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
