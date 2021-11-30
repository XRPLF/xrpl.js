# ripple-address-codec

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Functions for encoding and decoding XRP Ledger addresses and seeds.

Also includes support for encoding/decoding [rippled validator (node) public keys](https://xrpl.org/run-rippled-as-a-validator.html).

[![NPM](https://nodei.co/npm/ripple-address-codec.png)](https://www.npmjs.org/package/ripple-address-codec)

## X-address Conversion

All tools and apps in the XRP Ledger ecosystem are encouraged to adopt support for the X-address format. The X-address format is a single Base58 string that encodes an 'Account ID', a (destination) tag, and whether the address is intended for a test network. This prevents users from unintentionally omitting the destination tag when sending and receiving payments and other transactions.

## API

### classicAddressToXAddress(classicAddress: string, tag: number | false, test: boolean): string

Convert a classic address and (optional) tag to an X-address. If `tag` is `false`, the returned X-address explicitly indicates that the recipient does not want a tag to be used. If `test` is `true`, consumers of the address will know that the address is intended for use on test network(s) and the address will start with `T`.

```js
> const api = require('ripple-address-codec')
> api.classicAddressToXAddress('rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf', 4294967295)
'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
```

Encode a test address e.g. for use with [Testnet or Devnet](https://xrpl.org/xrp-testnet-faucet.html):

```js
> const api = require('ripple-address-codec')
> api.classicAddressToXAddress('r3SVzk8ApofDJuVBPKdmbbLjWGCCXpBQ2g', 123, true)
'T7oKJ3q7s94kDH6tpkBowhetT1JKfcfdSCmAXbS75iATyLD'
```

### xAddressToClassicAddress(xAddress: string): {classicAddress: string, tag: number | false, test: boolean}

Convert an X-address to a classic address and tag. If the X-address did not have a tag, the returned object's `tag` will be `false`. (Since `0` is a valid tag, instead of `if (tag)`, use `if (tag !== false)` if you want to check for a tag.) If the X-address is intended for use on test network(s), `test` will be `true`; if it is intended for use on the main network (mainnet), `test` will be `false`.

```js
> const api = require('ripple-address-codec')
> api.xAddressToClassicAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi')
{
  classicAddress: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
  tag: 4294967295,
  test: false
}
```

### isValidXAddress(xAddress: string): boolean

Returns `true` if the provided X-address is valid, or `false` otherwise.

```js
> const api = require('ripple-address-codec')
> api.isValidXAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi')
true
```

Returns `false` for classic addresses (starting with `r`). To validate a classic address, use `isValidClassicAddress`.

### isValidClassicAddress(address: string): boolean

Check whether a classic address (starting with `r`...) is valid.

Returns `false` for X-addresses (extended addresses). To validate an X-address, use `isValidXAddress`.

### encodeSeed(entropy: Buffer, type: 'ed25519' | 'secp256k1'): string

Encode the given entropy as an XRP Ledger seed (secret). The entropy must be exactly 16 bytes (128 bits). The encoding includes which elliptic curve digital signature algorithm (ECDSA) the seed is intended to be used with. The seed is used to produce the private key.

### decodeSeed(seed: string): object

Decode a seed into an object with its version, type, and bytes.

Return object type:
```
{
  version: number[],
  bytes: Buffer,
  type: string | null
}
```

### encodeAccountID(bytes: Buffer): string

Encode bytes as a classic address (starting with `r`...).

### decodeAccountID(accountId: string): Buffer

Decode a classic address (starting with `r`...) to its raw bytes.

### encodeNodePublic(bytes: Buffer): string

Encode bytes to the XRP Ledger "node public key" format (base58).

This is useful for rippled validators.

### decodeNodePublic(base58string: string): Buffer

Decode an XRP Ledger "node public key" (in base58 format) into its raw bytes.

### encodeAccountPublic(bytes: Buffer): string

Encode a public key, as for payment channels.

### decodeAccountPublic(base58string: string): Buffer

Decode a public key, as for payment channels.

### encodeXAddress(accountId: Buffer, tag: number | false, test: boolean): string

Encode account ID, tag, and network ID to X-address.

`accountId` must be 20 bytes because it is a RIPEMD160 hash, which is 160 bits (160 bits = 20 bytes).

At this time, `tag` must be <= MAX_32_BIT_UNSIGNED_INT (4294967295) as the XRP Ledger only supports 32-bit tags.

If `test` is `true`, this address is intended for use with a test network such as Testnet or Devnet.

### decodeXAddress(xAddress: string): {accountId: Buffer, tag: number | false, test: boolean}

Convert an X-address to its classic address, tag, and network ID.

### Other functions

```js
> var api = require('ripple-address-codec');
> api.decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
{ version: [ 1, 225, 75 ],
  bytes: [ 76, 58, 29, 33, 63, 189, 251, 20, 199, 194, 141, 96, 148, 105, 179, 65 ],
  type: 'ed25519' }
> api.decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
{ version: 33,
  bytes: [ 207, 45, 227, 120, 251, 221, 126, 46, 232, 125, 72, 109, 251, 90, 123, 255 ],
  type: 'secp256k1' }
> api.decodeAccountID('rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN')
[ 186,
  142,
  120,
  98,
  110,
  228,
  44,
  65,
  180,
  109,
  70,
  195,
  4,
  141,
  243,
  161,
  195,
  200,
  112,
  114 ]
```

## Tests

Run unit tests with:

    npm test

Use `--watch` to run in watch mode, so that when you modify the tests, they are automatically re-run:

    npm test -- --watch

Use `--coverage` to generate and display code coverage information:

    npm test -- --coverage

This tells jest to output code coverage info in the `./coverage` directory, in addition to showing it on the command line.

## Releases

Use the [xrpl.js release process](https://github.com/XRPLF/xrpl.js/blob/main/CONTRIBUTING.md#release).

## Acknowledgements

This library references and adopts code and standards from the following sources:

- [XLS-5d Standard for Tagged Addresses](https://github.com/xrp-community/standards-drafts/issues/6) by @nbougalis
- [XRPL Tagged Address Codec](https://github.com/xrp-community/xrpl-tagged-address-codec) by @WietseWind
- [X-Address transaction functions](https://github.com/codetsunami/xrpl-tools/tree/master/xaddress-functions) by @codetsunami

[coveralls-image]: https://badgen.net/coveralls/c/github/ripple/ripple-address-codec/master
[coveralls-url]: https://coveralls.io/r/ripple/ripple-address/codec?branch=master
[npm-downloads-image]: https://badgen.net/npm/dm/ripple-address-codec
[npm-url]: https://npmjs.org/package/ripple-address-codec
[npm-version-image]: https://badgen.net/npm/v/ripple-address-codec
[travis-image]: https://badgen.net/travis/ripple/ripple-address-codec/master
[travis-url]: https://travis-ci.org/github/ripple/ripple-address-codec
