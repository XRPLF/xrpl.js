import { assert } from 'chai'

import { XrplError, NotFoundError } from '../../src'

describe('client errors', function () {
  it('XrplError with data', async function () {
    const error = new XrplError('_message_', '_data_')
    assert.strictEqual(error.toString(), '[XrplError(_message_, "_data_")]')
  })

  it('preserves JSON formatting for ordinary data', function () {
    const error = new XrplError('original', { code: 42, nested: ['detail'] })
    assert.strictEqual(
      error.toString(),
      '[XrplError(original, {"code":42,"nested":["detail"]})]',
    )
  })

  it('does not throw while logging circular data', function () {
    const data: { code: number; self?: object } = { code: 42 }
    data.self = data
    const error = new XrplError('original', data)
    assert.strictEqual(
      error.toString(),
      '[XrplError(original, [unserializable data])]',
    )
    assert.strictEqual(error.inspect(), error.toString())
    assert.strictEqual(String(error), error.toString())
    assert.strictEqual(error.data, data)
  })

  it('does not throw while logging bigint data', function () {
    const error = new XrplError('original', { value: 1n })
    assert.strictEqual(
      error.toString(),
      '[XrplError(original, [unserializable data])]',
    )
  })

  it('does not throw when data has a failing toJSON method', function () {
    const error = new XrplError('original', {
      toJSON(): never {
        throw new Error('serialization failure')
      },
    })
    assert.strictEqual(
      error.toString(),
      '[XrplError(original, [unserializable data])]',
    )
  })

  it('NotFoundError default message', async function () {
    const error = new NotFoundError()
    assert.strictEqual(error.toString(), '[NotFoundError(Not found)]')
  })
})
