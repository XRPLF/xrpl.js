import { AMMClawback, AMMDeposit, AMMDepositFlags } from 'xrpl'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { createAMMPool, testTransaction } from '../utils'

describe('AMMClawback', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('base', async function () {
    const ammPool = await createAMMPool(testContext.client, true)
    const { asset, asset2, issuerWallet } = ammPool
    const holderWallet = ammPool.lpWallet

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: holderWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: {
        currency: 'USD',
        issuer: issuerWallet.address,
        value: '10',
      },
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, holderWallet)

    const ammClawback: AMMClawback = {
      TransactionType: 'AMMClawback',
      Account: issuerWallet.address,
      Holder: holderWallet.address,
      Asset: asset,
      Asset2: asset2,
    }

    await testTransaction(testContext.client, ammClawback, issuerWallet)
  })
})
