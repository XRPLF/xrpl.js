import { assert } from 'chai'

import {
  AMMDeposit,
  AMMDepositFlags,
  Client,
  Currency,
  SignerListSet,
  Wallet,
  XChainBridge,
  XChainCreateBridge,
} from '../../src'

import serverUrl from './serverUrl'
import {
  GENESIS_ACCOUNT,
  createAMMPool,
  fundAccount,
  generateFundedWallet,
  testTransaction,
} from './utils'

export interface TestAMMPool {
  issuerWallet: Wallet
  lpWallet: Wallet
  testWallet: Wallet
  asset: Currency
  asset2: Currency
}

interface TestBridge {
  xchainBridge: XChainBridge
  witness: Wallet
  signatureReward: string
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

export async function setupBridge(client: Client): Promise<TestBridge> {
  const doorAccount = await generateFundedWallet(client)
  const signatureReward = '200'
  const xchainBridge: XChainBridge = {
    LockingChainDoor: doorAccount.classicAddress,
    LockingChainIssue: { currency: 'XRP' },
    IssuingChainDoor: GENESIS_ACCOUNT,
    IssuingChainIssue: { currency: 'XRP' },
  }
  const setupTx: XChainCreateBridge = {
    TransactionType: 'XChainCreateBridge',
    Account: doorAccount.classicAddress,
    XChainBridge: xchainBridge,
    SignatureReward: signatureReward,
    MinAccountCreateAmount: '10000000',
  }

  await testTransaction(client, setupTx, doorAccount)

  // confirm that the transaction actually went through
  const accountObjectsResponse = await client.request({
    command: 'account_objects',
    account: doorAccount.classicAddress,
    type: 'bridge',
  })
  assert.lengthOf(
    accountObjectsResponse.result.account_objects,
    1,
    'Should be exactly one bridge owned by the account',
  )

  const witnessWallet = await generateFundedWallet(client)

  const signerTx: SignerListSet = {
    TransactionType: 'SignerListSet',
    Account: doorAccount.classicAddress,
    SignerEntries: [
      {
        SignerEntry: {
          Account: witnessWallet.classicAddress,
          SignerWeight: 1,
        },
      },
    ],
    SignerQuorum: 1,
  }
  await testTransaction(client, signerTx, doorAccount)

  const signerAccountInfoResponse = await client.request({
    command: 'account_info',
    account: doorAccount.classicAddress,
    signer_lists: true,
  })
  const signerListInfo = signerAccountInfoResponse.result.signer_lists?.[0]
  assert.deepEqual(
    signerListInfo?.SignerEntries,
    signerTx.SignerEntries,
    'SignerEntries were not set properly',
  )
  assert.equal(
    signerListInfo?.SignerQuorum,
    signerTx.SignerQuorum,
    'SignerQuorum was not set properly',
  )

  return { xchainBridge, witness: witnessWallet, signatureReward }
}
