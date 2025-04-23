# Code structure

 - `enums` contains the logic for mapping types to their numerical id in rippled, which is used to serialize / deserialize later on. For more details, see its specific [README.md](src/enums/README.md)
 - `serdes` contains the two main classes of this repo `BinarySerializer` and `BinaryParser` which actually do the serializing / deserializing.
 - `types` defines how the library should convert between objects and binary data for each data type. These are then used by the `BinarySerializer` and `BinaryParser` to serialize / deserialize rippled data.
 - At the top-level, we have helper functions for specific situations (like `encodeForMultisigning` in [index.ts](src/index.ts)). These functions are generally what are used by consumers of the library (with `BinarySerializer` and `BinaryParser` being used as the implementation under the hood)

# Running tests
You can run tests for this repo with:
`npm i` to install necessary dependencies followed by either:
- `npm test` - Run unit tests in Node.
- `npm test:browser` - Run unit tests in the browser.

## Adding tests
All tests should be added to the `test` folder, with long test data added to the [test/fixtures](test/fixtures) folder.

For a good example unit test file, look at [test/hash.test.ts](test/hash.test.ts).

If you add a new serializable type, please add a new file with tests that ensure it can be encoded / decoded, and that it throws any relevant errors.

# Updating `definitions.json`

The `definitions.json` file contains all the fields within rippled and all the relevant values needed to decode/encode it from the [rippled binary format](https://xrpl.org/es-es/docs/references/protocol/binary-format).

To update it, use the script [here](./tools/generateDefinitions.js). You can run the script with `node path/to/generateDefinitions.js`.

# Adding new serializable types
To add a new serializable type, first read through `enum`'s [README.md](src/enums/README.md) as it explains how to update `definitions.json` which ties `TransactionType`s and `Field`s to specific ids rippled understands.

After that, if you need to add a new type of data to be serialized / deserialized (for example adding a bigger int than [uint-64.ts](src/types/uint-64.ts)) you can follow these steps:
1. Create a new class that extends `SerializedType`
  - If your type is intended to be comparable to native values like `number`, you should extend `Comparable<YourObjectType | nativeValue>`. See [uint-64.ts](src/types/uint-64.ts) for an example of this.
2. Add your new subclass of `SerializableType` to `coreTypes` in [packages/ripple-binary-codec/src/types/index.ts](packages/ripple-binary-codec/src/types/index.ts)
  - The `coreTypes` variable is used by `BinaryParser` and `BinarySerializer` to understand what possible types exist when reading / writing binary data.
3. Write a unit tests for this type that demonstrates it can properly serialize / deserialize and throw the proper errors (see [Adding Tests](#adding-tests))
