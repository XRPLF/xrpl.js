import type { Client } from '..'
import { XrplError } from '../errors'

/**
 * Returns the network ID of the rippled server.
 *
 * @param this - The Client used to connect to the ledger.
 * @param client
 * @returns The network id.
 */
export default async function getNetworkID(client: Client): Promise<number> {
  const response = await client.request({
    command: 'server_info',
  })
  const networkID = response.result.info.network_id
  if (networkID == null) {
    throw new XrplError(
      'getNetworkID: Could not get network_id from server_info',
    )
  }
  return networkID
}
