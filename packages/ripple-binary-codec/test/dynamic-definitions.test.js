const stockDefinitions = require('../dist/enums/definitions.json')
const alternativeDefinitions = Object.assign({}, stockDefinitions)
alternativeDefinitions.TRANSACTION_TYPES.FakePayment = 200

const { encode, decode, setDefinitions } = require('../dist')
setDefinitions(alternativeDefinitions)

describe('encoding and decoding with custom definitions', function () {
  test('encode non-existing stock tx type with custom definitions', function () {
    const tx_json = { TransactionType: 'FakePayment' }
    const encoded = encode(tx_json)
    const decoded = decode(encoded)
    expect(tx_json).toEqual(decoded)
  })
})
