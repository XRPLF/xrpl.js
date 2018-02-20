import {validate, removeUndefined, dropsToXrp} from '../common'
import {RippleAPI} from '../api'
import {AccountInfoResponse} from '../common/types/commands/account_info'

type GetAccountInfoOptions = {
  ledgerVersion?: number
}

type FormattedGetAccountInfoResponse = {
  sequence: number,
  xrpBalance: string,
  ownerCount: number,
  previousInitiatedTransactionID: string,
  previousAffectingTransactionID: string,
  previousAffectingTransactionLedgerVersion: number
}

function formatAccountInfo(
  response: AccountInfoResponse
): FormattedGetAccountInfoResponse {
  const data = response.account_data
  return removeUndefined({
    sequence: data.Sequence,
    xrpBalance: dropsToXrp(data.Balance),
    ownerCount: data.OwnerCount,
    previousInitiatedTransactionID: data.AccountTxnID,
    previousAffectingTransactionID: data.PreviousTxnID,
    previousAffectingTransactionLedgerVersion: data.PreviousTxnLgrSeq
  })
}

export default async function getAccountInfo(
  this: RippleAPI, address: string, options: GetAccountInfoOptions = {}
): Promise<FormattedGetAccountInfoResponse> {
  // 1. Validate
  validate.getAccountInfo({address, options})
  // 2. Make Request
  const response = await this._request('account_info', {
    account: address,
    ledger_index: options.ledgerVersion || 'validated'
  })
  // 3. Return Formatted Response
  return formatAccountInfo(response)
}
