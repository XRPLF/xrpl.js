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

function getServerInfo(connection: Connection): Promise<GetServerInfoResponse> {
  return connection.request({command: 'server_info'}).then(response =>
    convertKeysFromSnakeCaseToCamelCase(response.info)
  );
}

function computeFeeFromServerInfo(cushion: number,
    serverInfo: GetServerInfoResponse
): number {
  return (Number(serverInfo.validatedLedger.baseFeeXrp)
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
