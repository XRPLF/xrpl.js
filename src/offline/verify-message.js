/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('ripple-keypairs')
const binary = require('ripple-binary-codec')
const {validate, stringToUtf8ByteArray, bytesToHex} = common

function verifyMessage(message: string,
  signature: string, publicKey: string
): string {
  validate.verifyMessage({message, signature, publicKey})

  return keypairs.verify(bytesToHex(stringToUtf8ByteArray(message)), signature, publicKey)
}

module.exports = verifyMessage
