# Definitions

This file is used to serialize/deserialize transactions and ledger objects for the XRPL. It's broken into 5 sections laid out below.

At the bottom of this README you can find instructions and examples for how to define your own types in a definitions file in order to work on a custom sidechain or develop new amendments.

## Types

These are the [types](https://xrpl.org/serialization.html#type-list) associated with a given Serialization Field. Each type has an arbitrary [type_code](https://xrpl.org/serialization.html#type-codes), with lower codes sorting first.

## Ledger Entry Types

Each ledger's state tree contain [ledger objects](https://xrpl.org/ledger-object-types.html), which represent all settings, balances, and relationships in the shared ledger.

## Fields

These are Serialization Fields (`sf`) [defined in rippled's SField.cpp](https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/impl/SField.cpp). Fields with undefined values are omitted before encoding.

### Key

The key is the string defined in the rippled source code, such as "LedgerEntry", "Transaction", etc.

### nth

`nth` is the sort code, meaning "nth of type." It is is combined with the type code in order to construct the Field ID of this field. The Field ID is only used for sorting the fields. Since there are multiple fields with the same data type, the `nth` is used to deterministically order each field among other fields of the same data type.

Each field has a Field ID, which is used to sort fields that have the same type as one another with lower codes sorting first.

- [Field definitions](https://github.com/ripple/rippled/blob/72e6005f562a8f0818bc94803d222ac9345e1e40/src/ripple/protocol/impl/SField.cpp#L72-L266)
- [Constructing the `SField` field codes](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/SField.h#L95-L98)

For example, the `Account` field has sort code (nth) `1`, so it comes before the `Destination` field which has sort code `3`.

Sort code numbers are reused for fields of different types, but different fields of the same type never have the same sort code. When you combine the type code with the sort code, you get the field's unique _Field ID_.

The unique [Field ID](https://xrpl.org/serialization.html#field-ids) is prefixed before the field in the final serialized blob. The size of the Field ID is one to three bytes depending on the type code and the field codes it combines.

### isVLEncoded

If true, the field is Variable Length encoded and [length-prefixed](https://xrpl.org/serialization.html#length-prefixing). The variable-length encoded fields are `STI_VL`/`Blob`, `STI_ACCOUNT`/`AccountID`, and `STI_VECTOR256`/`Vector256`.

### isSerialized

Fields are serialized if they are not [one of these](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/impl/SField.cpp#L71-L78) or if they are not an SField.

- https://github.com/ripple/ripple-binary-codec/blob/14e76e68ead7e4bcd83c942dbdc9064d5a66869b/src/enums/definitions.json#L832
- https://github.com/ripple/rippled/search?utf8=%E2%9C%93&q=taker_gets_funded&type=

### isSigningField

True unless the field is [specified with `SField::notSigning`](https://github.com/ripple/rippled/blob/eaff9a0e6aec0ad077f118501791c7684debcfd5/src/ripple/protocol/impl/SField.cpp#L198).

## Transaction Results

See:

- https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/TER.h
- https://xrpl.org/transaction-results.html

To generate a new definitions file from rippled source code, use this tool: https://github.com/RichardAH/xrpl-codec-gen

## Transaction Types

See https://github.com/ripple/rippled/blob/develop/src/ripple/protocol/TxFormats.h

# Defining Your Own Definitions

If you're building your own sidechain or writing an amendment for the XRPL, you may need to create new XRPL definitions.

To do that there are a couple things you need to do:

1. Generate your own `definitions.json` file from rippled source code using [this tool](https://github.com/RichardAH/xrpl-codec-gen) (The default `definitions.json` for mainnet can be found [here](https://github.com/XRPLF/xrpl.js/blob/main/packages/ripple-binary-codec/src/enums/definitions.json))
2. Create new SerializedType classes for any new Types (So that encode/decode behavior is defined). The SerializedType classes correspond to "ST..." classes in Rippled. Note: This is very rarely required.

- For examples of how to implement that you can look at objects in the [`types` folder](../types/), such as `Amount`, `UInt8`, or `STArray`.

3. Import your `definitions.json` file to construct your own `XrplDefinitions` object.
4. Pass the `XrplDefinitions` object whenever you `encode` or `decode` a transaction.
5. If you added any new transaction types, you should create an `interface` for the transaction that extends `BaseTransaction` from the `xrpl` repo to use it with the functions on `Client` (See the below example of adding a new transaction type)

## Example of adding a new Transaction type

```
// newDefinitionsJson is where you can import your custom defined definitions.json file
const newDefinitionsJson = require('./new-transaction-type-definitions.json')
const { XrplDefinitions, Client } = require('xrpl')

const newDefs = new XrplDefinitions(newDefinitionsJson)

// Change to point at the server you care about
const serverAddress = 'wss://s.devnet.rippletest.net:51233'
const client = new Client(serverAddress)
const wallet1 = await client.fundWallet()

// Extending BaseTransaction allows typescript to recognize this as a transaction type
interface NewTx extends BaseTransaction {
    Amount: Amount
}

const tx: NewTx = {
    // The TransactionType here needs to match what you added in your newDefinitionsJson file
    TransactionType: 'NewTx',
    Account: wallet1.address,
    Amount: '100',
}

// By passing in your newDefs, your new transaction should be serializable.
// Rippled will still throw an error though if it's not a supported transaction type.
const result = await client.submitAndWait(tx, {
    wallet: wallet1,
    definitions: newDefs,
})
```

## Example of adding a new serializable Type

```
const { XrplDefinitions } = require('../dist/coretypes')

// newDefinitionsJson is where you can import your custom defined definitions.json file
const newDefinitionsJson = require('./fixtures/new-definitions.json')


// For any new Types you create, you'll need to make a class with the same name which extends a SerializedType object
// In order to define how to serialize/deserialize that field. Here we simply make our NewType act like a UInt32.

const { UInt32 } = require('../dist/types/uint-32')
class NewType extends UInt32 {
  // Should be the same as UInt32
}

const extendedCoreTypes = { NewType }

const newDefs = new XrplDefinitions(newDefinitionsJson, extendedCoreTypes)

// From this point on, we should be able to serialize / deserialize Transactions with fields that have 'NewType' as their Type.

const encoded = encode(my_tx, newDefs)
const decoded = decode(encoded, newDefs)
```

## Other examples

You can find other examples of how to modify `definitions.json` in `definition.test.js` which contains tests for this feature, and uses various example modified `definition` files. You can find the tests and the corresponding example `definition` files in [this folder of test cases](https://github.com/XRPLF/xrpl.js/tree/main/packages/ripple-binary-codec/test)
