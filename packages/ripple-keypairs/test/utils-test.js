'use strict' // eslint-disable-line strict

const assert = require('assert')
const utils = require('../src/utils')

describe('utils', () => {
  it('hexToBytes - zero', () => {
    assert.deepEqual(utils.hexToBytes('000000'), [0, 0, 0])
  })

  it('hexToBytes - DEADBEEF', () => {
    assert.deepEqual(utils.hexToBytes('DEADBEEF'), [222, 173, 190, 239])
  })
})
