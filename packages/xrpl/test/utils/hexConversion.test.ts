import { stringToHex, hexToString } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

describe('hexToString and stringToHex', function () {
  it('converts "example.com"', function () {
    const str = 'example.com'
    const hex = stringToHex(str)
    assert.strictEqual(
      hex,
      '6578616D706C652E636F6D',
      'should convert to hex equivalent',
    )
    const result = hexToString(hex)
    assert.strictEqual(
      result,
      'example.com',
      'should convert back to example.com',
    )
  })

  it('converts "你好"', function () {
    const str = '你好'
    const hex = stringToHex(str)
    assert.strictEqual(hex, 'E4BDA0E5A5BD', 'should convert to hex equivalent')
    const result = hexToString(hex)
    assert.strictEqual(result, '你好', 'should convert back to 你好')
  })
})
