import { BinaryParser } from '../src/binary'
import { coreTypes } from '../src/types'

const { Number: STNumber } = coreTypes

describe('STNumber', () => {
  it('should encode and decode integers', () => {
    const value = '9876543210'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual(value)
  })
  it('roundtrip integer', () => {
    const value = '123456789'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('123456789')
  })

  it('roundtrip negative integer', () => {
    const value = '-987654321'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('-987654321')
  })

  it('roundtrip zero', () => {
    const value = '0'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('0')
  })

  it('roundtrip decimal', () => {
    const value = '123.456'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('123.456')
  })

  it('roundtrip scientific notation positive', () => {
    const value = '1.23e5'
    const num = STNumber.from(value)
    // NOTE: The codec always outputs the normalized value as a decimal string,
    // not necessarily in scientific notation. Only exponents < -25 or > -5
    // will use scientific notation. So "1.23e5" becomes "123000".
    expect(num.toJSON()).toEqual('123000')
  })

  it('roundtrip scientific notation negative', () => {
    const value = '-4.56e-7'
    const num = STNumber.from(value)
    // NOTE: The output is the normalized decimal form of the value.
    // "-4.56e-7" becomes "-0.000000456" as per XRPL codec behavior.
    expect(num.toJSON()).toEqual('-0.000000456')
  })

  it('roundtrip large exponent', () => {
    const value = '7.89e+20'
    const num = STNumber.from(value)
    // NOTE: The XRPL codec will output this in normalized scientific form,
    // as mantissa=7890000000000000, exponent=5, so the output is '7890000000000000e5'.
    expect(num.toJSON()).toEqual('7890000000000000e5')
  })

  it('roundtrip via parser', () => {
    const value = '123456.789'
    const num = STNumber.from(value)
    const parser = new BinaryParser(num.toHex())
    const parsedNum = STNumber.fromParser(parser)
    expect(parsedNum.toJSON()).toEqual(num.toJSON())
  })

  it('zero via parser', () => {
    const value = '0'
    const num = STNumber.from(value)
    const parser = new BinaryParser(num.toHex())
    const parsedNum = STNumber.fromParser(parser)
    expect(parsedNum.toJSON()).toEqual('0')
  })

  it('normalization with trailing zeros', () => {
    const value = '123.45000'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('123.45')
  })

  it('normalization with leading zeros', () => {
    const value = '0000123.45'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('123.45')
  })

  it('integer with exponent', () => {
    const value = '123e2'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('12300')
  })

  it('negative decimal with exponent', () => {
    const value = '-1.2e2'
    const num = STNumber.from(value)
    expect(num.toJSON()).toEqual('-120')
  })

  it('throws with invalid input (non-number string)', () => {
    expect(() => {
      STNumber.from('abc123')
    }).toThrow(new Error('Unable to parse number from string: abc123'))
  })

  it('throws with invalid input (object)', () => {
    expect(() => {
      STNumber.from({ foo: 'bar' })
    }).toThrow(
      new Error('STNumber.from: Only string or STNumber instance is supported'),
    )
  })
})
