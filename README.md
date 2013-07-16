Ripple JavaScript Library - ripple-lib
======================================

This library can connect to the Ripple network via the WebSocket protocol and runs in Node.js as well as in the browser.

##Building

* https://ripple.com/wiki/Ripple_JavaScript_library

##See also

* https://ripple.com
* https://ripple.com/wiki

##Initializing a remote connection

[ripple-lib.remote](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js) is responsible for managing connections to rippled servers.

```js
var Remote = require('ripple-lib').Remote;

var remote = new Remote({
  trusted: false,
  servers: [ 
    { 
        host: ''
      , port: 1111,
      , secure: true
    } 
  ]
});

remote.connect();
```

##Remote functions

Each remote function returns a `Request` object. This object is an `EventEmitter`. You may listen for success or failure events from each request, or provide a callback. Example:

```js
var request = remote.request_server_info();
request.on('success', function(res) { 
  //handle success conditions
});
request.on('error', function(err) { 
  //handle error conditions
});
request.request();
```

Or:

```js
remote.request_server_info(function(err, res) {
  
});
```

**remote.request_server_info([callback])**

**remote.request_ledger(ledger, [opts], [callback])**

**remote.request_ledger_hash([callback])**

**remote.request_ledger_header([callback])**

**remote.request_ledger_current([callback])**

**remote.request_ledger_entry(type, [callback])**

**remote.request_subscribe(streams, [callback])**

**remote.request_unsubscribe(streams, [callback])**

**remote.request_transaction_entry(hash, [callback])**

**remote.request_tx(hash, [callback])**

**remote.request_account_info(accountID, [callback])**

**remote.request_account_lines(accountID, account_index, current, [callback])**

**remote.request_account_offers(accountID, account_index, current, [callback])**

**remote.request_account_tx(opts, [callback])**

**remote.request_book_offers(gets, pays, taker, [callback])**

**remote.request_wallet_accounts(seed, [callback])**

+ requires trusted remote

**remote.request_sign(secret, tx_json, [callback])**

+ requires trusted remote

**remote.request_submit([callback])**

**remote.request_account_balance(account, current, [callback])**

**remote.request_account_flags(account, current, [callback])**

**remote.request_owner_count(account, current, [callback])**

**remote.request_ripple_balance(account, issuer, currency, current, [callback])**

**remote.request_ripple_path_find(src_account, dst_account, dst_amount, src_currencies, [callback])**

**remote.request_unl_list([callback])**

**remote.request_unl_add(addr, comment, [callback])**

**remote.request_unl_delete(node, [callback])**

**remote.request_peers([callback])**

**remote.request_connect(ip, port, [callback])**

**remote.transaction()**
