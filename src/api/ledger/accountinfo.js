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

function getAccountInfo(account, options, callback) {
  validate.address(account);
  validate.getAccountInfoOptions(options);

  const request = {
    account: account,
    ledger: options.ledgerVersion
  };

  this.remote.requestAccountInfo(request,
    composeAsync(formatAccountInfo, callback));
}

module.exports = utils.wrapCatch(getAccountInfo);
