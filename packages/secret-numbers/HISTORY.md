# @xrplf/secret-numbers (xrpl-secret-numbers) Release History

Subscribe to [the **xrpl-announce** mailing list](https://groups.google.com/g/xrpl-announce) for release announcements. We recommend that `@xrplf/secret-numbers` users stay up-to-date with the latest stable release.

## Unreleased

## 1.0.0 (2024-02-01)

### BREAKING CHANGES:
* `xrpl-secret-numbers` is now `@xrplf/secret-numbers`.
* The bundled file produced changed from  `dist/browerified.js` to `build/xrplf-secret-numbers-latest.js`.
* Bundle variable is `xrplf_secret_numbers` instead of using browserify's loader.
* * Moved all methods that were on `Utils` are now individually exported.
* `Buffer` has been replaced with `UInt8Array` for both params and return values. `Buffer` may continue to work with params since they extend `UInt8Arrays`.

### Non-Breaking Changes
* Add `xrpl-secret-numbers` by @WietseWind  to the mono repo.
* `unpkg` and `jsdelivr` support was simplified.
* Unit tests run in a browser and node.
* Remove `brorand` as a dependency and use `@xrplf/isomorphic` instead.
* Eliminates 4 runtime dependencies: `base-x`, `base64-js`, `buffer`, and `ieee754`.
