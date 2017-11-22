/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const ValidationError = utils.common.errors.ValidationError
const claimFlags = utils.common.txFlags.PaymentChannelClaim
const {validate, xrpToDrops} = utils.common
import type {Instructions, Prepare} from './types.js'

type PaymentChannelClaim = {
  channel: string,
  balance?: string,
  amount?: string,
  signature?: string,
  publicKey?: string,
  renew?: boolean,
  close?: boolean
}

function createPaymentChannelClaimTransaction(account: string,
  claim: PaymentChannelClaim
): Object {
  const txJSON: Object = {
    Account: account,
    TransactionType: 'PaymentChannelClaim',
    Channel: claim.channel,
    Flags: 0
  }

  if (claim.balance !== undefined) {
    txJSON.Balance = xrpToDrops(claim.balance)
  }
  if (claim.amount !== undefined) {
    txJSON.Amount = xrpToDrops(claim.amount)
  }

  if (Boolean(claim.signature) !== Boolean(claim.publicKey)) {
    throw new ValidationError('"signature" and "publicKey" fields on'
      + ' PaymentChannelClaim must only be specified together.')
  }

  if (claim.signature !== undefined) {
    txJSON.Signature = claim.signature
  }
  if (claim.publicKey !== undefined) {
    txJSON.PublicKey = claim.publicKey
  }

  if (claim.renew === true && claim.close === true) {
    throw new ValidationError('"renew" and "close" flags on PaymentChannelClaim'
      + ' are mutually exclusive')
  }

  if (claim.renew === true) {
    txJSON.Flags |= claimFlags.Renew
  }
  if (claim.close === true) {
    txJSON.Flags |= claimFlags.Close
  }

  return txJSON
}

function preparePaymentChannelClaim(address: string,
  paymentChannelClaim: PaymentChannelClaim,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.preparePaymentChannelClaim(
    {address, paymentChannelClaim, instructions})
  const txJSON = createPaymentChannelClaimTransaction(
    address, paymentChannelClaim)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = preparePaymentChannelClaim
