# xrpl.js

A JavaScript/TypeScript library for interacting with the XRP Ledger

[![NPM](https://nodei.co/npm/xrpl.png)](https://www.npmjs.org/package/xrpl)
![npm bundle size](https://img.shields.io/bundlephobia/min/xrpl)

This is the recommended library for integrating a JavaScript/TypeScript app with the XRP Ledger, especially if you intend to use advanced functionality such as IOUs, payment paths, the decentralized exchange, account settings, payment channels, escrows, multi-signing, and more.

## [➡️ Reference Documentation](http://js.xrpl.org)

See the full reference documentation for all classes, methods, and utilities.

## [➡️ Applications and Projects](https://github.com/XRPLF/xrpl.js/blob/main/APPLICATIONS.md)

What is `xrpl.js` used for? The applications on the list linked above use `xrpl.js`. Open a PR to add your app or project to the list!

### Features

+ Works in Node.js and in web browsers
+ Helpers for creating requests and parsing responses for the [XRP Ledger APIs](https://xrpl.org/rippled-api.html)
+ Listen to events on the XRP Ledger (transactions, ledger, validations, etc.)
+ Sign and submit transactions to the XRP Ledger
+ Type definitions for TypeScript

### Requirements

+ **[Node.js v14](https://nodejs.org/)** is recommended. We also support v12 and v16. Other versions may work but are not frequently tested.

## Getting Started

In an existing project (with `package.json`), install `xrpl.js`:

```
$ npm install --save xrpl
```

Or with `yarn`:

```
$ yarn add xrpl
```

Example usage:

```js
const xrpl = require("xrpl")
async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
  await client.connect()

  const response = await client.request({
    "command": "account_info",
    "account": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    "ledger_index": "validated"
  })
  console.log(response)

  client.disconnect()
}
main()
```

For more examples, see the [documentation](#documentation).

## Try it out now!

If you just want to try xrpl.js, you can fork this Code Sandbox template:
https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js

It goes through:
1. Creating a new test account
2. Sending a payment transaction 
3. And sending requests to see your account balance

### Using xrpl.js with `create-react-app`
To use `xrpl.js` with React, you need to install shims for core NodeJS modules. Starting with version 5, Webpack stopped including shims by default, so you must modify your Webpack configuration to add the shims you need. Either you can eject your config and modify it, or you can use a library such as `react-app-rewired`. The example below uses `react-app-rewired`.

1. Install shims (you can use `yarn` as well):

   ```shell
   npm install --save-dev \
       assert \
       buffer \
       crypto-browserify \
       https-browserify \
       os-browserify \
       process \
       stream-browserify \
       stream-http \
       url
   ```
2. Modify your webpack configuration
    1. Install `react-app-rewired`
   
       ````shell
       npm install --save-dev react-app-rewired
       ````

    2. At the project root, add a file named `config-overrides.js` with the following content:

       ```javascript
       const webpack = require('webpack');
       
       module.exports = function override(config) {
           const fallback = config.resolve.fallback || {};
           Object.assign(fallback, {
               "assert": require.resolve("assert"),
               "crypto": require.resolve("crypto-browserify"),
               "http": require.resolve("stream-http"),
               "https": require.resolve("https-browserify"),
               "os": require.resolve("os-browserify"),
               "stream": require.resolve("stream-browserify"),
               "url": require.resolve("url"),
               "ws": require.resolve('xrpl/dist/npm/client/WSWrapper'),
           })
           config.resolve.fallback = fallback
           config.plugins = (config.plugins || []).concat([
               new webpack.ProvidePlugin({
                   process: 'process/browser',
                   Buffer: ['buffer', 'Buffer']
               })
           ])
       
           // This is deprecated in webpack 5 but alias false does not seem to work
           config.module.rules.push({
               test: /node_modules[\\\/]https-proxy-agent[\\\/]/,
               use: 'null-loader',
           })
           return config;
       }
       ```
       
    3. Update package.json scripts section with

        ```
        "start": "react-app-rewired start", 
        "build": "react-app-rewired build",
        "test": "react-app-rewired test",
        ```

This online template uses these steps to run xrpl.js with React in the browser:
https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js

### Using xrpl.js with React Native

If you want to use `xrpl.js` with React Native you will need to install shims for core NodeJS modules. To help with this you can use a module like [rn-nodeify](https://github.com/tradle/rn-nodeify).

1. Install dependencies (you can use `yarn` as well):

    ```shell
    npm install react-native-crypto
    npm install xrpl
    # install peer deps
    npm install react-native-randombytes
    # install latest rn-nodeify
    npm install rn-nodeify@latest --dev
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
### Using xrpl.js with Vite React

Similar to above, to get xrpl.js to work with Vite you need to set up a couple aliases in the vite.config.ts file. 

1. If it's a fresh project you can use `npm create vite@latest` then choose the React and TypeScript options.

2. Copy these settings into your `vite.config.ts` file.

```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import polyfillNode from 'rollup-plugin-polyfill-node'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {

        define: {
          global: 'globalThis',
        },
        plugins: [
            NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true,
            }),
        ],
    },
},
build: {
  rollupOptions: {
      plugins: [
          polyfillNode(),
      ]
  }
},
resolve: {
  alias: {
    events: 'events',
    crypto: 'crypto-browserify',
    stream: 'stream-browserify',
    http: 'stream-http',
    https: 'https-browserify',
    ws: 'xrpl/dist/npm/client/WSWrapper',
  },
}})
```

3. Install the config dependencies and xrpl (e.g. using this command)

```
npm install --save-dev @esbuild-plugins/node-globals-polyfill \
		rollup-plugin-polyfill-node \
		&& npm install
		events \
		crypto-browserify \
		stream-browserify \
		stream-http \
		https-browserify \
		xrpl
```

### Using xrpl.js with Deno

Until official support for [Deno](https://deno.land) is added, you can use the following work-around to use `xrpl.js` with Deno:

```javascript
import xrpl from 'https://dev.jspm.io/npm:xrpl';

(async () => {
  const api = new (xrpl as any).Client('wss://s.altnet.rippletest.net:51233');
  const address = 'rH8NxV12EuV...khfJ5uw9kT';

  api.connect().then(() => {
    api.getBalances(address).then((balances: any) => {
      console.log(JSON.stringify(balances, null, 2));
    });
  });
})();
```

## Documentation

+ [Get Started in Node.js](https://xrpl.org/get-started-using-node-js.html)
+ [Full Reference Documentation](https://js.xrpl.org)
+ [Code Samples](https://github.com/XRPLF/xrpl.js/tree/main/packages/xrpl/snippets/src)

### Mailing Lists

We have a low-traffic mailing list for announcements of new `xrpl.js` releases. (About 1 email per week)

+ [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)

### Report an issue

Experienced an issue? Report it [here](https://github.com/XRPLF/xrpl.js/issues/new).

## More Information

+ [xrpl-announce mailing list](https://groups.google.com/g/xrpl-announce) - subscribe for release announcements
+ [xrpl.js API Reference](https://js.xrpl.org)
+ [XRP Ledger Dev Portal](https://xrpl.org)
