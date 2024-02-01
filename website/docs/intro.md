---
sidebar_position: 1
---

# Quickstart

### Requirements

- **[Node.js v16](https://nodejs.org/)** is recommended. We also support v14, v18 and v20. Other versions may work but are not frequently tested.

### Installing xrpl.js

In an existing project (with package.json), install xrpl.js with:

```
$ npm install --save xrpl
```

Or with `yarn`:

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
<br/>https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js

It goes through:

1. Creating a new test account
2. Sending a payment transaction
3. And sending requests to see your account balance!
