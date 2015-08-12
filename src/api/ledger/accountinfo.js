/* @flow */

'use strict';
const utils = require('./utils');
const removeUndefined = require('./parse/utils').removeUndefined;
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;

function formatAccountInfo(response) {
  const data = response.account_data;
  return removeUndefined({
    sequence: data.Sequence,
    xrpBalance: utils.common.dropsToXrp(data.Balance),
    ownerCount: data.OwnerCount,
    previousInitiatedTransactionID: data.AccountTxnID,
    previousAffectingTransactionID: data.PreviousTxnID,
    previousAffectingTransactionLedgerVersion: data.PreviousTxnLgrSeq
  });
}

function getAccountInfoAsync(account, options, callback) {
  validate.address(account);
  validate.getAccountInfoOptions(options);

  const request = {
    account: account,
    ledger: options.ledgerVersion || 'validated'
  };

  this.remote.requestAccountInfo(request,
    composeAsync(formatAccountInfo, callback));
}

function getAccountInfo(account: string, options={}) {
  return utils.promisify(getAccountInfoAsync.bind(this))(account, options);
}

module.exports = getAccountInfo;
