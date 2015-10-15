/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;
const BigNumber = require('bignumber.js');
import type {Instructions, Prepare} from './types.js';
import type {TrustLineSpecification} from '../ledger/trustlines-types.js';

const TrustSetFlags = {
  authorized: {set: 'SetAuth'},
  ripplingDisabled: {set: 'NoRipple', unset: 'ClearNoRipple'},
  frozen: {set: 'SetFreeze', unset: 'ClearFreeze'}
};

function convertQuality(quality) {
  return quality === undefined ? undefined :
    (new BigNumber(quality)).shift(9).truncated().toNumber();
}

function createTrustlineTransaction(account: string,
    trustline: TrustLineSpecification
): Transaction {
  validate.address(account);
  validate.trustline(trustline);

  const limit = {
    currency: trustline.currency,
    issuer: trustline.counterparty,
    value: trustline.limit
  };

  const transaction = new Transaction();
  transaction.trustSet(account, limit, convertQuality(trustline.qualityIn),
    convertQuality(trustline.qualityOut));
  utils.setTransactionBitFlags(transaction, trustline, TrustSetFlags);
  return transaction;
}

function prepareTrustlineAsync(account: string,
    trustline: TrustLineSpecification, instructions: Instructions, callback
) {
  const transaction = createTrustlineTransaction(account, trustline);
  utils.prepareTransaction(transaction, this.remote, instructions, callback);
}

function prepareTrustline(account: string,
    trustline: TrustLineSpecification, instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareTrustlineAsync.bind(this))(
    account, trustline, instructions);
}

module.exports = prepareTrustline;
