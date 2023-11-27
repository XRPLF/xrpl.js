import { IncomingMessage } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'

import { isValidClassicAddress } from 'ripple-address-codec'

import type { Client } from '../client'
import { RippledError, XRPLFaucetError } from '../errors'

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
 * The fundWallet() method is used to send an amount of XRP (usually 1000) to a new (randomly generated)
 * or existing XRP Ledger wallet.
 *
 * @example
 *
 * Example 1: Fund a randomly generated wallet
 * const { Client, Wallet } = require('xrpl')
 *
 * const client = new Client('wss://s.altnet.rippletest.net:51233')
 * await client.connect()
 * const { balance, wallet } = await client.fundWallet()
 *
 * Under the hood, this will use `Wallet.generate()` to create a new random wallet, then ask a testnet faucet
 * To send it XRP on ledger to make it a real account. If successful, this will return the new account balance in XRP
 * Along with the Wallet object to track the keys for that account. If you'd like, you can also re-fill an existing
 * Account by passing in a Wallet you already have.
 * ```ts
 * const api = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
 * await api.connect()
 * const { wallet, balance } = await api.fundWallet()
 * ```
 *
 * Example 2: Fund wallet using a custom faucet host and known wallet address
 *
 * `fundWallet` will try to infer the url of a faucet API from the network your client is connected to.
 * There are hardcoded default faucets for popular test networks like testnet and devnet.
 * However, if you're working with a newer or more obscure network, you may have to specify the faucetHost
 * And faucetPath so `fundWallet` can ask that faucet to fund your wallet.
 *
 * ```ts
 * const newWallet = Wallet.generate()
 * const { balance, wallet  } = await client.fundWallet(newWallet, {
 *       amount: '10',
 *       faucetHost: 'https://custom-faucet.example.com',
 *       faucetPath: '/accounts'
 *     })
 *     console.log(`Sent 10 XRP to wallet: ${address} from the given faucet. Resulting balance: ${balance} XRP`)
 *   } catch (error) {
 *     console.error(`Failed to fund wallet: ${error}`)
 *   }
 * }
 * ```
 *
 * @param this - Client.
 * @param wallet - An existing XRPL Wallet to fund. If undefined or null, a new Wallet will be created.
 * @param options - See below.
 * @param options.faucetHost - A custom host for a faucet server. On devnet,
 * testnet, devnet, and HooksV3 testnet, `fundWallet` will
 * attempt to determine the correct server automatically. In other environments,
 * or if you would like to customize the faucet host in devnet or testnet,
 * you should provide the host using this option.
 * @param options.faucetPath - A custom path for a faucet server. On devnet,
 * testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
 * attempt to determine the correct path automatically. In other environments,
 * or if you would like to customize the faucet path in devnet or testnet,
 * you should provide the path using this option.
 * Ex: client.fundWallet(null,{'faucet.altnet.rippletest.net', '/accounts'})
 * specifies a request to 'faucet.altnet.rippletest.net/accounts' to fund a new wallet.
 * @param options.amount - A custom amount to fund, if undefined or null, the default amount will be 1000.
 * @param options.usageContext - An optional field to indicate the use case context of the faucet transaction
 * Ex: integration test, code snippets.
 * @returns A Wallet on the Testnet or Devnet that contains some amount of XRP,
 * and that wallet's balance in XRP.
 * @throws When either Client isn't connected or unable to fund wallet address.
 */
// eslint-disable-next-line max-lines-per-function -- All lines necessary
async function fundWallet(
  this: Client,
  wallet?: Wallet | null,
  options?: {
    faucetHost?: string
    faucetPath?: string
    amount?: string
    usageContext?: string
  },
): Promise<{
  wallet: Wallet
  balance: number
}> {
  if (!this.isConnected()) {
    throw new RippledError('Client not connected, cannot call faucet')
  }

  // Generate a new Wallet if no existing Wallet is provided or its address is invalid to fund
  const walletToFund =
    wallet && isValidClassicAddress(wallet.classicAddress)
      ? wallet
      : Wallet.generate()

  // Create the POST request body
  const postBody = Buffer.from(
    new TextEncoder().encode(
      JSON.stringify({
        destination: walletToFund.classicAddress,
        xrpAmount: options?.amount,
        userAgent: 'xrpl.js',
        usageContext: options?.usageContext,
      }),
    ),
  )

  let startingBalance = 0
  try {
    startingBalance = Number(
      await this.getXrpBalance(walletToFund.classicAddress),
    )
  } catch {
    /* startingBalance remains '0' */
  }
  // Options to pass to https.request
  const httpOptions = getHTTPOptions(this, postBody, {
    hostname: options?.faucetHost,
    pathname: options?.faucetPath,
  })

  return returnPromise(
    httpOptions,
    this,
    startingBalance,
    walletToFund,
    postBody,
  )
}

// eslint-disable-next-line max-params -- Helper function created for organizational purposes
async function returnPromise(
  options: RequestOptions,
  client: Client,
  startingBalance: number,
  walletToFund: Wallet,
  postBody: Buffer,
): Promise<{
  wallet: Wallet
  balance: number
}> {
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

export default fundWallet
