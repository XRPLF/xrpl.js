# ripple-address-codec [![NPM](https://img.shields.io/npm/v/ripple-address-codec.svg)](https://npmjs.org/package/ripple-address-codec)

Functions for encoding and decoding XRP Ledger addresses and seeds. Also includes support for encoding/decoding [rippled validator (node) public keys](https://xrpl.org/run-rippled-as-a-validator.html).

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

### xAddressToClassicAddress(xAddress: string): {classicAddress: string, tag: number | false, test: boolean}

Convert an X-address to a classic address and tag. If the X-address did not have a tag, the returned object will not have a `tag` field. If the X-address is intended for use on test network(s), `test` will be `true`; if it is intended for use on the main network (mainnet), `test` will be `false`.

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

    yarn test

Use `--watch` to run in watch mode, so that when you modify the tests, they are automatically re-run:

    yarn test --watch

Use `--coverage` to generate and display code coverage information:

    yarn test --coverage

This tells jest to output code coverage info in the `./coverage` directory, in addition to showing it on the command line.

## Acknowledgements

This library references and adopts code and standards from the following sources:

- [XLS-5d Standard for Tagged Addresses](https://github.com/xrp-community/standards-drafts/issues/6) by @nbougalis
- [XRPL Tagged Address Codec](https://github.com/xrp-community/xrpl-tagged-address-codec) by @WietseWind
- [X-Address transaction functions](https://github.com/codetsunami/xrpl-tools/tree/master/xaddress-functions) by @codetsunami
