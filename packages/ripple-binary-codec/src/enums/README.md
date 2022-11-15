# Definitions

## Overview of Terms

### Types

These are the [types](https://xrpl.org/serialization.html#type-list) associated with a given Serialization Field. Each type has an arbitrary [type_code](https://xrpl.org/serialization.html#type-codes), with lower codes sorting first.

### Ledger Entry Types

Each ledger's state tree contain [ledger objects](https://xrpl.org/ledger-object-types.html), which represent all settings, balances, and relationships in the shared ledger.

### Fields

These are Serialization Fields (`sf`) [defined in rippled's SField.cpp](https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/impl/SField.cpp). Fields with undefined values are omitted before encoding.

#### Key

The key is the string defined in the rippled source code, such as "LedgerEntry", "Transaction", etc.

#### nth

`nth` is the sort code, meaning "nth of type." It is is combined with the type code in order to construct the Field ID of this field. The Field ID is only used for sorting the fields. Since there are multiple fields with the same data type, the `nth` is used to deterministically order each field among other fields of the same data type.

Each field has a Field ID, which is used to sort fields that have the same type as one another with lower codes sorting first.

- [Field definitions](https://github.com/ripple/rippled/blob/72e6005f562a8f0818bc94803d222ac9345e1e40/src/ripple/protocol/impl/SField.cpp#L72-L266)
- [Constructing the `SField` field codes](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/SField.h#L95-L98)

For example, the `Account` field has sort code (nth) `1`, so it comes before the `Destination` field which has sort code `3`.

Sort code numbers are reused for fields of different types, but different fields of the same type never have the same sort code. When you combine the type code with the sort code, you get the field's unique _Field ID_.

The unique [Field ID](https://xrpl.org/serialization.html#field-ids) is prefixed before the field in the final serialized blob. The size of the Field ID is one to three bytes depending on the type code and the field codes it combines.

#### isVLEncoded

If true, the field is Variable Length encoded and [length-prefixed](https://xrpl.org/serialization.html#length-prefixing). The variable-length encoded fields are `STI_VL`/`Blob`, `STI_ACCOUNT`/`AccountID`, and `STI_VECTOR256`/`Vector256`.

#### isSerialized

Fields are serialized if they are not [one of these](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/impl/SField.cpp#L71-L78) or if they are not an SField.

- https://github.com/ripple/ripple-binary-codec/blob/14e76e68ead7e4bcd83c942dbdc9064d5a66869b/src/enums/definitions.json#L832
- https://github.com/ripple/rippled/search?utf8=%E2%9C%93&q=taker_gets_funded&type=

#### isSigningField

True unless the field is [specified with `SField::notSigning`](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/impl/SField.cpp#L198).

### Transaction Results

See:

- https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/TER.h
- https://xrpl.org/transaction-results.html

To generate a new definitions file from rippled source code, use this tool: https://github.com/RichardAH/xrpl-codec-gen

### Transaction Types

See https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/TxFormats.h

# Defining Your Own Definitions

If you're building your own side chain or amendment for the XRPL, you may need to create new definitions.

To do that there are three high level things you need to do:

1. Generate your own `definitions.json` file from rippled source code using [this tool](https://github.com/RichardAH/xrpl-codec-gen) (The default `definitions.json` for mainnet can be found [here](https://github.com/XRPLF/xrpl.js/blob/main/packages/ripple-binary-codec/src/enums/definitions.json))
2. Create new SerializedType classes for any new Types (So that encode/decode behavior is defined)

- For examples of how to implement that you can look at objects in the `types` folder, such as `Amount`, `UInt8`, or `STArray`.

3. Import your `definitions.json` file and `coreTypes` from the `types` folder, then use them to construct your own `DefinitionContents` object.
4. Pass the `DefinitionContents` object whenever you `encode` or `decode` a transaction.

To see this in action, look at the below snippet (Or the test file which contains examples of adding each type of definition)

```
// DEFAULT_DEFINITIONS is the global tracker of type definitions, so we have to update it to add new types
const { DefinitionContents, DEFAULT_DEFINITIONS } = require('../dist/coretypes')

// coreTypes is the default list of serialized Types that are defined in xrpl.js
const { coreTypes } = require('../dist/types')

// newTypeDefs is where you can import your custom defined definitions.json file
const newTypeDefs = require('./fixtures/new-type.json')


// For any new Types you create, you'll need to make a class with the same name which extends a SerializedType object
// In order to define how to serialize/deserialize that field. Here we simply make our NewType act like a UInt32.

const { UInt32 } = require('../dist/types/uint-32')
class NewType extends UInt32 {
  // Should be the same as UInt32
}

const extendedCoreTypes = { ...coreTypes }
extendedCoreTypes['NewType'] = NewType

const newDefs = new DefinitionContents(newTypeDefs, extendedCoreTypes)

// From this point on, we should be able to serialize / deserialize Transactions with fields that have 'NewType' as their Type.

const encoded = encode(my_tx, newDefs)
const decoded = decode(encoded, newDefs)
```

Example code is based on the test case in definitions.test.js which has other examples of modifying the `definitions.json` - You can find it and the corresponding example `definition` files in [this folder of test cases](https://github.com/XRPLF/xrpl.js/tree/main/packages/ripple-binary-codec/test)
