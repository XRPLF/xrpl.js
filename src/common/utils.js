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

/**
 * Converts a JS string to a UTF-8 "byte" array.
 * From {@link https://git.io/v52py|Google's common JavaScript library}.
 * @param {string} str 16-bit unicode string.
 * @return {!Array<number>} UTF-8 byte array.
 */
function stringToUtf8ByteArray(str) {
  var out = [], p = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
        ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
        ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out;
}

function bytesToHex(a) {
  return a.map(function(byteValue) {
    const hex = byteValue.toString(16).toUpperCase();
    return hex.length > 1 ? hex : '0' + hex;
  }).join('');
}

module.exports = {
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  isValidSecret,
  stringToUtf8ByteArray,
  bytesToHex
}
