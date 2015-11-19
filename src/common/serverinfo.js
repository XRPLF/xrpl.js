'use strict';
const _ = require('lodash');
const {convertKeysFromSnakeCaseToCamelCase} = require('./utils');
import type {Connection} from './connection';

export type GetServerInfoResponse = {
  buildVersion: string,
  completeLedgers: string,
  hostid: string,
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
    baseFeeXrp: number,
    hash: string,
    reserveBaseXrp: number,
    reserveIncXrp: number,
    seq: number
  },
  validationQuorum: number
}

function renameKeys(object, mapping) {
  _.forEach(mapping, (to, from) => {
    object[to] = object[from];
    delete object[from];
  });
}

function getServerInfo(connection: Connection): Promise<GetServerInfoResponse> {
  return connection.request({command: 'server_info'}).then(response => {
    const info = convertKeysFromSnakeCaseToCamelCase(response.info);
    renameKeys(info, {hostid: 'hostID'});
    renameKeys(info.validatedLedger, {
      baseFeeXrp: 'baseFeeXRP',
      reserveBaseXrp: 'reserveBaseXRP',
      reserveIncXrp: 'reserveIncrementXRP',
      seq: 'ledgerVersion'
    });
    return info;
  });
}

function computeFeeFromServerInfo(cushion: number,
    serverInfo: GetServerInfoResponse
): number {
  return (Number(serverInfo.validatedLedger.baseFeeXRP)
       * Number(serverInfo.loadFactor) * cushion).toString();
}

function getFee(connection: Connection, cushion: number) {
  return getServerInfo(connection).then(
    _.partial(computeFeeFromServerInfo, cushion));
}

module.exports = {
  getServerInfo,
  getFee
};
