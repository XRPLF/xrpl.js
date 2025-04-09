import { validateRequiredField, validateOptionalField } from '../../../src/models/transactions/common'
import { ValidationError } from '../../../src/errors'

describe('validateRequiredField', () => {
  const txMock = {
    TransactionType: 'Payment',
    amount: 42,
    account: 'rXYZ',
  }

  it('throws an error with expected and actual types', () => {
    expect(() =>
      validateRequiredField(txMock, 'amount', (val) => typeof val === 'string', 'string')
    ).toThrow(new ValidationError('Payment: invalid field amount: expected string, received number'))
  })

  it('does not throw if value is valid', () => {
    expect(() =>
      validateRequiredField(txMock, 'account', (val) => typeof val === 'string', 'string')
    ).not.toThrow()
  })

  it('throws without expectedType if not passed', () => {
    expect(() =>
      validateRequiredField(txMock, 'amount', (val) => typeof val === 'string')
    ).toThrow(new ValidationError('Payment: invalid field amount'))
  })

  it('throws when field is missing', () => {
    expect(() =>
      validateRequiredField(txMock, 'nonExistentField', (val) => typeof val === 'string')
    ).toThrow(new ValidationError('Payment: missing field nonExistentField'))
  })
})

describe('validateOptionalField', () => {
  const txMock = {
    TransactionType: 'Payment',
    memo: 123,
  }

  const txNoMemo = {
    TransactionType: 'Payment',
  }

  it('skips validation if value is undefined', () => {
    expect(() =>
      validateOptionalField(txNoMemo, 'memo', (val) => typeof val === 'string', 'string')
    ).not.toThrow()
  })

  it('delegates to validation if value is defined', () => {
    expect(() =>
      validateOptionalField(txMock, 'memo', (val) => typeof val === 'string', 'string')
    ).toThrow(new ValidationError('Payment: invalid field memo: expected string, received number'))
  })
})