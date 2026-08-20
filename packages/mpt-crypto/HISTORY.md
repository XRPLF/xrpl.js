# @xrplf/mpt-crypto Release History

Subscribe to [the **xrpl-announce** mailing list](https://groups.google.com/g/xrpl-announce) for release announcements. We recommend that `@xrplf/mpt-crypto` users stay up-to-date with the latest stable release.

## Unreleased

### Added

- Initial release: Confidential MPT (XLS-0096) cryptographic primitives for the XRP Ledger — EC-ElGamal encryption, Pedersen commitments, per-transaction context hashes, and zero-knowledge proofs — exposed as a hex-in / hex-out TypeScript API over a vendored WebAssembly build of the reference [`XRPLF/mpt-crypto`](https://github.com/XRPLF/mpt-crypto) C library. Ships both a CommonJS and an ES-module WASM glue so it loads in Node and in bundlers.
