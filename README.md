#ripple-lib

A JavaScript API for interacting with Ripple in Node.js and the browser

[![Circle CI](https://circleci.com/gh/ripple/ripple-lib/tree/develop.svg?style=svg)](https://circleci.com/gh/ripple/ripple-lib/tree/develop) [![Coverage Status](https://coveralls.io/repos/ripple/ripple-lib/badge.png?branch=develop)](https://coveralls.io/r/ripple/ripple-lib?branch=develop)

[![NPM](https://nodei.co/npm/ripple-lib.png)](https://www.npmjs.org/package/ripple-lib)

###Features

+ Connect to a rippled server in JavaScript (Node.js or browser)
+ Issue [rippled API](https://ripple.com/build/rippled-apis/) requests
+ Listen to events on the Ripple network (transaction, ledger, etc.)
+ Sign and submit transactions to the Ripple network

##Getting Started

Install `ripple-lib` using npm:
```
  $ npm install ripple-lib
```

Then see the [documentation](https://github.com/ripple/ripple-lib/blob/develop/docs/index.md) and [code samples](https://github.com/ripple/ripple-lib/tree/develop/docs/samples)

##Running tests

1. Clone the repository
2. `cd` into the repository and install dependencies with `npm install`
3. `npm test` or `npm test --coverage` (`istanbul` will create coverage reports in coverage/lcov-report/`)

##More Information

+ [Ripple Dev Portal](https://ripple.com/build/)
