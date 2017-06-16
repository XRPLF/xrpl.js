/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const binary = require('ripple-binary-codec')
const utils = require('./utils')
const BigNumber = require('bignumber.js')
const {decodeAddress} = require('ripple-address-codec')
const {validate} = utils.common
const {computeBinaryTransactionHash} = require('ripple-hashes')

function addressToBigNumber(address) {
  const hex = (new Buffer(decodeAddress(address))).toString('hex')
  return new BigNumber(hex, 16)
}

function compareSigners(a, b) {
  return addressToBigNumber(a.Signer.Account)
    .comparedTo(addressToBigNumber(b.Signer.Account))
}

function combine(signedTransactions: Array<string>): Object {
  validate.combine({signedTransactions})

  const txs = _.map(signedTransactions, binary.decode)
  const tx = _.omit(txs[0], 'Signers')
  if (!_.every(txs, _tx => _.isEqual(tx, _.omit(_tx, 'Signers')))) {
    throw new utils.common.errors.ValidationError(
      'txJSON is not the same for all signedTransactions')
  }
  const unsortedSigners = _.reduce(txs, (accumulator, _tx) =>
    accumulator.concat(_tx.Signers || []), [])
  const signers = unsortedSigners.sort(compareSigners)
  const signedTx = _.assign({}, tx, {Signers: signers})
  const signedTransaction = binary.encode(signedTx)
  const id = computeBinaryTransactionHash(signedTransaction)
  return {signedTransaction, id}
}

module.exports = combine
