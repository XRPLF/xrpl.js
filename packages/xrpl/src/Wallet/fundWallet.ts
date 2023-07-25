import { IncomingMessage } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'

import { isValidClassicAddress } from 'ripple-address-codec'

import type { Client } from '../client'
import { XRPLFaucetError } from '../errors'

import {
  FaucetWallet,
  getFaucetHost,
  getDefaultFaucetPath,
} from './defaultFaucets'

import { Wallet } from '.'

// Interval to check an account balance
const INTERVAL_SECONDS = 1
// Maximum attempts to retrieve a balance
const MAX_ATTEMPTS = 20

/**
 * Generate a new wallet to fund if no existing wallet is provided or its address is invalid.
 *
 * @param wallet - Optional existing wallet.
 * @returns The wallet to fund.
 */
export function generateWalletToFund(wallet?: Wallet | null): Wallet {
  if (wallet && isValidClassicAddress(wallet.classicAddress)) {
    return wallet
  }
  return Wallet.generate()
}

/**
 * Get the starting balance of the wallet.
 *
 * @param client - The client object.
 * @param classicAddress - The classic address of the wallet.
 * @returns The starting balance.
 */
export async function getStartingBalance(
  client: Client,
  classicAddress: string,
): Promise<number> {
  let startingBalance = 0
  try {
    startingBalance = Number(await client.getXrpBalance(classicAddress))
  } catch {
    // startingBalance remains '0'
  }
  return startingBalance
}

export interface FundWalletOptions {
  faucetHost?: string
  faucetPath?: string
  amount?: string
  usageContext?: string
}

/**
 * Perform the fund wallet request.
 *
 * @param client - The client object.
 * @param startingBalance - The starting balance of the wallet.
 * @param walletToFund - The wallet to fund.
 * @param postBody - The body of the POST request.
 * @param options - Optional additional options.
 * @returns A promise that resolves to the funded wallet and balance.
 */
// eslint-disable-next-line max-params -- Helper function created for organizational purposes
export async function doFundWalletRequest(
  client: Client,
  startingBalance: number,
  walletToFund: Wallet,
  postBody: Buffer,
  options?: FundWalletOptions,
): Promise<{
  wallet: Wallet
  balance: number
}> {
  const httpOptions = getHTTPOptions(client, postBody, {
    hostname: options?.faucetHost,
    pathname: options?.faucetPath,
  })
  return new Promise((resolve, reject) => {
    const request = httpsRequest(httpOptions, (response) => {
      const chunks: Uint8Array[] = []
      response.on('data', (data) => chunks.push(data))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- not actually misused, different resolve/reject
      response.on('end', async () =>
        onEnd(
          response,
          chunks,
          client,
          startingBalance,
          walletToFund,
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

/**
 * Get the HTTP options for the request.
 *
 * @param client - The client object.
 * @param postBody - The body of the request.
 * @param options - Optional additional options.
 * @param options.hostname - Optional hostname of the faucet server.
 * @param options.pathname - Optional path of the faucet server. Such as /accounts
 * @returns The HTTP options for the request.
 */
function getHTTPOptions(
  client: Client,
  postBody: Uint8Array,
  options?: {
    hostname?: string
    pathname?: string
  },
): RequestOptions {
  const finalHostname = options?.hostname ?? getFaucetHost(client)
  const finalPathname = options?.pathname ?? getDefaultFaucetPath(finalHostname)
  return {
    hostname: finalHostname,
    port: 443,
    path: finalPathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postBody.length,
    },
  }
}

/**
 * Handle the 'end' event of the response.
 *
 * @param response - The incoming message response.
 * @param chunks - The array of data chunks received in the response.
 * @param client - The client object.
 * @param startingBalance - The starting balance of the wallet.
 * @param walletToFund - The wallet to fund.
 * @param resolve - The function to resolve the promise.
 * @param reject - The function to reject the promise.
 * @returns A promise that resolves when the processing is complete.
 */
// eslint-disable-next-line max-params -- Helper function created for organizational purposes
async function onEnd(
  response: IncomingMessage,
  chunks: Uint8Array[],
  client: Client,
  startingBalance: number,
  walletToFund: Wallet,
  resolve: (response: { wallet: Wallet; balance: number }) => void,
  reject: (err: ErrorConstructor | Error | unknown) => void,
): Promise<void> {
  const body = Buffer.concat(chunks).toString()

  // "application/json; charset=utf-8"
  if (response.headers['content-type']?.startsWith('application/json')) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- We know this is safe and correct
    const faucetWallet: FaucetWallet = JSON.parse(body)
    const classicAddress = faucetWallet.account.classicAddress
    await processSuccessfulResponse(
      client,
      classicAddress,
      walletToFund,
      startingBalance,
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

/**
 * Process a successful response from the faucet.
 *
 * @param client - The client object.
 * @param classicAddress - The classic address of the faucet account.
 * @param walletToFund - The wallet to fund.
 * @param startingBalance - The starting balance of the wallet.
 * @param resolve - The function to resolve the promise.
 * @param reject - The function to reject the promise.
 * @returns A promise that resolves when the processing is complete.
 */
// eslint-disable-next-line max-params, max-lines-per-function -- Only used as a helper function, lines inc due to added balance.
async function processSuccessfulResponse(
  client: Client,
  classicAddress: string | undefined,
  walletToFund: Wallet,
  startingBalance: number,
  resolve: (response: { wallet: Wallet; balance: number }) => void,
  reject: (err: ErrorConstructor | Error | unknown) => void,
): Promise<void> {
  if (!classicAddress) {
    reject(new XRPLFaucetError(`The faucet account is undefined`))
    return
  }
  try {
    // Check at regular interval if the address is enabled on the XRPL and funded
    const updatedBalance = await getUpdatedBalance(
      client,
      classicAddress,
      startingBalance,
    )

    if (updatedBalance > startingBalance) {
      resolve({
        wallet: walletToFund,
        balance: await getUpdatedBalance(
          client,
          walletToFund.classicAddress,
          startingBalance,
        ),
      })
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
 * Check at regular interval if the address is enabled on the XRPL and funded.
 *
 * @param client - Client.
 * @param address - The account address to check.
 * @param originalBalance - The initial balance before the funding.
 * @returns A Promise boolean.
 */
async function getUpdatedBalance(
  client: Client,
  address: string,
  originalBalance: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPTS
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Not actually misused here, different resolve
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval)
        resolve(originalBalance)
      } else {
        attempts -= 1
      }

      try {
        let newBalance
        try {
          newBalance = Number(await client.getXrpBalance(address))
        } catch {
          /* newBalance remains undefined */
        }

        if (newBalance > originalBalance) {
          clearInterval(interval)
          resolve(newBalance)
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
