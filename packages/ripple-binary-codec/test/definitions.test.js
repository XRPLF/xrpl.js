const { encode, decode } = require('../dist')
const {
  DefinitionContents,
  DEFINITIONS,
  Field,
  TransactionType,
  LedgerEntryType,
  Type,
  TransactionResult,
} = require('../dist/coretypes')
const { coreTypes } = require('../dist/types')
const normalDefinitions = require('./fixtures/normal-definitions.json')
const newTransactionDefinitions = require('./fixtures/new-transaction-type.json')
const { UInt8 } = require('../dist/types/uint-8')
const { expect } = require('chai')

// /**
//  * Derived UInt class for serializing/deserializing 8 bit UInt
//  */
// class UInt8Alternate extends UInt8 {
//   static width = 8 / 8 // 1
//   static defaultUInt8 = new UInt8Alternate(Buffer.alloc(UInt8Alternate.width))

//   constructor(bytes) {
//     super(bytes ?? UInt8Alternate.defaultUInt8.bytes)
//   }

//   static fromParser(parser) {
//     return new UInt8Alternate(parser.read(UInt8Alternate.width))
//   }

//   /**
//    * Construct a UInt8 object from a number
//    *
//    * @param val UInt8 object or number
//    */
//   static from(val) {
//     if (val instanceof UInt8Alternate) {
//       return val // MODIFIED from UInt8 implementation to show encode/decode works
//     }

//     if (typeof val === 'number') {
//       const buf = Buffer.alloc(UInt8Alternate.width)
//       buf.writeUInt8(val, 0)
//       return new UInt8Alternate(buf)
//     }

//     throw new Error('Cannot construct UInt8Alternate from given value')
//   }

//   /**
//    * get the value of a UInt8 object
//    *
//    * @returns the number represented by this.bytes
//    */
//   valueOf() {
//     return this.bytes.readUInt8(0)
//   }
// }

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
    const my_tx = Object.assign({}, tx_json, {
      TransactionType: 'NewTestTransaction',
    })
    // Before updating the types, this should not be encodable
    expect(() => encode(my_tx)).throws()

    const newDefs = new DefinitionContents(newTransactionDefinitions)
    DEFINITIONS.updateAll(newDefs, coreTypes)

    const encodedAfter = encode(my_tx)
    const decoded = decode(encodedAfter)
    expect(decoded).deep.equal(my_tx)
  })
})
