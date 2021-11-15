const { coreTypes } = require('../dist/types')
const Decimal = require('decimal.js')

const { encodeAccountID } = require('ripple-address-codec')
const { binary } = require('../dist/coretypes')
const { Amount, Hash160 } = coreTypes
const { makeParser, readJSON } = binary
const { Field, TransactionType } = require('./../dist/enums')
const { parseHexOnly, hexOnly, loadFixture } = require('./utils')
const fixtures = loadFixture('data-driven-tests.json')
const { BytesList } = require('../dist/serdes/binary-serializer')
const { Buffer } = require('buffer/')

const __ = hexOnly
function toJSON(v) {
  return v.toJSON ? v.toJSON() : v
}

function assertEqualAmountJSON(actual, expected) {
  expect(typeof actual === typeof expected).toBe(true)
  if (typeof actual === 'string') {
    expect(actual).toEqual(expected)
    return
  }
  expect(actual.currency).toEqual(expected.currency)
  expect(actual.issuer).toEqual(expected.issuer)
  expect(
    actual.value === expected.value ||
      new Decimal(actual.value).equals(new Decimal(expected.value)),
  ).toBe(true)
}

function basicApiTests() {
  const bytes = parseHexOnly('00,01020304,0506', Uint8Array)
  test('can read slices of bytes', () => {
    const parser = makeParser(bytes)
    expect(parser.bytes instanceof Buffer).toBe(true)
    const read1 = parser.read(1)
    expect(read1 instanceof Buffer).toBe(true)
    expect(read1).toEqual(Buffer.from([0]))
    expect(parser.read(4)).toEqual(Buffer.from([1, 2, 3, 4]))
    expect(parser.read(2)).toEqual(Buffer.from([5, 6]))
    expect(() => parser.read(1)).toThrow()
  })
  test('can read a Uint32 at full', () => {
    const parser = makeParser('FFFFFFFF')
    expect(parser.readUInt32()).toEqual(0xffffffff)
  })
}

function transactionParsingTests() {
  const transaction = {
    json: {
      Account: 'raD5qJMAShLeHZXf9wjUmo6vRK4arj9cF3',
      Fee: '10',
      Flags: 0,
      Sequence: 103929,
      SigningPubKey:
        '028472865AF4CB32AA285834B57576B7290AA8C31B459047DB27E16F418D6A7166',
      TakerGets: {
        currency: 'ILS',
        issuer: 'rNPRNzBB92BVpAhhZr4iXDTveCgV5Pofm9',
        value: '1694.768',
      },
      TakerPays: '98957503520',
      TransactionType: 'OfferCreate',
      TxnSignature: __(`
          304502202ABE08D5E78D1E74A4C18F2714F64E87B8BD57444AF
          A5733109EB3C077077520022100DB335EE97386E4C0591CAC02
          4D50E9230D8F171EEB901B5E5E4BD6D1E0AEF98C`),
    },
    binary: __(`
      120007220000000024000195F964400000170A53AC2065D5460561E
      C9DE000000000000000000000000000494C53000000000092D70596
      8936C419CE614BF264B5EEB1CEA47FF468400000000000000A73210
      28472865AF4CB32AA285834B57576B7290AA8C31B459047DB27E16F
      418D6A71667447304502202ABE08D5E78D1E74A4C18F2714F64E87B
      8BD57444AFA5733109EB3C077077520022100DB335EE97386E4C059
      1CAC024D50E9230D8F171EEB901B5E5E4BD6D1E0AEF98C811439408
      A69F0895E62149CFCC006FB89FA7D1E6E5D`),
  }

  const tx_json = transaction.json
  // These tests are basically development logs

  test('can be done with low level apis', () => {
    const parser = makeParser(transaction.binary)

    expect(parser.readField()).toEqual(Field.TransactionType)
    expect(parser.readUInt16()).toEqual(7)
    expect(parser.readField()).toEqual(Field.Flags)
    expect(parser.readUInt32()).toEqual(0)
    expect(parser.readField()).toEqual(Field.Sequence)
    expect(parser.readUInt32()).toEqual(103929)
    expect(parser.readField()).toEqual(Field.TakerPays)
    parser.read(8)
    expect(parser.readField()).toEqual(Field.TakerGets)
    // amount value
    expect(parser.read(8)).not.toBe([])
    // amount currency
    expect(Hash160.fromParser(parser)).not.toBe([])
    expect(encodeAccountID(parser.read(20))).toEqual(tx_json.TakerGets.issuer)
    expect(parser.readField()).toEqual(Field.Fee)
    expect(parser.read(8)).not.toEqual([])
    expect(parser.readField()).toEqual(Field.SigningPubKey)
    expect(parser.readVariableLengthLength()).toBe(33)
    expect(parser.read(33).toString('hex').toUpperCase()).toEqual(
      tx_json.SigningPubKey,
    )
    expect(parser.readField()).toEqual(Field.TxnSignature)
    expect(parser.readVariableLength().toString('hex').toUpperCase()).toEqual(
      tx_json.TxnSignature,
    )
    expect(parser.readField()).toEqual(Field.Account)
    expect(encodeAccountID(parser.readVariableLength())).toEqual(
      tx_json.Account,
    )
    expect(parser.end()).toBe(true)
  })

  test('can be done with high level apis', () => {
    const parser = makeParser(transaction.binary)
    function readField() {
      return parser.readFieldAndValue()
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.TransactionType)
      expect(value).toEqual(TransactionType.OfferCreate)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.Flags)
      expect(value.valueOf()).toEqual(0)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.Sequence)
      expect(value.valueOf()).toEqual(103929)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.TakerPays)
      expect(value.isNative()).toEqual(true)
      expect(value.toJSON()).toEqual('98957503520')
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.TakerGets)
      expect(value.isNative()).toEqual(false)
      expect(value.toJSON().issuer).toEqual(tx_json.TakerGets.issuer)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.Fee)
      expect(value.isNative()).toEqual(true)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.SigningPubKey)
      expect(value.toJSON()).toEqual(tx_json.SigningPubKey)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.TxnSignature)
      expect(value.toJSON()).toEqual(tx_json.TxnSignature)
    }
    {
      const [field, value] = readField()
      expect(field).toEqual(Field.Account)
      expect(value.toJSON()).toEqual(tx_json.Account)
    }
    expect(parser.end()).toBe(true)
  })

  test('can be done with higher level apis', () => {
    const parser = makeParser(transaction.binary)
    const jsonFromBinary = readJSON(parser)
    expect(jsonFromBinary).toEqual(tx_json)
  })

  test('readJSON (binary.decode) does not return STObject ', () => {
    const parser = makeParser(transaction.binary)
    const jsonFromBinary = readJSON(parser)
    expect(jsonFromBinary instanceof coreTypes.STObject).toBe(false)
    expect(jsonFromBinary instanceof Object).toBe(true)
    expect(jsonFromBinary.prototype).toBe(undefined)
  })
}

function amountParsingTests() {
  fixtures.values_tests
    .filter((obj) => obj.type === 'Amount')
    .forEach((f, i) => {
      if (f.error) {
        return
      }
      const parser = makeParser(f.expected_hex)
      const testName = `values_tests[${i}] parses ${f.expected_hex.slice(
        0,
        16,
      )}...
          as ${JSON.stringify(f.test_json)}`
      test(testName, () => {
        const value = parser.readType(Amount)
        // May not actually be in canonical form. The fixtures are to be used
        // also for json -> binary;
        const json = toJSON(value)
        assertEqualAmountJSON(json, f.test_json)
        if (f.exponent) {
          const exponent = new Decimal(json.value)
          expect(exponent.e - 15).toEqual(f.exponent)
        }
      })
    })
}

function fieldParsingTests() {
  fixtures.fields_tests.forEach((f, i) => {
    const parser = makeParser(f.expected_hex)
    test(`fields[${i}]: parses ${f.expected_hex} as ${f.name}`, () => {
      const field = parser.readField()
      expect(field.name).toEqual(f.name)
      expect(field.type.name).toEqual(f.type_name)
    })
  })
  test('Field throws when type code out of range', () => {
    const parser = makeParser('0101')
    expect(() => parser.readField()).toThrow(
      new Error('Cannot read FieldOrdinal, type_code out of range'),
    )
  })
  test('Field throws when field code out of range', () => {
    const parser = makeParser('1001')
    expect(() => parser.readFieldOrdinal()).toThrowError(
      new Error('Cannot read FieldOrdinal, field_code out of range'),
    )
  })
  test('Field throws when both type and field code out of range', () => {
    const parser = makeParser('000101')
    expect(() => parser.readFieldOrdinal()).toThrowError(
      new Error('Cannot read FieldOrdinal, type_code out of range'),
    )
  })
}

function assertRecyclable(json, forField) {
  const Type = forField.associatedType
  const recycled = Type.from(json).toJSON()
  expect(recycled).toEqual(json)
  const sink = new BytesList()
  Type.from(recycled).toBytesSink(sink)
  const recycledAgain = makeParser(sink.toHex()).readType(Type).toJSON()
  expect(recycledAgain).toEqual(json)
}

function nestedObjectTests() {
  fixtures.whole_objects.forEach((f, i) => {
    test(`whole_objects[${i}]: can parse blob into
          ${JSON.stringify(
            f.tx_json,
          )}`, /*                                              */ () => {
      const parser = makeParser(f.blob_with_no_signing)
      let ix = 0
      while (!parser.end()) {
        const [field, value] = parser.readFieldAndValue()
        const expected = f.fields[ix]
        const expectedJSON = expected[1].json
        const expectedField = expected[0]
        const actual = toJSON(value)

        try {
          expect(actual).toEqual(expectedJSON)
        } catch (e) {
          throw new Error(`${e} ${field} a: ${actual} e: ${expectedJSON}`)
        }
        expect(field.name).toEqual(expectedField)
        assertRecyclable(actual, field)
        ix++
      }
    })
  })
}

function pathSetBinaryTests() {
  const bytes = __(
    `1200002200000000240000002E2E00004BF161D4C71AFD498D00000000000000
     0000000000000055534400000000000A20B3C85F482532A9578DBB3950B85CA0
     6594D168400000000000000A69D446F8038585E9400000000000000000000000
     00425443000000000078CA21A6014541AB7B26C3929B9E0CD8C284D61C732103
     A4665B1F0B7AE2BCA12E2DB80A192125BBEA660F80E9CEE137BA444C1B0769EC
     7447304502205A964536805E35785C659D1F9670D057749AE39668175D6AA75D
     25B218FE682E0221009252C0E5DDD5F2712A48F211669DE17B54113918E0D2C2
     66F818095E9339D7D3811478CA21A6014541AB7B26C3929B9E0CD8C284D61C83
     140A20B3C85F482532A9578DBB3950B85CA06594D1011231585E1F3BD02A15D6
     185F8BB9B57CC60DEDDB37C10000000000000000000000004254430000000000
     585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C131E4FE687C90257D3D2D694C
     8531CDEECBE84F33670000000000000000000000004254430000000000E4FE68
     7C90257D3D2D694C8531CDEECBE84F3367310A20B3C85F482532A9578DBB3950
     B85CA06594D100000000000000000000000042544300000000000A20B3C85F48
     2532A9578DBB3950B85CA06594D1300000000000000000000000005553440000
     0000000A20B3C85F482532A9578DBB3950B85CA06594D1FF31585E1F3BD02A15
     D6185F8BB9B57CC60DEDDB37C100000000000000000000000042544300000000
     00585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C131E4FE687C90257D3D2D69
     4C8531CDEECBE84F33670000000000000000000000004254430000000000E4FE
     687C90257D3D2D694C8531CDEECBE84F33673115036E2D3F5437A83E5AC3CAEE
     34FF2C21DEB618000000000000000000000000425443000000000015036E2D3F
     5437A83E5AC3CAEE34FF2C21DEB6183000000000000000000000000055534400
     000000000A20B3C85F482532A9578DBB3950B85CA06594D1FF31585E1F3BD02A
     15D6185F8BB9B57CC60DEDDB37C1000000000000000000000000425443000000
     0000585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C13157180C769B66D942EE
     69E6DCC940CA48D82337AD000000000000000000000000425443000000000057
     180C769B66D942EE69E6DCC940CA48D82337AD10000000000000000000000000
     00000000000000003000000000000000000000000055534400000000000A20B3
     C85F482532A9578DBB3950B85CA06594D100`,
  )

  const expectedJSON = [
    [
      {
        account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
        currency: 'BTC',
        issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
      },
      {
        account: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
        currency: 'BTC',
        issuer: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        currency: 'BTC',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      },
      {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      },
    ],
    [
      {
        account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
        currency: 'BTC',
        issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
      },
      {
        account: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
        currency: 'BTC',
        issuer: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
      },
      {
        account: 'rpvfJ4mR6QQAeogpXEKnuyGBx8mYCSnYZi',
        currency: 'BTC',
        issuer: 'rpvfJ4mR6QQAeogpXEKnuyGBx8mYCSnYZi',
      },
      {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      },
    ],
    [
      {
        account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
        currency: 'BTC',
        issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
      },
      {
        account: 'r3AWbdp2jQLXLywJypdoNwVSvr81xs3uhn',
        currency: 'BTC',
        issuer: 'r3AWbdp2jQLXLywJypdoNwVSvr81xs3uhn',
      },
      { currency: 'XRP' },
      {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      },
    ],
  ]

  test('works with long paths', () => {
    const parser = makeParser(bytes)
    const txn = readJSON(parser)
    expect(txn.Paths).toEqual(expectedJSON)
    // TODO: this should go elsewhere
    expect(coreTypes.PathSet.from(txn.Paths).toJSON()).toEqual(expectedJSON)
  })
}

describe('Binary Parser', function () {
  describe('pathSetBinaryTests', () => pathSetBinaryTests())
  describe('nestedObjectTests', () => nestedObjectTests())
  describe('fieldParsingTests', () => fieldParsingTests())
  describe('amountParsingTests', () => amountParsingTests())
  describe('transactionParsingTests', () => transactionParsingTests())
  describe('basicApiTests', () => basicApiTests())
})
