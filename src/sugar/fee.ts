import BigNumber from 'bignumber.js'

import type { Client } from '..'

const NUM_DECIMAL_PLACES = 6
const BASE_10 = 10

/**
 * Calculates the current transaction fee for the ledger.
 * Note: This is a public API that can be called directly.
 * This is not used by the `prepare*` methods. See `src/transaction/utils.ts`.
 *
 * @param this - The Client used to connect to the ledger.
 * @param cushion - The fee cushion to use.
 * @returns The transaction fee.
 */
export default async function getFee(
  this: Client,
  cushion?: number,
): Promise<string> {
  const feeCushion = cushion ?? this.feeCushion

  const serverInfo = (await this.request({ command: 'server_info' })).result
    .info

  const baseFee = serverInfo.validated_ledger?.base_fee_xrp

  if (baseFee == null) {
    throw new Error('getFee: Could not get base_fee_xrp from server_info')
  }

  const baseFeeXrp = new BigNumber(baseFee)
  if (serverInfo.load_factor == null) {
    // https://github.com/ripple/rippled/issues/3812#issuecomment-816871100
    serverInfo.load_factor = 1
  }
  let fee = baseFeeXrp.times(serverInfo.load_factor).times(feeCushion)

  // Cap fee to `client.maxFeeXRP`
  fee = BigNumber.min(fee, this.maxFeeXRP)
  // Round fee to 6 decimal places
  return new BigNumber(fee.toFixed(NUM_DECIMAL_PLACES)).toString(BASE_10)
}
