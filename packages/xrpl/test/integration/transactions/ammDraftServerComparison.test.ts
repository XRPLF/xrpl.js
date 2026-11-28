/* eslint-disable no-bitwise, no-await-in-loop -- compare each flag mask sequentially against one standalone ledger */
import { assert } from 'chai'

import { AMMDepositFlags, AMMWithdrawFlags, validate } from '../../../src'
import {
  setupAMMPool,
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
  type TestAMMPool,
} from '../setup'

// Runs only against the isolated standalone server. No live accounts are used.
describe('AMM draft versus standalone xrpld', () => {
  let context: XrplIntegrationTestContext
  let pool: TestAMMPool
  let lpToken: Record<string, unknown>

  beforeAll(async () => {
    context = await setupClient()
    pool = await setupAMMPool(context.client)
    const response = await context.client.request({
      command: 'amm_info',
      asset: pool.asset,
      asset2: pool.asset2,
    })
    lpToken = { ...response.result.amm.lp_token, value: '1' }
  }, 120000)

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- setup may fail before assignment
    if (context != null) {
      await teardownClient(context)
    }
  })

  // eslint-disable-next-line max-statements -- keep the test matrix and assertions together
  it('compares every mode-specific field subset with server preflight', async () => {
    const modes: Array<[string, number, number[]]> = [
      ['AMMDeposit', AMMDepositFlags.tfLPToken, [8, 11]],
      ['AMMDeposit', AMMDepositFlags.tfSingleAsset, [1, 9]],
      ['AMMDeposit', AMMDepositFlags.tfTwoAsset, [3, 11]],
      ['AMMDeposit', AMMDepositFlags.tfOneAssetLPToken, [9]],
      ['AMMDeposit', AMMDepositFlags.tfLimitLPToken, [5]],
      ['AMMDeposit', AMMDepositFlags.tfTwoAssetIfEmpty, [3, 19]],
      ['AMMWithdraw', AMMWithdrawFlags.tfLPToken, [8]],
      ['AMMWithdraw', AMMWithdrawFlags.tfWithdrawAll, [0]],
      ['AMMWithdraw', AMMWithdrawFlags.tfOneAssetWithdrawAll, [1]],
      ['AMMWithdraw', AMMWithdrawFlags.tfSingleAsset, [1]],
      ['AMMWithdraw', AMMWithdrawFlags.tfTwoAsset, [3]],
      ['AMMWithdraw', AMMWithdrawFlags.tfOneAssetLPToken, [9]],
      ['AMMWithdraw', AMMWithdrawFlags.tfLimitLPToken, [5]],
    ]
    const counts: Record<string, number> = {
      invalid: 0,
      valid: 0,
      successful: 0,
      tec: 0,
    }
    for (const [type, flags, accepted] of modes) {
      const isDeposit = type === 'AMMDeposit'
      const fields: Array<[string, unknown]> = [
        ['Amount', '1'],
        ['Amount2', { ...pool.asset2, value: '1' }],
        ['EPrice', isDeposit ? '1' : lpToken],
        [isDeposit ? 'LPTokenOut' : 'LPTokenIn', lpToken],
        ...(isDeposit ? [['TradingFee', 12] as [string, unknown]] : []),
      ]
      for (let mask = 0; mask < 2 ** fields.length; mask += 1) {
        const tx: Record<string, unknown> = {
          TransactionType: type,
          Account: pool.testWallet.classicAddress,
          Asset: pool.asset,
          Asset2: pool.asset2,
          Flags: flags,
        }
        fields.forEach(([field, value], index) => {
          if ((mask & (1 << index)) !== 0) {
            tx[field] = value
          }
        })
        let sdkAccepted = true
        try {
          validate(tx)
        } catch {
          sdkAccepted = false
        }
        assert.equal(
          sdkAccepted,
          accepted.includes(mask),
          `SDK ${type} flag=${flags} mask=${mask}`,
        )
        const response = await context.client.request({
          command: 'simulate',
          tx_json: tx as never,
        })
        assert.isFalse(response.result.applied, 'simulation must not apply')
        const result = response.result.engine_result
        if (accepted.includes(mask)) {
          assert.isTrue(
            result === 'tesSUCCESS' || result.startsWith('tec'),
            `inconclusive valid control ${type} flag=${flags} mask=${mask}: ${result}`,
          )
          counts.valid += 1
          counts[result === 'tesSUCCESS' ? 'successful' : 'tec'] += 1
        } else {
          assert.equal(
            result,
            'temMALFORMED',
            `server ${type} flag=${flags} mask=${mask}`,
          )
          counts.invalid += 1
        }
      }
    }
    assert.equal(counts.valid, 17)
    assert.equal(counts.invalid, 287)
    assert.isAbove(
      counts.successful,
      0,
      'at least one valid control must succeed',
    )
    assert.isAbove(
      counts.tec,
      0,
      'expected a preclaim result for a valid control',
    )
  }, 180000)

  it('checks missing and conflicting flags and fee boundaries', async () => {
    const assetAmount = { ...pool.asset2, value: '1' }
    const cases: Array<[string, Record<string, unknown>, string | null]> = [
      [
        'missing deposit mode',
        { TransactionType: 'AMMDeposit', Flags: 0, Amount: '1' },
        'temMALFORMED',
      ],
      [
        'conflicting deposit modes',
        {
          TransactionType: 'AMMDeposit',
          Flags: AMMDepositFlags.tfSingleAsset | AMMDepositFlags.tfTwoAsset,
          Amount: '1',
        },
        'temMALFORMED',
      ],
      [
        'missing withdrawal mode',
        { TransactionType: 'AMMWithdraw', Flags: 0 },
        'temMALFORMED',
      ],
      [
        'conflicting withdrawal modes',
        {
          TransactionType: 'AMMWithdraw',
          Flags:
            AMMWithdrawFlags.tfWithdrawAll | AMMWithdrawFlags.tfSingleAsset,
          Amount: '1',
        },
        'temMALFORMED',
      ],
      [
        'minimum fee',
        {
          TransactionType: 'AMMDeposit',
          Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
          Amount: '1',
          Amount2: assetAmount,
          TradingFee: 0,
        },
        null,
      ],
      [
        'maximum fee',
        {
          TransactionType: 'AMMDeposit',
          Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
          Amount: '1',
          Amount2: assetAmount,
          TradingFee: 1000,
        },
        null,
      ],
      [
        'fee too high',
        {
          TransactionType: 'AMMDeposit',
          Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
          Amount: '1',
          Amount2: assetAmount,
          TradingFee: 1001,
        },
        'temBAD_FEE',
      ],
    ]
    for (const [name, fields, expected] of cases) {
      const tx = {
        Account: pool.testWallet.classicAddress,
        Asset: pool.asset,
        Asset2: pool.asset2,
        ...fields,
      }
      let sdkAccepted = true
      try {
        validate(tx)
      } catch {
        sdkAccepted = false
      }
      assert.equal(sdkAccepted, expected == null, name)
      const response = await context.client.request({
        command: 'simulate',
        tx_json: tx as never,
      })
      assert.isFalse(response.result.applied, name)
      const result = response.result.engine_result
      if (expected == null) {
        assert.isTrue(
          result === 'tesSUCCESS' || result.startsWith('tec'),
          `${name}: ${result}`,
        )
      } else {
        assert.equal(result, expected, name)
      }
    }
  }, 30000)
})
