import { assert } from 'chai'

import { setupClient, teardownClient } from '../setupClient'

describe('client errors', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('XrplError with data', async function () {
    const error = new this.client.errors.XrplError('_message_', '_data_')
    assert.strictEqual(error.toString(), "[XrplError(_message_, '_data_')]")
  })

  it('NotFoundError default message', async function () {
    const error = new this.client.errors.NotFoundError()
    assert.strictEqual(error.toString(), '[NotFoundError(Not found)]')
  })
})
