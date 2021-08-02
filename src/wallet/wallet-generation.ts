import axios from 'axios'

import {errors} from '../common'
import {GeneratedAddress} from '../offline/generate-address'

export interface FaucetWallet {
  accounts: GeneratedAddress
  amount: number
  balance: number
}

const TEST_FAUCET_URL = 'https://faucet.altnet.rippletest.net/accounts'
const DEV_FAUCET_URL = 'https://faucet.devnet.rippletest.net/accounts'

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @param onTestnet - If true (default), generates the wallet on the Testnet, otherwise on the Devnet
 * @returns - A Wallet on the Testnet or Devnet that contains some amount of XRP.
 */
function generateFaucetWallet(onTestnet = true): Promise<FaucetWallet | void> {
  const faucetUrl = getFaucetUrl(onTestnet)

  return axios
    .post<FaucetWallet>(faucetUrl)
    .then((response) => {
      return response.data
    })
    .catch((error) => {
      throw new errors.XRPLFaucetError(error.data)
    })
}

/**
 * Returns the URL of the faucet that should be used.
 *
 * @param onTestnet - Boolean to indicate which URL to retrieve.
 * @returns - The URL of the matching faucet.
 */
export const getFaucetUrl = (onTestnet: boolean): string => {
  if (onTestnet) {
    return TEST_FAUCET_URL
  } else {
    return DEV_FAUCET_URL
  }
}

export default generateFaucetWallet
