import { isValidClassicAddress } from 'ripple-address-codec'

import type { Client } from '../client'
import { XRPLFaucetError } from '../errors'

import { FaucetWallet, getFaucetHost, getFaucetPath } from './defaultFaucets'

import { Wallet } from '.'

// Interval to check an account balance
const INTERVAL_SECONDS = 1
// Maximum attempts to retrieve a balance
const MAX_ATTEMPTS = 20

export interface FundingOptions {
  /**
   *  A custom amount to fund, if undefined or null, the default amount will be 1000.
   */
  amount?: string
  /**
   * A custom host for a faucet server. On devnet, testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
   * attempt to determine the correct server automatically. In other environments, or if you would like to customize
   * the faucet host in devnet or testnet, you should provide the host using this option.
   */
  faucetHost?: string
  /**
   * A custom path for a faucet server. On devnet,
   * testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
   * attempt to determine the correct path automatically. In other environments,
   * or if you would like to customize the faucet path in devnet or testnet,
   * you should provide the path using this option.
   * Ex: client.fundWallet(null,{'faucet.altnet.rippletest.net', '/accounts'})
   * specifies a request to 'faucet.altnet.rippletest.net/accounts' to fund a new wallet.
   */
  faucetPath?: string
  /**
   * An optional field to indicate the use case context of the faucet transaction
   * Ex: integration test, code snippets.
   */
  usageContext?: string
}

/**
 * Parameters to pass into a faucet request to fund an XRP account.
 */
export interface FaucetRequestBody {
  /**
   * The address to fund. If no address is provided the faucet will fund a random account.
   */
  destination?: string
  /**
   * The total amount of XRP to fund the account with.
   */
  xrpAmount?: string
  /**
   * An optional field to indicate the use case context of the faucet transaction
   * Ex: integration test, code snippets.
   */
  usageContext?: string
  /**
   * Information about the context of where the faucet is being called from.
   * Ex: xrpl.js or xrpl-py
   */
  userAgent: string
}

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
 *
 * Helper function to request funding from a faucet. Should not be called directly from outside the xrpl.js library.
 *
 * @param options - See below
 * @param options.faucetHost - A custom host for a faucet server. On devnet,
 * testnet, AMM devnet, and HooksV3 testnet, `fundWallet` will
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
 * @param client - A connection to the XRPL to send requests and transactions.
 * @param startingBalance - The amount of XRP in the given walletToFund on ledger already.
 * @param walletToFund - An existing XRPL Wallet to fund.
 * @param postBody - The content to send the faucet to indicate which address to fund, how much to fund it, and
 * where the request is coming from.
 * @returns A promise that resolves to a funded wallet and the balance within it.
 */
// eslint-disable-next-line max-params -- Helper function created for organizational purposes
export async function requestFunding(
  options: FundingOptions,
  client: Client,
  startingBalance: number,
  walletToFund: Wallet,
  postBody: FaucetRequestBody,
): Promise<{
  wallet: Wallet
  balance: number
}> {
  const hostname = options.faucetHost ?? getFaucetHost(client)
  if (!hostname) {
    throw new XRPLFaucetError('No faucet hostname could be derived')
  }
  const pathname = options.faucetPath ?? getFaucetPath(hostname)
  const response = await fetch(`https://${hostname}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it can be anything
  const body = await response.json()
  if (
    response.ok &&
    response.headers.get('Content-Type')?.startsWith('application/json')
  ) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- It's a FaucetWallet
    const classicAddress = (body as FaucetWallet).account.classicAddress
    return processSuccessfulResponse(
      client,
      classicAddress,
      walletToFund,
      startingBalance,
    )
  }
  return processError(response, body)
}

// eslint-disable-next-line max-params -- Only used as a helper function, lines inc due to added balance.
async function processSuccessfulResponse(
  client: Client,
  classicAddress: string | undefined,
  walletToFund: Wallet,
  startingBalance: number,
): Promise<{
  wallet: Wallet
  balance: number
}> {
  if (!classicAddress) {
    return Promise.reject(
      new XRPLFaucetError(`The faucet account is undefined`),
    )
  }
  // Check at regular interval if the address is enabled on the XRPL and funded
  const updatedBalance = await getUpdatedBalance(
    client,
    classicAddress,
    startingBalance,
  )

  if (updatedBalance > startingBalance) {
    return {
      wallet: walletToFund,
      balance: updatedBalance,
    }
  }
  throw new XRPLFaucetError(
    `Unable to fund address with faucet after waiting ${
      INTERVAL_SECONDS * MAX_ATTEMPTS
    } seconds`,
  )
}

async function processError(response: Response, body): Promise<never> {
  return Promise.reject(
    new XRPLFaucetError(
      `Request failed: ${JSON.stringify({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- json response could be anything
        body: body || {},
        contentType: response.headers.get('Content-Type'),
        statusCode: response.status,
      })}`,
    ),
  )
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
