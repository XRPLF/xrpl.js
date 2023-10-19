import { assert } from 'chai'

import {
  Client,
  SignerListSet,
  Wallet,
  XChainBridge,
  XChainCreateBridge,
} from '../../src'

import serverUrl from './serverUrl'
import {
  GENESIS_ACCOUNT,
  fundAccount,
  generateFundedWallet,
  testTransaction,
} from './utils'

interface TestBridge {
  xchainBridge: XChainBridge
  witness: Wallet
  signatureReward: string
}

export interface XrplIntegrationTestContext {
  client: Client
  wallet: Wallet
  bridge: TestBridge
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
      bridge: await setupBridge(client),
      client,
      wallet,
    }
    return context
  })
}

async function setupBridge(client: Client): Promise<TestBridge> {
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
  const signerListInfo =
    signerAccountInfoResponse.result.account_data.signer_lists?.[0]
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
