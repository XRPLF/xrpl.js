import { assert } from 'chai'
import { convertHexToString, convertStringToHex } from 'xrpl-local/utils'

describe('convertHexToString and convertStringToHex', () => {
  it('converts "example.com"', () => {
    const str = 'example.com'
    const hex = convertStringToHex(str)
    assert.strictEqual(
      hex,
      '6578616D706C652E636F6D',
      'should convert to hex equivalent',
    )
    const result = convertHexToString(hex)
    assert.strictEqual(
      result,
      'example.com',
      'should convert back to example.com',
    )
  })

  it('converts "你好"', () => {
    const str = '你好'
    const hex = convertStringToHex(str)
    assert.strictEqual(hex, 'E4BDA0E5A5BD', 'should convert to hex equivalent')
    const result = convertHexToString(hex)
    assert.strictEqual(result, '你好', 'should convert back to 你好')
  })
})
