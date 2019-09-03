# ripple-address-codec [![NPM](https://img.shields.io/npm/v/ripple-address-codec.svg)](https://npmjs.org/package/ripple-address-codec)

## API

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
