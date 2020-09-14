# ripple-binary-codec [![NPM](https://img.shields.io/npm/v/ripple-binary-codec.svg)](https://npmjs.org/package/ripple-binary-codec)

Functions to encode/decode to/from the ripple [binary serialization format](https://xrpl.org/serialization.html)

[![NPM](https://nodei.co/npm/ripple-binary-codec.png)](https://www.npmjs.org/package/ripple-binary-codec)

## API
```js
> const api = require('ripple-binary-codec')
```


### decode(binary: string): object
Decode a hex-string into a transaction object.
```js
> api.decode('1100612200000000240000000125000000072D0000000055DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF6240000002540BE4008114D0F5430B66E06498D4CEEC816C7B3337F9982337')
{
  LedgerEntryType: 'AccountRoot',
  Flags: 0,
  Sequence: 1,
  PreviousTxnLgrSeq: 7,
  OwnerCount: 0,
  PreviousTxnID: 'DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF',
  Balance: '10000000000',
  Account: 'rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv'
}
```

### encode(json: object): string
Encode a transaction object into a hex-string. Note that encode filters out fields with undefined values.
```js
> api.encode({
  LedgerEntryType: 'AccountRoot',
  Flags: 0,
  Sequence: 1,
  PreviousTxnLgrSeq: 7,
  OwnerCount: 0,
  PreviousTxnID: 'DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF',
  Balance: '10000000000',
  Account: 'rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv' 
})
'1100612200000000240000000125000000072D0000000055DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF6240000002540BE4008114D0F5430B66E06498D4CEEC816C7B3337F9982337'
```

#### X-Address Compatibility 
  * ripple-binary-codec handles X-addresses by looking for a few specific files (Account/SourceTag, Destination/DestinationTag).
  * If other fields (in the future) must to support X-addresses with tags, this library will need to be updated.
  * When decoding rippled binary, the output will always output classic address + tag, with no X-addresses. X-address support only applies when encoding to binary.

#### Encoding Currency Codes
  * The standard format for currency codes is a three-letter string such as `USD`. This is intended for use with ISO 4217 Currency Codes.
  * Currency codes must be exactly 3 ASCII characters in length and there are [a few other rules](https://xrpl.org/currency-formats.html#currency-codes).
  * ripple-binary-codec allows any 3-character ASCII string to be encoded as a currency code, although rippled may enforce tighter restrictions.
  * When _decoding_, if a currency code is three uppercase letters or numbers (`/^[A-Z0-9]{3}$/`), then it will be decoded into that string. For example,`0000000000000000000000004142430000000000` decodes as `ABC`.
  * When decoding, if a currency code is does not match the regex, then it is not considered to be an ISO 4217 or pseudo-ISO currency. ripple-binary-codec will return a 160-bit hex-string (40 hex characters). For example, `0000000000000000000000006142430000000000` (`aBC`) decodes as `0000000000000000000000006142430000000000` because it contains a lowercase letter.

### encodeForSigning(json: object): string

Encode the transaction object for signing.

### encodeForSigningClaim(json: object): string

Encode the transaction object for payment channel claim.

### encodeForMultisigning(json: object, signer: string): string

Encode the transaction object for multi-signing.

### encodeQuality(value: string): string
```js
> api.encodeQuality('195796912.5171664')
'5D06F4C3362FE1D0'
```

### decodeQuality(value: string): string 
```js
> api.decodeQuality('5D06F4C3362FE1D0')
'195796912.5171664'
```

### decodeLedgerData(binary: string): object
```js
> api.decodeLedgerData("01E91435016340767BF1C4A3EACEB081770D8ADE216C85445DD6FB002C6B5A2930F2DECE006DA18150CB18F6DD33F6F0990754C962A7CCE62F332FF9C13939B03B864117F0BDA86B6E9B4F873B5C3E520634D343EF5D9D9A4246643D64DAD278BA95DC0EAC6EB5350CF970D521276CDE21276CE60A00")
{
  ledger_index: 32052277,
  total_coins: '99994494362043555',
  parent_hash: 'EACEB081770D8ADE216C85445DD6FB002C6B5A2930F2DECE006DA18150CB18F6',
  transaction_hash: 'DD33F6F0990754C962A7CCE62F332FF9C13939B03B864117F0BDA86B6E9B4F87',
  account_hash: '3B5C3E520634D343EF5D9D9A4246643D64DAD278BA95DC0EAC6EB5350CF970D5',
  parent_close_time: 556231902,
  close_time: 556231910,
  close_time_resolution: 10,
  close_flags: 0
}
```

## Tests

Run unit tests with:

    yarn test

Use `--coverage` to generate and display code coverage information:

    yarn test --coverage

This tells jest to output code coverage info in the `./coverage` directory, in addition to showing it on the command line.