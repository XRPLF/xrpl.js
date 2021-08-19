# ripple-lib Release History

Subscribe to [the **ripple-lib-announce** mailing list](https://groups.google.com/forum/#!forum/ripple-lib-announce) for release announcements. We recommend that ripple-lib users stay up-to-date with the latest stable release.

## 1.10.0 (2021-08-12)

* Add address generation from Devnet/Testnet faucets (#1497)
* Fix bug with `getBalances()` ledgerVersion (#1505)
* Include lodash in webpack build (#1500)
* Documentation Updates:
  * Export and document AccountSetFlags (#1525)
  * Add links to example keypair derivation (#1523)

## 1.9.8 (2021-07-30)

* Export offline methods to top level of package (#1479)
* Remove deprecated ledger fields (#1160)
  * These fields have been deprecated for many years: accepted, hash (use ledger_hash instead), seqNum (use ledger_index instead), totalCoins (use total_coins instead)
* Docs improvements (#1251, #1420, #1463)
* Reduce dependencies on lodash (#1467)
* Bug fixes
  * Allow lowercase hex for memos (#1475)
  * Add type argument to Promise (#1474)
  * Fix miscommunication with ripplingDisabled in trustlines (#1481)
  * Allow X-address for issuer (#1471)
* Dependencies
  * ws, ripple-binary-codec
  * deps-dev: typescript, @types/node, ts-node

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
f3a0efb9f8bb618da6b10425a9b55a8492359a331a22d0ab4de7d3551870eb3d  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
fd40457a89a14732ce261148e129cdda5aa963d9a433c57700353083faa1bffe  build/ripple-latest.js
```

## 1.9.7 (2021-07-14)

* Bug fixes
  * TypeScript: fix TrustlineTransaction type (#1458) (#1460) (thanks @mrosendin)
* Docs
  * Update boilerplate (#1459) (thanks @mDuo13)
* Dependencies
  * @types/node, @types/ws, @types/lodash, @types/mocha, prettier, mocha, webpack, ripple-binary-codec, ws, webpack-cli, doctoc

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
a994422648c040076251c9a040fd494bc2ee30de23867607985b953022853afc  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
2e22b6187ff5f9300520c29a538013067609b439181f1f2184d6a80fcfa2449c  build/ripple-latest.js
```

## 1.9.6 (2021-07-01)

* Bug fixes
  * Use 'current' ledger when preparing txs (#1429) (#999)
  * Allow multiple settings at once (#1435)
* Dependencies
  * ripple-address-codec, prettier, mocha

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
cac7f6f3be93efbd61dc5fd527c40f0d1baec06f2f9faa64e9eeb191cc85a710  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
5737483e940dca8b73768d8a1de8217c7e921a9cebaadef02d2b16867658f331  build/ripple-latest.js
```

## 1.9.5 (2021-06-01)

* Bug fixes
  * Prevent getFee from returning NaN from Reporting Mode (#1401) (#1398)
  * Return promise inside catch block of reconnect to propagate promise (#1418) (#1113) (thanks @camposfyi)
  * Internal
    * Update mocha to use RC file config (#1417) (#1210) (thanks @camposfyi)
* Dependencies
  * @types/ws, ws, browserslist, @types/lodash

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
fcdc4aa1e1df7cb788b68f3d036e168aa64f9e818f441b99fef62d4571c0387d  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
dfb7a92c4156fb3ee367254b5ea0935cda741cd3b5c36cdca695e7d89f88605e  build/ripple-latest.js
```

## 1.9.4 (2021-04-18)

* Add memos support for all transaction types for getTransactions (#1353, #1397)
* Add Deno and React instructions (#1387)

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
daa2b892a18037e89fea6fcf7de67624a782971956cb8df17cd765a4b0201ee9  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
b1d0bab54c6dbc76091610ede54a4269e73dea8cc6a9c25738d62bd7671920e4  build/ripple-latest.js
```

## 1.9.3 (2021-03-16)

* Expose ripple-address-codec methods. These are static methods on RippleAPI, so you do not need to create a RippleAPI instance.
  * `classicAddressToXAddress` / `xAddressToClassicAddress`
  * `isValidXAddress` / `isValidClassicAddress`
  * `encodeSeed` / `decodeSeed`
  * `encodeAccountID` / `decodeAccountID`
  * `encodeNodePublic` / `decodeNodePublic`
  * `encodeAccountPublic` / `decodeAccountPublic`
  * `encodeXAddress` / `decodeXAddress`

Example 1. Encode an X-address with tag 4294967295:
```js
const RippleAPI = require('ripple-lib').RippleAPI
const xAddress = RippleAPI.classicAddressToXAddress('rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf', 4294967295)
console.log(xAddress)
```

Output for Example 1:
```
XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi
```

Example 2. Encode a test address for use with Testnet or Devnet:
```js
const RippleAPI = require('ripple-lib').RippleAPI
const address = RippleAPI.classicAddressToXAddress('r3SVzk8ApofDJuVBPKdmbbLjWGCCXpBQ2g', 123, true)
console.log(address)
```

Output for Example 2:
```
T7oKJ3q7s94kDH6tpkBowhetT1JKfcfdSCmAXbS75iATyLD
```

Example 3. Decode an X-address:
```js
const RippleAPI = require('ripple-lib').RippleAPI
const address = RippleAPI.xAddressToClassicAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi')
console.log(address)
```

Output for Example 3:
```js
{
  classicAddress: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
  tag: 4294967295,
  test: false
}
```

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
bcc8db4e5464197151a267d9f240693794bf1eb4d26a4e0b3637f82a1d66e440  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
99c2825685d249c074abe7b59abaf197afce67ece7ad08ded6db67185e916dd2  build/ripple-latest.js
```

## 1.9.2 (2021-03-12)

* Docs
  * Add missing transaction type links (#1378)
* Bug fixes
  * Deserialization and verification of payment paths (#1382) (#1347) (#1376)
* Dependencies
  * Bump ripple-binary-codec to 1.1.2
    * Fix edge case when constructing a value from "0", which can occur when using rippled v1.7.0
  * Bump lodash, ripple-address-codec

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
a1fd24b65d81ea5dbc36d74da7a6317267a048bba084effff5380d47299c3c63  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
410f78105c4f23c13671ec94f963ef47179393bfcad65ff610bc838c5a3c6a65  build/ripple-latest.js
```

## 1.9.1 (2021-02-25)

* Docs
  * Add transaction specifications: (#1352)
    * Ticket Create
    * Account Delete
    * Deposit Preauth
  * Update link to subscribe page (#1354)
* Bug fixes
  * Allow connectionTimeout option to be customized (#1355)
* Dependencies
  * Bump ripple-keypairs to 1.0.3
  * Bump elliptic to 6.5.4 (this patches a potential security issue, although we do not believe that the issue affects ripple-lib: [details](https://github.com/ripple/ripple-keypairs/security/advisories/GHSA-w6x3-9ph2-7x54))

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
f59e0221a7218460eea59b0441a0ee2d2a14484dd473ed5373283852798516c7  build/ripple-latest-min.js
fc17a5572001d814ea6b81aa701fcb66882ec031c68afb769a8ea8b71c6529a6  build/ripple-latest-min.js.LICENSE.txt
731ed44cbff8db26bcf256e0e3f3ac3fe90a10b6c227701d67918a5d643c5b29  build/ripple-latest.js
```

## 1.9.0 (2020-12-07)

* New features
  * Support for tickets (TicketBatch amendment required - not yet activated on live/main network)
    * `prepareTicketCreate`
  * Types: Add LedgerClosedEvent and export more types
* Docs
  * Improve descriptions of get-ledger response time fields
  * Applications
    * Add Bithomp explorer
    * Add example of reliable transaction submission
* Node.js
  * Require Node.js version 10.13.0+
* Internal
  * Update webpack, webpack-cli, mocha, nyc, ripple-binary-codec
  * Run prettier to format code

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 build/*
2d3ae057ad637df272f98cfe940ea9e1317588e5bbf4fee47c8b16d6e6e71d85  build/ripple-latest-min.js
8cbbc7bb482f68bcc8d411bae2e42effdb14ddfa562fcbc329a373910b85cf8c  build/ripple-latest.js
```

## 1.8.2 (2020-10-23)

* Bug fixes
  * Browser compatibility: Use ripple-binary-codec 0.2.x to prevent browser issues (#1321)
  * Memory leak: Clear awaiting response promises to prevent memory leak (#1302)
* Feature: getSettings() - allow ledgerVersion to be 'validated', 'closed', or 'current' (#1298)
* Docs: Update APPLICATIONS.md

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 *
ba760c36028b8a3ce267386e188a422890dfb1b03bc87c852a4c2034ea9bac2e  ripple-latest-min.js
7e5281eb9623602284b9f11564f0f3a36cfde305f2c2f7a32e0d29a04913c817  ripple-latest.js
```

## 1.8.1 (2020-09-25)

* Internal
  * Bump elliptic to 6.5.3 (this patches a potential security issue, although we do not believe that the issue affects ripple-lib)
  * Bump ripple-binary-codec to 1.0.2
  * Bump lodash to 4.17.19

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 *
0895f349944fa11bb1976b2c350c0eb143dfd09abbfc7c2be33aed5c2a4b9ee8  ripple-latest-min.js
7c00188a28f9d295d8e66aa08b340294d2fe49f635d154fb0df049ae8572c195  ripple-latest.js
```

## 1.8.0 (2020-07-06)

* [Document `request('submit', ...)` method](https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#submit), which includes additional useful information in the response
* Update [list of applications using ripple-lib](https://github.com/ripple/ripple-lib/blob/1.7.0/APPLICATIONS.md)

## 1.7.1 (2020-05-26)

* Fix preparePayment when using source.amount/destination.minAmount (#1295) (Fix #1237) (Thanks to @leobel)
* Docs
  * Fix generateXAddress example (#1286)
  * Update Transaction Streams link (#1278)
* Dependencies
  * Update assert-diff, mocha, webpack-bundle-analyzer, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, @types/ws, @types/node, ws, ts-node, eventemitter2

## 1.7.0 (2020-04-28)

* Export hashing functions (#1275)
* Add failHard (fail_hard) option in `submit` method (#1029)
* Add type for parseAccountFlags (#1258)
* Add api.connection.getReserveBase() (#1259)
* Travis: remove node 8 (#1257)
* Dependencies
  * Update ripple-address-codec, @types/ws, @types/lodash, https-proxy-agent
  * Update devDependencies: eventemitter2, nyc, ejs, @types/node, webpack, ts-node, prettier, @typescript-eslint/eslint-plugin

## 1.6.5 (2020-03-23)

* APPLICATIONS.md: Add xrplorer.com
* Internal: Fix typos
* Dependencies
  * Update @types/ws, @types/node, @typescript-eslint/eslint-plugin, @types/mocha, webpack, typescript, mocha, assert-diff
  * Remove mocha-junit-reporter

## 1.6.4 (2020-02-18)

* Fix generateXAddress() and generateAddress() with no entropy (#1211, #1209)
* Internal
  * Improve unit tests
* Dependencies
  * Update webpack-cli, @types/node, webpack, @typescript-eslint/eslint-plugin,
    typescript, ripple-keypairs

## 1.6.3 (2020-02-05)

* Update ripple-keypairs to 1.0.0
* Bug fix: Assign event listener to socket close event on open before attempting post-open logic (#1186)
  * Protects against possible unhandled rejection in disconnect
  * Adds the Connection `_ws.close` event listener post `_ws.open` before executing any post `_ws.open` logic, i.e. `Connection._subscribeToLedger`
  * This prevents a reconnection error loop that occurs if `Connection._ws` is never cleaned up by the unreachable `_ws.close` event listener
  * Also ensures that a possible disconnect() promise rejection is not unhandled if any `_ws.open` logic in `Connection.connect()` throws
* Dependencies
  * Update mocha-junit-reporter, @types/node, mocha, @typescript-eslint/eslint-plugin, ripple-address-codec

## 1.6.2 (2020-01-17)

* Bug fix: Catch possible error in reconnect() on _heartbeat(), emit reconnect error (#1179)
* Docs: Fix whitespace
* Dependencies
  * Update @typescript-eslint/eslint-plugin, ts-node, @types/node, @types/ws, typescript

## 1.6.1 (2020-01-14)

> **Update Note:** In this release we refactored the internal connection logic of ripple-lib to improve resiliency across dropped messages and reconnects. The external interface remains the same, with zero changes to public methods/properties. However, If you experience any problems around connections, requests, and request retries, please [file an issue]( https://github.com/ripple/ripple-lib/issues/new) with the repo (and be sure to test against v1.6.0 to confirm that the problem was introduced in this version).

* Documentation
  * Document message type 'path_find' (#1121) (thanks @r0bertz)
  * Improve documentation for address generation; functions that can be called offline; generateXAddress() (#1158, #1159, #1169) (thanks @hbergren)
  * Add [Security Policy](https://github.com/ripple/ripple-lib/blob/develop/SECURITY.md)
* Bug fixes
  * Types: Fix AccountObjectsResponse structure (#1127) (thanks @you21979)
  * In some cases, ripple-lib would fail to wait for the connection to be ready (#1119)
* Dependencies
  * Update docs dependencies, ejs and doctoc (#1153)
  * Update eslint, ripple-lib-transactionparser, typescript, nyc, ws, @types/node, ripple-binary-codec, mocha, mocha-junit-reporter
* Internal
  * Add LedgerHistory to Connection (#1119): Moved ledger logic into its own Ledger class

## 1.6.0 (2020-01-06)

* Add support for AccountDelete (#1120)
* Improve error type given on rejected message _send to be DisconnectedError (#1098)
* Internal
  * Add unit test for unhandled promise rejection warning on message _send (#1098)
* Dependencies
  * Update @types/node, @typescript-eslint/parser

## 1.5.1 (2019-12-28)

* Fix support for CDNs (#1142)
* Internal
  * Clean up connection trace logic (#1114)
  * Clean up the connection config (#1115)
  * Run prettier format (#1116)
  * Update eslint command (#1118)
* Dependencies
  * Update webpack-cli, webpack, ts-node, @types/lodash, @types/ws, @types/node, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, https-proxy-agent, mocha, eventemitter2

## 1.5.0 (2019-12-14)

* Add support for `WalletLocator` (#1083)
* Types: Move and de-dupe `TransactionJSON` type (#1096)
  * This resolves an error surfaced by [TypeScript 3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#local-and-imported-type-declarations-now-conflict)
* Add a heartbeat to detect hung connections (#1101)
* Dependencies
  * Update TypeScript version (#1096)
  * Update ripple-lib-transactionparser to 0.8.1 (#1097)
  * Update ripple-binary-codec to 0.2.5
  * Update webpack (#1112)
  * Require node 8 and yarn (#1107)
* Testing: Refactor and add unit tests
  * Fix some errors caught by the improved tests

## 1.4.2 (2019-11-14)

* Add support for tick size (#1090) (thanks @RareData)
* Update email hash default to allow proper clearing (#1089) (thanks @RareData)
* Fix Unhandled Promise Rejection Warning on message `_send`
  * Add an immediate catch to the `_send` promise passed to `_whenReady` in case there is rejection before async handlers are added (#1092) (thanks @nickewansmith)
* Docs improvements
  * Add XRP Toolkit reference (#1088)
* Internal improvements
  * Add a prettier config
  * Update Node.js Testing Versions (#1085)
    * Testing matrix based on: https://nodejs.org/en/about/releases/
      - Node 11 is no longer supported (not LTS)
      - Node 12 added (active LTS)
      - Node 13 added ("current" release)

## 1.4.1 (2019-11-06)

* Compatibility: Change TypeScript compile target back to `es6` (#1071)
  * WARNING: This allows for the use of Node v6, which is no longer supported by Node.js, as it was end-of-life'd in April 2019
  * We recommend updating to Node v8/v10 ASAP in order to get security updates and fixes from the Node.js team
  * We are not actively running tests against Node v6 (ref #1076)
* Docs: `getAccountObjects` doc fix
* Dependencies:
  * Update `bignumber.js`
  * Update `ripple-keypairs`
  * Update `ws`
* Build process: Update `webpack` flow

## 1.4.0 (2019-10-28)

* Unref timer so it does not hang the Node.js process
* Add a 2-second timeout for connect()
* Improve getTransaction() error when tx has not been validated yet
* Add support for the new X-address format
* Fix error in Safari, Chrome 78, Firefox 70
* Some error messages have changed slightly. For example:
  * `-instance.Account is not of a type(s) string,instance.Account does not conform to the "address" format`
  * `+instance.Account is not of a type(s) string,instance.Account is not exactly one from <xAddress>,<classicAddress>`

### Internal improvements

* Reduce dependency size
* Move tests to TypeScript
* Replace tslint with eslint
* Update https-proxy-agent
* Add tests

## 1.3.4 (2019-10-18)

* Update ripple-lib-transactionparser
* Improve error message when signing fails (e.g. due to trailing zeros)
* Integrate ripple-hashes (in TypeScript with improved naming and docs)
* Add multi-signing example to sign() method docs
* Update TypeScript

## 1.3.3 (2019-09-10)

* Expand node version compatibility to support Node.js 12 ([ripple-binary-codec#32](https://github.com/ripple/ripple-binary-codec/issues/32))

## 1.3.2 (2019-09-03)

* Export and document `rippleTimeToISO8601()` method
* Add type for isValidAddress (fixes error TS7016, #1032)
* Docs: update recommended Node.js version (#1031)

When using this release with [rippled](https://github.com/ripple/rippled), we recommend using [rippled version 1.3.1](https://github.com/ripple/rippled/releases/tag/1.3.1) or later.

## 1.3.1 (2019-08-26)

* Upgrade to gulp 4 (#1030)
* Remove http server (unused)
* Update dependencies

There are no changes in the browser version with this release. The npm package for Node.js should be slightly smaller.

When using this release with [rippled](https://github.com/ripple/rippled), we recommend using [rippled version 1.3.1](https://github.com/ripple/rippled/releases/tag/1.3.1).

## 1.3.0 (2019-08-16)

### Bug fixes:

* Breaking change: Fix `getServerInfo` (#1012)

Before:
```
{
  // ...
  "load": {
    "jobTypes": {
      "0": {"jobType": "untrustedValidation", "perSecond": 10},
      "1": {"jobType": "ledgerData", "peakTime": 2, "perSecond": 2},
      "2": {"inProgress": 1, "jobType": "clientCommand", "perSecond": 1},
      "3": {"jobType": "transaction", "perSecond": 1},
      // ...
    },
    "threads": 6
  },
  // ...
}
```

After:
```
{
  // ...
  "load": {
    "jobTypes": [
      {
        "jobType": "untrustedValidation",
        "perSecond": 8
      },
      {
        "avgTime": 2,
        "jobType": "ledgerData",
        "peakTime": 72,
        "perSecond": 2
      },
      {
        "inProgress": 1,
        "jobType": "clientCommand",
        "perSecond": 1
      },
      {
        "jobType": "transaction",
        "perSecond": 1
      },
      // ...
    ],
    "threads": 6
  },
  // ...
}
```

* Sign method - verify accurate encoding (#1026)
  * In previous versions, the following could be encoded incorrectly:
    * Amounts of XRP with more than 6 decimal places
    * Amounts of XRP drops with any decimal places
  * In versions 1.2.5 and 1.3.0, amounts that are invalid in this way will throw an error
* Expand `APIOptions` by extending `ConnectionOptions` (#1018, fixes #1017)
* Fix docs for destination.address (#1011)

### New features:

* Support removing a signer list (#1021)
* Export `setCanonicalFlag` method from `src/transaction/utils`

### Improvements:

* Clean up phrasing in schema descriptions (#1023)
* Improve docs
* Update dependencies

Since this release fixes a bug that could cause transactions to be serialized incorrectly during the signing process, it has also been simultaneously released as version 1.2.5 (patch release).

When using this release with [rippled](https://github.com/ripple/rippled), we recommend using [rippled version 1.3.1](https://github.com/ripple/rippled/releases/tag/1.3.1).

## 1.2.4 (2019-06-06)

* Update README.md
* Clarify docs
* Update dependencies
* Fix typos

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
4f09c056ccc51bc6cf17b128b559112e9c5adf19cc96ac8f9a06faee185697a7  ripple-1.2.4-debug.js
5da1c75a02d76b0b105d98355ee4561f5d5036e8d5d0237efd5960812dcaa1fd  ripple-1.2.4-min.js
e147f303e880a65db149d2a5b9183b75814bd8145cd00740bcc4679d867192c8  ripple-1.2.4.js
```

## 1.2.3 (2019-04-30)

* Fix browser builds

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
efb0f29cde94534a015d8a2171abb11b9a4345ba01418bf5b6ab6042a6d51dde  ripple-1.2.3-debug.js
b86145c0e30099b966ed8d3830ba25988d72877f1f87044d9954d6707be098ac  ripple-1.2.3-min.js
e027d91c7321d41ba94bb1bdc77dcff0107a5fd9eb833c6dbd06f1bbedef3900  ripple-1.2.3.js
```

## 1.2.2 (2019-04-15)

* Prevent `prepareTransaction` from overwriting `Fee` and/or `LastLedgerSequence` (#997)
* Add `deliveredAmount` as optional field for type `Outcome` (#996)
* Fix build failure with TS strict checks (#993)

Minor changes:

* Use TypeScript project references
* Travis: Drop node 9 and add node 11 for testing
* Bump versions of devDependencies

Note: There is no browser version of this release.

## 1.2.1 (2019-03-23)

* Update `ripple-binary-codec` to 0.2.1 to support `tecKILLED`

The SHA-256 checksums for the browser version of this release can be found
below.

```
% shasum -a 256 *
531c2a8f4bf6d6b5bd4afe6a40b6a68a77179a343902cfa4210d7e35b5697af0  ripple-1.2.1-debug.js
201ee99922b16b7e32afb5317ef4bb9facc23b20c272bb5c4ed7010f5d996cab  ripple-1.2.1-min.js
c1b984581299bf00e0e3c8ac4e62eadfc9b190bd78a2458a76e59ceb56046148  ripple-1.2.1.js
```

## 1.2.0 (2019-03-19)

This release:

* changes the way you handle errors for the `prepare*` methods.
* improves the `message` field of `RippledError`s.
* allows `Sequence` to be set in the transaction JSON provided to
  `prepareTransaction`.

For details, continue reading:

### [BREAKING CHANGE] `prepare*` methods reject the Promise on error

The `prepare*` methods now always reject the Promise when an error occurs, instead of throwing.

Previously, the methods would synchronously throw on validation errors, despite being asynchronous methods that return Promises.

In other words, to handle errors in the past, you would need to use a try/catch block:

```
// OBSOLETE - no need for try/catch anymore
try {
  api.preparePayment(address, payment, instructions).then(prepared => {
    res.send(prepared.txJSON);
  }).catch(error => {
    // Handle asynchronous error
  });
} catch (error) {
    // Handle synchronous error
}
```

Now, you can rely on the Promise's `catch` handler, which is called with the error when the Promise is rejected:

```
api.preparePayment(address, payment, instructions).then(prepared => {
  res.send(prepared.txJSON);
}).catch(error => {
  // Handle error
});
```

This applies to:
* preparePayment
* prepareTrustline
* prepareOrder
* prepareOrderCancellation
* prepareSettings
* prepareEscrowCreation
* prepareEscrowExecution
* prepareCheckCreate
* prepareCheckCash
* prepareCheckCancel
* preparePaymentChannelCreate
* preparePaymentChannelClaim
* preparePaymentChannelFund

### Improved `RippledError` `message`

Previously, `RippledErrors` (errors from rippled) used rippled's `error` field as the `message`.

Now, the `error_message` field is used as the `message`.

This helps to surface the specific cause of an error.

For example, before:
```
[RippledError(invalidParams, { error: 'invalidParams',
  error_code: 31,
  error_message: 'Missing field \'account\'.',
  id: 3,
  request: { command: 'account_info', id: 3 },
  status: 'error',
  type: 'response' })]
```

After:
```
[RippledError(Missing field 'account'., { error: 'invalidParams',
  error_code: 31,
  error_message: 'Missing field \'account\'.',
  id: 3,
  request: { command: 'account_info', id: 3 },
  status: 'error',
  type: 'response' })]
```

In this case, you can see at a glance that `account` is the missing field.

The `error` field is still available in `errorObject.data.error`.

When `error_message` is not set (as with e.g. error 'entryNotFound'), the `error` field is used as the `message`.

### [BUG FIX] `prepareTransaction` does not overwrite the `Sequence` field

The `prepareTransaction` method now allows `Sequence` to be set in the Transaction JSON object, instead of overwriting it with the account's expected sequence based on the state of the ledger.

Previously, you had to use the `sequence` field in the `instructions` object to manually set a transaction's sequence number.

### New in rippled 1.2.1

As this is the first release of ripple-lib following the release of rippled 1.2.1, we would like to highlight the following API improvements:

1. The [`delivered_amount` field](https://developers.ripple.com/partial-payments.html#the-delivered-amount-field) has been added to the `ledger` method, and to transaction subscriptions.

        api.getLedger({includeTransactions: true, includeAllData: true, ledgerVersion: 17718771}).then(...)

    You can also call `ledger` directly:

        request('ledger', {...}).then(...)

2. [Support for Ed25519 seeds encoded using ripple-lib](https://github.com/ripple/rippled/pull/2734)

You have access to these improvements when you use a rippled server running version 1.2.1 or later. At the time of writing, we recommend using rippled version **1.2.2** or later.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
13021fe3efbdd59faf68597b0b18204b39847b285cca82f84c737e3d19922cc2  ripple-1.2.0-debug.js
0070225e731afd8c2c0a0976111ebf326c19a96ee1549368de9f016abdd53d2f  ripple-1.2.0-min.js
d440268397c03ad5137a3294e53a07b959ef93cd23b1990d6f82621c4776ba9f  ripple-1.2.0.js
```

## 1.1.2 (2018-12-12)

+ Update `submit` response (#978)
  + Includes the full object returned by rippled, while keeping the existing
    fields for backward compatibility
+ Add `getLedger` option for ledger hash (#980)
  + Use the `ledgerHash` option to get a specific ledger by hash

Thanks to @alexchiriac for the contributions in this release.

When using `ripple-lib` with `rippled`, we recommend using `rippled` version
1.1.2 or later.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
e6cc52395d0c3e205263777ba2e528e50f4d1f84bb4b16763a3bf7f5fcc290f5  ripple-1.1.2-debug.js
82df879bc2970e0e4fd161975a99448b4859b0cde751d8ea34e9f51d672090b9  ripple-1.1.2-min.js
12f56330dc71bba8ac3004025cbc9698413a0c619df302dda105b31228a67319  ripple-1.1.2.js
```

## 1.1.1 (2018-11-27)

+ Fix `getOrderbook` offer sorting (#970)
  + **BREAKING CHANGE:** The ordering of offers returned by `getOrderbook` has
    been changed so that offers with the best quality are sorted first
+ Add new helper methods for working with the `rippled` APIs:
  + `formatBidsAndAsks`: Takes offers and returns a formatted order book object
    with bids and asks
  + `renameCounterpartyToIssuer`: Takes an object and renames the `counterparty`
    field to `issuer`
+ TypeScript: Add return type for `generateAddress` (#968)

When using `ripple-lib` with `rippled`, we recommend using `rippled` version 1.1.1 or
later.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
e151900e49bb5482b02bef5b0b1542ea586076363b072ae616f6d4d2f7f5b8a1  ripple-1.1.1-debug.js
6aee3757b29de285f361e20862261090033c07a13fd09f4a3cc4c097b6e84b55  ripple-1.1.1-min.js
bea4a889fb9ee4092324c6667490ea66469bdde869ddc1aaddf5e9d12b0cf091  ripple-1.1.1.js
```

## 1.1.0 (2018-10-31)

+ Add support for Node.js v10 LTS (#964)
+ Add [DepositPreauth](https://developers.ripple.com/depositauth.html) ([#958](https://github.com/ripple/ripple-lib/pull/958))
+ In `FormattedTransactionType`, the `Outcome`'s `balanceChanges` property had
  the wrong type. This is now fixed (#955)
+ Add/fix docs for: xrpToDrops, dropsToXrp, iso8601ToRippleTime, schemaValidator, isValidAddress, isValidSecret, deriveKeypair, deriveAddress

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
e1d742092b3c0fcee97a875e18db4baeab3bbc82f08b96e883ee188c5f0cfb37  ripple-1.1.0-debug.js
f28921f57a133678dcb3cb54c497626bd76b1f953d22d61f3ddca31c8947d552  ripple-1.1.0-min.js
3696871a80c1102635699994adcaf00cdfdfcff5014fc2eba3d8f8d8437c8f91  ripple-1.1.0.js
```

## 1.0.2 (2018-10-16)

+ Fix #954: Exclude SendMax from all XRP to XRP payments (thanks @jefftrudeau)
+ TypeScript
  + book_offers returns offers type OfferLedgerEntry (#951)
  + Use `object` (#936)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
2556fe17296e127ed44e7066e90a6175e2b164f00ca3c1aa7b1c554f31c688dd  ripple-1.0.2-debug.js
e0342ea21eac32a1024c62034fba09c6f26dd3e7371b23ea1e153e03135cd590  ripple-1.0.2-min.js
c7286c517497d018d02d09257e81172b61d36c8b9885a077af68e8133c3b3b9b  ripple-1.0.2.js
```

## 1.0.1 (2018-09-27)

+ Add address/secret/key validation and derivation methods ([#932](https://github.com/ripple/ripple-lib/pull/932))
  + `isValidAddress(address: string) : boolean`: Checks if the specified string contains a valid address.
  + `isValidSecret(secret: string): boolean`: Checks if the specified string contains a valid secret.
  + `deriveKeypair(seed: string): {privateKey: string, publicKey: string}`: Derive a public and private key from a seed.
  + `deriveAddress(publicKey: string): string`: Derive an XRP Ledger address from a public key.
+ To derive an address from a secret:
  1. Derive the public key from the secret.
  2. Derive the address from the public key.
  + Example: `const address = api.deriveAddress(api.deriveKeypair(secret).publicKey)`
+ Update server regex to accommodate UDS (#944)
+ Include memos when parsing trustlines (#949)
+ Add remaining LedgerEntry types (#943)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
9b6408641ce83659afcd5765c256c35829a4fcb4c3244dc9ca6bf27c871a45c4  ripple-1.0.1-debug.js
7ab2b69fe59c2d4a74638116e2ba3b387155eb2d23e48a01bbf7beb72911f898  ripple-1.0.1-min.js
8bb4dcad9ce25a27003b1d73d71ddf41b8a5af02ece4ebbfeaff4aeb91f3b8c4  ripple-1.0.1.js
```

## 1.0.0 (2018-08-30)

We are pleased to announce the release of `ripple-lib` version 1.0.0.

This version features a range of changes and improvements that make the library
more capable and flexible. It includes new methods for accessing rippled APIs,
including subscriptions.

When using this version with `rippled` for online functionality, we recommend
using `rippled` version 1.0.1 or later.

Here is a summary of the changes since `ripple-lib` version 0.22.0, which was
the last non-beta version.

### New Features

+ [Add `request()`, `hasNextPage()`, and `requestNextPage()` for accessing `rippled`
  APIs](https://github.com/ripple/ripple-lib/blob/09541dae86bc859bf5928ac65b2645dfaaf7f8b1/docs/index.md#rippled-apis).
+ Add `prepareTransaction()` for preparing raw `txJSON`.
+ XRP amounts can be specified in drops. Also, `xrpToDrops()` and `dropsToXrp()`
  are available to make conversions.
+ `getTransaction` responses can include a new `channelChanges` property that
  describes the details of a payment channel.

### Data Validation and Errors

+ [Amounts in drops and XRP are checked for
  validity](https://github.com/ripple/ripple-lib/blob/develop/HISTORY.md#100-beta1-2018-05-24).
+ [A maximum fee is now
  imposed](https://github.com/ripple/ripple-lib/blob/develop/HISTORY.md#100-beta2-2018-06-08). Exceeding it causes a `ValidationError` to be
  thrown.
+ Errors are improved and more data validation was added.
+ Bug fix: `getPaths` now filters paths correctly and works correctly when the
  destination currency is XRP.

### Breaking Changes

The following changes were introduced in 1.0.0.

+ `getTransaction()` and `getTransactions()`
  + The `specification.destination.amount` field has been removed from the parsed transaction response.
  + To determine the amount that a transaction delivered, use `outcome.deliveredAmount`.
  + If you require the provisional requested `Amount` from the original transaction:
    + Use `getTransaction`'s `includeRawTransaction` option, or
    + Use `getTransactions`'s `includeRawTransactions` option, or
    + Use the rippled APIs directly with `request`. For example, call the API methods `tx`, `account_tx`, etc.
+ `getLedger()` response object
  + The `rawTransactions` field has been removed (for consistency with `getTransaction()` and `getTransactions()`).
  + Instead, within each `transaction`, use the new `rawTransaction` JSON string.
  + The `metaData` field has been renamed to `meta` for consistency with rippled's `tx` method.
  + `ledger_index` has been added to each raw transaction.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
06e5efcb6846ad45dedfd85cfa2ef4bdeb608b15ccbfb60b872c995d97342426  ripple-1.0.0-debug.js
cdb26b928a89ce228c727d1ff966df266eb46b2f76bd94f81cbeb0a9d75febf0  ripple-1.0.0-min.js
f74ee804e8a945a994e4e3901a0a3eb52292fbdcbff61ed30cefb8ffbcba50c3  ripple-1.0.0.js
```

## 1.0.0-beta.5 (2018-08-11)

+ [Fix a TypeScript error by importing the `Prepare` type](https://github.com/ripple/ripple-lib/commit/7cd517268bda5fe74b91dad02fedf8b51b7eae9b)

## 1.0.0-beta.4 (2018-08-10)

+ [Add `prepareTransaction()`](https://github.com/ripple/ripple-lib/pull/898)
+ Internal improvements and cleanup

## 1.0.0-beta.3 (2018-07-17)

+ For payment channel transactions, `getTransaction` includes a new
  `channelChanges` property that describes the details of the payment channel.
  (#920)

### Bug Fixes

+ A bug caused calculated fees to use too many decimal places. This was fixed by
  rounding fees to 6 decimal places. (#912)
+ When using the Settings transaction to set up a multi-signing list, the
  threshold and weights fields are required. (#909)
+ Docs: Fix the MIMETYPE in examples with memos. (#914)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
460dbb521e24c44cb53dabc1a74feeca33d031b44d889dd5b51103ca92d51de6  ripple-1.0.0-beta.3-debug.js
cccfd24973c6b7990d9e933a589175dae26249825737fff4f2f73d8558a3f186  ripple-1.0.0-beta.3-min.js
0dc456a58fb078347d9920310621595905085595d73c2b8fe96bea73bcf35450  ripple-1.0.0-beta.3.js
```

## 1.0.0-beta.2 (2018-06-08)

### Breaking Changes

+ During transaction preparation, there is now a maximum fee. Also, when a transaction is signed, its fee is checked and an error is thrown if the fee exceeds the maximum. The default `maxFeeXRP` is `'2'` (2 XRP). Override this value in the RippleAPI constructor.
+ Attempting to prepare a transaction with an exact `fee` higher than `maxFeeXRP` causes a `ValidationError` to be thrown.
+ Attempting to sign a transaction with a fee higher than `maxFeeXRP` causes a `ValidationError` to be thrown.
+ The value returned by `getFee()` is capped at `maxFeeXRP`.

### Other Changes

+ In Transaction Instructions, the `maxFee` parameter is deprecated. Use the `maxFeeXRP` parameter in the RippleAPI constructor.

#### Overview of new fee limit

Most users of ripple-lib do not need to make any code changes to accommodate the new soft limit on fees. The limit is designed to protect against the most severe cases where an unintentionally high fee may be used.

+ When having ripple-lib provide the fee with a `prepare*` method, a maximum fee of `maxFeeXRP` (default 2 XRP) applies. You can prepare more economical transactions by setting a lower `maxFeeXRP`, or support high-priority transactions by setting a higher `maxFeeXRP` in the RippleAPI constructor.
+ When using `sign` with a Fee higher than `maxFeeXRP`, a `ValidationError` is thrown.

If you have any questions or concerns, please open an issue on GitHub.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
ef348a2805098e61395b689b410cbf4bfd35e4d72e38c89f4ab74ec5e19793f5  ripple-1.0.0-beta.2-debug.js
ea33fd53df8c7176d5fbf52dae0b64aade7180860f26449062cdbefaf8bd4d9b  ripple-1.0.0-beta.2-min.js
fe5cc6e97c9b8a1470dacb34f16a64255cd639a25381abe9db1ba79e102456f2  ripple-1.0.0-beta.2.js
```

## 1.0.0-beta.1 (2018-05-24)

### Breaking Changes

+ Amounts in drops and XRP are checked for validity. Some
  methods may now throw a `BigNumber Error` or `ValidationError` if the amount
  is invalid. This may include methods that previously did not throw.
+ Note that 1 drop is equivalent to 0.000001 XRP and 1 XRP is equivalent to 1,000,000 drops.
+ Using drops is recommended. All rippled APIs require XRP amounts to be
  expressed in drops.

### Other Changes

+ Allow specifying amounts in drops for consistency with the `rippled`
  APIs.
+ Export `xrpToDrops()` and `dropsToXrp()` functions.
+ Potentially breaking change: Improve errors. For example, `RippledError` now includes the full response from
  the `rippled` server ([#687](https://github.com/ripple/ripple-lib/issues/687)). `NotConnectedError`
  may be thrown with a different message than before.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
a80ebb39e186640246306eadb2879147458c8271fd3c6cb32e6ef78d0b4b01a5  ripple-1.0.0-beta.1-debug.js
81bcc4b5fd6fd52220ed151242eaddd63eb29c4078845edc68f65b769557d126  ripple-1.0.0-beta.1-min.js
738b4d65b58cf4e3542fa396f8d319a24cd7d0b7aff5ff629a900e244f735ff4  ripple-1.0.0-beta.1.js
```

## 1.0.0-beta.0 (2018-05-10)

+ [Add `request`, `hasNextPage`, and
  `requestNextPage`](https://github.com/ripple/ripple-lib/pull/887).
  + This provides support for all rippled APIs, including subscriptions.

When using rippled APIs, you must:
+ For all XRP amounts, use drops (1 drop = 0.000001 XRP).
+ Instead of `counterparty`, use `issuer`.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
ab2094979a3d6b320c7bc22bc5946c50fa5e29af0976d352e7689b0a4d840c55  ripple-1.0.0-beta.0-debug.js
0e7f7d740606c2866ebf63776b13b41a555848e1a1419e2c8058d2e6c562d7fd  ripple-1.0.0-beta.0-min.js
bd05e8806832ca4192aea7ba2d0362baa9f44605f8e8e6676acd25eb0b94b778  ripple-1.0.0-beta.0.js
```

## 0.22.0 (2018-05-10)

+ [`getOrderbook` - return raw order data](https://github.com/ripple/ripple-lib/pull/886). The full `BookOffer` data is now provided under `data`.

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
33f71b55c4adec4452826e44fe7809377364df04222b60f0fce01e7de2daff33  ripple-0.22.0-debug.js
63232888a4ea77065e8e8eb8fdaa8ebfe3a785428fe935e2667c1ea54c837f29  ripple-0.22.0-min.js
ab98026fabe296bd938297c48cb58e01dfdbe90f3c66c9617d6a3e1efd4c6b93  ripple-0.22.0.js
```

## 0.21.0 (2018-04-11)

+ [Upgrade https-proxy-agent](https://github.com/ripple/ripple-lib/pull/883)
+ [Add getAccountObjects](https://github.com/ripple/ripple-lib/pull/881)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
3ab52209ad4a80393c8c08ef3f4aa9cfb47bc76c0ede2ee9fa7f5ca180ba4d67  ripple-0.21.0-debug.js
3b1efccded347bed5f64757098a1ea6a513bb8932d922d00af47cd24e001dc14  ripple-0.21.0-min.js
db08e5a3eab1f659b4c803543374398004d950ba720adc4b9a7658817cb5c94b  ripple-0.21.0.js
```

## 0.20.0 (2018-04-09)

+ [Add support for using a keypair with sign()](https://github.com/ripple/ripple-lib/pull/769)
+ [Fix a bug caused by jsonschema v1.2.3 by pinning to v1.2.2](https://github.com/ripple/ripple-lib/pull/882)
+ [Improve Payment Channel documentation](https://github.com/ripple/ripple-lib/pull/877)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
389811a9baa72f77e2a43d0b48045762d29a6f616ed5fd2660ba76fc12a3ecc5  ripple-0.20.0-debug.js
c1746ea0dd55318cb4e1ef3955ef14759d9d70861437c69abafc10169916f068  ripple-0.20.0-min.js
17958b0e46395d2b2a35a003693c0babdfb5382513d3cc58a62f8648ad710b0e  ripple-0.20.0.js
```

## 0.19.1 (2018-03-22)

+ [Fix: Include TypeScript declarations in npm package](https://github.com/ripple/ripple-lib/pull/863)
+ [Fix: Documentation link to checkCash](https://github.com/ripple/ripple-lib/pull/871)
+ [Internal: Clean up types and migrate more APIs to new request method](https://github.com/ripple/ripple-lib/pull/857)
+ [Internal: Fix Payment source and destination types](https://github.com/ripple/ripple-lib/pull/870)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
3ed5332aa035c07bae6c1abfdfc8ca77cdbb05cc4b88878f544f1ea4cb793f4d  ripple-0.19.1-debug.js
2f5507aa00a40ab6a94de1822af87db5e927edef3885aef5d9b39ccb623ccb54  ripple-0.19.1-min.js
1e439aee1b220242d56ea687a9b55a67b8614212c1ddbd70a4fcf34503fc487a  ripple-0.19.1.js
```

## 0.19.0 (2018-03-02)

+ [Add support for Checks](https://github.com/ripple/ripple-lib/pull/853)
  + **CheckCreate** adds a check entry to the ledger. The check is a promise from the source of the check that the destination of the check may cash the check and receive up to the SendMax specified on the check. The check may have an (optional) expiration, after which the check may no longer be cashed.
  + **CheckCancel** removes the check from the ledger without transferring funds. Either the check's source or destination can cancel the check at any time. After a check has expired, any account can cancel the check.
  + **CheckCash** is a request by the destination of the check to transfer a requested amount of funds, up to the check's SendMax, from the source to the destination. The destination may receive less than the SendMax due to transfer fees.
+ [Add support for the Deposit Authorization account root flag](https://github.com/ripple/ripple-lib/pull/852)
+ [Generate .ts.d TypeScript declaration files](https://github.com/ripple/ripple-lib/pull/851)
+ [Improve documentation of getTransactions params](https://github.com/ripple/ripple-lib/pull/856)
+ [Add new request interface](https://github.com/ripple/ripple-lib/pull/843) (private for now)

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
0e7ce4594b7e455fbc57ad81f6fddc391d1e1f349a49c96ad783be50f80fdc14  ripple-0.19.0-debug.js
6d716a0357929e51e476f22136880f7a0e5458fd396ac145ce9308f278ff7cc1  ripple-0.19.0-min.js
6715db1af638f99226ab7f8f244103306aa6e04d1b8c1da47a63431053bacb84  ripple-0.19.0.js
```

## 0.18.2 (2018-02-13)

+ [Fix: Publish updated browser builds to npm so that users can easily use
  CDNs](https://github.com/ripple/ripple-lib/pull/849)
+ [Fix: Browserify fails due to dependency on `ws`](https://github.com/ripple/ripple-lib/pull/847)
+ [Fix: `build` script fails when `node_modules` is in path](https://github.com/ripple/ripple-lib/pull/846)
+ [Reduce size of published npm package](https://github.com/ripple/ripple-lib/commit/0c318816ccf25c4c3932934a35ef903cc552edc1)
+ Clean up files from Flow (we migrated to TypeScript)
+ Typos and code cleanup

The SHA-256 checksums for the browser version of this release can be found
below.
```
% shasum -a 256 *
f08ab61137255be3639e9d210ded2a182b6e0388f257a70d9b372ce7e7e518a6  ripple-0.18.2-debug.js
0604835b8421391167b4314ce93a76b5994780a08bd7edf36d91eb5e8f2643a2  ripple-0.18.2-min.js
fda56ab5c8256e04355e20064877ef4053f26c87f37cfcf861340f22bf89ee40  ripple-0.18.2.js
```

## 0.18.1 (2018-01-27)

Note: The package published to npm for this version did not include updated
browser builds. If you are using a CDN that pulls from npm, please use 0.18.2 or
later.

+ [Fix: isSameIssue() should check counterparty](https://github.com/ripple/ripple-lib/pull/836). This bug caused `getOrderbook()` to return incorrect values.

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 *
6871855a2af1dc591ef557d442c11e8c60e01c5932054e13e8cbb84a182f45e0  ripple-0.18.1-debug.js
331f0baff46af44933a8fa31f128132945ff82a147acfff0a7315adb446e3de0  ripple-0.18.1-min.js
26324bb0725d2d484fe3b6086335d49734f45dc647b07c60746e0d8619f1ed3e  ripple-0.18.1.js
```

## 0.18.0 (2018-01-25)

+ [Convert from Flow to TypeScript](https://github.com/ripple/ripple-lib/pull/816)
+ [Use ES Module syntax](https://github.com/ripple/ripple-lib/pull/815) (Babel still compiles these to common.js modules for
  distribution)
+ Docs: [Improve escrow creation example/test](https://github.com/ripple/ripple-lib/pull/820)
+ [Fix type errors](https://github.com/ripple/ripple-lib/pull/811)
+ [Fix lint errors](https://github.com/ripple/ripple-lib/pull/813)

## 0.17.9 (2017-11-14)

+ [Update ws dependency to 3.3.1](https://github.com/ripple/ripple-lib/pull/804)
+ [Remove unnecessary polyfills](https://github.com/ripple/ripple-lib/pull/807)
+ Fix lint errors ([#786](https://github.com/ripple/ripple-lib/pull/786), [#808](https://github.com/ripple/ripple-lib/pull/808))
+ [Update ripple-keypairs dependency to 0.10.1](https://github.com/ripple/ripple-lib/pull/805)

The SHA-256 checksums for the browser version of this release can be found below.
```
% shasum -a 256 *
b52f251eedac2509d72093eab1e8dba0d0f4a9fe6a28ec1cc90853cfb0fd7110  ripple-0.17.9-debug.js
d577a2bbdbdf7535c5365a1c52a2a31989d1b966e30abcba65c87133a536b9dc  ripple-0.17.9-min.js
ff4c3002842fac72ec2ebbd081e9594b0de6050d4d051a8fd6c06adb9a351488  ripple-0.17.9.js
```

The SHA-1 checksums for the browser version of this release can be found below.
```
% shasum *
e1995afc34aef6accd269cfccc55a45619618a41  ripple-0.17.9-debug.js
e6ad9a9c111ab696f5637bfa372d80999e5ae362  ripple-0.17.9-min.js
4866494ec5f9095cc34bea142f1e2b8ac5f7fbf8  ripple-0.17.9.js
```

## 0.17.8 (2017-11-06)

+ Fix: Freezing in Safari 10.1 (updated bignumber.js) (closes #762)
+ [Fix: `getSettings` should include signers](https://github.com/ripple/ripple-lib/commit/2a90f9b134e168937dceb7da283d63734eac9e7c)
+ Update for Node 6
+ Update lodash dependency
+ Migrate to yarn

## 0.17.7 (2017-05-08)

+ Replace AJV with jsonschema

## 0.16.5 (2016-01-21)

+ [Filter insufficient source funds paths from pathfind results](https://github.com/ripple/ripple-lib/pull/688)

## 0.16.4

+ [Update `ws` to 1.0.1](https://github.com/ripple/ripple-lib/pull/682)

## 0.16.2

+ Bump `ripple-binary-codec` dependency version to 0.1.1 to fix issue with `computeLedgerHash` for transactions with `DeliverMin`

## 0.16.1

+ [FIX: Use assert not assert-diff](https://github.com/ripple/ripple-lib/commit/f6ebe325193e7208c5ee8d8e84a7504714f0009e)

## 0.16.0

__BREAKING CHANGES__
+ [Fix types of XRP values in `getServerInfo` response](https://github.com/ripple/ripple-lib/commit/99d08065e4bda3dda6ae1f183adbd11abc70a9b7)
+ [Change error event format and fix crash due to error event on websocket](https://github.com/ripple/ripple-lib/commit/9cd72595f0efc062d77b9d625695d6030c524cc6)

__OTHER CHANGES__
+ [Fix `generateAddress` docs and add error event listener to boilerplate](https://github.com/ripple/ripple-lib/commit/809d981987a2890fac3a73a40a05c598b9040334)
+ [Allow setting `maxLedgerVersion` to `null` to specify no maximum](https://github.com/ripple/ripple-lib/commit/82613e7e8b360d1ae1552eab4559ab4763c06d7e)
+ [Add support for client certificates](https://github.com/ripple/ripple-lib/commit/5f5e48e4140345d166b8c1a3ee0847b0d9e2d893)
+ [`getFee` returns a string not a float](https://github.com/ripple/ripple-lib/commit/7bf2da6014c87e164542e69356efeaabb575a157)
+ [Fix parsing of quality for `getTrustlines`](https://github.com/ripple/ripple-lib/commit/86ff315ef2a39dfdc2ce97e0e1c4aa73f04e363b)
+ Fix `DeliverMin` value when specifying `minAmount`
+ [http server example](https://github.com/ripple/ripple-lib/commit/76866ab901ea46a2dd73181605e0f7f4220043d4)

## 0.15.2

+ [Fix support for proxy credentials in proxy URL and fix error when there are more than 10 outstanding requests](https://github.com/ripple/ripple-lib/commit/0990ad4a6f1d59ca9d2cb859b4e2d71693f3fc4b)

## 0.15.1

+ [Fix `babel-polyfill` require](https://github.com/ripple/ripple-lib/commit/062148674c3b1293ab82c28e25615ddd530339fa)
+ [Fix samples](https://github.com/ripple/ripple-lib/commit/5d5cf868a2ddb1b1cd40e4a4f0a782d0066c2055)
+ [Add unit tests for `RippleAPIBroadcast`](https://github.com/ripple/ripple-lib/commit/ddf8fe5b1a9c750490dca98fb9ffaaf8017f87e0)

## 0.15.0

__BREAKING CHANGES__
+ ["servers" parameter changed to single "server"](https://github.com/ripple/ripple-lib/commit/7061e9afe46f0682254d098adeff3dd7157521a1)

__OTHER CHANGES__
+ [Fix handling memos in `prepareSettings`](https://github.com/ripple/ripple-lib/commit/c9704137b7b538e8dbf31c483bcdcf2dcfd7cd75)
+ [Docs: SusPay warnings, offline mode, and other tweaks](https://github.com/ripple/ripple-lib/commit/4b4fc36ebd93f1360781a65f2869bd2c4f0a5093)
+ [Fix prepareOrderCancellation documentation](https://github.com/ripple/ripple-lib/commit/5e720891f579fd73d43c64e5ec519d9121023c10)

## 0.14.0

__BREAKING CHANGES__
+ [`prepareOrderCancellation` now takes orderCancellation specification](https://github.com/ripple/ripple-lib/commit/7f33d8a71e56289e5a5e0ead1c74f75ebcde72bc)
+ [Rename "ledgerClosed" event to "ledger" and change format](https://github.com/ripple/ripple-lib/commit/8a3d4a64db5fbf560ebf87dc62e0212513c5e18a)

__OTHER CHANGES__
+ [Fix proxy support and add support for proxy authorization](https://github.com/ripple/ripple-lib/commit/14b840f3feca758e0384b746c94e36d8bf59b8c2)
+ [Fix trace option](https://github.com/ripple/ripple-lib/commit/af620755c53556c55eed12de4b0013ef5a349ce2)
+ [Allow memos on all transaction types](https://github.com/ripple/ripple-lib/commit/b5081344da8e66fbd3a5113cc3313325ef72a494)
+ [Add documentation for RippleAPI options](https://github.com/ripple/ripple-lib/commit/a76b554cadb9f9f918b06f8386bc29355682a1a4)
+ [Docs: more on basic types, tx types](https://github.com/ripple/ripple-lib/commit/fdbac63f466b4fd3be701d4878800d856692e26e)
+ [Docs: revised introductory material](https://github.com/ripple/ripple-lib/commit/ef2515507dbd3c6a426ab5b31332a1bdf72d5b2d)
+ [boost coverage to almost 100%](https://github.com/ripple/ripple-lib/commit/995606b1e6f3643af34d9fd442ccd31f320b03eb)

## 0.13.2

+ [Fix: Specify send_max when pathfinding with a source amount](https://github.com/ripple/ripple-lib/commit/75142139184625c8b9fcc480b1825d9985337813)

## 0.13.1

+ [Add documentation for API events](https://github.com/ripple/ripple-lib/commit/25d1ac0c5f95cad32ea4ceebb)
+ [Fix: Add babel-polyfill](https://github.com/ripple/ripple-lib/commit/8a53abc32f6ec6c7d50cd182492d6fb511b86704)
+ [Fix: Bump version on ripple-hashes](https://github.com/ripple/ripple-lib/commit/12e5765c64aea31b3c2fb65ff989cf01e6368f58)

## 0.13.0

__BREAKING CHANGES__
+ Add new RippleAPI interface and delete old API
    - [RippleAPI README and samples](https://github.com/ripple/ripple-lib/tree/develop/docs/samples)

__OTHER CHANGES__
+ [Removed timeout method of Request and added default timeout](https://github.com/ripple/ripple-lib/commit/634fe5683a9082e57682ff7d5c4fb9483b4af818)
+ [Add Remote.closeCurrentPathFind function, so current pathfind can be properly closed](https://github.com/ripple/ripple-lib/commit/e99010f363fc7cbe7fd547d3ca5b32ea083c44e6)
+ [Implement Balance Sheet API](https://github.com/ripple/ripple-lib/pull/579)
+ [Fix bugs in orderbook subscription](https://github.com/ripple/ripple-lib/commit/7404795dc64a85216148de7bc3ca7da7b33f4490)
+ [Fix crash due to rippled slowDown error](https://github.com/ripple/ripple-lib/commit/84838b2e9f6969b593b8462a62a6b8f516ada937)
+ [Fix: Emit error events and return error on pathfind](https://github.com/ripple/ripple-lib/commit/1ccbaf677631a1944eb05d90f7afc5f3690a03dd)
+ [Deprecate core and remove snake case method copying](https://github.com/ripple/ripple-lib/commit/fb8dc44ec1d49bb05cd0cdbe6dd4ab211195868a)
+ [Fix RangeSet for validated_ledger as single ledger](https://github.com/ripple/ripple-lib/commit/9f9e76f8b933201651af59307135f67cfa7d60e8)
+ [Fix bug where the paths would be set with an empty array](https://github.com/ripple/ripple-lib/commit/83874ec0962da311b76f2385623e51c68bc39035)
+ [Fix reserve calculation](https://github.com/ripple/ripple-lib/commit/52879febb92d876f01f2e4d70871baa07af631fb)

## 0.12.9

+ [OrderBook performance optimizations](https://github.com/ripple/ripple-lib/commit/3e17d91edf36745f6b6c09b0ad88971b7775f6ab)

## 0.12.7 and 0.12.8

+ [Improve performance of orderbook](https://github.com/ripple/ripple-lib/commit/c745faaaf0956ca98448a754b4fe97fb50574fc7)
+ [Remove Firefox warning about prototype overwrite](https://github.com/ripple/ripple-lib/commit/0c62fa21123b220b066871e1c41a3b4fe6f51885)
+ [Fix compare bug in `Amount` class](https://github.com/ripple/ripple-lib/commit/806547dd154e1b0bf252e8a74ad3ac6aa8a97660)

## 0.12.6

+ [Fix webpack require failure due to "./" notation](https://github.com/ripple/ripple-lib/commit/8d9746d7b10be203ee613df523c2522012ff1baf)

## 0.12.15

+ [Add offer autobridging](https://github.com/ripple/ripple-lib/commit/c7bbce83719c1e8c6a4fae5ca850e7515db1a4a5)
+ [Prevent crash when listening for "model" events on the OrderBook class](https://github.com/ripple/ripple-lib/commit/5824c3cb7cb6bd834d6e037f69943aebf3d83351)
+ [Fix empty order edgecase](https://github.com/ripple/ripple-lib/commit/64809d9ae23dc24f47accd4b4788b48f49880d3e)
+ [Fix AutobridgeCalculator (RT-3445)](https://github.com/ripple/ripple-lib/commit/1fff5ea6dcbcee856536df26f3b9cf1aec3c3b55)
+ [Update sjcl and delete custom ripemd160, montgomery, and jacobi](https://github.com/ripple/ripple-lib/commit/50cda426eb83599c38c0b725e1524a01fc415da2)
+ [Fix transaction summary for transactions that fail with remoteError](https://github.com/ripple/ripple-lib/commit/5e714f6143464d7912f42537acaa553b88eaf6dc)
+ [Fix serializedobject append for excessively large bytes length](https://github.com/ripple/ripple-lib/commit/e93f1ab6f4aaad347450aee75a169af0faa2121c)
+ [Switch to sjcl npm module](https://github.com/ripple/ripple-lib/commit/9a502580fd89ec6a9aa55f4e5847f6a4a2cb5bba)
+ [Add babel transpiler](https://github.com/ripple/ripple-lib/commit/398f8d001f758bf575b959537a17e79e4042d17b)
+ [Remove unused float.js and wallet.js](https://github.com/ripple/ripple-lib/commit/d4a4b5f4fbbf09677a59ce81bace35c6426a2fda)
+ [Remove config singleton to reduce global state](https://github.com/ripple/ripple-lib/commit/c655c2a20ee5d150a4b5a1b6717b9fb81f636025)

## 0.12.4

+ [Improve entropy security](https://github.com/ripple/ripple-lib/commit/c7ba822320880037796f57876d1abb4e525648ed)
+ [Remove unused crypt.js file](https://github.com/ripple/ripple-lib/commit/1f68eba1461bca03a4d22872450d15ae5a185334)

## 0.12.3

+ [Add getLedgerSequence to Remote](https://github.com/ripple/ripple-lib/commit/d09548d04d3238fca653d482ec1d5faa7254559a)
+ [Improve randomness when generating ECDSA signatures](https://github.com/ripple/ripple-lib/commit/fe7e30b737ead6e71adfa466f5835ba546feab31)
+ [Improve SerializedObject.append performance](https://github.com/ripple/ripple-lib/commit/f7c35b118ebba549a64bcaa1a0629385ec6dbf6f)
+ [Add `Amount.scale`. Multiply an amount’s value by a scale factor](https://github.com/ripple/ripple-lib/commit/74dac97b368493056474468520f05671f458a69f)

## 0.12.2

+ [Check that stack trace is available, fixes logging in browser](https://github.com/ripple/ripple-lib/commit/53cae3a66d48e88e8a6bbb96d6489ce7b9e22975)

## 0.12.1

__BREAKING CHANGES__
+ [Removed support for parsing native amounts in floating point format](https://github.com/ripple/ripple-lib/commit/e80cd1ff55deae9cd5b0ae85be957f86856b887e)

__OTHER CHANGES__
+ [Fix taker pays funded calculation](https://github.com/ripple/ripple-lib/commit/5af824f5cf46c7b9caa58ee0a757bf854d26c8dc)
+ [Fix order funded amount calculation](https://github.com/ripple/ripple-lib/commit/b2cdb1a6aed968b1f306e8dadbd4b7ca37e5aa03)
+ [Fix handling of quality in order book](https://github.com/ripple/ripple-lib/commit/2a5a8b498da60df738ba18d5c265f34771e8a1af)
+ [Fix currency parsing of non-alphanumeric and no-currency currencies](https://github.com/ripple/ripple-lib/commit/2166bb2e88eae8d5f1aba77338f69e8a9edf6a6f)
+ [Add Amount.strict_mode for toggling range validation](https://github.com/ripple/ripple-lib/commit/b5ed8f59a7dab1a17491618b8d9193646c314fb4)
+ [Add filename and line number to log, use log.warn() for deprecations](https://github.com/ripple/ripple-lib/commit/90329d3d73f1a76675063655b407513e32dc048b)
+ [Add GlobalFreeze and NoFreeze flags](https://github.com/ripple/ripple-lib/commit/e2ed2bdbf6f01c7d4d690c2cf0b83fba94558dd7)
+ [Fix handling of falsy parameters in requestLedger](https://github.com/ripple/ripple-lib/commit/6023efed41b7812b3bab660a1c0dc9f0a21000b9)
+ [Fix Base:decode](https://github.com/ripple/ripple-lib/commit/719f39c01c6941d9a650aa94f95617793dd53ea0)
+ [Fix Amount: clone in ratio_human, product_human](https://github.com/ripple/ripple-lib/commit/19e17a8431550cf156b1ad669a19dedfe4e28e4a)
+ [Fix Amount.to_human for very small numbers](https://github.com/ripple/ripple-lib/commit/6abfa759aa09d68074ac558d96c4b126a7cd1719)
+ [Refactor base conversion](https://github.com/ripple/ripple-lib/commit/f2b63fa4a80663eb29472bc6bb1aea8159f1f205)
+ [Update binary transaction format](https://github.com/ripple/ripple-lib/commit/8e134918fb4c22983320a3102f955e4568bb1dfb)
+ [Add DefaultRipple account flag](https://github.com/ripple/ripple-lib/commit/3e249902c4cf25b4da5e75048c84ae391be83b10)
+ [Remove `Features` field requirement in `SetFee` transaction format](https://github.com/ripple/ripple-lib/commit/a20a649013646710c078d4ce1e210f87c7fe74fe)
+ [Remove `RegularKey` field requirement in `SetRegularKey` transaction format](https://github.com/ripple/ripple-lib/commit/c275174f27877ba8f389eb4efe969feb514d6e46)

## 0.12.0

__BREAKING CHANGES__
+ REMOVED Remote storage interface
+ REMOVED Remote `ping` configuration
+ REMOVED Old/deprecated Remote server configuration (websocket_ip, websocket_port)
+ REMOVED browser `online` reconnect listener
    - [Cleanup, deprecations - 2833a7b6](https://github.com/ripple/ripple-lib/commit/2833a7b66e696dab427464625077f9b93092d0d5)
+ Remove `jsbn` and use `bignumber.js` instead for big number math
+ The `allow_nan` flag has been removed. Results for invalid amounts will always be `NaN`
    - [Refactor to use bignumber.js - d025b4a0](https://github.com/ripple/ripple-lib/commit/d025b4a0c3a98a6de27a1bee9573c85347bcd66b)
    - [Handle invalid input in parse_human - c8f18c8c](https://github.com/ripple/ripple-lib/commit/c8f18c8c8590b7b48e370e0325b6677b7720294f)
    - [Check for null in isNumber - b86790c8](https://github.com/ripple/ripple-lib/commit/b86790c8543c239a532fd7697d4652829019d385)
    - [Cleanup amount.js - d0fb291c](https://github.com/ripple/ripple-lib/commit/d0fb291c4e330193a244902156f1d74730da357d)

__OTHER CHANGES__
+ [Add deprecation warnings to request constructors. The first argument to request constructor functions should be an object containing request properties](https://github.com/ripple/ripple-lib/commit/35d76b3520934285f80059c1badd6c522539104c)
+ [Fix taker_gets_funded exceeding offer.TakerGets](https://github.com/ripple/ripple-lib/commit/b19ecb4482b589d575382b7a5d0480b963383bb1)
+ [Fix unsymmetric memo serializing](https://github.com/ripple/ripple-lib/commit/1ed36fabdbd54f4d31078c2b0eaa3becc0fe2821)
+ [Fix IOU value passed to `Amount.from_json()`](https://github.com/ripple/ripple-lib/commit/fd1b64393dffb3d1819cd40b8d43df43a4db042d)
+ [Update transaction binary parsing to account for XRP delivered amounts](https://github.com/ripple/ripple-lib/commit/35a346a674e6ee1e1e495db93700d55984efc7dd)
+ [Bumped dependencies](https://github.com/ripple/ripple-lib/commit/f9bc7cc746b44b24b61bbe260ae2e9d9617286da)

## 0.11.0

+ [Track the funded status of an order based on cumulative account orders](https://github.com/ripple/ripple-lib/commit/67d39737a4d5e0fcd9d9b47b9083ee00e5a9e652) and [67d3973](https://github.com/ripple/ripple-lib/commit/b6b99dde022e1e14c4797e454b1d7fca50e49482)
+ Remove blobvault client from ripple-lib, use the [`ripple-vault-client`](https://github.com/ripple/ripple-vault-client) instead [9b3d62b7](https://github.com/ripple/ripple-lib/commit/9b3d62b765c4c25beae6eb0fa57ef3a07f2581b1)
+ [Add support for `ledger` option in requestBookOffers](https://github.com/ripple/ripple-lib/commit/34c0677c453c409ef0a5b351959abdc176d3bacb)
+ [Add support for `limit` option in requestBookOffers](https://github.com/ripple/ripple-lib/commit/d1d4452217c878d0b377d24830b4cd8b3162f6e0)
+ [Add `ledgerSelect` request constructor in `Remote`](https://github.com/ripple/ripple-lib/commit/98f40abfc3aa74dec5067a2d90002756cc8acd01)
+ [Default to binary data for commands that accept the binary flag](https://github.com/ripple/ripple-lib/commit/7cb113fcbcfc1e3e9830a999148b3e78df3387cc)
+ [Fix metadata account check](https://github.com/ripple/ripple-lib/commit/3f61598d6c87e3cc877af60e2d515f9eff73dfe1)
+ [Double check `tes` code before emitting `success`](https://github.com/ripple/ripple-lib/commit/97a8c874903eb7309d8f755955ac80872f670582)
+ [Decrease redundancy in binary account_tx parsing](https://github.com/ripple/ripple-lib/commit/0aba638e6e7f4f6e22cb6424eed3897ebad90a5a)
+ [Abort server connection on unrecoverable TLS error](https://github.com/ripple/ripple-lib/commit/000a2ea00c57157044aeca0fb3f24b37669b163c)
+ [Fix complete ledgers check on subscription that is not initial](https://github.com/ripple/ripple-lib/commit/89de91301e682a46dc60aaacc7ae152e8fe1b7c7)

## 0.10.0

+ [Transaction changes](https://github.com/ripple/ripple-lib/pull/221)
+ **Important** `tef*` and `tel*` and errors will no longer be presented as
final. Rather than considering these errors final, ripple-lib will wait until
the `LastLedgerSequence` specified in the transaction is exceeded.  This makes
failures more definitive, and ensures that no transaction will resubmit
indefinitely.
+ A new, final tej-class error is introduced to account for transactions that
are locally determined to have expired: `tejMaxLedger`.
+ [Allow per transaction fees to be set, `transaction.setFixedFee()`](https://github.com/ripple/ripple-lib/commit/9b22f279bcbe60ee6bcf4b7fa60a48e9c197a828)
+ [Improve memo support](https://github.com/ripple/ripple-lib/commit/1704ac4ae144c0ce54afad86f644c75a632080b1)
    - Add `MemoFormat` property for memo
    - Enforce `MemoFormat` and `MemoType` to be valid ASCII
    - Support `text` and `json` MemoFormat
+ [Update sjcl library](https://github.com/ripple/ripple-lib/commit/3204998fcb6f31d6c90532a737a4adb8a1e420f6)
    - Improved entropy by taking advantage of platform crypto
    - Use jscl's k256 curve instead of altering the c256 curve with k256 configuration
    - **Deprecated:** The c256 curve is linked to the k256 curve to provide backwards compatibility, this link will be removed in the future
+ [Fix empty queue check on reconnect](https://github.com/ripple/ripple-lib/commit/3c21994adcf72d1fbd87d453ceb917f9ad6df4ec)

## 0.9.4

+ [Normalize offers from book_offers and transaction stream](https://github.com/ripple/ripple-lib/commit/86ed24b94cf7c8929c87db3a63e9bbea7f767e9c)
+ [Fix: Amount.to_human() precision rounding](https://github.com/ripple/ripple-lib/commit/e371cc2c3ceccb3c1cfdf18b98d80093147dd8b2)
+ [Fix: fractional drops in funded taker_pays setter](https://github.com/ripple/ripple-lib/commit/0d7fc0a573a144caac15dd13798b23eeb1f95fb4)

## 0.9.3

+ [Change `presubmit` to emit immediately before transaction submit](https://github.com/ripple/ripple-lib/commit/7a1feaa89701bf861ab31ebd8ffdc8d8d1474e29)
+ [Add a "core" browser build of ripple-lib which has a subset of features and smaller file size](https://github.com/ripple/ripple-lib/pull/205)
+ [Update binformat with missing fields from rippled](https://github.com/ripple/ripple-lib/commit/cae980788efb00191bfd0988ed836d60cdf7a9a2)
+ [Wait for transaction validation before returning `tec` error](https://github.com/ripple/ripple-lib/commit/6bdd4b2670906588852fc4dda457607b4aac08e4)
+ [Change default `max_fee` on `Remote` to `1 XRP`](https://github.com/ripple/ripple-lib/commit/d6b1728c23ff85c3cc791bed6982a750641fd95f)
+ [Fix: Request ledger_accept should return the Remote](https://github.com/ripple/ripple-lib/pull/209)

## 0.9.2

__BREAKING CHANGES__
+ [Change accountRequest method signature](https://github.com/ripple/ripple-lib/commit/6f5d1104aa3eb440c518ec4f39e264fdce15fa15)

__OTHER CHANGES__
+ [Add paging behavior for account requests, `account_lines` and `account_offers`](https://github.com/ripple/ripple-lib/commit/722f4e175dbbf378e51b49142d0285f87acb22d7)
+ [Add max_fee setter to transactions to set max fee the submitter is willing to pay](https://github.com/ripple/ripple-lib/commit/24587fab9c8ad3840d7aa345a7037b48839e09d7)
+ [Fix: cap IOU Amounts to their max and min value](https://github.com/ripple/ripple-lib/commit/f05941fbc46fdb7c6fe7ad72927af02d527ffeed)

Example on how to use paging with `account_offers`:
```js
// A valid `ledger_index` or `ledger_hash` is required to provide a reliable result.
// Results can change between ledger closes, so the provided ledger will be used as base.
var options = {
    account: < rippleAccount >,
    limit: < Number between 10 and 400 >,
    ledger: < valid ledger_index or ledger_hash >
}

// The `marker` comes back in an account request if there are more results than are returned
// in the current response. The amount of results per response are determined by the `limit`.
if (marker) {
    options.marker = < marker >;
}

var request = remote.requestAccountOffers(options);
```

[Full working example](https://github.com/geertweening/ripple-lib-scripts/blob/master/account_offers_paging.js)

## 0.9.1

+ Switch account requests to use ledgerSelect rather than ledgerChoose ([278df90](https://github.com/ripple/ripple-lib/commit/278df9025a20228de22379a53c76ca12d40fa591))
+ **Deprecated** setting `ident` and `account_index` on account requests ([278df90](https://github.com/ripple/ripple-lib/commit/278df9025a20228de22379a53c76ca12d40fa591))
+ Change initial account transaction sequence to 1 ([a3c1d06](https://github.com/ripple/ripple-lib/commit/a3c1d06eba883dc84fe2bfe700e4309795c84cac))
+ Fix: instance transaction without remote ([d3b6b81](https://github.com/ripple/ripple-lib/commit/d3b6b8127c7b01e416b400c25abf1719bdd008ca))
+ Fix: account root request ledger argument ([bc1f9f8](https://github.com/ripple/ripple-lib/commit/bc1f9f8a286b187d36ebaf552694e31e73742293))
+ Fix: rsign.js local signing and example ([d3b6b81](https://github.com/ripple/ripple-lib/commit/d3b6b8127c7b01e416b400c25abf1719bdd008ca) and [f1004c6](https://github.com/ripple/ripple-lib/commit/f1004c6db2a0ce59bbabbb8f2b355a9fd9995fd8))

## 0.9.0

__BREAKING CHANGES__
+ Make maxLoops in seed.get_key optional. [Example use in tests](https://github.com/ripple/ripple-lib/blob/23e473b6886c457781949c825b3ff48b3984e51f/test/seed-test.js) ([23e473b](https://github.com/ripple/ripple-lib/commit/23e473b6886c457781949c825b3ff48b3984e51f))

__OTHER CHANGES__
+ Add routes to the vault client for KYC attestations ([ed2da574](https://github.com/ripple/ripple-lib/commit/ed2da57475acf5e9d2cf3373858f4274832bd83f))
+ Currency: add `show_interest` flag to show or hide interest in `Currency.to_human()` and `Currency.to_json()` [Example use in tests](https://github.com/ripple/ripple-lib/blob/947ec3edc2e7c8f1ef097e496bf552c74366e749/test/currency-test.js#L123)
+ Configurable maxAttempts for transaction submission ([d107092](https://github.com/ripple/ripple-lib/commit/d10709254061e9e4416d2cb78b5cac1ec0d7ffa5))
+ Binformat: added missing TransactionResult options ([6abed8d](https://github.com/ripple/ripple-lib/commit/6abed8dd5311765b2eb70505dadbdf5121439ca8))
+ Shrinkwrap packages for dependency locking ([2dcd5f9](2dcd5f94fbc71200eb08a5044c76ef94f7971913))
+ Fix: Amount.to_human() precision bugs ([4be209e](https://github.com/ripple/ripple-lib/commit/4be209e286b5b209bec7bcd1212098985e15ff2f) and [7708c64](https://github.com/ripple/ripple-lib/commit/7708c64576e70ce3ac190442daceb30e4446aab7))
+ Fix: change handling of requestLedger options ([57b7030](https://github.com/ripple/ripple-lib/commit/57b70300f5f0c7534ede118ddbb5d8762668a4f8))

## 0.8.2

+ Currency: Allow mixed letters and numbers in currencies
+ Deprecate account_tx map/reduce/filterg
+ Fix: correct requestLedger arguments
+ Fix: missing subscription on error events for some server methods
+ Fix: orderbook reset on reconnect
+ Fix: ripple-lib crashing. Add potential missing error handlers

## 0.8.1

+ Wallet: Add Wallet class that generates wallets
+ Make npm test runnable in Windows.
+ Fix several stability issues, see merged PR's for details
+ Fix bug in Amount.to_human_full()
+ Fix undefined fee states when connecting to a rippled that is syncing

## 0.8.0

+ Orderbook: Added tracking of offer funds for determining when offers are not funded
+ Orderbook: Added tests
+ Orderbook: Update owner funds
+ Transactions: If transaction errs with `tefALREADY`, wait until all possible submissions err with the same before emitting `error`. Fixes a client "Transaction malformed" bug.
+ Transactions: Track submissions, don't bother submitting to unconnected servers
+ Request: `request.request()` now accepts an array of servers as first argument. Servers can be represented with URL, or the server object itself.
+ Request: `request.broadcast()` now returns the number of servers request was sent to
+ Server: Acquire host information from server without additional request
+ Amount: Add a constant for the maximum canonical value that can be expressed as a Ripple value
+ Amount: Make Constants static fields on the class, instead of a separate export

## 0.7.39

+ Improvements to multi-server support. Fixed an issue where a server's score was not reset and connections would keep dropping after being connected for a significant amount of time.
+ Improvements in order book support. Added support for currency pairs with interest bearing currencies. You can request an order book with hex, ISO code or full name for the currency.
+ Fix value parsing for amount/currency order pairs, e.g. `Amount.from_human("XAU 12345.6789")`
+ Improved Amount parsing from human readable string given a hex currency, e.g. `Amount.from_human("10 015841551A748AD2C1F76FF6ECB0CCCD00000000")`
+ Improvements to username normalization in the vault client
+ Add 2-factor authentication support for vault client
+ Removed vestiges of Grunt, switched to Gulp

## 0.7.37

+ **Deprecations**

    1. Removed humanistic amount detection in `transaction.payment`. Passing `1XRP` as the payment amount no longer works.
    2. `remote.setServer` uses full server URL rather than hostname. Example: `remote.setServer('wss://s`.ripple.com:443')`
    3. Removed constructors for deprecated transaction types from `transaction.js`.
    4. Removed `invoiceID` option from `transaction.payment`. Instead, use the `transaction.invoiceID` method.
    5. Removed `transaction.transactionManager` getter.

+ Improved multi-server support. Servers are now ranked dynamically, and transactions are broadcasted to all connected servers.
+ Automatically ping connected servers. Client configuration now should contain `ping: <seconds>` to specify the ping interval.
+ Added `transaction.lastLedger` to specify `LastLedgerSequence`. Setting it this way also ensures that the sequence is not bumped on subsequent requests.
+ Added optional `remote.accountTx` binary parsing.
    ```js
      {
        binary: true,
        parseBinary: false
      }
    ```
+ Added full currency name support, e.g. `Currency.from_json('XRP').to_human({full_name:'Ripples'})` will return `XRP - Ripples`
+ Improved interest bearing currency support, e.g. `Currency.from_human('USD - US Dollar (2.5%pa)')`
+ Improve test coverage
+ Added blob vault client.  The vault client facilitates interaction with ripple's namespace and blob vault or 3rd party blob vaults using ripple's blob vault software (https://github.com/ripple/ripple-blobvault). A list of the available functions can be found at [docs/VAULTCLIENT.md](docs/VAULTCLIENT.md)


## 0.7.35

+ `LastLedgerSequence` is set by default on outgoing transactions. This refers to the last valid ledger index (AKA sequence) for a transaction. By default, this index is set to the current index (at submission time) plus 8. In theory, this allows ripple-lib to deterministically fail a transaction whose submission request timed out, but whose associated server continues to emit ledger_closed events.
+ Transactions that err with `telINSUF_FEE_P` will be automatically resubmitted. This error indicates that the `Fee` supplied in the transaction submission request was inadequate. Ideally, the `Fee` is tracked by ripple-lib in real-time, and the resubmitted transaction will most likely succeed.
+ Added Transaction.iff(function(callback) { }). Callback expects first argument to be an Error or null, second argument is a boolean which indicates whether or not to proceed with the transaction submission. If an `iff` function is specified, it will be executed prior to every submission of the transaction (including resubmissions).
+ Transactions will now emit `presubmit` and `postsubmit` events. They will be emitted before and after a transaction is submitted, respectively.
+ Added Transaction.summary(). Returns a summary of a transaction in semi-human-readable form. JSON-stringifiable.
+ Remote.requestAccountTx() with `binary: true` will automatically parse transactions.
+ Added Remote.requestAccountTx filter, map, and reduce.

```js
  remote.requestAccountTx({
    account: 'retc',
    ledger_index_min: -1,
    ledger_index_max: -1,
    limit: 100,
    binary: true,

    filter: function(transaction) {
      return transaction.tx.TransactionType === 'Payment';
    },

    map: function(transaction) {
      return Number(transaction.tx.Amount);
    },

    reduce: function(a, b) {
      return a + b;
    },

    pluck: 'transactions'
  }, console.log)
```

+ Added persistence hooks.
+ General performance improvements, especially for long-running processes.
