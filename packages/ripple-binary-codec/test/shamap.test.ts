import ledgerFull38129 from './fixtures/ledger-full-38129.json'
import ledgerFull40000 from './fixtures/ledger-full-40000.json'
import { BytesList } from '../src/serdes/binary-serializer'

import { ShaMap, ShaMapLeaf, ShaMapNode } from '../src/shamap'
import { binary, HashPrefix } from '../src/coretypes'
import { coreTypes, Hash256 } from '../src/types'

function now() {
  return Number(Date.now()) / 1000
}

const ZERO = '0000000000000000000000000000000000000000000000000000000000000000'

function makeItem(
  indexArg: string,
): [
  Hash256,
  { toBytesSink: (sink: BytesList) => void; hashPrefix: () => Buffer },
] {
  let str = indexArg
  while (str.length < 64) {
    str += '0'
  }
  const index = Hash256.from(str)
  const item = {
    toBytesSink(sink: BytesList) {
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
    // @ts-expect-error -- we are mocking nodes
    items.forEach((i) => map.addItem(...(makeItem(i) as ShaMapNode)))
    const h1 = map.hash()
    expect(h1.eq(h1)).toBe(true)
    map = new ShaMap()
    // @ts-expect-error -- we are mocking nodes
    items.reverse().forEach((i) => map.addItem(...(makeItem(i) as ShaMapNode)))
    expect(map.hash()).toEqual(h1)
  })
  function factory(ledger: typeof ledgerFull38129 | typeof ledgerFull40000) {
    it(`recreate account state hash from ${ledger}`, () => {
      const map = new ShaMap()
      // const t = now();
      const leafNodePrefix = HashPrefix.accountStateEntry
      ledger.accountState
        .map((e, i): ShaMapLeaf => {
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
            toBytesSink(sink: BytesList) {
              sink.put(bytes)
            },
          } as ShaMapLeaf
        })
        .forEach((so: ShaMapLeaf) => map.addItem(so.index, so))
      expect(map.hash().toHex()).toBe(ledger.account_hash)
      // console.log('took seconds: ', (now() - t));
    })
  }
  factory(ledgerFull38129)
  factory(ledgerFull40000)
})
