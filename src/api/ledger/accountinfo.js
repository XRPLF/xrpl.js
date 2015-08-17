/* @flow */

'use strict';
const utils = require('./utils');
const removeUndefined = require('./parse/utils').removeUndefined;
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;

type AccountData = {
  Sequence: number,
  Account: string,
  Balance: string,
  Flags: number,
  LedgerEntryType: string,
  OwnerCount: number,
  PreviousTxnID: string,
  AccountTxnID?: string,
  PreviousTxnLgrSeq: number,
  index: string
}

type AccountDataResponse = {
  account_data: AccountData,
  ledger_current_index?: number,
  ledger_hash?: string,
  ledger_index: number,
  validated: boolean
}

type AccountInfoOptions = {
  ledgerVersion?: number
}

type AccountInfoCallback = (err: any, data: AccountInfoResponse) => void

type AccountInfoResponse = {
  sequence: number,
  xrpBalance: string,
  ownerCount: number,
  previousInitiatedTransactionID: string,
  previousAffectingTransactionID: string,
  previousAffectingTransactionLedgerVersion: number
}

function formatAccountInfo(response: AccountDataResponse) {
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

function getAccountInfoAsync(account: string, options: AccountInfoOptions,
                             callback: AccountInfoCallback
) {
  validate.address(account);
  validate.getAccountInfoOptions(options);

  const request = {
    account: account,
    ledger: options.ledgerVersion || 'validated'
  };

  this.remote.requestAccountInfo(request,
    composeAsync(formatAccountInfo, callback));
}

function getAccountInfo(account: string, options: AccountInfoOptions={}
): Promise<AccountInfoResponse> {
  return utils.promisify(getAccountInfoAsync.bind(this))(account, options);
}

module.exports = getAccountInfo;
