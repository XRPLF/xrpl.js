#ripple-lib

JavaScript client for [rippled](https://github.com/ripple/rippled)

[![Build Status](https://travis-ci.org/ripple/ripple-lib.svg?branch=develop)](https://travis-ci.org/ripple/ripple-lib) [![Coverage Status](https://coveralls.io/repos/ripple/ripple-lib/badge.png?branch=develop)](https://coveralls.io/r/ripple/ripple-lib?branch=develop)

[![NPM](https://nodei.co/npm/ripple-lib.png)](https://www.npmjs.org/package/ripple-lib)

###Features

+ Connect to a rippled server in JavaScript (Node.js or browser)
+ Issue [rippled API](https://ripple.com/wiki/JSON_Messages) requests
+ Listen to events on the Ripple network (transaction, ledger, etc.)
+ Sign and submit transactions to the Ripple network

###In this file

1. [Installation](README.md#installation)
2. [Quickstart](README.md#quickstart)
3. [Running tests](https://github.com/ripple/ripple-lib#running-tests)

###Additional documentation

1. [Guides](docs/GUIDES.md)
2. [API Reference](docs/REFERENCE.md)
3. [Wiki](https://ripple.com/wiki/Ripple_JavaScript_library)

###Also see

+ [The Ripple wiki](https://ripple.com/wiki)
+ [ripple.com](https://ripple.com)

##Installation

**Via npm for Node.js**

```
  $ npm install ripple-lib
```

**Building ripple-lib for browser use**

```
  $ git clone https://github.com/ripple/ripple-lib
  $ npm install
  $ npm run build
```

Then use the minified `build/ripple-*-min.js` in your webpage

##Quickstart

`Remote.js` ([remote.js](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js)) is the point of entry for interacting with rippled

```js
/* Loading ripple-lib with Node.js */
var Remote = require('ripple-lib').Remote;

/* Loading ripple-lib in a webpage */
// var Remote = ripple.Remote;

var remote = new Remote({
  // see the API Reference for available options
  servers: [ 'wss://s1.ripple.com:443' ]
});

remote.connect(function() {
  /* remote connected */
  remote.request('server_info', function(err, info) {

  });
});
```

##Running tests

1. Clone the repository

2. `cd` into the repository and install dependencies with `npm install`

3. `npm test` or `node_modules\.bin\mocha test\*-test.js`

**Generating code coverage**

ripple-lib uses `istanbul` to generate code coverage. To create a code coverage report, run `npm test --coverage`. The report will be created in `coverage/lcov-report/`.
