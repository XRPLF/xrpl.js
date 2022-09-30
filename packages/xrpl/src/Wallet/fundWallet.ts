/* eslint-disable max-lines -- barely exceeds limit */
import { IncomingMessage } from 'http'
import { request as httpsRequest, RequestOptions } from 'https'

import { isValidClassicAddress } from 'ripple-address-codec'

import type { Client } from '..'
import { RippledError, XRPLFaucetError } from '../errors'

import Wallet from '.'

interface FaucetWallet {
  account: {
    xAddress: string
    classicAddress?: string
    secret: string
  }
  amount: number
  balance: number
}

enum FaucetNetwork {
  Testnet = 'faucet.altnet.rippletest.net',
  Devnet = 'faucet.devnet.rippletest.net',
  NFTDevnet = 'faucet-nft.ripple.com',
  HooksV2Testnet = 'hooks-testnet-v2.xrpl-labs.com',
}

const FaucetNetworkPaths: Record<string, string> = {
  [FaucetNetwork.Testnet]: '/accounts',
  [FaucetNetwork.Devnet]: '/accounts',
  [FaucetNetwork.NFTDevnet]: '/accounts',
  [FaucetNetwork.HooksV2Testnet]: '/newcreds',
}

// Interval to check an account balance
const INTERVAL_SECONDS = 1
// Maximum attempts to retrieve a balance
const MAX_ATTEMPTS = 20

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @example
 * ```typescript
 * const api = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
 * await api.connect()
 * const { wallet, balance } = await api.fundWallet()
 * ```
 *
 * @param this - Client.
 * @param wallet - An existing XRPL Wallet to fund. If undefined or null, a new Wallet will be created.
 * @param options - See below.
 * @param options.faucetHost - A custom host for a faucet server. On devnet and
 * testnet, `fundWallet` will attempt to determine the correct server
 * automatically. In other environments, or if you would like to customize the
 * faucet host in devnet or testnet, you should provide the host using this
 * option.
 * @param options.faucetPath - A custom path for a faucet server. On devnet and
 * testnet, `fundWallet` will attempt to determine the correct path
 * automatically. In other environments, or if you would like to customize the
 * faucet path in devnet or testnet, you should provide the path using this
 * option.
 * @returns A Wallet on the Testnet or Devnet that contains some amount of XRP,
 * and that wallet's balance in XRP.
 * @throws When either Client isn't connected or unable to fund wallet address.
 */
// eslint-disable-next-line max-lines-per-function -- couple lines over
async function fundWallet(
  this: Client,
  wallet?: Wallet | null,
  options?: {
    faucetHost?: string
    faucetPath?: string
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
  const httpOptions = getHTTPOptions(
    this,
    postBody,
    options?.faucetHost,
    options?.faucetPath,
  )

  // Currently, hooks testnet v2 has no way of funding a given wallet
  if (httpOptions.hostname === 'hooks-testnet-v2.xrpl-labs.com' && wallet) {
    throw new XRPLFaucetError(
      'Cannot fund passed in wallet with hooks testnet v2',
    )
  }

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

// eslint-disable-next-line max-params -- helper function
function getHTTPOptions(
  client: Client,
  postBody: Uint8Array,
  hostname?: string,
  pathname?: string,
): RequestOptions {
  const finalHostname = hostname ?? getFaucetHost(client)
  const finalPathname = pathname ?? getFaucetPath(finalHostname)
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

  // ('application/json; charset=utf-8')
  if (response.headers['content-type']?.startsWith('application/json')) {
    await processSuccessfulResponse(
      client,
      body,
      startingBalance,
      walletToFund,
      resolve,
      reject,
    )
  } else if (client.url === 'wss://hooks-testnet-v2.xrpl-labs.com') {
    await processHooksV2Response(client, body, startingBalance, resolve, reject)
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
  body: string,
  startingBalance: number,
  walletToFund: Wallet,
  resolve: (response: { wallet: Wallet; balance: number }) => void,
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

// eslint-disable-next-line max-params, max-lines-per-function -- Only used as a helper function, lines inc due to added balance.
async function processHooksV2Response(
  client: Client,
  body: string,
  startingBalance: number,
  resolve: (response: { wallet: Wallet; balance: number }) => void,
  reject: (err: ErrorConstructor | Error | unknown) => void,
): Promise<void> {
  const faucetWallet = JSON.parse(body)
  const classicAddress = faucetWallet.address
  const walletToFund = Wallet.fromSecret(faucetWallet.secret)

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

/**
 * Get the faucet host based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 * @throws When the client url is not on altnet or devnet.
 */
function getFaucetHost(client: Client): FaucetNetwork | undefined {
  const connectionUrl = client.url

  if (connectionUrl.includes('hooks-testnet-v2')) {
    return FaucetNetwork.HooksV2Testnet
  }

  // 'altnet' for Ripple Testnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes('altnet') || connectionUrl.includes('testnet')) {
    return FaucetNetwork.Testnet
  }

  if (connectionUrl.includes('devnet')) {
    return FaucetNetwork.Devnet
  }

  if (connectionUrl.includes('xls20-sandbox')) {
    return FaucetNetwork.NFTDevnet
  }

  throw new XRPLFaucetError('Faucet URL is not defined or inferrable.')
}

/**
 * Get the faucet pathname based on the faucet hostname.
 *
 * @param hostname - hostname.
 * @returns A String with the correct path for the input hostname.
 * If hostname undefined or cannot find (key, value) pair in {@link FaucetNetworkPaths}, defaults to '/accounts'
 */
function getFaucetPath(hostname: string | undefined): string {
  if (hostname === undefined) {
    return '/accounts'
  }
  return FaucetNetworkPaths[hostname] || '/accounts'
}

export default fundWallet

const _private = {
  FaucetNetwork,
  FaucetNetworkPaths,
  getFaucetHost,
  getFaucetPath,
}

export { _private }
