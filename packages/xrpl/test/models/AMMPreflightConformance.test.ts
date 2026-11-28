/* eslint-disable no-bitwise -- exercise combined transaction flags */

// Draft regression tests for XRPLF/xrpl.js#3579, originally reported by nabe3m.
// Expected outcomes concern xrpld's static preflight field/flag rules only;
// acceptance here does not imply a transaction will succeed on a ledger.
import { AMMDepositFlags, AMMWithdrawFlags } from '../../src'
import { ValidationError } from '../../src/errors'
import { validateAMMDeposit } from '../../src/models/transactions/AMMDeposit'
import { validateAMMWithdraw } from '../../src/models/transactions/AMMWithdraw'

const asset = { currency: 'ETH', issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd' }
const amount = { ...asset, value: '2.5' }
const lp = {
  currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
  issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
  value: '1000',
}
const base = {
  Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
  Asset: { currency: 'XRP' },
  Asset2: asset,
  Sequence: 1337,
}

describe('AMM static preflight conformance (issue #3579)', () => {
  const deposits: Array<[string, number, Record<string, unknown>]> = [
    ['LP token', AMMDepositFlags.tfLPToken, { LPTokenOut: lp }],
    ['single asset', AMMDepositFlags.tfSingleAsset, { Amount: '1000' }],
    [
      'two assets',
      AMMDepositFlags.tfTwoAsset,
      { Amount: '1000', Amount2: amount },
    ],
    [
      'one asset and LP token',
      AMMDepositFlags.tfOneAssetLPToken,
      { Amount: '1000', LPTokenOut: lp },
    ],
    [
      'limit LP token',
      AMMDepositFlags.tfLimitLPToken,
      { Amount: '1000', EPrice: '25' },
    ],
    [
      'two assets if empty',
      AMMDepositFlags.tfTwoAssetIfEmpty,
      { Amount: '1000', Amount2: amount, TradingFee: 500 },
    ],
  ]
  const withdrawals: Array<[string, number, Record<string, unknown>]> = [
    ['LP token', AMMWithdrawFlags.tfLPToken, { LPTokenIn: lp }],
    ['withdraw all', AMMWithdrawFlags.tfWithdrawAll, {}],
    [
      'one asset withdraw all',
      AMMWithdrawFlags.tfOneAssetWithdrawAll,
      { Amount: '1000' },
    ],
    ['single asset', AMMWithdrawFlags.tfSingleAsset, { Amount: '1000' }],
    [
      'two assets',
      AMMWithdrawFlags.tfTwoAsset,
      { Amount: '1000', Amount2: amount },
    ],
    [
      'one asset and LP token',
      AMMWithdrawFlags.tfOneAssetLPToken,
      { Amount: '1000', LPTokenIn: lp },
    ],
    [
      'limit LP token',
      AMMWithdrawFlags.tfLimitLPToken,
      { Amount: '1000', EPrice: '25' },
    ],
  ]

  it.each(deposits)('accepts deposit mode %s', (_name, Flags, fields) => {
    expect(() =>
      validateAMMDeposit({
        ...base,
        TransactionType: 'AMMDeposit',
        Flags,
        ...fields,
      }),
    ).not.toThrow()
  })
  it.each(withdrawals)('accepts withdrawal mode %s', (_name, Flags, fields) => {
    expect(() =>
      validateAMMWithdraw({
        ...base,
        TransactionType: 'AMMWithdraw',
        Flags,
        ...fields,
      }),
    ).not.toThrow()
  })

  const invalidDeposits: Array<[string, Record<string, unknown>]> = [
    ['no mode', { Flags: 0, Amount: '1000' }],
    [
      'multiple modes',
      {
        Flags: AMMDepositFlags.tfSingleAsset | AMMDepositFlags.tfTwoAsset,
        Amount: '1000',
      },
    ],
    [
      'single asset with Amount2',
      { Flags: AMMDepositFlags.tfSingleAsset, Amount: '1000', Amount2: amount },
    ],
    [
      'LP token with only Amount',
      { Flags: AMMDepositFlags.tfLPToken, Amount: '1000' },
    ],
    [
      'one asset missing LP token',
      { Flags: AMMDepositFlags.tfOneAssetLPToken, Amount: '1000' },
    ],
    [
      'limit mode missing EPrice',
      { Flags: AMMDepositFlags.tfLimitLPToken, Amount: '1000' },
    ],
    [
      'fee in single asset mode',
      { Flags: AMMDepositFlags.tfSingleAsset, Amount: '1000', TradingFee: 500 },
    ],
    [
      'fee above maximum',
      {
        Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
        Amount: '1000',
        Amount2: amount,
        TradingFee: 1001,
      },
    ],
  ]
  const invalidWithdrawals: Array<[string, Record<string, unknown>]> = [
    ['no mode', { Flags: 0 }],
    [
      'multiple modes',
      {
        Flags: AMMWithdrawFlags.tfLPToken | AMMWithdrawFlags.tfWithdrawAll,
        LPTokenIn: lp,
      },
    ],
    ['LP token mode missing token', { Flags: AMMWithdrawFlags.tfLPToken }],
    [
      'withdraw all with Amount',
      { Flags: AMMWithdrawFlags.tfWithdrawAll, Amount: '1000' },
    ],
    [
      'one asset withdraw all missing Amount',
      { Flags: AMMWithdrawFlags.tfOneAssetWithdrawAll },
    ],
    [
      'single asset with LP token',
      { Flags: AMMWithdrawFlags.tfSingleAsset, Amount: '1000', LPTokenIn: lp },
    ],
  ]

  it.each(invalidDeposits)('rejects deposit with %s', (_name, fields) => {
    expect(() =>
      validateAMMDeposit({ ...base, TransactionType: 'AMMDeposit', ...fields }),
    ).toThrow(ValidationError)
  })
  it.each(invalidWithdrawals)('rejects withdrawal with %s', (_name, fields) => {
    expect(() =>
      validateAMMWithdraw({
        ...base,
        TransactionType: 'AMMWithdraw',
        ...fields,
      }),
    ).toThrow(ValidationError)
  })

  it('accepts both limits with LP token deposit', () => {
    expect(() =>
      validateAMMDeposit({
        ...base,
        TransactionType: 'AMMDeposit',
        Flags: AMMDepositFlags.tfLPToken,
        LPTokenOut: lp,
        Amount: '1000',
        Amount2: amount,
      }),
    ).not.toThrow()
  })

  it('rejects only one LP token deposit limit', () => {
    expect(() =>
      validateAMMDeposit({
        ...base,
        TransactionType: 'AMMDeposit',
        Flags: AMMDepositFlags.tfLPToken,
        LPTokenOut: lp,
        Amount: '1000',
      }),
    ).toThrow(ValidationError)
  })

  it.each([0, 1000])('accepts fee boundary %s', (TradingFee) => {
    expect(() =>
      validateAMMDeposit({
        ...base,
        TransactionType: 'AMMDeposit',
        Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
        Amount: '1000',
        Amount2: amount,
        TradingFee,
      }),
    ).not.toThrow()
  })

  it.each([-1, 1001, 1.5, NaN, Infinity, '500'])(
    'rejects invalid fee %s',
    (TradingFee) => {
      expect(() =>
        validateAMMDeposit({
          ...base,
          TransactionType: 'AMMDeposit',
          Flags: AMMDepositFlags.tfTwoAssetIfEmpty,
          Amount: '1000',
          Amount2: amount,
          TradingFee,
        }),
      ).toThrow(ValidationError)
    },
  )

  it('supports object flags with a global flag', () => {
    expect(() =>
      validateAMMDeposit({
        ...base,
        TransactionType: 'AMMDeposit',
        Flags: { tfSingleAsset: true, tfInnerBatchTxn: true },
        Amount: '1000',
      }),
    ).not.toThrow()
    expect(() =>
      validateAMMWithdraw({
        ...base,
        TransactionType: 'AMMWithdraw',
        Flags: { tfWithdrawAll: true, tfSingleAsset: false },
      }),
    ).not.toThrow()
  })

  it('rejects empty, conflicting, and unknown object flags', () => {
    for (const Flags of [
      {},
      { tfSingleAsset: true, tfTwoAsset: true },
      { unknownFlag: true },
    ]) {
      expect(() =>
        validateAMMDeposit({
          ...base,
          TransactionType: 'AMMDeposit',
          Flags,
          Amount: '1000',
        }),
      ).toThrow(ValidationError)
    }
  })

  const depositFields: Record<string, unknown> = {
    Amount: '1000',
    Amount2: amount,
    LPTokenOut: lp,
    EPrice: '25',
    TradingFee: 500,
  }
  const withdrawFields: Record<string, unknown> = {
    Amount: '1000',
    Amount2: amount,
    LPTokenIn: lp,
    EPrice: '25',
  }
  const rules: Array<
    [string, number, Record<string, unknown>, string[], string[]]
  > = [
    [
      'deposit LP',
      AMMDepositFlags.tfLPToken,
      { LPTokenOut: lp },
      ['LPTokenOut'],
      ['EPrice', 'TradingFee'],
    ],
    [
      'deposit single',
      AMMDepositFlags.tfSingleAsset,
      { Amount: '1000' },
      ['Amount'],
      ['Amount2', 'EPrice', 'TradingFee'],
    ],
    [
      'deposit two',
      AMMDepositFlags.tfTwoAsset,
      { Amount: '1000', Amount2: amount },
      ['Amount', 'Amount2'],
      ['EPrice', 'TradingFee'],
    ],
    [
      'deposit one LP',
      AMMDepositFlags.tfOneAssetLPToken,
      { Amount: '1000', LPTokenOut: lp },
      ['Amount', 'LPTokenOut'],
      ['Amount2', 'EPrice', 'TradingFee'],
    ],
    [
      'deposit limit',
      AMMDepositFlags.tfLimitLPToken,
      { Amount: '1000', EPrice: '25' },
      ['Amount', 'EPrice'],
      ['Amount2', 'LPTokenOut', 'TradingFee'],
    ],
    [
      'deposit empty',
      AMMDepositFlags.tfTwoAssetIfEmpty,
      { Amount: '1000', Amount2: amount },
      ['Amount', 'Amount2'],
      ['EPrice', 'LPTokenOut'],
    ],
    [
      'withdraw LP',
      AMMWithdrawFlags.tfLPToken,
      { LPTokenIn: lp },
      ['LPTokenIn'],
      ['Amount', 'Amount2', 'EPrice'],
    ],
    [
      'withdraw all',
      AMMWithdrawFlags.tfWithdrawAll,
      {},
      [],
      ['Amount', 'Amount2', 'LPTokenIn', 'EPrice'],
    ],
    [
      'withdraw one all',
      AMMWithdrawFlags.tfOneAssetWithdrawAll,
      { Amount: '1000' },
      ['Amount'],
      ['Amount2', 'LPTokenIn', 'EPrice'],
    ],
    [
      'withdraw single',
      AMMWithdrawFlags.tfSingleAsset,
      { Amount: '1000' },
      ['Amount'],
      ['Amount2', 'LPTokenIn', 'EPrice'],
    ],
    [
      'withdraw two',
      AMMWithdrawFlags.tfTwoAsset,
      { Amount: '1000', Amount2: amount },
      ['Amount', 'Amount2'],
      ['LPTokenIn', 'EPrice'],
    ],
    [
      'withdraw one LP',
      AMMWithdrawFlags.tfOneAssetLPToken,
      { Amount: '1000', LPTokenIn: lp },
      ['Amount', 'LPTokenIn'],
      ['Amount2', 'EPrice'],
    ],
    [
      'withdraw limit',
      AMMWithdrawFlags.tfLimitLPToken,
      { Amount: '1000', EPrice: '25' },
      ['Amount', 'EPrice'],
      ['Amount2', 'LPTokenIn'],
    ],
  ]
  it.each(rules)(
    'enforces required and forbidden fields for %s',
    // eslint-disable-next-line max-params -- each column describes one independent rule
    (name, Flags, valid, required, forbidden) => {
      const isDeposit = name.startsWith('deposit')
      const validate = isDeposit ? validateAMMDeposit : validateAMMWithdraw
      const fields = isDeposit ? depositFields : withdrawFields
      const tx: Record<string, unknown> = {
        ...base,
        TransactionType: isDeposit ? 'AMMDeposit' : 'AMMWithdraw',
        Flags,
        ...valid,
      }
      for (const field of required) {
        const missing = { ...tx }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- exercise each required field
        delete missing[field]
        expect(() => validate(missing)).toThrow(ValidationError)
      }
      for (const field of forbidden) {
        expect(() => validate({ ...tx, [field]: fields[field] })).toThrow(
          ValidationError,
        )
      }
    },
  )

  // Each bit represents one present field: Amount, Amount2, EPrice, LP token,
  // and (for deposits) TradingFee. These accepted sets come from the pinned
  // xrpld preflight rules linked in issue #3579.
  const fieldSets: Array<[string, number, number[]]> = [
    ['deposit', AMMDepositFlags.tfLPToken, [8, 11]],
    ['deposit', AMMDepositFlags.tfSingleAsset, [1, 9]],
    ['deposit', AMMDepositFlags.tfTwoAsset, [3, 11]],
    ['deposit', AMMDepositFlags.tfOneAssetLPToken, [9]],
    ['deposit', AMMDepositFlags.tfLimitLPToken, [5]],
    ['deposit', AMMDepositFlags.tfTwoAssetIfEmpty, [3, 19]],
    ['withdraw', AMMWithdrawFlags.tfLPToken, [8]],
    ['withdraw', AMMWithdrawFlags.tfWithdrawAll, [0]],
    ['withdraw', AMMWithdrawFlags.tfOneAssetWithdrawAll, [1]],
    ['withdraw', AMMWithdrawFlags.tfSingleAsset, [1]],
    ['withdraw', AMMWithdrawFlags.tfTwoAsset, [3]],
    ['withdraw', AMMWithdrawFlags.tfOneAssetLPToken, [9]],
    ['withdraw', AMMWithdrawFlags.tfLimitLPToken, [5]],
  ]
  it.each(fieldSets)(
    'checks every %s field subset for mode %i',
    (kind, Flags, accepted) => {
      const isDeposit = kind === 'deposit'
      const values: Array<[string, unknown]> = [
        ['Amount', '1000'],
        ['Amount2', amount],
        ['EPrice', '25'],
        [isDeposit ? 'LPTokenOut' : 'LPTokenIn', lp],
        ...(isDeposit ? [['TradingFee', 500] as [string, unknown]] : []),
      ]
      for (let mask = 0; mask < 2 ** values.length; mask += 1) {
        const tx: Record<string, unknown> = {
          ...base,
          TransactionType: isDeposit ? 'AMMDeposit' : 'AMMWithdraw',
          Flags,
        }
        values.forEach(([name, value], index) => {
          if ((mask & (1 << index)) !== 0) {
            tx[name] = value
          }
        })
        const validate = isDeposit ? validateAMMDeposit : validateAMMWithdraw
        if (accepted.includes(mask)) {
          expect(() => validate(tx)).not.toThrow()
        } else {
          expect(() => validate(tx)).toThrow(ValidationError)
        }
      }
    },
  )
})
