# ripple-keypairs Release History

## Unreleased

## 2.0.0 Beta 1 (2023-10-19)

### Breaking Changes
* Bump typescript to 5.x
* Remove Node 14 support
* Remove `assert` dependency. If you were catching `AssertionError` you need to change to `Error`.
* Fix `deriveKeypair` ignoring manual decoding algorithm. (Specifying algorithm=`ed25519` in `opts` now works on secrets like `sNa1...`)
* Remove `crypto` polyfills, `create-hash`, `elliptic`, `hash.js`, and their many dependencies in favor of `@noble/hashes` and `@nobel/curves`
* Remove `bytesToHex` and `hexToBytes`.  They can now be found in `@xrplf/isomorphic/utils`
* `verifyTransaction` will throw an error if there is no signature
* Improved key algorithm detection. It will now throw Errors with helpful messages

### Changes
* Remove `brorand` as a dependency and use `@xrplf/isomorphic` instead.

## 1.3.1 (2023-09-27)
### Fixed
* Fix source-maps not finding their designated source

## 1.3.0 (2023-06-13)
### Added
* Adds support for npm v9

## 1.1.5 (2023-03-08)
### Changed
- All tests now use the Jest test runner and have been refactored for consistency across all packages

## 1.1.4 (2022-05-02)
- `hexToBytes` now produces empty output for empty input, rather than `[0]`.
- Extend `bytesToHex` to work correctly with any input type accepted by `Array.from`.
  In particular, it now produces correct output for typed arrays such as `UInt8Array`.

## 1.1.1 (2021-12-1)
- Fix issue where npm < 7 was not allowed to install the library

## 1.1.0 (2021-11-15)
- Converts ripple-keypairs into a monorepo with ripple-binary-codec,
  ripple-address-codec, and xrpl. Changes to build tooling but no new features or
  bug fixes

## 1.0.3 (2021-02-22)

* Update dependencies:
  * elliptic to 6.5.4 - includes security fix, although ripple-keypairs should not be susceptible because the vulnerable code is meant only for DH key exchange, which we do not use
  * ripple-address-codec to 4.1.2
  * bn.js, ts-node, @types/node, @types/mocha, codecov, prettier, typescript, eslint-config-prettier, eslint-plugin-import, elint-config-airbnb-base, eslint-plugin-prettier, ts-node, mocha

## 1.0.2 (2020-09-12)

* Drop support for Node.js version 8 (#171)
  * Node.js v8 reached End-of-Life on 31st December 2019. As ripple-keypairs is a security-sensitive library, we recommend upgrading to Node.js 10 or higher immediately. ([Node.js Releases](https://nodejs.org/en/about/releases/))
* Internal
  * Update dependencies (#170) (#163) (#173) (#172) (#175) (#177) (#179) (#180) (#181)
  * Bump elliptic from 6.5.2 to 6.5.3 (#190)
    * We do not believe that the issue fixed in this patch affects ripple-keypairs in any way, but we are bumping the dependency just to stay up-to-date.
  * Bump lodash from 4.17.15 to 4.17.20 (#207)
* Add GitHub Actions CI (#221)

## 1.0.1 (2020-05-12)

* Update dependencies
  * codecov, eslint-config-airbnb-typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @types/node, eslint-plugin-mocha, typescript, mocha
* This will probably be the last version to support Node.js version 8, which reached End-of-Life on 31st December 2019. If you are still using Node.js 8, we recommend upgrading to version 10 or higher as soon as possible. ([Node.js Releases](https://nodejs.org/en/about/releases/))

## 1.0.0 (2020-02-05)

* Refactor and use TypeScript
* Use Travis CI (.travis.yml)
* Use "dist/*" for distribution files
* Add yarn.lock
* Export members and add default export
* Internal
  * Use published ripple-address-codec (#58)
  * Replace TSLint with ESLint + Prettier (#71)
  * Add type (#74)
  * Remove unused code (#81)
  * Add tests (#82)
  * Improve comments (#90)
  * Remove Babel (#33)
* Update dependencies
  * @types/node, eslint, bn.js, typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, mocha, istanbul, hash.js

## 0.11.0 (2018-10-23)

* Upgrade elliptic (#28)

## 0.10.2

* Remove unused devDependencies

## 0.10.1 (2017-11-10)

* [Verify that generated keypairs can correctly sign a message](https://github.com/ripple/ripple-keypairs/pull/22)
