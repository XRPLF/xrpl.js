# @xrplf/isomorphic Release History

## Unreleased

### Fixed
* `engines` now requires Node.js 20.19.0 or later, matching its ESM-only `@noble` dependencies. The package already failed to load on older Node.js versions.

## 1.0.2 (2026-06-04)
* bump @noble/hashes from 1.8.0 to 2.0.1

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
