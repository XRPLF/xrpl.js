import { assert } from 'chai'

import { isValidAddress } from 'xrpl-local'

describe('isValidAddress', function () {
  it('Validates valid classic address', function () {
    const classic = 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W'
    assert(isValidAddress(classic))
  })

  it('Does not validate invalid classic address', function () {
    const classic = 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENhqw96W'
    assert(!isValidAddress(classic))
  })

  it('Validates valid X-Address', function () {
    const xAddress = 'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD28Sq49uo34VyjnmK5H'
    assert(isValidAddress(xAddress))
  })

  it('Does not validate invalid X-Address', function () {
    const xAddress = 'XV5sbjUmgPpvXv4ixFWZ5pfAYZ6PD28Sq49uo34VyjnmK5H'
    assert(!isValidAddress(xAddress))
  })
})
