#The Ripple JavaScript Library

`ripple-lib` connects to the Ripple network via the WebSocket protocol and runs in Node.js as well as in the browser.

###In this file:

1. Overview
2. [Getting `ripple-lib`](README.md#getting-ripple-lib)
3. [Quickstart](README.md#quickstart)
4. [Running tests](https://github.com/ripple/ripple-lib#running-tests)

###For additional documentation see:

1. [The `ripple-lib` Guides (docs/GUIDES.md)](docs/GUIDES.md)
2. [The `ripple-lib` API Reference (docs/REFERENCE.md)](docs/REFERENCE.md)
3. https://ripple.com/wiki/Ripple_JavaScript_library  

###Also see:

+ https://ripple.com/wiki  
+ https://ripple.com

##Getting `ripple-lib`

1. Via npm for Node.js: `npm install ripple-lib`
2. Build from the source using `grunt` and load the minified `ripple-#.#.#-min.js` into your webpage


##Quickstart

`Remote` ([remote.js](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js)) is the module responsible for managing connections to `rippled` servers:

```js
/* Loading ripple-lib with Node.js */
var Remote = require('ripple-lib').Remote;

/* Loading ripple-lib in a webpage */
// var Remote = ripple.Remote;

var remote = new Remote({
  // see the API Reference for available options
  trusted:        true,
  local_signing:  true,
  local_fee:      true,
  fee_cusion:     1.5,
  servers: [
    {
        host:    's1.ripple.com'
      , port:    443
      , secure:  true
    }
  ]
});

remote.connect(function() {
  /* remote connected */

  // see the API Reference for available functions
});
```

See [The `ripple-lib` Guides](docs/GUIDES.md) and [The `ripple-lib` API Reference](docs/REFERENCE.md) for walkthroughs and details about all of the available functions and options.

##Running tests

1. Clone the repository

2. `cd` into the repository and install dependencies with `npm install`

3. `npm test` or `make test`

**Generating code coverage**

ripple-lib uses `jscoverage` to generate code coverage. To generate a file `coverage.html`, run `make coverage`
