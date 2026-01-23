# @xrplf/isomorphic Release History

## Unreleased

### Fixed
* Updated the linter devDependencies to latest versions @xrplf/eslint-config@3.0.0, eslint-plugin-array-func@5.1.0 and eslint-plugin-tsdoc@0.5.0. As a consequence of the updates to `eslint-plugin-array-func`, all the eslint-config files have been updated from CommonJS format to ESM format to maintain compatibility.
* Accomodated updates to the APIs of `webpack-merge`, `typescript v5.9` `@noble/curves` dependencies. No behavioral changes introduced.

## 1.0.1 (2024-06-03)

### Fixed

* Throw error if `hexToBytes` or `hexToString` is provided a string that is not in hex

## 1.0.0 (2024-02-01)

Initial release providing isomorphic and tree-shakable implementations of:

* ripemd160
* sha256
* sha512
* bytesToHash
* hashToBytes
* hexToString
* stringToHex
* randomBytes
* stringToHex
* ws
