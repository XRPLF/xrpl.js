const { encode, decode } = require('../dist')
const { DefinitionContents, DEFINITIONS } = require('../dist/coretypes')
const { coreTypes } = require('../dist/types')
// const { coreTypes } = require('../dist/types')
const newTypeDefs = require('./fixtures/new-type.json')
// const newLedgerEntryTypeDefs = require('./fixtures/new-ledger-entry-type.json') //TODO: Either add a test that involves these or remove them before merging.
// const newTransactionResultsDefs = require('./fixtures/new-transaction-result.json')
const newFieldDefs = require('./fixtures/new-field.json')
const { UInt32 } = require('../dist/types/uint-32')
const newTransactionDefs = require('./fixtures/new-transaction-type.json')

const tx_json = {
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
    const my_tx = Object.assign({}, tx_json, {
      TransactionType: 'NewTestTransaction',
    })
    // Before updating the types, this should not be encodable
    expect(() => encode(my_tx)).toThrow()

    const newDefs = new DefinitionContents(newTransactionDefs, coreTypes)

    const encoded = encode(my_tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(my_tx)
  })

  test('can encode and decode a new Field', function () {
    const my_tx = Object.assign({}, tx_json, {
      NewFieldDefinition: 10,
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(my_tx))).not.toStrictEqual(my_tx)

    const newDefs = new DefinitionContents(newFieldDefs, coreTypes)

    const encoded = encode(my_tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(my_tx)
  })

  test('can encode and decode a new Type', function () {
    const my_tx = Object.assign({}, tx_json, {
      TestField: 10, // Should work the same as a UInt32
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(my_tx))).not.toStrictEqual(my_tx)

    class NewType extends UInt32 {
      // Should be the same as UInt32
    }

    const extendedCoreTypes = { ...coreTypes }
    extendedCoreTypes['NewType'] = NewType

    const newDefs = new DefinitionContents(newTypeDefs, extendedCoreTypes)

    const encoded = encode(my_tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(my_tx)
  })
})
