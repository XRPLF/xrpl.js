import { decode, encode, XrplDefinitions } from '../src'
import normalDefinitionsJson from '../src/enums/definitions.json'
import { BinaryParser } from '../src/binary'
import { coreTypes } from '../src/types'
import { type JSON } from '../src/types/serialized-type'

const { Data, DataType, Json } = coreTypes

const ACCOUNT = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ACCOUNT_HEX = 'B5F762798A53D543A014CAF8B297CFF8F2F937E8'
const USD_HEX = '0000000000000000000000005553440000000000'

/**
 * Definitions with the smart-contract STypes and one field of each, as the
 * xrpld smart-contracts branch defines them (STI_DATA 27, STI_DATATYPE 28,
 * STI_JSON 29; sfParameterValue, sfParameterType, sfContractJson nth 1).
 */
function contractDefinitions(): XrplDefinitions {
  const definitions = JSON.parse(JSON.stringify(normalDefinitionsJson))
  definitions.TYPES.Data = 27
  definitions.TYPES.DataType = 28
  definitions.TYPES.Json = 29
  const field = (type: string): Record<string, unknown> => ({
    nth: 1,
    isVLEncoded: false,
    isSerialized: true,
    isSigningField: true,
    type,
  })
  definitions.FIELDS.push(['ParameterValue', field('Data')])
  definitions.FIELDS.push(['ParameterType', field('DataType')])
  definitions.FIELDS.push(['ContractJson', field('Json')])
  return new XrplDefinitions(definitions)
}

describe('Data', function () {
  const cases: Array<[string, JSON, string]> = [
    ['UINT8', 8, '001008'],
    ['UINT16', 16, '00010010'],
    ['UINT32', 32, '000200000020'],
    ['UINT64', '000000000000001E', '0003000000000000001E'],
    ['UINT128', 'AB'.repeat(16), `0004${'AB'.repeat(16)}`],
    ['UINT160', 'AB'.repeat(20), `0011${'AB'.repeat(20)}`],
    ['UINT192', 'AB'.repeat(24), `0015${'AB'.repeat(24)}`],
    ['UINT256', 'AB'.repeat(32), `0005${'AB'.repeat(32)}`],
    ['VL', 'DEADBEEFCAFEBABE', '000708DEADBEEFCAFEBABE'],
    ['ACCOUNT', ACCOUNT, `000814${ACCOUNT_HEX}`],
    ['AMOUNT', '1000000', '000640000000000F4240'],
    ['ISSUE', { currency: 'XRP' }, `0018${'00'.repeat(20)}`],
    [
      'ISSUE',
      { currency: 'USD', issuer: ACCOUNT },
      `0018${USD_HEX}${ACCOUNT_HEX}`,
    ],
    ['CURRENCY', 'USD', `001A${USD_HEX}`],
    ['NUMBER', '99', '00090DBD2FC137A30000FFFFFFF0'],
  ]

  cases.forEach(([type, value, hex]) => {
    it(`encodes and decodes ${type}`, function () {
      const data = Data.from({ type, value })
      expect(data.toHex()).toEqual(hex)
      const parsed = Data.fromParser(new BinaryParser(hex))
      expect(parsed.toJSON()).toEqual({ type, value })
    })
  })

  it('reads an ACCOUNT given as 40 hex characters', function () {
    expect(Data.from({ type: 'ACCOUNT', value: ACCOUNT_HEX }).toJSON()).toEqual(
      { type: 'ACCOUNT', value: ACCOUNT },
    )
  })

  it('stops at the end of its own bytes', function () {
    const parser = new BinaryParser('000200000020FF')
    Data.fromParser(parser)
    expect(parser.size()).toEqual(1)
  })

  it('throws on an unsupported type string', function () {
    expect(() => Data.from({ type: 'OBJECT', value: {} })).toThrow(
      'Data: unsupported type OBJECT',
    )
  })

  it('throws on a missing value', function () {
    expect(() => Data.from({ type: 'UINT32' })).toThrow(
      'Data: expected an object with type and value',
    )
  })

  it('throws on an unknown inner type code', function () {
    expect(() => Data.fromParser(new BinaryParser('000E00'))).toThrow(
      'Data: unknown type code 14',
    )
  })

  it('round-trips as a transaction field', function () {
    const definitions = contractDefinitions()
    const tx = {
      Account: ACCOUNT,
      TransactionType: 'Payment',
      ParameterValue: { type: 'UINT32', value: 32 },
    }
    const encoded = encode(tx, definitions)
    expect(encoded).toContain('011B000200000020')
    expect(decode(encoded, definitions)).toEqual(tx)
  })
})

describe('DataType', function () {
  const cases: Array<[string, string]> = [
    ['UINT16', '0001'],
    ['UINT32', '0002'],
    ['UINT64', '0003'],
    ['UINT128', '0004'],
    ['UINT256', '0005'],
    ['AMOUNT', '0006'],
    ['VL', '0007'],
    ['ACCOUNT', '0008'],
    ['NUMBER', '0009'],
    ['UINT8', '0010'],
    ['UINT160', '0011'],
    ['UINT192', '0015'],
    ['ISSUE', '0018'],
    ['CURRENCY', '001A'],
  ]

  cases.forEach(([type, hex]) => {
    it(`encodes and decodes ${type}`, function () {
      expect(DataType.from({ type }).toHex()).toEqual(hex)
      expect(DataType.fromParser(new BinaryParser(hex)).toJSON()).toEqual({
        type,
      })
    })
  })

  it('decodes an unknown type code as its number', function () {
    expect(DataType.fromParser(new BinaryParser('03E7')).toJSON()).toEqual({
      type: '999',
    })
  })

  it('throws on an unsupported type string', function () {
    expect(() => DataType.from({ type: 'PATHSET' })).toThrow(
      'DataType: unsupported type PATHSET',
    )
  })

  it('round-trips as a transaction field', function () {
    const definitions = contractDefinitions()
    const tx = {
      Account: ACCOUNT,
      TransactionType: 'Payment',
      ParameterType: { type: 'AMOUNT' },
    }
    const encoded = encode(tx, definitions)
    expect(encoded).toContain('011C0006')
    expect(decode(encoded, definitions)).toEqual(tx)
  })
})

describe('Json', function () {
  // STJson_test.cpp testAddAndFromBlob: {"a": UInt8 7, "b": UInt32 123456}
  const objectHex = '0E0001610210070162050200 01E240'.replace(/ /gu, '')
  // STJson_test.cpp testArraySerialization: [UInt8 10, UInt32 20, UInt64 30]
  const arrayHex = '14010210 0A050200000014 0903000000000000001E'.replace(
    / /gu,
    '',
  )

  it('decodes an object with hex keys', function () {
    const json = Json.fromParser(new BinaryParser(objectHex))
    expect(json.toJSON()).toEqual({ '61': 7, '62': 123456 })
    expect(json.toHex()).toEqual(objectHex)
  })

  it('decodes an array', function () {
    expect(Json.fromParser(new BinaryParser(arrayHex)).toJSON()).toEqual([
      10,
      20,
      '000000000000001E',
    ])
  })

  it('decodes an empty object', function () {
    expect(Json.fromParser(new BinaryParser('00')).toJSON()).toEqual({})
  })

  it('decodes a null value', function () {
    // {"k": null}
    expect(Json.fromParser(new BinaryParser('0400016B00')).toJSON()).toEqual({
      '6B': null,
    })
  })

  it('decodes VL, ACCOUNT, AMOUNT and CURRENCY values', function () {
    const entries = [
      ['01', '76', '050703ABCDEF'],
      ['01', '61', `1608 14${ACCOUNT_HEX}`],
      ['01', '6D', '0906 40000000000F4240'],
      ['01', '63', `151A ${USD_HEX}`],
    ]
    const body = entries.map((entry) => entry.join('')).join('')
    const inner = `00${body}`.replace(/ /gu, '')
    const hex = `${(inner.length / 2).toString(16).padStart(2, '0')}${inner}`
    expect(Json.fromParser(new BinaryParser(hex)).toJSON()).toEqual({
      '76': 'ABCDEF',
      '61': ACCOUNT,
      '6D': '1000000',
      '63': 'USD',
    })
  })

  it('decodes a value of a type it does not parse as hex of its bytes', function () {
    // STI_NUMBER falls to the node's default branch (STJson.cpp:290-306)
    const inner = '00016E0D090DBD2FC137A30000FFFFFFF0'
    const hex = `${(inner.length / 2).toString(16).toUpperCase()}${inner}`
    expect(Json.fromParser(new BinaryParser(hex)).toJSON()).toEqual({
      '6E': '0DBD2FC137A30000FFFFFFF0',
    })
  })

  it('decodes a nested object', function () {
    // {"o": {"a": UInt8 7}}
    const nested = '0600016102 1007'.replace(/ /gu, '')
    const inner = `00016F08 1D${nested}`.replace(/ /gu, '')
    const hex = `${(inner.length / 2).toString(16).padStart(2, '0')}${inner}`
    expect(Json.fromParser(new BinaryParser(hex)).toJSON()).toEqual({
      '6F': { '61': 7 },
    })
  })

  it('throws when the declared length does not match its entries', function () {
    expect(() => Json.fromParser(new BinaryParser('03000161'))).toThrow()
  })

  it('encodes an empty object or array as STJson::add does', function () {
    expect(Json.from({}).toHex()).toEqual('0100')
    expect(Json.from([]).toHex()).toEqual('0101')
    expect(Json.from([]).toJSON()).toEqual([])
  })

  it('refuses to encode from JSON, as the node does', function () {
    expect(() => Json.from({ '61': 7 })).toThrow(
      'Json: encoding from JSON is not supported',
    )
  })

  it('decodes as a ledger entry field', function () {
    const definitions = contractDefinitions()
    const hex = `110061011D${objectHex}`
    expect(decode(hex, definitions)).toEqual({
      LedgerEntryType: 'AccountRoot',
      ContractJson: { '61': 7, '62': 123456 },
    })
  })
})
