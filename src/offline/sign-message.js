/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('ripple-keypairs')
const binary = require('ripple-binary-codec')
const {validate, stringToUtf8ByteArray, bytesToHex} = common

function signMessage(message: string,
  privateKey: string
): string {
  validate.signMessage({message, privateKey})

  return keypairs.sign(bytesToHex(stringToUtf8ByteArray(message)), privateKey)
}

module.exports = signMessage
