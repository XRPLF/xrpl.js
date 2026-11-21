import BigNumber from 'bignumber.js'

import { type Client } from '..'
import { XrplError } from '../errors'

const NUM_DECIMAL_PLACES = 6
const BASE_10 = 10

/**
 * Calculates the current transaction fee for the ledger.
 * Note: This is a public API that can be called directly.
 *
 * @param client - The Client used to connect to the ledger.
 * @param cushion - The fee cushion to use.
 * @returns The transaction fee.
 */
export default async function getFeeXrp(
  client: Client,
  cushion?: number,
): Promise<string> {
  const feeCushion = cushion ?? client.feeCushion

  const serverInfo = (
    await client.request({
      command: 'server_info',
    })
  ).result.info

  const baseFee = serverInfo.validated_ledger?.base_fee_xrp

  if (baseFee == null) {
    throw new XrplError(
      'getFeeXrp: Could not get base_fee_xrp from server_info',
    )
  }

  const baseFeeXrp = new BigNumber(baseFee)
  // https://github.com/ripple/rippled/issues/3812#issuecomment-816871100
  serverInfo.load_factor ??= 1
  let fee = baseFeeXrp.times(serverInfo.load_factor).times(feeCushion)

  // Cap fee to `client.maxFeeXRP`
  fee = BigNumber.min(fee, client.maxFeeXRP)
  // Round fee to 6 decimal places
  return new BigNumber(fee.toFixed(NUM_DECIMAL_PLACES)).toString(BASE_10)
}

/**
 * Estimates the gas required for a transaction by simulating the provided tx blob.
 *
 * @param client - The Client used to connect to the ledger.
 * @param txBlob - The transaction blob to simulate.
 * @returns The estimated gas as a string.
 */
export async function getGasEstimate(
  client: Client,
  txBlob: string,
): Promise<number> {
  const response = await client.request({
    command: 'simulate',
    tx_blob: txBlob,
  })

  if (response.result.engine_result !== 'tesSUCCESS') {
    throw new Error(response.result.engine_result_message)
  }

  if (typeof response.result.meta !== 'object') {
    throw new XrplError(
      'getGasEstimate: Could not get meta from simulate response',
    )
  }

  const meta = response.result.meta
  if (typeof meta.GasUsed !== 'number') {
    throw new XrplError(
      'getGasEstimate: GasUsed in simulate response is not a number',
    )
  }
  return Number(meta.GasUsed)
}
