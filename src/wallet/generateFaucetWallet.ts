import { IncomingMessage } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'

import { isValidClassicAddress } from 'ripple-address-codec'

import type { Client } from '..'
import { RippledError, XRPLFaucetError } from '../errors'
import { GeneratedAddress } from '../utils/generateAddress'

import Wallet from '.'

interface FaucetWallet {
  account: GeneratedAddress
  amount: number
  balance: number
}

enum FaucetNetwork {
  Testnet = 'faucet.altnet.rippletest.net',
  Devnet = 'faucet.devnet.rippletest.net',
}

// Interval to check an account balance
const INTERVAL_SECONDS = 1
// Maximum attempts to retrieve a balance
const MAX_ATTEMPTS = 20

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @param this - Client.
 * @param wallet - An existing XRPL Wallet to fund, if undefined, a new Wallet will be created.
 * @returns A Wallet on the Testnet or Devnet that contains some amount of XRP.
 * @throws When either Client isn't connected or unable to fund wallet address.
 */
async function generateFaucetWallet(
  this: Client,
  wallet?: Wallet,
): Promise<Wallet | undefined> {
  if (!this.isConnected()) {
    throw new RippledError('Client not connected, cannot call faucet')
  }

  // Generate a new Wallet if no existing Wallet is provided or its address is invalid to fund
  const fundWallet =
    wallet && isValidClassicAddress(wallet.classicAddress)
      ? wallet
      : Wallet.generate()

  // Create the POST request body
  const postBody = new TextEncoder().encode(
    JSON.stringify({
      destination: fundWallet.classicAddress,
    }),
  )

  let startingBalance = 0
  try {
    startingBalance = Number(
      await getAddressXrpBalance(this, fundWallet.classicAddress),
    )
  } catch {
    /* startingBalance remains '0' */
  }

  // Options to pass to https.request
  const options = getOptions(this, postBody)

  return returnPromise(options, this, startingBalance, fundWallet, postBody)
}

// eslint-disable-next-line max-params -- Helper function created for organizational purposes
async function returnPromise(
  options: RequestOptions,
  client: Client,
  startingBalance: number,
  fundWallet: Wallet,
  postBody: Uint8Array,
): Promise<Wallet | undefined> {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(options, (response) => {
      const chunks: Uint8Array[] = []
      response.on('data', (data) => chunks.push(data))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- not actually misused, different resolve/reject
      response.on('end', async () =>
        onEnd(
          response,
          chunks,
          client,
          startingBalance,
          fundWallet,
          resolve,
          reject,
        ),
      )
    })
    // POST the body
    request.write(postBody)

    request.on('error', (error) => {
      reject(error)
    })

    request.end()
  })
}

function getOptions(client: Client, postBody: Uint8Array): RequestOptions {
  return {
    hostname: getFaucetUrl(client),
    port: 443,
    path: '/accounts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postBody.length,
    },
  }
}

// eslint-disable-next-line max-params -- Helper function created for organizational purposes
async function onEnd(
  response: IncomingMessage,
  chunks: Uint8Array[],
  client: Client,
  startingBalance: number,
  fundWallet: Wallet,
  resolve: (wallet?: Wallet) => void,
  reject: (err: ErrorConstructor | Error | unknown) => void,
): Promise<void> {
  const body = Buffer.concat(chunks).toString()

  // "application/json; charset=utf-8"
  if (response.headers['content-type']?.startsWith('application/json')) {
    await processSuccessfulResponse(
      client,
      body,
      startingBalance,
      fundWallet,
      resolve,
      reject,
    )
  } else {
    reject(
      new XRPLFaucetError(
        `Content type is not \`application/json\`: ${JSON.stringify({
          statusCode: response.statusCode,
          contentType: response.headers['content-type'],
          body,
        })}`,
      ),
    )
  }
}

// eslint-disable-next-line max-params -- Only used as a helper function
async function processSuccessfulResponse(
  client: Client,
  body: string,
  startingBalance: number,
  fundWallet: Wallet,
  resolve: (wallet?: Wallet) => void,
  reject: (err: ErrorConstructor | Error | unknown) => void,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- We know this is safe and correct
  const faucetWallet: FaucetWallet = JSON.parse(body)
  const classicAddress = faucetWallet.account.classicAddress

  if (!classicAddress) {
    reject(new XRPLFaucetError(`The faucet account is undefined`))
    return
  }
  try {
    // Check at regular interval if the address is enabled on the XRPL and funded
    const isFunded = await hasAddressBalanceIncreased(
      client,
      classicAddress,
      startingBalance,
    )

    if (isFunded) {
      resolve(fundWallet)
    } else {
      reject(
        new XRPLFaucetError(
          `Unable to fund address with faucet after waiting ${
            INTERVAL_SECONDS * MAX_ATTEMPTS
          } seconds`,
        ),
      )
    }
  } catch (err) {
    if (err instanceof Error) {
      reject(new XRPLFaucetError(err.message))
    }
    reject(err)
  }
}

/**
 * Retrieves an XRPL address XRP balance.
 *
 * @param client - Client.
 * @param address - XRPL address.
 * @returns The address's balance of XRP.
 */
async function getAddressXrpBalance(
  client: Client,
  address: string,
): Promise<string> {
  // Get all the account balances
  try {
    const balances = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    })

    return balances.result.account_data.Balance
  } catch (err) {
    if (err instanceof Error) {
      throw new XRPLFaucetError(
        `Unable to retrieve balance of ${address}. Error: ${err.message}`,
      )
    }
    throw err
  }
}

/**
 * Check at regular interval if the address is enabled on the XRPL and funded.
 *
 * @param client - Client.
 * @param address - The account address to check.
 * @param originalBalance - The initial balance before the funding.
 * @returns A Promise boolean.
 */
async function hasAddressBalanceIncreased(
  client: Client,
  address: string,
  originalBalance: number,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPTS
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Not actually misused here, different resolve
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval)
        resolve(false)
      } else {
        attempts -= 1
      }

      try {
        let newBalance
        try {
          newBalance = Number(await getAddressXrpBalance(client, address))
        } catch {
          /* newBalance remains undefined */
        }

        if (newBalance > originalBalance) {
          clearInterval(interval)
          resolve(true)
        }
      } catch (err) {
        clearInterval(interval)
        if (err instanceof Error) {
          reject(
            new XRPLFaucetError(
              `Unable to check if the address ${address} balance has increased. Error: ${err.message}`,
            ),
          )
        }
        reject(err)
      }
    }, INTERVAL_SECONDS * 1000)
  })
}

/**
 * Get the faucet URL based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 * @throws When the client url is not on altnet or devnet.
 */
function getFaucetUrl(client: Client): FaucetNetwork | undefined {
  const connectionUrl = client.connection.getUrl()

  // 'altnet' for Ripple Testnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes('altnet') || connectionUrl.includes('testnet')) {
    return FaucetNetwork.Testnet
  }

  if (connectionUrl.includes('devnet')) {
    return FaucetNetwork.Devnet
  }

  throw new XRPLFaucetError('Faucet URL is not defined or inferrable.')
}

export default generateFaucetWallet

const _private = {
  FaucetNetwork,
  getFaucetUrl,
}
export { _private }
