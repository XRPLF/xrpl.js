/* @flow */

'use strict';
const utils = require('./utils');
const {validate, composeAsync, convertErrors, removeUndefined} = utils.common;

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
    command: 'account_info',
    account: account,
    ledger_index: options.ledgerVersion || 'validated'
  };

  this.remote.rawRequest(request,
    composeAsync(formatAccountInfo, convertErrors(callback)));
}

function getAccountInfo(account: string, options: AccountInfoOptions = {}
): Promise<AccountInfoResponse> {
  return utils.promisify(getAccountInfoAsync).call(this, account, options);
}

module.exports = getAccountInfo;
