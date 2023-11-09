import { assert } from 'chai'

// how long before each test case times out
const TIMEOUT = 20000

// the purpose of this file is to indicate the end of tests and not really test anything.
describe('closing test', function () {
  it(
    'closing test',
    function () {
      assert(true)
    },
    TIMEOUT,
  )
})
