const { ShaMap } = require('../src/shamap')
const { binary, HashPrefix } = require('../src/coretypes')
const { coreTypes } = require('../src/types')

import ledgerFull38129 from './fixtures/ledger-full-38129.json'
import ledgerFull40000 from './fixtures/ledger-full-40000.json'

function now() {
  return Number(Date.now()) / 1000
}

const ZERO = '0000000000000000000000000000000000000000000000000000000000000000'

function makeItem(indexArg: any) {
  let str = indexArg
  while (str.length < 64) {
    str += '0'
  }
  const index = coreTypes.Hash256.from(str)
  const item = {
    toBytesSink(sink: any) {
      index.toBytesSink(sink)
    },
    hashPrefix() {
      return Buffer.from([1, 3, 3, 7])
    },
  }
  return [index, item]
}

describe('ShaMap', () => {
  now()

  it('hashes to zero when empty', () => {
    const map = new ShaMap()
    expect(map.hash().toHex()).toBe(ZERO)
  })
  it('creates the same hash no matter which order items are added', () => {
    let map = new ShaMap()
    const items = [
      '0',
      '1',
      '11',
      '7000DE445E22CB9BB7E1717589FA858736BAA5FD192310E20000000000000000',
      '7000DE445E22CB9BB7E1717589FA858736BAA5FD192310E21000000000000000',
      '7000DE445E22CB9BB7E1717589FA858736BAA5FD192310E22000000000000000',
      '7000DE445E22CB9BB7E1717589FA858736BAA5FD192310E23000000000000000',
      '12',
      '122',
    ]
    items.forEach((i) => map.addItem(...makeItem(i)))
    const h1 = map.hash()
    expect(h1.eq(h1)).toBe(true)
    map = new ShaMap()
    items.reverse().forEach((i) => map.addItem(...makeItem(i)))
    expect(map.hash()).toEqual(h1)
  })
  function factory(ledger: any) {
    it(`recreate account state hash from ${ledger}`, () => {
      const map = new ShaMap()
      // const t = now();
      const leafNodePrefix = HashPrefix.accountStateEntry
      ledger.accountState
        .map((e: any, i: any) => {
          if (i > 1000 && i % 1000 === 0) {
            console.log(e.index)
            console.log(i)
          }
          const bytes = binary.serializeObject(e)
          return {
            index: coreTypes.Hash256.from(e.index),
            hashPrefix() {
              return leafNodePrefix
            },
            toBytesSink(sink: any) {
              sink.put(bytes)
            },
          }
        })
        .forEach((so: any) => map.addItem(so.index, so))
      expect(map.hash().toHex()).toBe(ledger.account_hash)
      // console.log('took seconds: ', (now() - t));
    })
  }
  factory(ledgerFull38129)
  factory(ledgerFull40000)
  // factory('ledger-4320277.json');
  // factory('14280680.json');
})
