import { BinaryParser } from '../src/binary'
import { coreTypes } from '../src/types'
// import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

const { Data } = coreTypes

describe('Data Type with all STTypes', () => {
  describe('UInt8', () => {
    it('should encode and decode UInt8', () => {
      const data = Data.from({ type: 'UInt8', value: 255 })
      const hex = data.toHex()
      expect(hex).toBe('0010FF') // 0010 = type ID for UInt8, FF = 255

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'UInt8', value: 255 })
    })

    it('should handle UInt8 zero', () => {
      const data = Data.from({ type: 'UInt8', value: 0 })
      expect(data.toHex()).toBe('001000')
      expect(data.toJSON()).toEqual({ type: 'UInt8', value: 0 })
    })

    it('should handle UInt8 from string', () => {
      const data = Data.from({ type: 'UInt8', value: '128' })
      expect(data.toHex()).toBe('001080')
      expect(data.toJSON()).toEqual({ type: 'UInt8', value: 128 })
    })
  })

  describe('UInt16', () => {
    it('should encode and decode UInt16', () => {
      const data = Data.from({ type: 'UInt16', value: 65535 })
      const hex = data.toHex()
      expect(hex).toBe('0001FFFF') // 0001 = type ID for UInt16, FFFF = 65535

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'UInt16', value: 65535 })
    })

    it('should handle UInt16 zero', () => {
      const data = Data.from({ type: 'UInt16', value: 0 })
      expect(data.toHex()).toBe('00010000')
    })
  })

  describe('UInt32', () => {
    it('should encode and decode UInt32', () => {
      const data = Data.from({ type: 'UInt32', value: 4294967295 })
      const hex = data.toHex()
      expect(hex).toBe('0002FFFFFFFF') // 0002 = type ID for UInt32

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'UInt32', value: 4294967295 })
    })
  })

  describe('UInt64', () => {
    it('should encode and decode UInt64', () => {
      const data = Data.from({ type: 'UInt64', value: '7fffffffffffffff' })
      const hex = data.toHex()
      expect(hex).toBe('00037FFFFFFFFFFFFFFF') // 0003 = type ID for UInt64

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({
        type: 'UInt64',
        value: '7FFFFFFFFFFFFFFF',
      })
    })

    // it('should handle UInt64 as number string', () => {
    //   const data = Data.from({ type: 'UInt64', value: '123456789' })
    //   const parser = new BinaryParser(data.toHex())
    //   const parsed = Data.fromParser(parser)
    //   expect(parsed.getValue().toJSON()).toBe('123456789')
    // })
  })

  describe('Hash128', () => {
    it('should encode and decode Hash128', () => {
      const value = '00000000000000000000000000000001'
      const data = Data.from({ type: 'Hash128', value })
      const hex = data.toHex()
      expect(hex).toBe('0004' + value) // 0004 = type ID for Hash128

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({
        type: 'Hash128',
        value: value.toUpperCase(),
      })
    })
  })

  describe('Hash160', () => {
    it('should encode and decode Hash160', () => {
      const value = '0000000000000000000000000000000000000001'
      const data = Data.from({ type: 'Hash160', value })
      const hex = data.toHex()
      expect(hex).toBe('0011' + value) // 0011 = type ID for Hash160

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({
        type: 'Hash160',
        value: value.toUpperCase(),
      })
    })
  })

  describe('Hash192', () => {
    it('should encode and decode Hash192', () => {
      const value = '000000000000000000000000000000000000000000000001'
      const data = Data.from({ type: 'Hash192', value })
      const hex = data.toHex()
      expect(hex).toBe('0015' + value) // 0015 = type ID for Hash192

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({
        type: 'Hash192',
        value: value.toUpperCase(),
      })
    })
  })

  describe('Hash256', () => {
    it('should encode and decode Hash256', () => {
      const value =
        'D955DAC2E77519F05AD151A5D3C99FC8125FB39D58FF9F106F1ACA4491902C25'
      const data = Data.from({ type: 'Hash256', value })
      const hex = data.toHex()
      expect(hex).toBe('0005' + value) // 0005 = type ID for Hash256

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Hash256', value })
    })
  })

  describe('Blob (Variable Length)', () => {
    it('should encode and decode Blob with hex string', () => {
      const value = 'DEADBEEF'
      const data = Data.from({ type: 'Blob', value })
      const hex = data.toHex()

      // Blob encoding: type ID (0007) + length prefix (04 for 4 bytes) + data
      expect(hex).toBe('000704DEADBEEF')

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Blob', value })
    })

    it('should handle empty Blob', () => {
      const data = Data.from({ type: 'Blob', value: '' })
      const hex = data.toHex()
      expect(hex).toBe('000700') // 00 = length 0

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Blob', value: '' })
    })

    it('should handle longer Blob data', () => {
      const value = 'DEADBEEFCAFE' + '00'.repeat(100) // Long hex string
      const data = Data.from({ type: 'Blob', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Blob', value })
    })
  })

  describe('AccountID', () => {
    it('should encode and decode AccountID', () => {
      const value = 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn'
      const data = Data.from({ type: 'AccountID', value })
      const hex = data.toHex()

      // AccountID encoding: type ID (0008) + (14) + 20 bytes of account ID
      expect(hex.substring(0, 4)).toBe('0008')
      expect(hex.length).toBe(6 + 40) // 2 bytes type + 1 byte length + 20 bytes account

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'AccountID', value })
    })

    it('should handle different account format', () => {
      const value = 'rExKpRKXNz25UAjbckCRtQsJFcSfjL9Er3'
      const data = Data.from({ type: 'AccountID', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'AccountID', value })
    })
  })

  // describe('AMOUNT', () => {
  //   it('should encode and decode XRP AMOUNT', () => {
  //     const value = '1000000'
  //     const data = Data.from({ type: 'AMOUNT', value })
  //     const hex = data.toHex()

  //     // XRP amount encoding: type ID (0006) + positive bit + amount
  //     expect(hex).toBe('000640000000000F4240') // 0F4240 = 1000000 in hex

  //     const parser = new BinaryParser(hex)
  //     const parsed = Data.fromParser(parser)
  //     expect(parsed.toJSON()).toEqual({ type: 'AMOUNT', value })
  //   })

  //   it('should encode and decode issued currency AMOUNT', () => {
  //     const value = {
  //       currency: 'USD',
  //       issuer: 'rExKpRKXNz25UAjbckCRtQsJFcSfjL9Er3',
  //       value: '1.2',
  //     }
  //     const data = Data.from({ type: 'AMOUNT', value })
  //     const hex = data.toHex()

  //     // Issued currency: type ID (0006) + 48 bytes (8 bytes amount + 20 bytes currency + 20 bytes issuer)
  //     expect(hex.substring(0, 4)).toBe('0006')
  //     expect(hex.length).toBe(4 + 96) // 2 bytes type + 48 bytes for issued currency

  //     const parser = new BinaryParser(hex)
  //     const parsed = Data.fromParser(parser)
  //     const parsedValue = parsed.toJSON().value

  //     // The parsed value should match the original structure
  //     expect(parsedValue).toMatchObject({
  //       currency: 'USD',
  //       issuer: value.issuer,
  //       value: '1.2',
  //     })
  //   })

  //   it('should handle negative issued currency amount', () => {
  //     const value = {
  //       currency: 'EUR',
  //       issuer: 'rExKpRKXNz25UAjbckCRtQsJFcSfjL9Er3',
  //       value: '-100.5',
  //     }
  //     const data = Data.from({ type: 'AMOUNT', value })
  //     const parser = new BinaryParser(data.toHex())
  //     const parsed = Data.fromParser(parser)
  //     const parsedValue = parsed.toJSON().value

  //     expect(parsedValue).toMatchObject({
  //       currency: 'EUR',
  //       value: '-100.5',
  //     })
  //   })
  // })

  // describe('CURRENCY', () => {
  //   it('should encode and decode standard CURRENCY', () => {
  //     const value = 'USD'
  //     const data = Data.from({ type: 'CURRENCY', value })
  //     const hex = data.toHex()

  //     // CURRENCY encoding: type ID (000A) + 20 bytes currency code
  //     expect(hex.substring(0, 4)).toBe('000A')
  //     expect(hex.length).toBe(4 + 40) // 2 bytes type + 20 bytes currency

  //     const parser = new BinaryParser(hex)
  //     const parsed = Data.fromParser(parser)
  //     expect(parsed.toJSON()).toEqual({ type: 'CURRENCY', value })
  //   })

  //   it('should handle non-standard currency code', () => {
  //     const value = '0158415500000000C1F76FF6ECB0BAC600000000'
  //     const data = Data.from({ type: 'CURRENCY', value })
  //     const parser = new BinaryParser(data.toHex())
  //     const parsed = Data.fromParser(parser)
  //     expect(parsed.toJSON()).toEqual({
  //       type: 'CURRENCY',
  //       value: value.toUpperCase(),
  //     })
  //   })
  // })

  describe('Number (STNumber)', () => {
    it('should encode and decode positive decimal Number', () => {
      const value = '1.2'
      const data = Data.from({ type: 'Number', value })
      const hex = data.toHex()

      // Number encoding: type ID (0009) + serialized number
      expect(hex.substring(0, 4)).toBe('0009')

      const parser = new BinaryParser(hex)
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Number', value })
    })

    it('should handle integer Number', () => {
      const value = '123456789'
      const data = Data.from({ type: 'Number', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Number', value })
    })

    it('should handle negative Number', () => {
      const value = '-987.654'
      const data = Data.from({ type: 'Number', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Number', value })
    })

    it('should handle zero Number', () => {
      const value = '0'
      const data = Data.from({ type: 'Number', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      expect(parsed.toJSON()).toEqual({ type: 'Number', value })
    })

    it('should handle scientific notation Number', () => {
      const value = '1.23e5'
      const data = Data.from({ type: 'Number', value })
      const parser = new BinaryParser(data.toHex())
      const parsed = Data.fromParser(parser)
      // STNumber normalizes scientific notation to decimal
      expect(parsed.toJSON()).toEqual({ type: 'Number', value: '123000' })
    })
  })

  // describe('ISSUE', () => {
  //   it('should encode and decode ISSUE with currency only', () => {
  //     const value = { currency: 'USD' }
  //     const data = Data.from({ type: 'ISSUE', value })
  //     const hex = data.toHex()

  //     // ISSUE encoding: type ID (000C) + currency (20 bytes) + issuer (20 bytes if present)
  //     expect(hex.substring(0, 4)).toBe('000C')

  //     const parser = new BinaryParser(hex)
  //     const parsed = Data.fromParser(parser)
  //     expect(parsed.toJSON()).toEqual({ type: 'ISSUE', value })
  //   })

  //   it('should encode and decode ISSUE with currency and issuer', () => {
  //     const value = {
  //       currency: 'EUR',
  //       issuer: 'rExKpRKXNz25UAjbckCRtQsJFcSfjL9Er3',
  //     }
  //     const data = Data.from({ type: 'ISSUE', value })
  //     const parser = new BinaryParser(data.toHex())
  //     const parsed = Data.fromParser(parser)
  //     expect(parsed.toJSON()).toEqual({ type: 'ISSUE', value })
  //   })
  // })

  // describe('Complex roundtrip tests', () => {
  //   it('should correctly serialize all parameter types from the contract call', () => {
  //     const parameters = [
  //       { type: 'UINT8', value: 255 },
  //       { type: 'UINT16', value: 65535 },
  //       { type: 'UINT32', value: 4294967295 },
  //       { type: 'UINT64', value: '7fffffffffffffff' },
  //       { type: 'UINT128', value: '00000000000000000000000000000001' },
  //       { type: 'UINT160', value: '0000000000000000000000000000000000000001' },
  //       {
  //         type: 'UINT192',
  //         value: '000000000000000000000000000000000000000000000001',
  //       },
  //       {
  //         type: 'UINT256',
  //         value:
  //           'D955DAC2E77519F05AD151A5D3C99FC8125FB39D58FF9F106F1ACA4491902C25',
  //       },
  //       { type: 'VL', value: 'DEADBEEF' },
  //       { type: 'ACCOUNT', value: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn' },
  //       { type: 'AMOUNT', value: '1000000' },
  //       {
  //         type: 'AMOUNT',
  //         value: {
  //           currency: 'USD',
  //           issuer: 'rExKpRKXNz25UAjbckCRtQsJFcSfjL9Er3',
  //           value: '1.2',
  //         },
  //       },
  //       { type: 'NUMBER', value: '1.2' },
  //     ]

  //     const results: string[] = []

  //     parameters.forEach((param, index) => {
  //       const data = Data.from(param)
  //       const hex = data.toHex()
  //       results.push(`Parameter ${index} (${param.type}): ${hex}`)

  //       // Verify roundtrip
  //       const parser = new BinaryParser(hex)
  //       const parsed = Data.fromParser(parser)
  //       const json = parsed.toJSON()

  //       // Log any mismatches
  //       if (JSON.stringify(json.value) !== JSON.stringify(param.value)) {
  //         console.log(`Mismatch at parameter ${index}:`)
  //         console.log('  Original:', param.value)
  //         console.log('  Parsed:', json.value)
  //       }
  //     })

  //     // Log all results for debugging
  //     console.log('All parameter encodings:')
  //     results.forEach((r) => console.log(r))
  //   })
  // })

  // describe('Error handling', () => {
  //   it('should throw on invalid type string', () => {
  //     expect(() => {
  //       Data.from({ type: 'INVALID_TYPE', value: '123' })
  //     }).toThrow('Data: unsupported type string: INVALID_TYPE')
  //   })

  //   it('should throw on UINT8 out of range', () => {
  //     expect(() => {
  //       Data.from({ type: 'UINT8', value: 256 })
  //     }).toThrow('UINT8 value out of range')
  //   })

  //   it('should throw on UINT16 out of range', () => {
  //     expect(() => {
  //       Data.from({ type: 'UINT16', value: 65536 })
  //     }).toThrow('UINT16 value out of range')
  //   })

  //   it('should throw on invalid input format', () => {
  //     expect(() => {
  //       Data.from('invalid')
  //     }).toThrow('Data.from: value must be Data instance or DataJSON object')
  //   })
  // })

  // describe('Data equality', () => {
  //   it('should correctly compare equal Data instances', () => {
  //     const data1 = Data.from({ type: 'UINT32', value: 12345 })
  //     const data2 = Data.from({ type: 'UINT32', value: 12345 })
  //     expect(data1.equals(data2)).toBe(true)
  //   })

  //   it('should correctly identify unequal Data instances', () => {
  //     const data1 = Data.from({ type: 'UINT32', value: 12345 })
  //     const data2 = Data.from({ type: 'UINT32', value: 54321 })
  //     expect(data1.equals(data2)).toBe(false)
  //   })

  //   it('should identify different types as unequal', () => {
  //     const data1 = Data.from({ type: 'UINT16', value: 100 })
  //     const data2 = Data.from({ type: 'UINT32', value: 100 })
  //     expect(data1.equals(data2)).toBe(false)
  //   })
  // })

  // describe('Data getValue method', () => {
  //   it('should correctly retrieve UINT8 value', () => {
  //     const data = Data.from({ type: 'UINT8', value: 42 })
  //     const value = data.getValue()
  //     expect(value).toBeInstanceOf(UInt8)
  //     expect(value.toJSON()).toBe(42)
  //   })

  //   it('should correctly retrieve VL value', () => {
  //     const data = Data.from({ type: 'VL', value: 'DEADBEEF' })
  //     const value = data.getValue()
  //     expect(value).toBeInstanceOf(Blob)
  //     expect(value.toJSON()).toBe('DEADBEEF')
  //   })

  //   it('should correctly retrieve AMOUNT value', () => {
  //     const data = Data.from({ type: 'AMOUNT', value: '1000000' })
  //     const value = data.getValue()
  //     expect(value).toBeInstanceOf(Amount)
  //     expect(value.toJSON()).toBe('1000000')
  //   })
  // })
})
