---
sidebar_position: 4
---

# Using xrpl.js with Vite React

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
