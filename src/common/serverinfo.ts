import * as _ from 'lodash'
import {convertKeysFromSnakeCaseToCamelCase} from './utils'
import BigNumber from 'bignumber.js'
import {RippleAPI} from '..'

export type GetServerInfoResponse = {
  buildVersion: string
  completeLedgers: string
  hostID: string
  ioLatencyMs: number
  load?: {
    jobTypes: Array<object>
    threads: number
  }
  lastClose: {
    convergeTimeS: number
    proposers: number
  }
  loadFactor: number
  peers: number
  pubkeyNode: string
  pubkeyValidator?: string
  serverState: string
  validatedLedger: {
    age: number
    baseFeeXRP: string
    hash: string
    reserveBaseXRP: string
    reserveIncrementXRP: string
    ledgerVersion: number
  }
  validationQuorum: number
  networkLedger?: string
}

function renameKeys(object: Record<string, any>, mapping: Record<string, any>) {
  Object.entries(mapping).forEach(entry => {
    const [from, to] = entry;
    object[to] = object[from]
    delete object[from]
  })
}

function getServerInfo(this: RippleAPI): Promise<GetServerInfoResponse> {
  return this.request('server_info').then((response) => {
    const info = convertKeysFromSnakeCaseToCamelCase(response.info)
    renameKeys(info, {hostid: 'hostID'})
    if (info.validatedLedger) {
      renameKeys(info.validatedLedger, {
        baseFeeXrp: 'baseFeeXRP',
        reserveBaseXrp: 'reserveBaseXRP',
        reserveIncXrp: 'reserveIncrementXRP',
        seq: 'ledgerVersion'
      })
      info.validatedLedger.baseFeeXRP = info.validatedLedger.baseFeeXRP.toString()
      info.validatedLedger.reserveBaseXRP = info.validatedLedger.reserveBaseXRP.toString()
      info.validatedLedger.reserveIncrementXRP = info.validatedLedger.reserveIncrementXRP.toString()
    }
    return info
  })
}

// This is a public API that can be called directly.
// This is not used by the `prepare*` methods. See `src/transaction/utils.ts`
async function getFee(this: RippleAPI, cushion?: number): Promise<string> {
  if (cushion == null) {
    cushion = this._feeCushion
  }
  if (cushion == null) {
    cushion = 1.2
  }

  const serverInfo = (await this.request('server_info')).info
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

export {getServerInfo, getFee}
