'use strict' // eslint-disable-line strict

const assert = require('assert')
const utils = require('../dist/utils')

describe('utils', () => {
  it('hexToBytes - empty', () => {
    assert.deepEqual(utils.hexToBytes(''), [])
  })

  it('hexToBytes - zero', () => {
    assert.deepEqual(utils.hexToBytes('000000'), [0, 0, 0])
  })

  it('hexToBytes - DEADBEEF', () => {
    assert.deepEqual(utils.hexToBytes('DEADBEEF'), [222, 173, 190, 239])
  })

  it('bytesToHex - DEADBEEF', () => {
    assert.deepEqual(utils.bytesToHex([222, 173, 190, 239]), 'DEADBEEF')
  });

  it('bytesToHex - DEADBEEF (Uint8Array)', () => {
    assert.deepEqual(utils.bytesToHex(new Uint8Array([222, 173, 190, 239])), 'DEADBEEF')
  });
})
