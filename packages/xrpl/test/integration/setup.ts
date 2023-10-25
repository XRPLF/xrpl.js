import { assert } from 'chai'

import {
  AMMCreate,
  AMMDeposit,
  AMMDepositFlags,
  AccountSet,
  AccountSetAsfFlags,
  Client,
  Currency,
  Payment,
  SignerListSet,
  TrustSet,
  TrustSetFlags,
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

export interface AMMPool {
  issuerWallet: Wallet
  lpWallet: Wallet
  asset: Currency
  asset2: Currency
}

interface TestBridge {
  xchainBridge: XChainBridge
  witness: Wallet
  signatureReward: string
}

export interface XrplIntegrationTestContext {
  amm: AMMPool
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
      amm: await setupAMMPool(client, wallet),
      client,
      wallet,
    }
    return context
  })
}

async function setupAMMPool(client: Client, wallet: Wallet): Promise<AMMPool> {
  const lpWallet = await generateFundedWallet(client)
  const issuerWallet = await generateFundedWallet(client)
  const currencyCode = 'USD'

  const accountSetTx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: issuerWallet.classicAddress,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple,
  }

  await testTransaction(client, accountSetTx, issuerWallet)

  const trustSetTx: TrustSet = {
    TransactionType: 'TrustSet',
    Flags: TrustSetFlags.tfClearNoRipple,
    Account: lpWallet.classicAddress,
    LimitAmount: {
      currency: currencyCode,
      issuer: issuerWallet.classicAddress,
      value: '1000',
    },
  }

  await testTransaction(client, trustSetTx, lpWallet)

  const paymentTx: Payment = {
    TransactionType: 'Payment',
    Account: issuerWallet.classicAddress,
    Destination: lpWallet.classicAddress,
    Amount: {
      currency: currencyCode,
      issuer: issuerWallet.classicAddress,
      value: '500',
    },
  }

  await testTransaction(client, paymentTx, issuerWallet)

  const ammCreateTx: AMMCreate = {
    TransactionType: 'AMMCreate',
    Account: lpWallet.classicAddress,
    Amount: '250',
    Amount2: {
      currency: currencyCode,
      issuer: issuerWallet.classicAddress,
      value: '250',
    },
    TradingFee: 12,
  }

  await testTransaction(client, ammCreateTx, lpWallet)

  const asset: Currency = { currency: 'XRP' }
  const asset2: Currency = {
    currency: currencyCode,
    issuer: issuerWallet.classicAddress,
  }

  // Need to deposit (be an LP) to make bid/vote/withdraw eligible in tests for testContext.wallet
  const ammDepositTx: AMMDeposit = {
    TransactionType: 'AMMDeposit',
    Account: wallet.classicAddress,
    Asset: asset,
    Asset2: asset2,
    Amount: '1000',
    Flags: AMMDepositFlags.tfSingleAsset,
  }

  await testTransaction(client, ammDepositTx, wallet)

  return {
    issuerWallet,
    lpWallet,
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
