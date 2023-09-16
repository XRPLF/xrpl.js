import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import {
  AMMDeposit,
  AMMDepositFlags,
  AMMWithdraw,
  AMMWithdrawFlags,
  IssuedCurrencyAmount,
} from 'xrpl'

import { AMMInfoResponse, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, setupAMMPool, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AMMWithdraw', function () {
  let testContext: XrplIntegrationTestContext
  let wallet: Wallet
  let wallet2: Wallet
  let wallet3: Wallet
  let currencyCode: string
  let lptoken: IssuedCurrencyAmount

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet = testContext.wallet
    wallet2 = await generateFundedWallet(testContext.client)
    wallet3 = await generateFundedWallet(testContext.client)
    currencyCode = 'USD'

    const ammInfoRes = await setupAMMPool(
      testContext.client,
      wallet,
      wallet2,
      currencyCode,
    )

    const { amm } = ammInfoRes.result
    lptoken = amm.lp_token
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'withdraw with Amount',
    async function () {
      const ammDepositTx: AMMDeposit = {
        TransactionType: 'AMMDeposit',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '1000',
        Flags: AMMDepositFlags.tfSingleAsset,
      }

      await testTransaction(testContext.client, ammDepositTx, wallet3)

      const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm: preAmm } = preAmmInfoRes.result
      const { amount: preAmount, amount2: preAmount2 } = preAmm

      const ammWithdrawTx: AMMWithdraw = {
        TransactionType: 'AMMWithdraw',
        Account: wallet3.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '500',
        Flags: AMMWithdrawFlags.tfSingleAsset,
      }

      await testTransaction(testContext.client, ammWithdrawTx, wallet3)

      const ammInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm } = ammInfoRes.result
      const { amount, amount2 } = amm

      if (typeof amount !== 'string') {
        throw new Error('amount should be a string')
      }
      if (typeof preAmount !== 'string') {
        throw new Error('preAmount should be a string')
      }
      assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)
      assert.deepEqual(amount2, preAmount2)
    },
    TIMEOUT,
  )

  it(
    'withdraw with Amount and Amount2',
    async function () {
      // Need to deposit before withdraw is eligible
      const ammDepositTx: AMMDeposit = {
        TransactionType: 'AMMDeposit',
        Account: wallet2.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '100',
        Amount2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
          value: '100',
        },
        Flags: AMMDepositFlags.tfTwoAsset,
      }

      await testTransaction(testContext.client, ammDepositTx, wallet2)

      const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm: preAmm } = preAmmInfoRes.result
      const {
        amount: preAmount,
        amount2: preAmount2,
        lp_token: preLPToken,
      } = preAmm

      const ammWithdrawTx: AMMWithdraw = {
        TransactionType: 'AMMWithdraw',
        Account: wallet2.classicAddress,
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
        Amount: '50',
        Amount2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
          value: '50',
        },
        Flags: AMMWithdrawFlags.tfTwoAsset,
      }

      await testTransaction(testContext.client, ammWithdrawTx, wallet2)

      const ammInfoRes: AMMInfoResponse = await testContext.client.request({
        command: 'amm_info',
        asset: {
          currency: 'XRP',
        },
        asset2: {
          currency: currencyCode,
          issuer: wallet2.classicAddress,
        },
      })

      const { amm } = ammInfoRes.result
      const { amount, amount2, lp_token } = amm

      if (typeof amount !== 'string') {
        throw new Error('amount should be a string')
      }
      if (typeof preAmount !== 'string') {
        throw new Error('preAmount should be a string')
      }
      assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

      if (typeof amount2 !== 'object') {
        throw new Error('amount2 should be an object')
      }
      if (typeof preAmount2 !== 'object') {
        throw new Error('preAmount2 should be an object')
      }
      assert.equal(
        parseInt(amount2.value, 10) < parseInt(preAmount2.value, 10),
        true,
      )

      assert.equal(
        parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
        true,
      )
    },
    TIMEOUT,
  )

  it('withdraw with Amount and LPTokenIn', async function () {
    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

    const lptokenIn = { ...lptoken, value: '10' }
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet.classicAddress,
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
      Amount: '5',
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfOneAssetLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.deepEqual(amount2, preAmount2)

    assert.equal(
      parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
      true,
    )
  })

  it('withdraw with LPTokenIn', async function () {
    const lptokenOut = { ...lptoken, value: '5' }
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet2.classicAddress,
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
      LPTokenOut: lptokenOut,
      Flags: AMMDepositFlags.tfLPToken,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet2)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

    const lptokenIn = { ...lptoken, value: '1' }
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet2.classicAddress,
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet2)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }

    const amount2Value = new BigNumber(amount2.value)
    const preAmount2Value = new BigNumber(preAmount2.value)
    assert.equal(amount2Value.isLessThan(preAmount2Value), true)

    assert.equal(
      parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
      true,
    )
  })
})
