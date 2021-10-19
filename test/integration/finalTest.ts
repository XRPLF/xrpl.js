import assert from 'assert'

// how long before each test case times out
const TIMEOUT = 20000

// the purpose of this file is to indicate the end of tests and not really test anything.
describe('test', function () {
  this.timeout(TIMEOUT)

  it('closing test', function () {
    assert(true)
  })
})
