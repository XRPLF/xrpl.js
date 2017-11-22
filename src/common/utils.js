/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const {deriveKeypair} = require('ripple-keypairs')

import type {Amount, RippledAmount} from './types.js'

function isValidSecret(secret: string): boolean {
  try {
    deriveKeypair(secret)
    return true
  } catch (err) {
    return false
  }
}

function dropsToXrp(drops: string): string {
  return (new BigNumber(drops)).dividedBy(1000000.0).toString()
}

function xrpToDrops(xrp: string): string {
  return (new BigNumber(xrp)).times(1000000.0).floor().toString()
}

function toRippledAmount(amount: Amount): RippledAmount {
  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value)
  }
  // $FlowFixMe: amount.issuer is not a Amount type property. Safe to remove?
  return {
    currency: amount.currency,
    issuer: amount.counterparty ? amount.counterparty :
      (amount.issuer ? amount.issuer : undefined),
    value: amount.value
  }
}

function convertKeysFromSnakeCaseToCamelCase(obj: any): any {
  if (typeof obj === 'object') {
    let newKey
    return _.reduce(obj, (result, value, key) => {
      newKey = key
      // taking this out of function leads to error in PhantomJS
      const FINDSNAKE = /([a-zA-Z]_[a-zA-Z])/g
      if (FINDSNAKE.test(key)) {
        newKey = key.replace(FINDSNAKE, r => r[0] + r[2].toUpperCase())
      }
      result[newKey] = convertKeysFromSnakeCaseToCamelCase(value)
      return result
    }, {})
  }
  return obj
}

function removeUndefined(obj: Object): Object {
  return _.omitBy(obj, _.isUndefined)
}

/**
 * @param {Number} rpepoch (seconds since 1/1/2000 GMT)
 * @return {Number} ms since unix epoch
 *
 */
function rippleToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + 0x386D4380) * 1000
}

/**
 * @param {Number|Date} timestamp (ms since unix epoch)
 * @return {Number} seconds since ripple epoch ( 1/1/2000 GMT)
 */
function unixToRippleTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - 0x386D4380
}

function rippleTimeToISO8601(rippleTime: number): string {
  return new Date(rippleToUnixTimestamp(rippleTime)).toISOString()
}

function iso8601ToRippleTime(iso8601: string): number {
  return unixToRippleTimestamp(Date.parse(iso8601))
}

module.exports = {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  isValidSecret
}
