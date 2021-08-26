import _ from 'lodash'
import BigNumber from 'bignumber.js'
import {Client} from '..'

// This is a public API that can be called directly.
// This is not used by the `prepare*` methods. See `src/transaction/utils.ts`
async function getFee(this: Client, cushion?: number): Promise<string> {
  if (cushion == null) {
    cushion = this._feeCushion
  }
  if (cushion == null) {
    cushion = 1.2
  }

  const serverInfo = (await this.request({command: "server_info"})).result.info
  const baseFeeXrp = new BigNumber(serverInfo.validated_ledger.base_fee_xrp)
  if (serverInfo.load_factor == null) {
    // https://github.com/ripple/rippled/issues/3812#issuecomment-816871100
    serverInfo.load_factor = 1
  }
  let fee = baseFeeXrp.times(serverInfo.load_factor).times(cushion)

  // Cap fee to `this._maxFeeXRP`
  fee = BigNumber.min(fee, this._maxFeeXRP)
  // Round fee to 6 decimal places
  return new BigNumber(fee.toFixed(6)).toString(10)
}

export {getFee}
