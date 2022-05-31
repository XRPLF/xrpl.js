## Deprecated

This library (ripple-lib 1.x) has been deprecated in favor of [xrpl.js version 2+](https://github.com/XRPLF/xrpl.js).

# ripple-lib (RippleAPI)

A JavaScript/TypeScript API for interacting with the XRP Ledger

[![NPM](https://nodei.co/npm/ripple-lib.png)](https://www.npmjs.org/package/ripple-lib)

This library is for integrating a JavaScript/TypeScript app with the XRP Ledger and supports functionality such as IOUs, payment paths, the decentralized exchange, account settings, payment channels, escrows, multi-signing, and more.

## [➡️ Reference Documentation](https://github.com/XRPLF/xrpl.js/blob/1.x/docs/index.md)

Use the above link to view the full reference documentation.

### Features

+ Connect to a `rippled` server from Node.js or a web browser
+ Helpers for creating requests and parsing responses for the [rippled API](https://developers.ripple.com/rippled-api.html)
+ Listen to events on the XRP Ledger (transactions, ledger, validations, etc.)
+ Sign and submit transactions to the XRP Ledger
+ Type definitions for TypeScript

### Requirements

+ **[Node.js v14](https://nodejs.org/)** is recommended. Other versions may work but are not frequently tested.
+ **[Yarn](https://yarnpkg.com/)** is recommended. `npm` may work but we use `yarn.lock`.

## Getting Started

See also: [RippleAPI Beginners Guide](https://xrpl.org/get-started-with-rippleapi-for-javascript.html)

In an existing project (with `package.json`), install `ripple-lib`:
```
$ yarn add ripple-lib
```

Then see the [documentation](#documentation).

### Using ripple-lib with React Native

If you want to use `ripple-lib` with React Native you will need to have some of the NodeJS modules available. To help with this you can use a module like [rn-nodeify](https://github.com/tradle/rn-nodeify).

1. Install dependencies (you can use `npm` as well):

    ```shell
    yarn add react-native-crypto
    yarn add ripple-lib 
    # install peer deps
    yarn add react-native-randombytes
    # install latest rn-nodeify
    yarn add rn-nodeify@latest --dev
    ```

2. After that, run the following command:

    ```shell
    # install node core shims and recursively hack package.json files
    # in ./node_modules to add/update the "browser"/"react-native" field with relevant mappings
    ./node_modules/.bin/rn-nodeify --hack --install
    ```

3. Enable `crypto`:

    `rn-nodeify` will create a `shim.js` file in the project root directory.
    Open it and uncomment the line that requires the crypto module:

    ```javascript
    // If using the crypto shim, uncomment the following line to ensure
    // crypto is loaded first, so it can populate global.crypto
    require('crypto')
    ```

4. Import `shim` in your project (it must be the first line):

  ```javascript
  import './shim'
  ...
  ```

### Using ripple-lib with Deno

Until official support for [Deno](https://deno.land) is added, you can use the following work-around to use `ripple-lib` with Deno:

```javascript
import ripple from 'https://dev.jspm.io/npm:ripple-lib';

(async () => {
  const api = new (ripple as any).RippleAPI({ server: 'wss://s.altnet.rippletest.net:51233' });
  const address = 'rH8NxV12EuV...khfJ5uw9kT';

  api.connect().then(() => {
    api.getBalances(address).then((balances: any) => {
      console.log(JSON.stringify(balances, null, 2));
    });
  });
})();
```

## Documentation

+ [RippleAPI Beginners Guide](https://xrpl.org/get-started-with-rippleapi-for-javascript.html)
+ [RippleAPI Full Reference Documentation](https://xrpl.org/rippleapi-reference.html) ([in this repo](https://github.com/ripple/ripple-lib/blob/develop/docs/index.md))
+ [Code Samples](https://github.com/ripple/ripple-lib/tree/develop/docs/samples)
+ [XRP Ledger Dev Portal](https://xrpl.org/)

### Mailing Lists

We have a low-traffic mailing list for announcements of new ripple-lib releases. (About 1 email per week)

+ [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/forum/#!forum/ripple-server)

## Development

To build the library for Node.js and the browser:
```
$ yarn build
```

The TypeScript compiler will [output](./tsconfig.json#L7) the resulting JS files in `./dist/npm/`.

webpack will output the resulting JS files in `./build/`.

For details, see the `scripts` in `package.json`.

## Running Tests

### Unit Tests

1. Clone the repository
2. `cd` into the repository and install dependencies with `yarn install`
3. `yarn test`

### Linting

Run `yarn lint` to lint the code with `eslint`.

## Generating Documentation

Do not edit `./docs/index.md` directly because it is a generated file.

Instead, edit the appropriate `.md.ejs` files in `./docs/src/`.

If you make changes to the JSON schemas, fixtures, or documentation sources, update the documentation by running `yarn run docgen`.
