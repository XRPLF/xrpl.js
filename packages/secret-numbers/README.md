# XRPL Secret Numbers [![npm version](https://badge.fury.io/js/@xrplf%2Fsecret-numbers.svg)](https://www.npmjs.com/@xrplf/secret-numbers)

For more background information, please read the [proposed Standard](https://github.com/xrp-community/standards-drafts/issues/15).

A tool to convert Secret Numbers to the widely used Family Seed `s...` format is [available here](https://github.com/WietseWind/secret-numbers-to-family-seed/releases)

A bundled version of this lib is available at NPM (`build/xrplf-secret-numbers-latest.js`), CDN: https://cdn.jsdelivr.net/npm/@xrplf/secret-numbers. You can access the library as `xrplf_secret_numbers`. Sample:
https://jsfiddle.net/WietseWind/uo1zy0q7/

#### Generate XRPL Accounts with a number-based secret: 8 chunks of 6 digits.

The common formats for XRPL account secrets are (at the time of writing this, July 2019):

- Family Seed, eg. `sh1HiK7SwjS1VxFdXi7qeMHRedrYX`
- Mnemonic, eg. `car banana apple road ...`

These formats are prone to typo's and not that user friendly. Using numbers means it's language (spoken, written) agnostic as well. They may be especially intimidating for the public that's relatively new to cryptocurrencies / blockchain technology.

This library encodes the entropy to generate accounts into 8 chunks of 6 digits, of which 5 digits are 1/8th of the entropy, and a 6th digit contains a checksum allowing realtime typo detection.

##### A secret now looks like:

```
554872 394230 209376 323698
140250 387423 652803 258676
```

For compatibility with existing clients, this library supports exporting the family seed for a generated / entered "Secret Number"-set as well.

## API

The typescript code to use resides in `./src/` and the compiled js in `./dist/` of the package. See the `./samples/` folder for some simple JS samples.

##### Generating a new account:

```
const {Account} = require('@xrplf/secret-numbers')
const account = new Account()
```

##### Importing an existing account:

```
const {Account} = require('@xrplf/secret-numbers')
const secret = '399150 474506 009147 088773 432160 282843 253738 605430'
const account = new Account(secret)
```

Or importing with custom entropy (buffer, 16):

```
const {Account} = require('@xrplf/secret-numbers')
const entropy = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex')
const account = new Account(entropy)
```

##### After generating / importing:

You can fetch the account details (address, secret, etc.) using these methods:

```
console.log(account.getAddress())
console.log(account.getSecret())
```

##### Available methods:

- `getSecret()`: Array<string>[8]
- `getSecretString()`: string `012345 456789 ...`
- `getAddress()`: string `rXXXXXXXX...`
- `getFamilySeed()`: string `sXXXXXXXX...`
- `getKeypair()`: `Keypair({privateKey, publicKey}`

##### To split/check/encode/decode some more:

There's a `Utils` export as well:

```
const {Account, Utils} = require('@xrplf/secret-numbers')
```

Some Utils methods (that you may want to use in your UI / ... before using the Account constructor):

 - To calculate the 6th decimal for a group of 5 digits:  
   `calculateChecksum(position: number, value: number)`: number
 - To check a checksum (either sliced or the 6th char of a string containing numbers:  
   `checkChecksum(position: number, value: number | string, checksum?: number)`: Boolean

## Development

Run `npm run prepublish` to clean, lint, test and build. Or just run `npm run build`, `npm run test` or `npm run lint`. 

Tests are in `./test/`

## Credits

This concept is based on an idea by [@nbougalis](https://github.com/nbougalis).
