# Unique Setup Steps for Xrpl.js

For when you need to do more than just install `xrpl.js` for it to work (especially for React projects in the browser).

### Using xrpl.js from a CDN

You can avoid setting up your build system to handle `xrpl.js` by using a cdn version that is prebuilt for the browser.

- unpkg `<script src="https://unpkg.com/xrpl@2.3.0/build/xrpl-latest-min.js"></script>`
- jsdelivr `<script src="https://cdn.jsdelivr.net/npm/xrpl@2.3.0/build/xrpl-latest-min.js"></script>`

Ensure that the full path is provided so the browser can find the sourcemaps.

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

      ```shell
      npm install --save-dev react-app-rewired
      ```

   2. At the project root, add a file named `config-overrides.js` with the following content:

      ```javascript
      const webpack = require("webpack");

      module.exports = function override(config) {
        const fallback = config.resolve.fallback || {};
        Object.assign(fallback, {
          assert: require.resolve("assert"),
          crypto: require.resolve("crypto-browserify"),
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          os: require.resolve("os-browserify"),
          stream: require.resolve("stream-browserify"),
          url: require.resolve("url"),
          ws: require.resolve("xrpl/dist/npm/client/WSWrapper"),
        });
        config.resolve.fallback = fallback;
        config.plugins = (config.plugins || []).concat([
          new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
          }),
        ]);

        // This is deprecated in webpack 5 but alias false does not seem to work
        config.module.rules.push({
          test: /node_modules[\\\/]https-proxy-agent[\\\/]/,
          use: "null-loader",
        });
        return config;
      };
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
   require("crypto");
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
