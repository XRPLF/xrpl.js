import type { Client } from '..'
// import { XrplError } from '../errors'

/**
 * Returns the network ID of the rippled server.
 *
 * @param this - The Client used to connect to the ledger.
 * @returns The network id.
 */
export default async function getNetworkID(this: Client): Promise<number> {
  const response = await this.request({
    command: 'server_info',
  })
  return response.result.info.network_id ?? 1
}
