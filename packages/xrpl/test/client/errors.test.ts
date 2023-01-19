import { assert } from 'chai'
import { XrplError, NotFoundError } from 'xrpl-local'

import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('client errors', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('XrplError with data', async function () {
    const error = new XrplError('_message_', '_data_')
    assert.strictEqual(error.toString(), "[XrplError(_message_, '_data_')]")
  })

  it('NotFoundError default message', async function () {
    const error = new NotFoundError()
    assert.strictEqual(error.toString(), '[NotFoundError(Not found)]')
  })
})
