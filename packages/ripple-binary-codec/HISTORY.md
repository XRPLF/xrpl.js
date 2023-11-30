# ripple-binary-codec Release History

## Unreleased

### Breaking Changes
* `Buffer` has been replaced with `UInt8Array` for both params and return values. `Buffer` may continue to work with params since they extend `UInt8Arrays`.

### Changes
* Eliminates 4 runtime dependencies: `base-x`, `base64-js`, `buffer`, and `ieee754`.

## 2.0.0 Beta 1 (2023-10-19)

### Breaking Changes
* Bump typescript to 5.x
* Remove Node 14 support
* Remove decimal.js and big-integer. Use `BigNumber` from `bignumber.js` instead of `Decimal` and the native `BigInt` instead of `bigInt`.
* Remove `assert` dependency. If you were catching `AssertionError` you need to change to `Error`.
* Remove `create-hash` in favor of `@noble/hashes`

### Changes
* Update type definitions which causing errors in tests that the code already supported
    * `makeParser` to accept a `Buffer` in addition to `string`
    * `SerializedType` constructor allows not passing in a byte array
    * `Comparable` is now a generic type so that it allows `compareTo` methods to take more that the type itself.

## 1.11.0 (2023-11-30)
### Added
- Support for the DID amendment (XLS-40).

## 1.10.0 (2023-09-27)
### Added
- Support for the XChainBridge amendment (XLS-38).

## 1.9.0 (2023-08-24)

### Added
* Add AMM support [XLS-30](https://github.com/XRPLF/XRPL-Standards/discussions/78)
* Updated to include latest updates to `definitions.json`.

### Fixed
* Fix source-maps not finding their designated source

## 1.8.0 (2023-08-07)

### Added
* Added Clawback transaction type

## 1.7.1 (2023-07-18)
### Fixed
* Passing Definitions from `STObject` to `STArray` back to `STObject`, both for signing & decoding (to JSON)

## 1.7.0 (2023-07-12)
### Added
* `NetworkId` field support

## 1.6.0 (2023-06-13)
### Added
- Allow custom type definitions to be used for encoding/decoding transactions at runtime (e.g. for sidechains/new amendments)
- Adds support for npm v9

## 1.5.0 (2023-03-08)
### Changed
- All tests now use the Jest test runner and have been refactored for consistency across all packages

## 1.4.2 (2022-06-27)
- Fixed standard currency codes with lowercase and allowed symbols not decoding into standard codes.

## 1.4.1 (2022-06-02)
- Added a clearer error message for trying to encode an invalid transaction. (Ex. With an incorrect TransactionType)

## 1.4.0 (2022-04-18)
- Updated NFT definitions to match 1.9.0's breaking naming changes

## 1.3.2 (2022-02-02)
- Fixed error being raised when decoding issued currencies in non-standard formats that decode to XRP (#1920)
- Fix ISO when parsing currency code (#1921)
- Internal - build(deps-dev):
  - bump webpack from 5.66.0 to 5.68.0 (#1910)
  - bump webpack-cli from 4.9.1 to 4.9.2 (#1911)
  - bump eslint-plugin-mocha from 9.0.0 to 10.0.3 (#1912)
  - bump @types/node from 16.11.11 to 17.0.14 (#1913)
  - bump @types/mocha from 9.0.0 to 9.1.0 (#1914)
  - bump typescript from 4.5.2 to 4.5.5 (#1918)
  - bump typedoc from 0.22.10 to 0.22.11 (#1916)
  - bump chai from 4.3.4 to 4.3.6 (#1915)

## 1.3.1 (2022-01-28)
- Fix "homepage" field in package.json

## 1.3.0 (2021-12-17)
### Added
- Exported `TRANSACTION_TYPES` value
### Fixed
- Adds missing fields from XLS-20 NFT implementation

## 1.2.3 (2022-2-2)
- Fix issue where ISO is invalid when parsing currency code

## 1.2.2 (2021-12-02)
- Fix issue where unsupported currency codes weren't being correctly processed
- Added a workaround for rippled UNLModify encoding bug (#1830)

## 1.2.1 (2021-12-01)
- Fix issue where npm < 7 could not install the library

## 1.2.0 (2021-11-15)
- Converts ripple-binary-codec into a monorepo with ripple-address-codec,
  ripple-keypairs, and xrpl
- Adds preliminary support for XLS-20 NFT definitions

## 1.1.3 (2021-06-11)
- Fix for case UInt64.from string allowing lowercase hex (#135)
- Fix for `ValidatorToReEnable` field code (#130)

## 1.1.2 (2021-03-10)
- Fix for case UInt64.from string '0' due to changes in rippled 1.7.0

## 1.1.1 (2021-02-12)
- PathSet.toJSON() does not return undefined values
- Add support for X-Addresses in Issued Currency Amounts
- Fix STArray error message

## 1.1.0 (2020-12-03)
- Add support for Tickets (TicketBatch amendment)
- Fix web browser compatibility

## 1.0.2 (2020-09-11)
- Allow currencies to be encoded from any 3 character ASCII code

## 1.0.1 (2020-09-08)
- Filter out fields with undefined values

## 1.0.0 (2020-08-17)

- Migrate to TypeScript
  - Javascript classes used
  - Generics for constructing core types
- Reduced dependencies
  - Dependent on create-hash, decimal.js, ripple-address-codec
- Migrate testing to Jest and added tests
  - Tests for pseudo-transactions
- Added support for NegativeUNL pseudo-transactions

## 0.2.6 (2019-12-31)

- Update dependencies
  - decimal.js, fs-extra, mocha, handlebars, bn.js, babel-eslint, ripple-address-codec

## 0.2.5 (2019-12-14)

- Add support for AccountDelete (#37)

## 0.2.4 (2019-09-04)

- Update ripple-address-codec to 3.0.4

## 0.2.3 (2019-08-29)

- Expand node version compatibility (#32, #33)

## 0.2.2 (2019-07-26)

- Input validation - Amount and Fee should not allow fractional XRP drops ([#31](https://github.com/ripple/ripple-binary-codec/issues/31))
- Fix lint errors
- Update dependencies (including lodash and mocha)
- Require node 10 (.nvmrc)
- Remove assert-diff
- Remove codecov.io as it did not appear to work. The `package.json` script was:
  - `"codecov": "cat ./coverage/coverage.json | ./node_modules/codecov.io/bin/codecov.io.js"`

## 0.2.1

- Add tecKILLED from amendment fix1578 (PR #27 fixes #25)

## 0.2.0

- Add DepositPreauth fields
  - https://developers.ripple.com/depositauth.html

## 0.1.14

- Skip amount validation when deserializing f72c115

## 0.1.13

- Add Check, CheckCreate, CheckCash, CheckCancel

## 0.1.11

- Add ledger header decode function

## 0.1.8

## 0.1.7

## 0.1.6

## 0.1.3
