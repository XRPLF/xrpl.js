const { encode, decode } = require('../dist')
const { XrplDefinitions } = require('../dist/enums/xrpl-definitions')
const { coreTypes } = require('../dist/types')
const newTypeDefs = require('./fixtures/new-type.json')
const newFieldDefs = require('./fixtures/new-field.json')
const { UInt32 } = require('../dist/types/uint-32')
const newTransactionDefs = require('./fixtures/new-transaction-type.json')

const txJson = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 0,
  Sequence: 1,
  TransactionType: 'Payment',
}

describe('encode and decode using new types as a parameter', function () {
  test('can encode and decode a new TransactionType', function () {
    const tx = Object.assign({}, txJson, {
      TransactionType: 'NewTestTransaction',
    })
    // Before updating the types, this should not be encodable
    expect(() => encode(tx)).toThrow()

    const newDefs = new XrplDefinitions(newTransactionDefs)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })

  test('can encode and decode a new Field', function () {
    const tx = Object.assign({}, txJson, {
      NewFieldDefinition: 10,
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    const newDefs = new XrplDefinitions(newFieldDefs)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })

  test('can encode and decode a new Type', function () {
    const tx = Object.assign({}, txJson, {
      TestField: 10, // Should work the same as a UInt32
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    class NewType extends UInt32 {
      // Should be the same as UInt32
    }

    const extendedCoreTypes = { ...coreTypes }
    extendedCoreTypes['NewType'] = NewType

    const newDefs = new XrplDefinitions(newTypeDefs, extendedCoreTypes)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })
})
