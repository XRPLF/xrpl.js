# ripple-address-cod

## 4.1.3 (2021-05-10)

* Update dependencies
* Add `build` script as an alias for `compile`
* Update README

## 4.1.2 (2021-01-11)

* Internal dependencies
  * Update jest, ts-jest, typescript, lodash
    * Fix potential moderate severity vulnerabilities
  * Update @types/node, @types/jest, base-x
* Docs
  * Update example for encoding test address
  * Document functions (#73)
  * xAddressToClassicAddress when there is no tag (#114)
  * Add README badges (#120)
  * Add LICENSE (#138)
* Cleanup and polish
  * Add GitHub CI (#115)
  * Fix linting

## 4.1.1 (2020-04-03)

* Require node v10+
* CI: Drop node 6 & 8 and add node 13
* Update dependencies
  * Bump @types/node to 13.7.7 (#60)
  * Bump jest and ts-jest (#40)
  * Bump @types/jest to 25.1.2 (#51)
  * Bump ts-jest from 25.0.0 to 25.2.0 (#50)
  * Bump typescript from 3.7.5 to 3.8.3 (#61)
  * Update all dependencies in yarn.lock

## 4.1.0 (2020-01-22)

* Throwable 'unexpected_payload_length' error: The message has been expanded with ' Ensure that the bytes are a Buffer.'
* Docs (readme): Correct X-address to classic address example (#15) (thanks @RareData)

### New Features

* `encodeAccountPublic` - Encode a public key, as for payment channels
* `decodeAccountPublic` - Decode a public key, as for payment channels

* Internal
  * Update dependencies: ts-jest, @types/jest, @types/node, typescript, tslint,
    base-x

## 4.0.0 (2019-10-08)

### Breaking Changes

* `decodeAddress` has been renamed to `decodeAccountID`
* `isValidAddress` has been renamed to `isValidClassicAddress`

### New Features

* `classicAddressToXAddress` - Derive X-address from classic address, tag, and network ID
* `encodeXAddress` - Encode account ID, tag, and network ID as an X-address
* `xAddressToClassicAddress` - Decode an X-address to account ID, tag, and network ID
* `decodeXAddress` - Convert X-address to classic address, tag, and network ID
* `isValidXAddress` - Check whether an X-address (X...) is valid
