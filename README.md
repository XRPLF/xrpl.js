# xrpl.js

A JavaScript/TypeScript library for interacting with the XRP Ledger

[![NPM](https://nodei.co/npm/xrpl.png)](https://www.npmjs.org/package/xrpl)
![npm bundle size](https://img.shields.io/bundlephobia/min/xrpl)

This is the recommended library for integrating a JavaScript/TypeScript app with the XRP Ledger, especially if you intend to use advanced functionality such as IOUs, payment paths, the decentralized exchange, account settings, payment channels, escrows, multi-signing, and more.

## [➡️ Reference Documentation](http://js.xrpl.org)

See the full reference documentation for all classes, methods, and utilities.

## Features

1. Managing keys & creating test credentials ([`Wallet`](https://js.xrpl.org/classes/Wallet.html) && [`Client.fundWallet()`](https://js.xrpl.org/classes/Client.html#fundWallet))
2. Submitting transactions to the XRP Ledger ([`Client.submit(...)`](https://js.xrpl.org/classes/Client.html#submit) & [transaction types](https://xrpl.org/transaction-types.html))
3. Sending requests to observe the ledger ([`Client.request(...)`](https://js.xrpl.org/classes/Client.html#request) using [public api methods](https://xrpl.org/public-api-methods.html))
4. Subscribing to changes in the ledger ([Ex. ledger, transactions, & more...](https://xrpl.org/subscribe.html))
5. Helper functions to parse ledger data (Ex. [`xrpToDrops`](https://js.xrpl.org/functions/xrpToDrops.html))

All of which works in Node.js (tested for v14+) & web browsers.

## Quickstart

### Requirements

- **[Node.js v14](https://nodejs.org/)** is recommended. We also support v12 and v16. Other versions may work but are not frequently tested.

### Installing xrpl.js

You can install `xrpl.js` with `npm` or `yarn` using:

```
$ npm install --save xrpl
```

or

```
$ yarn add xrpl
```

Example usage:

```js
const xrpl = require("xrpl");
async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const response = await client.request({
    command: "account_info",
    account: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    ledger_index: "validated",
  });
  console.log(response);

  client.disconnect();
}
main();
```

For a more in-depth example, you can copy/forking this Code Sandbox template!
https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js

It goes through:

1. Creating a new test account
2. Sending a payment transaction
3. And sending requests to see your account balance!

### Case by Case Setup Steps

If you're using xrpl.js with React or Deno, you'll need to do a couple extra steps to set it up:

- [Using xrpl.js with `create-react-app`](./UNIQUE_SETUPS.md#using-xrpljs-with-create-react-app)
- [Using xrpl.js with `React Native`](./UNIQUE_SETUPS.md#using-xrpljs-with-react-native)
- [Using xrpl.js with `Vite React`](./UNIQUE_SETUPS.md#using-xrpljs-with-vite-react)
- [Using xrpl.js with `Deno`](./UNIQUE_SETUPS.md#using-xrpljs-with-deno)

## Documentation

As you develop with xrpl.js, there's two sites you'll use extensively:

1. [xrpl.org](https://xrpl.org/references.html) is the primary source for:
   a. How the ledger works ([See Concepts](https://xrpl.org/concepts.html#main-page-header))
   b. What kinds of transactions there are ([Transaction Types](https://xrpl.org/transaction-types.html#transaction-types))
   c. Requests you can send ([Public API Methods](https://xrpl.org/public-api-methods.html))
   d. Tutorials for interacting with various features of the ledger ([Tutorials](https://xrpl.org/tutorials.html#main-page-header))
2. [js.xrpl.org](https://js.xrpl.org/) has the reference docs for this library

## Asking for help

One of the best spots to ask for help is in the [XRPL Developer Discord](https://xrpldevs.org) - There's a channel for xrpl.js where other community members can help you figure out how to accomplish your goals.

You are also welcome to create an [issue](https://github.com/XRPLF/xrpl.js/issues) here and we'll do our best to respond within 3 days.

### Mailing Lists

If you want to hear when we release new versions of xrpl.js, you can join our low-traffic mailing list (About 1 email per week):

- [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

- [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)

### Key Links

- [xrpl.js Reference Docs](https://js.xrpl.org/)
- [xrpl.org (Detailed docs on how the XRPL works)](https://xrpl.org/references.html)
- [#javascript in the XRPL Developer Discord for questions & support](https://xrpldevs.org)
- [xrpl-announce (The mailing list for new xrpl.js versions)](https://groups.google.com/g/xrpl-announce)
- [Applications that use xrpl.js](https://github.com/XRPLF/xrpl.js/blob/main/APPLICATIONS.md) (You can open a PR to add your project!)
