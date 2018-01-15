# ripple-lib

A JavaScript API for interacting with the XRP Ledger

[![Circle CI](https://circleci.com/gh/ripple/ripple-lib/tree/develop.svg?style=svg)](https://circleci.com/gh/ripple/ripple-lib/tree/develop) [![Coverage Status](https://coveralls.io/repos/ripple/ripple-lib/badge.png?branch=develop)](https://coveralls.io/r/ripple/ripple-lib?branch=develop)

[![NPM](https://nodei.co/npm/ripple-lib.png)](https://www.npmjs.org/package/ripple-lib)

### Features

+ Connect to a `rippled` server from Node.js or a web browser
+ Issue [rippled API](https://ripple.com/build/rippled-apis/) requests
+ Listen to events on the XRP Ledger (transaction, ledger, etc.)
+ Sign and submit transactions to the XRP Ledger

## Getting Started

See also: [RippleAPI Beginners Guide](https://ripple.com/build/rippleapi-beginners-guide/)

You can use `npm`, but we recommend using `yarn` for the added assurance provided by `yarn.lock`.

+ [Yarn Installation Instructions](https://yarnpkg.com/en/docs/install)

Install `ripple-lib`:
```
$ yarn add ripple-lib
```

Then see the [documentation](https://github.com/ripple/ripple-lib/blob/develop/docs/index.md) and [code samples](https://github.com/ripple/ripple-lib/tree/develop/docs/samples)

## Running tests

1. Clone the repository
2. `cd` into the repository and install dependencies with `yarn install`
3. `yarn test` or `yarn test --coverage` (`istanbul` will create coverage reports in `coverage/lcov-report/`)

## Generating Documentation

The continuous integration tests require that the documentation stays up-to-date. If you make changes to the JSON schemas, fixtures, or documentation sources, you must update the documentation by running `yarn run docgen`.

`npm` may be used instead of `yarn` in the commands above.

## More Information

+ [Ripple Developer Center](https://ripple.com/build/)
