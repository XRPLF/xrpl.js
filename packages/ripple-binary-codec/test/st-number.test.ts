import { BinaryParser } from '../src/binary'
import { coreTypes } from '../src/types'

const { Number: STNumber } = coreTypes

describe('STNumber', () => {
  it('+ve normal value', () => {
    const value = '123'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual(value)
  })

  // scientific notation triggers in when abs(value) >= 10^11
  it('+ve very large value', () => {
    const value = '100000000000'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('1e11')
  })

  // scientific notation triggers in when abs(value) >= 10^11
  it('+ve large value', () => {
    const value = '10000000000'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('10000000000')
  })

  it('-ve normal value', () => {
    const value = '-123'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual(value)
  })

  // scientific notation triggers in when abs(value) >= 10^11
  it('-ve very large value', () => {
    const value = '-100000000000'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('-1e11')
  })

  // scientific notation triggers in when abs(value) >= 10^11
  it('-ve large value', () => {
    const value = '-10000000000'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('-10000000000')
  })

  // scientific notation triggers in when abs(value) < 10^-10
  it('+ve very small value', () => {
    const value = '0.00000000001'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('1e-11')
  })

  // scientific notation triggers in when abs(value) < 10^-10
  it('+ve small value', () => {
    const value = '0.0001'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('0.0001')
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
    // scientific notation triggers in when abs(value) >= 10^11
    expect(num.toJSON()).toEqual('123000')
  })

  it('roundtrip scientific notation negative', () => {
    const value = '-4.56e-7'
    const num = STNumber.from(value)
    // scientific notation triggers in when abs(value) < 10^-10
    expect(num.toJSON()).toEqual('-0.000000456')
  })

  it('-ve normal value', () => {
    const value = '-987654321'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('-987654321')
  })

  it('+v2 normal value', () => {
    const value = '987654321'
    const sn = STNumber.from(value)
    expect(sn.toJSON()).toEqual('987654321')
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
