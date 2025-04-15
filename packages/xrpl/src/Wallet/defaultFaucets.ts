import type { Client } from '../client'
import { XRPLFaucetError } from '../errors'

export interface FaucetWallet {
  account: {
    xAddress: string
    classicAddress?: string
    secret: string
  }
  amount: number
  balance: number
}

export enum FaucetNetwork {
  Testnet = 'faucet.altnet.rippletest.net',
  Devnet = 'faucet.devnet.rippletest.net',
}

export const faucetNetworkPaths: Record<string, string> = {
  [FaucetNetwork.Testnet]: '/accounts',
  [FaucetNetwork.Devnet]: '/accounts',
}

export const faucetNetworkIDs: Map<number, FaucetNetwork> = new Map([
  [1, FaucetNetwork.Testnet],
  [2, FaucetNetwork.Devnet],
])

/**
 * Get the faucet host based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 * @throws When there is no known faucet for the client's network ID.
 */
export function getFaucetHost(client: Client): FaucetNetwork | undefined {
  if (client.networkID == null) {
    throw new XRPLFaucetError(
      'Cannot create faucet URL without networkID or the faucetHost information',
    )
  }

  if (faucetNetworkIDs.has(client.networkID)) {
    return faucetNetworkIDs.get(client.networkID)
  }

  if (client.networkID === 0) {
    // mainnet does not have a faucet
    throw new XRPLFaucetError('Faucet is not available for mainnet.')
  }

  throw new XRPLFaucetError('Faucet URL is not defined or inferrable.')
}

/**
 * Get the faucet pathname based on the faucet hostname.
 *
 * @param hostname - hostname.
 * @returns A String with the correct path for the input hostname.
 * If hostname undefined or cannot find (key, value) pair in {@link faucetNetworkPaths}, defaults to '/accounts'
 */
export function getFaucetPath(hostname: string | undefined): string {
  if (hostname === undefined) {
    return '/accounts'
  }
  return faucetNetworkPaths[hostname] || '/accounts'
}
