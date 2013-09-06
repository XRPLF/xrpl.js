#The Ripple JavaScript Library

`ripple-lib` connects to the Ripple network via the WebSocket protocol and runs in Node.js as well as in the browser.

This file contains installation and quickstart instructions. For the full documentation see:

1. [The `ripple-lib` Guides](docs/REFERENCE.md)
2. [The `ripple-lib` API Reference](docs/REFERENCE.md)
3. Additional documentation resources can be found at:
  + https://ripple.com/wiki/Ripple_JavaScript_library  
  + https://ripple.com/wiki  
  + https://ripple.com

##Getting `ripple-lib`

1. Via npm for Node.js: `npm install ripple-lib`
2. Build from the source using `grunt` and load the minified `ripple-#.#.#-min.js` into your webpage


##Quickstart

`Remote` ([remote.js](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js)) is the module responsible for managing connections to `rippled` servers.

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
  servers: [
    {
        host:    's1.ripple.com'
      , port:    443,
      , secure:  true
    }
  ]
});

remote.connect(function() {
  /* remote connected */

  // see the API Reference for available functions
});
```
