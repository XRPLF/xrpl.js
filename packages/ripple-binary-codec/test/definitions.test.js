const { encode, decode } = require('../dist')
const { DefinitionContents, DEFINITIONS } = require('../dist/coretypes')
const { coreTypes } = require('../dist/types')
const newTypeDefs = require('./fixtures/new-type.json')
const newLedgerEntryTypeDefs = require('./fixtures/new-ledger-entry-type.json')
const newTransactionResultsDefs = require('./fixtures/new-transaction-result.json')
const newFieldDefs = require('./fixtures/new-field.json')
const newTransactionDefs = require('./fixtures/new-transaction-type.json')
const { UInt32 } = require('../dist/types/uint-32')

const originalDefinitions = { ...DEFINITIONS }

const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 0,
  Sequence: 1,
  TransactionType: 'Payment',
}

describe('encoding and decoding after modifying type definitions', function () {
  test('can encode and decode novel transaction type', function () {
    //TODO:
  })

  test('can remove a type and then return to normal', function () {
    //TODO:
  })

  test('can encode and decode a new TransactionType', function () {
    DEFINITIONS.updateAll(originalDefinitions, coreTypes)

    const my_tx = Object.assign({}, tx_json, {
      TransactionType: 'NewTestTransaction',
    })
    // Before updating the types, this should not be encodable
    expect(() => encode(my_tx)).toThrow()

    const newDefs = new DefinitionContents(newTransactionDefs)
    DEFINITIONS.updateAll(newDefs, coreTypes)

    const encodedAfter = encode(my_tx)
    const decoded = decode(encodedAfter)
    expect(decoded).toStrictEqual(my_tx)
  })

  test('can encode and decode a new Field', function () {
    DEFINITIONS.updateAll(originalDefinitions, coreTypes)

    const my_tx = Object.assign({}, tx_json, {
      NewFieldDefinition: 10,
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(my_tx))).not.toStrictEqual(my_tx)

    const newDefs = new DefinitionContents(newFieldDefs)
    DEFINITIONS.updateAll(newDefs, coreTypes)

    const encodedAfter = encode(my_tx)
    const decoded = decode(encodedAfter)
    expect(decoded).toStrictEqual(my_tx)
  })

  test('can encode and decode a new Type', function () {
    DEFINITIONS.updateAll(originalDefinitions, coreTypes)

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

    const newDefs = new DefinitionContents(newTypeDefs)
    DEFINITIONS.updateAll(newDefs, extendedCoreTypes)

    const encodedAfter = encode(my_tx)
    const decoded = decode(encodedAfter)
    expect(decoded).toStrictEqual(my_tx)
  })

  test('can add a new TransactionResult', function () {
    DEFINITIONS.updateAll(originalDefinitions, coreTypes)

    const newResult = 'tecNewTransactionResult'

    // Before defining the Transaction Result, there is no entry for it
    expect(DEFINITIONS.transactionResult.from(newResult)).toBe(undefined)

    const newDefs = new DefinitionContents(newTransactionResultsDefs)
    DEFINITIONS.updateAll(newDefs, coreTypes)

    expect(DEFINITIONS.transactionResult.from(newResult).name).toBe(newResult)
  })

  test('can add a new LedgerEntryType', function () {
    DEFINITIONS.updateAll(originalDefinitions, coreTypes)

    const newResult = 'NewLedgerEntryType'

    // Before defining the Transaction Result, there is no entry for it
    expect(DEFINITIONS.ledgerEntryType.from(newResult)).toBe(undefined)

    const newDefs = new DefinitionContents(newLedgerEntryTypeDefs)
    DEFINITIONS.updateAll(newDefs, coreTypes)

    expect(DEFINITIONS.ledgerEntryType.from(newResult).name).toBe(newResult)
  })
})
