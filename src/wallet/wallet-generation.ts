import axios from 'axios'

import {RippleAPI} from '..'
import {errors} from '../common'
import {GeneratedAddress} from '../offline/generate-address'
import {isValidAddress} from '../common/schema-validator'
import {reject} from 'lodash'

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
const MAX_ATTEMPS = 20 // Maximum attemptsto retrieve a balance

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @param wallet - An existing XRPL wallet to fund, if undefined, a new wallet will be created.
 * @returns - A Wallet on the Testnet or Devnet that contains some amount of XRP.
 */
async function generateFaucetWallet(
  this: RippleAPI,
  wallet?: string
): Promise<FaucetWallet | void> {
  let body = {}
  let startingBalance = 0
  let address: string

  // If the user provides an existing wallet to fund
  if (wallet && isValidAddress(wallet)) {
    // Create the POST request body
    body = {
      destination: wallet
    }
    // Retrieve the existing account balance
    try {
      const accountToFundBalance = await getWalletBalanceByCurrency(
        this,
        wallet
      )
      if (accountToFundBalance) {
        startingBalance = +accountToFundBalance
      } else {
        startingBalance = 0
      }
    } catch (err) {
      reject(
        new errors.XRPLFaucetError(
          `Unable to retrieve the balance of your account ${wallet}`
        )
      )
    }
    // And its address
    address = wallet
  }

  // Based on the connection URL, retrieve the correct faucet URL
  const faucetNetwork = getFaucetUrl(this)

  return new Promise((resolve, reject) => {
    axios
      .post<FaucetWallet>(faucetNetwork, body)
      .then(async (response) => {
        address = response.data.account.classicAddress
        try {
          // Check at regular interval if the account is enabled on the XRPL and funded
          const isAcctFunded = await hasAccountBalanceIncreased(
            this,
            address,
            startingBalance
          )

          if (isAcctFunded) {
            resolve(response.data)
          } else {
            reject(
              new errors.XRPLFaucetError(
                `Unable to fund address with faucet after waiting ${INTERVAL_SECONDS} seconds`
              )
            )
          }
        } catch (err) {
          reject(new errors.XRPLFaucetError(err))
        }
      })
      .catch((error) => {
        reject(new errors.XRPLFaucetError(error.data))
      })
  })
}

/**
 * Retrieves an XRPL address balance by currency
 *
 * @param api - RippleAPI
 * @param address - Wallet address.
 * @param currency - Currency to search, default XRP.
 * @returns
 */
async function getWalletBalanceByCurrency(
  api: RippleAPI,
  address: string,
  currency: string = 'XRP'
): Promise<string> {
  let curr = currency

  // If issued currency longer than 3 characters
  if (currency.length > 3) {
    curr = Buffer.from(currency, 'ascii')
      .toString('hex')
      .toUpperCase()
      .padEnd(40, '0')
  }

  try {
    // Get all the account balances
    const balances = await api.getBalances(address)

    // Retrieve only the 'curr' (typically XRP) balance
    const xrpCurrency = balances.filter((balance) => {
      return balance.currency === curr
    })

    return xrpCurrency[0].value
  } catch (err) {
    reject(`Account ${address} does not exist`)
  }
}

/**
 * Check at regular interval if the account is enabled on the XRPL and funded
 *
 * @param api - RippleAPI
 * @param address - the account address to check
 * @param originalBalance - the initial balance before the funding
 * @returns A Promise boolean
 */
async function hasAccountBalanceIncreased(
  api: RippleAPI,
  address: string,
  originalBalance: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPS
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval)
        reject(false)
      } else {
        attempts--
      }

      try {
        const newBalance = +(await getWalletBalanceByCurrency(api, address))
        if (newBalance > originalBalance) {
          clearInterval(interval)
          resolve(true)
        }
      } catch (err) {
        reject(
          new errors.XRPLFaucetError(
            `Unable to check the account ${address} balance...`
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
