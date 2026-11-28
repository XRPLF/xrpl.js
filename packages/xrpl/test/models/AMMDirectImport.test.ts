import { validateAMMDeposit } from '../../src/models/transactions/AMMDeposit'

it('handles object flags when the AMM validator is imported directly', () => {
  expect(() =>
    validateAMMDeposit({
      TransactionType: 'AMMDeposit',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: { currency: 'XRP' },
      Asset2: { currency: 'ETH', issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd' },
      Flags: { tfSingleAsset: true, tfInnerBatchTxn: true },
      Amount: '1000',
    }),
  ).not.toThrow()
})
