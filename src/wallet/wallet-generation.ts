import axios from 'axios'

import {RippleAPI} from '..'
import {errors} from '../common'
import {GeneratedAddress} from '../offline/generate-address'
import {isValidAddress} from '../common/schema-validator'

export interface FaucetWallet {
  account: GeneratedAddress
  amount: number
  balance: number
}

export enum FaucetNetwork {
  Testnet = 'https://faucet.altnet.rippletest.net/accounts',
  Devnet = 'https://faucet.devnet.rippletest.net/accounts'
}

const INTERVAL_SECONDS = 1 // Interval to check an account balance
const MAX_ATTEMPS = 20 // Maximum attempts to retrieve a balance

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @param address - An existing XRPL address to fund, if undefined, a new wallet will be created.
 * @param url - Custom faucet URL to use.
 * @returns - A Wallet on the Testnet or Devnet that contains some amount of XRP.
 */
async function generateFaucetWallet(
  this: RippleAPI,
  address?: string,
  url?: string
): Promise<FaucetWallet | void> {
  let body = {}
  let startingBalance = 0

  // If the user provides an existing wallet to fund
  if (address && isValidAddress(address)) {
    // Create the POST request body
    body = {
      destination: address
    }
    // Retrieve the existing account balance
    const addressToFundBalance = await getAddressXrpBalance(this, address)

    // Check the address balance is not undefined and is a number
    if (addressToFundBalance && !isNaN(+addressToFundBalance)) {
      startingBalance = +addressToFundBalance
    } else {
      startingBalance = 0
    }
  }

  let faucetUrl: string
  // If the user provides a custom Faucet URL
  if (url) {
    faucetUrl = url
  } else {
    // Otherwise, based on the connection URL, retrieve the correct faucet URL
    faucetUrl = getFaucetUrl(this)
  }

  return new Promise((resolve, reject) => {
    axios
      .post<FaucetWallet>(faucetUrl, body)
      .then(async (response) => {
        const classicAddress = response.data.account.classicAddress
        // If classicAddress is not undefined
        if (classicAddress) {
          try {
            // Check at regular interval if the address is enabled on the XRPL and funded
            const isFunded = await hasAddressBalanceIncreased(
              this,
              classicAddress,
              startingBalance
            )

            if (isFunded) {
              resolve(response.data)
            } else {
              reject(
                new errors.XRPLFaucetError(
                  `Unable to fund address with faucet after waiting ${
                    INTERVAL_SECONDS * MAX_ATTEMPS
                  } seconds`
                )
              )
            }
          } catch (err) {
            reject(new errors.XRPLFaucetError(err))
          }
        } else {
          reject(
            new errors.XRPLFaucetError(
              `The faucet account classic address is undefined`
            )
          )
        }
      })
      .catch((error) => {
        reject(new errors.XRPLFaucetError(error.data))
      })
  })
}

/**
 * Retrieves an XRPL address XRP balance
 *
 * @param api - RippleAPI
 * @param address - XRPL address.
 * @returns
 */
async function getAddressXrpBalance(
  api: RippleAPI,
  address: string
): Promise<string> {
  // Get all the account balances
  try {
    const balances = await api.getBalances(address)

    // Retrieve the XRP balance
    const xrpBalance = balances.filter(
      (balance) => balance.currency.toUpperCase() === 'XRP'
    )
    return xrpBalance[0].value
  } catch (err) {
    return `Unable to retrieve ${address} balance. Error: ${err}`
  }
}

/**
 * Check at regular interval if the address is enabled on the XRPL and funded
 *
 * @param api - RippleAPI
 * @param address - the account address to check
 * @param originalBalance - the initial balance before the funding
 * @returns A Promise boolean
 */
async function hasAddressBalanceIncreased(
  api: RippleAPI,
  address: string,
  originalBalance: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPS
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval)
        resolve(false)
      } else {
        attempts--
      }

      try {
        const newBalance = +(await getAddressXrpBalance(api, address))
        if (newBalance > originalBalance) {
          clearInterval(interval)
          resolve(true)
        }
      } catch (err) {
        clearInterval(interval)
        reject(
          new errors.XRPLFaucetError(
            `Unable to check if the address ${address} balance has increased. Error: ${err}`
          )
        )
      }
    }, INTERVAL_SECONDS * 1000)
  })
}

/**
 * Get the faucet URL based on the RippleAPI connection
 * @param api - RippleAPI
 * @returns A {@link FaucetNetwork}
 */
export function getFaucetUrl(api: RippleAPI) {
  const connectionUrl = api.connection.getUrl()

  // 'altnet' for Ripple Tesnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes('altnet') || connectionUrl.includes('testnet')) {
    return FaucetNetwork.Testnet
  }

  if (connectionUrl.includes('devnet')) {
    return FaucetNetwork.Devnet
  }

  return undefined
}

export default generateFaucetWallet
