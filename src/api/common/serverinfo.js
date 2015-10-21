'use strict';
const _ = require('lodash');
const {RippledNetworkError} = require('./errors');
const {promisify, convertKeysFromSnakeCaseToCamelCase} = require('./utils');

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

function getServerInfoAsync(remote,
  callback: (err: any, data?: GetServerInfoResponse) => void
): void {
  remote.rawRequest({command: 'server_info'}, (error, response) => {
    if (error) {
      const message = _.get(error, ['remote', 'error_message'], error.message);
      callback(new RippledNetworkError(message));
    } else {
      callback(null, convertKeysFromSnakeCaseToCamelCase(response.info));
    }
  });
}

function getServerInfo(remote: Object): Promise<GetServerInfoResponse> {
  return promisify(getServerInfoAsync)(remote);
}

function computeFeeFromServerInfo(cushion: number,
    serverInfo: GetServerInfoResponse
): number {
  return (Number(serverInfo.validatedLedger.baseFeeXrp)
       * Number(serverInfo.loadFactor) * cushion).toString();
}

function getFee(remote: Object, cushion: number) {
  return getServerInfo(remote).then(
    _.partial(computeFeeFromServerInfo, cushion));
}

module.exports = {
  getServerInfo,
  getFee
};
