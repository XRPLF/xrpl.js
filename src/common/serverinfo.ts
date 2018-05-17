import * as _ from 'lodash'
import {convertKeysFromSnakeCaseToCamelCase} from './utils'
import BigNumber from 'bignumber.js'
import {RippleAPI} from '../index'
import {ServerInfoResponse} from './types/commands'

export type GetServerInfoResponse = {
  buildVersion: string,
  completeLedgers: string,
  hostID: string,
  ioLatencyMs: number,
  load?: {
    jobTypes: Array<Object>,
    threads: number
  },
  lastClose: {
    convergeTimeS: number,
    proposers: number
  },
  loadFactor: number,
  peers: number,
  pubkeyNode: string,
  pubkeyValidator?: string,
  serverState: string,
  validatedLedger: {
    age: number,
    baseFeeXRP: string,
    hash: string,
    reserveBaseXRP: string,
    reserveIncrementXRP: string,
    ledgerVersion: number
  },
  validationQuorum: number
}

function renameKeys(object, mapping) {
  _.forEach(mapping, (to, from) => {
    object[to] = object[from]
    delete object[from]
  })
}

function computeFeeFromServerInfo(
  cushion: number, serverInfo: ServerInfoResponse
): string {
  return (new BigNumber(serverInfo.info.validated_ledger.base_fee_xrp)).
    times(serverInfo.info.load_factor).
    times(cushion).toString()
}

function getServerInfo(this: RippleAPI): Promise<GetServerInfoResponse> {
  return this.request('server_info').then(response => {
    const info = convertKeysFromSnakeCaseToCamelCase(response.info)
    renameKeys(info, {hostid: 'hostID'})
    if (info.validatedLedger) {
      renameKeys(info.validatedLedger, {
        baseFeeXrp: 'baseFeeXRP',
        reserveBaseXrp: 'reserveBaseXRP',
        reserveIncXrp: 'reserveIncrementXRP',
        seq: 'ledgerVersion'
      })
      info.validatedLedger.baseFeeXRP =
        info.validatedLedger.baseFeeXRP.toString()
      info.validatedLedger.reserveBaseXRP =
        info.validatedLedger.reserveBaseXRP.toString()
      info.validatedLedger.reserveIncrementXRP =
        info.validatedLedger.reserveIncrementXRP.toString()
    }
    return info
  })
}

async function getFee(this: RippleAPI, cushion?: number): Promise<string> {
  if (cushion === undefined) {
    cushion = this._feeCushion
  }
  if (cushion === undefined) {
    cushion = 1.2
  }
  const response = await this.request('server_info')
  return computeFeeFromServerInfo(cushion, response)
}

export {
  getServerInfo,
  getFee
}
