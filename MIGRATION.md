# Migration Guide

The goal of xrpl.js 3.0 was to improve the libraries support for non nodejs projects by eliminating the need for platform/build system specific polyfills and se.  This was accomplished 

There were five main goals for xrpl.js 3.0 package suite:

- Remove polyfills as dependencies for non node.js projects
- Reduce the bundle size for client side applications
- Execute unit tests in a browser enviroment
- Few breaking changes
- Improve docs

The result of which is a 60% reduction in bundle size and a complete elimination of polyfills for browser applications as well as a streamlining of react-native support.  All sub packages now run their tests in both nodejs and Chrome. The `xrpl` still will not run its unit tests in the browser but it still has exhaustive coverage through its integration tests which do.

## Polyfill Reduction

The polyfill elimination was achieved by switching from elliptic, create-hash, and crypto polyfills to the `@noble` suite of packages which includes `@noble/hashes`, `@noble/curves`, `@scure/bip32`, @scure/bip39, and `@scure/base`.  In order to still use node's built in crypto functions when running in a node environment `@xrplf/isomorphic` was created as a way to abstract the selection of the underlying implementation.

Additionally the faucet code switched from using node's `http` packages and instead leverage native fetch in the browser and `node-fetch` in node. This eliminated the polyfills for `http`, `https`, and `url`. The need for `assert` was addressed by switching to conditionals that throw exceptions and `utils` by updating error handling to use `JSON.stringify` instead of `inspect`.

The removal of `buffer` proved to be a tricky endeavor.  It brought along with it the largest amount of breaking changes but was necessary to get to a polyfill free future.  Since the `Buffer` object is not native to the browser all apis were migrated to `Uint8Arrays`.  Many libraries have begun making this transition as well so with the goal in sight it made since to address it at this time. Checkout this [blogpost](https://sindresorhus.com/blog/goodbye-nodejs-buffer) by Sindre Sorhus on the rational behind using `UintArrays` over `Buffer`.

## File Size Reduction

Polyfills were a major source of the the projects large bundle size however there was a need for further reductions.  `lodash` was removed as a dependency by utilizing es6 array methods.

Another source was the presence of 5 large number libraries. We had `decimal.js`, `big-integer`, `bignumber.js`, and two versions of `bn.js` (this was due to the transitive dependency tree).  The `bn.js` dependency was eliminated by switching to `@noble`. `decimal.js` and `big-integer` were then  normalized to `bignumber.js`.

## Unit Tests

All packages besides `xrpl` run their unit tests in the browser.  This was a major gap in testing and gives us additional confidence in the accuracy of future changes.  We achieved this by adding a karma config to every project that uses webpack to bundle each lib and then run the tests in Chrome. Hopefully soon even `xrpl` will have all its tests execute in a browser context.

## Improved Docs

The old docs didn't output the correct information due to how functions are assigned to the class. Those docstrings have been moved to the client class methods instead of the sugar functions.  We've also added missing docs for several functions.

## Breaking Changes / Migration Guide

### Uint8Array

Below is a list of every method affected.  All of these methods should still work with `Buffer`s as parameters because `Buffer` extends `Uint8Array`. You should beware of the return type changes as `Uint8Array` is missing many of the helper methods.

##### `ripple-address-codec`

- `decodeAccountID`
- `encodeAccountID`
- `decodeAccountPublic`
- `encodeAccountPublic`
- `decodeNodePublic`
- `encodeNodePublic`
- `encodeSeed`
- `decodeXAddress`
- `encodeXAddress`

##### `ripple-binary-codec`

- `SerializedType` constructor and `toBytes` .  Its sub-classes:
  - `AccountID`
  - `Amount`
  - `Blob`
  - `Currency`
  - `Hash`
  - `Hash128`
  - `Hash160`
  - `Hash256`
  - `Issue`
  - `PathSet`
  - `STArray`
  - `STObject`
  - `UInt`
  - `UInt8`
  - `UInt16`
  - `UInt32`
  - `UInt64`
  - `Vector256`
  - `XChainBridge`
- `ShaMapNode.hashPrefix`
- `BinarySerializer.put`
- `BytesList.put` and `BytesList.toBytes`
- `BinaryParser.read`
- `BinaryParser.readVariableLength`
- `Quality.encode` and `Quality.decode`
- `Sha512Half.put` and `Sha512Half.finish256`
- `transactionID`
- `sha512Half`
- Entries of `HashPrefix`
- Type `FieldInstance.header`
- `Bytes.bytes`
- `signingClaimData`
- `serializeObject`
- `makeParser`

##### `secret-numbers`

- `entropyToSecret`
- `randomEntropy`
- `Account` constructor

##### `xrpl`

- `rfc1751MnemonicToKey`

### Large Number Handling

`bn.js`, `decimal.js` and `big-integer` were removed as dependencies.  They usages were replaced with `BigNumber` from `big-number.js` (was already a dependency) and the native javascript object `BigInt`.

- `UInt64.valueOf` returns `bigint` instead of  `BigInteger`
- `SerializeType.from` can take a  `bigint` instead `BigInteger`
- `ledgerHash` had its param object change so that `total_coins` in a `bigint` instead `BigInteger`
- `Quality.decode` returns a `BigNumber` instead of a `Decimal`
- `Amount.assertIouIsValid` take a `BigNumber` instead `Decimal`
- `Amount.verifyNoDecimal` takes a `BigNumber` instead `Decimal`

### Error Handling

In order to remove `assert` as a dependency regular `Error` objects are thrown instead of  `AssertionError`.

Not a breaking change but there is now a much more descriptive error message when keys do not match for a given algorithm.  This impacts most of `ripple-keypairs` functions but only if you already had issues with incompatible values.

### Bundlers

For `vite` and `create-react-app` you can remove all xrpl.js polyfills/configurations this also includes the custom mappings for `ws` to `WsWrapper` and the exclusion of `https-proxy-agent`. These improves should extend to using the libraries with other bundlers or frameworks but has only been tested in those noted above.

### React Native

Neither `react-native-crypto` nor `rn-nodeify` are required.  Instead `fast-text-encoding` and `react-native-get-random-values` are as well as a small polyfills file to wire them up. You can find the new guide at `TODO: Link to setup guide`

### `xrpl-secret-numbers`

This library was absorbed into the monorepo as it was causing dependency mismatches and was going to require an update anyway.  It is now available as `@xrplf/secret-numbers`.  Besides making changes to use `UInt8Array` you will need to update all places where you use functions on the `Util` object.  These methods are now at the root of the library. These methods include:

- `Utils.randomEntropy`,
- `Utils.randomSecret`
- `Utils.entropyToSecret`
- `Utils.secretToEntropy`
- `Utils.calculateChecksum`
- `Utils.checkChecksum`
- `Utils.parseSecretString`

##### Prebundle

If you use the pre bundled version of the library you will need to make the following changes:

- Change any references to `dist/browerified.js` to `build/xrplf-secret-numbers-latest.js`.
- Access any methods as properties of `xrplf_secret_numbers` instead of using browserify's loader.

### HttpsProxyAgent

The way to configure proxies for `Client` has changed. It is now done by specifying the `agent` parameter on the ConnectionOptions config. This can use be created by libraries such as `https-proxy-agent` or any that
implements `http.Agent`.  This was done to remove a hard dependency on `https-proxy-agent` when running in the browser. The lack of proxy support is not a reduction in features as it never supported running in the browser and merely burdened bundles with unused dependencies.  This was also done to support `https-proxy-agent@7` which changed several option names.

#### Before

```javascript
{
  proxy: `ws://127.0.0.1:${port}`,
  authorization: 'authorization',
  trustedCertificates: ['path/to/pem'],
}
```

#### After

```javascript
 {
   agent: new HttpsProxyAgent<string>(`ws://127.0.0.1:${port}`, {
     ca: ['path/to/pem'],
   }),
   authorization: 'authorization'
 }
```

### Transaction` type

The type `Transaction` exported by `xrpl` was renamed to `SubmittableTransaction` and the definition for `Transaction` was then changed to include all transactions which is a union of `SubmittableTransaction` and `PseudoTransaction`.  This effectively changes the signature of the following methods:

* `Client.autofill`
* `Client.submit`
* `Client.submitAndWait`
* `Client.prepareTransaction`
* `getSignedTx`
* `isAccountDelete`

#### Wallet Generation

`Wallet.generate()` and  `Wallet.fromSeed` were ignoring the `algorithm`.  If your code was using that previously you will be getting new wallets.

### Miscellaneous

- Node 14 support was dropped
- `dropsToXRP` and `Client.getXrpBalance` now return a `number` instead of a `string`
- `BroadcastClient` was removed
- Move `authorizeChannel` from `wallet/signer` to `wallet/authorizeChannel` to solve a circular dependency issue.
