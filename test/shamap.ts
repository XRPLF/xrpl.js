import assert from 'assert'

import SHAMap, { NodeType } from '../src/utils/hashes/SHAMap'

const TYPE_TRANSACTION_NO_METADATA = NodeType.TRANSACTION_NO_METADATA

const HEX_ZERO =
  '0000000000000000000000000000000000000000000000000000000000000000'

/**
 * Generates data to hash for testing.
 *
 * @param int - TODO: fill in.
 * @returns TODO: fill in.
 */
function intToVuc(int: number): string {
  let ret = ''

  for (let it = 0; it < 32; it++) {
    ret += '0'
    ret += int.toString(16).toUpperCase()
  }
  return ret
}

function fillShamapTest(
  shamap: SHAMap,
  keys: string[],
  hashes: string[],
): void {
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const data = intToVuc(keyIndex)
    shamap.addItem(
      keys[keyIndex].toUpperCase(),
      data,
      TYPE_TRANSACTION_NO_METADATA,
    )
    assert.equal(shamap.hash, hashes[keyIndex])
  }
}

describe('SHAMap', function () {
  describe('#addItem', function () {
    it('will add new nodes to v1', function () {
      const keys = [
        'b92891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92881fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92691fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92791fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b91891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b99891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'f22891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        '292891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
      ]

      const hashesv1 = [
        'B7387CFEA0465759ADC718E8C42B52D2309D179B326E239EB5075C64B6281F7F',
        'FBC195A9592A54AB44010274163CB6BA95F497EC5BA0A8831845467FB2ECE266',
        '4E7D2684B65DFD48937FFB775E20175C43AF0C94066F7D5679F51AE756795B75',
        '7A2F312EB203695FFD164E038E281839EEF06A1B99BFC263F3CECC6C74F93E07',
        '395A6691A372387A703FB0F2C6D2C405DAF307D0817F8F0E207596462B0E3A3E',
        'D044C0A696DE3169CC70AE216A1564D69DE96582865796142CE7D98A84D9DDE4',
        '76DCC77C4027309B5A91AD164083264D70B77B5E43E08AEDA5EBF94361143615',
        'DF4220E93ADC6F5569063A01B4DC79F8DB9553B6A3222ADE23DEA02BBE7230E5',
      ]

      const shamapv1 = new SHAMap()
      assert.equal(shamapv1.hash, HEX_ZERO)
      fillShamapTest(shamapv1, keys, hashesv1)
    })
  })
})
