import assert from 'assert'

// how long before each test case times out
const TIMEOUT = 20000

describe('test', function () {
  this.timeout(TIMEOUT)

  it('closing test', function () {
    assert(true)
  })
})
