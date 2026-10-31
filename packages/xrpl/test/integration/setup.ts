import {
  AMMDeposit,
  AMMDepositFlags,
  Client,
  IssuedCurrency,
  Wallet,
  XRP,
} from '../../src'

import serverUrl from './serverUrl'
import {
  createAMMPool,
  fundAccount,
  generateFundedWallet,
  testTransaction,
} from './utils'

export interface TestAMMPool {
  issuerWallet: Wallet
  lpWallet: Wallet
  testWallet: Wallet
  asset: XRP
  asset2: IssuedCurrency
}

export interface XrplIntegrationTestContext {
  client: Client
  wallet: Wallet
}

export async function teardownClient(
  context: XrplIntegrationTestContext,
): Promise<void> {
  context.client.removeAllListeners()
  return context.client.disconnect()
}

async function connectWithRetry(client: Client, tries = 0): Promise<void> {
  return client.connect().catch(async (error) => {
    if (tries < 10) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(connectWithRetry(client, tries + 1))
        }, 1000)
      })
    }

    throw error
  })
}

export async function setupClient(
  server = serverUrl,
): Promise<XrplIntegrationTestContext> {
  const client = new Client(server, { timeout: 200000 })
  const wallet = Wallet.generate()
  return connectWithRetry(client).then(async () => {
    await fundAccount(client, wallet, {
      count: 20,
      delayMs: 1000,
    })
    const context: XrplIntegrationTestContext = {
      client,
      wallet,
    }
    return context
  })
}

export async function setupAMMPool(client: Client): Promise<TestAMMPool> {
  const testAMMPool = await createAMMPool(client)
  const { issuerWallet, lpWallet, asset, asset2 } = testAMMPool

  const testWallet = await generateFundedWallet(client)

  // Need to deposit (be an LP) to make bid/vote/withdraw eligible in tests for testContext.wallet
  const ammDepositTx: AMMDeposit = {
    TransactionType: 'AMMDeposit',
    Account: testWallet.classicAddress,
    Asset: asset,
    Asset2: asset2,
    Amount: '1000',
    Flags: AMMDepositFlags.tfSingleAsset,
  }

  await testTransaction(client, ammDepositTx, testWallet)

  return {
    issuerWallet,
    lpWallet,
    testWallet,
    asset,
    asset2,
  }
}
