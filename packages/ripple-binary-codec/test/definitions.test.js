const { encode, decode } = require('../dist')
const coreTypes = require('../dist/coretypes')
const {
  DefinitionContents,
  DEFINITIONS,
  Field,
  TransactionType,
  LedgerEntryType,
  Type,
  TransactionResult,
} = coreTypes
const normalDefinitions = require('./fixtures/normal-definitions.json')
const badDefinitions = require('./fixtures/bad-definitions.json')

// Notice: no Amount or Fee
const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  // Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  // Fee: '10',

  // JavaScript converts operands to 32-bit signed ints after doing bitwise
  // operations. We need to convert it back to an unsigned int with >>> 0.
  Flags: (1 << 31) >>> 0, // tfFullyCanonicalSig

  Sequence: 1,
  TransactionType: 'Payment',
  // TxnSignature,
  // Signature,
  // SigningPubKey
}

describe('encoding and decoding after modifying type definitions', function () {
  test('can encode and decode novel transaction type', function () {
    //TODO:
  })

  test('can remove a type and then return to normal', function () {
    //TODO:
  })

  test('can encode tx_json with Amount and Fee with edited definitions', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10',
    })
    DEFINITIONS.updateAll(new DefinitionContents(badDefinitions), [])
    DEFINITIONS.updateAll(new DefinitionContents(normalDefinitions), coreTypes)
    // const oldDefsEncoding = encode(my_tx)
    // const newDefs = new DefinitionContents(badDefintions)
    // Definitions.updateAll(newDefs)
    const encoded = encode(my_tx)
    // expect(oldDefsEncoding).toEqual(encoded)

    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  // TODO: Remove
  // test('throws when Amount is a number instead of a string-encoded integer', function () {
  //   const my_tx = Object.assign({}, tx_json, {
  //     Amount: 1000.789,
  //   })
  //   expect(() => {
  //     encode(my_tx)
  //   }).toThrow()
  // })

  // TODO:
  /*
   * Update types with a types file
   * Update types with the update function
   * Check for each of the 5 different sections (Remove -> Test fail -> Re-add -> Test pass)
   */
})
