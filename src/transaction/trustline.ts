import BigNumber from 'bignumber.js'
import * as utils from './utils'
const validate = utils.common.validate
const trustlineFlags = utils.common.txFlags.TrustSet
import {Instructions, Prepare, TransactionJSON} from './types'
import {
  FormattedTrustlineSpecification
} from '../common/types/objects/trustlines'
import {RippleAPI} from '..'

function convertQuality(quality) {
  return (new BigNumber(quality)).shift(9).truncated().toNumber()
}

function createTrustlineTransaction(account: string,
  trustline: FormattedTrustlineSpecification
): TransactionJSON {
  const limit = {
    currency: trustline.currency,
    issuer: trustline.counterparty,
    value: trustline.limit
  }

  const txJSON: any = {
    TransactionType: 'TrustSet',
    Account: account,
    LimitAmount: limit,
    Flags: 0
  }
  if (trustline.qualityIn !== undefined) {
    txJSON.QualityIn = convertQuality(trustline.qualityIn)
  }
  if (trustline.qualityOut !== undefined) {
    txJSON.QualityOut = convertQuality(trustline.qualityOut)
  }
  if (trustline.authorized === true) {
    txJSON.Flags |= trustlineFlags.SetAuth
  }
  if (trustline.ripplingDisabled !== undefined) {
    txJSON.Flags |= trustline.ripplingDisabled ?
      trustlineFlags.NoRipple : trustlineFlags.ClearNoRipple
  }
  if (trustline.frozen !== undefined) {
    txJSON.Flags |= trustline.frozen ?
      trustlineFlags.SetFreeze : trustlineFlags.ClearFreeze
  }
  if (trustline.memos !== undefined) {
    txJSON.Memos = trustline.memos.map(utils.convertMemo)
  }
  return txJSON
}

function prepareTrustline(this: RippleAPI, address: string,
  trustline: FormattedTrustlineSpecification, instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareTrustline({address, trustline, instructions})
    const txJSON = createTrustlineTransaction(address, trustline)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareTrustline
