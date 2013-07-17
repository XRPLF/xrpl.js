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

Once a connection is formed to any of the supplied servers, a `connect` event is emitted, indicating that the remote is ready to begin fulfilling requests. When there are no more connected servers to fulfill requests, a `disconnect` event is emitted. If you send requests before ripple-lib is connected to any servers, requests are deferred until the `connect` event is received.

```js
var remote = new Remote({ /* options */ }).connect();
remote.request_server_info(function(err, info) { }); // will defer until connected
```

##Remote functions

Each remote function returns a `Request` object. is object is an `EventEmitter`. You may listen for success or failure events from each request, or provide a callback. Example:

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

###request_server_info([callback])

###request_ledger(ledger, [opts], [callback])

###request_ledger_hash([callback])

###request_ledger_header([callback])

###request_ledger_current([callback])

###request_ledger_entry(type, [callback])

###request_subscribe(streams, [callback])

###request_unsubscribe(streams, [callback])

###request_transaction_entry(hash, [callback])

###request_tx(hash, [callback])

###request_account_info(accountID, [callback])

###request_account_lines(accountID, account_index, current, [callback])

###request_account_offers(accountID, account_index, current, [callback])

###request_account_tx(opts, [callback])

###request_book_offers(gets, pays, taker, [callback])

###request_wallet_accounts(seed, [callback])

+ requires trusted ###remote

###request_sign(secret, tx_json, [callback])

+ requires trusted ###remote

###request_submit([callback])

###request_account_balance(account, current, [callback])

###request_account_flags(account, current, [callback])

###request_owner_count(account, current, [callback])

###request_ripple_balance(account, issuer, currency, current, [callback])

###request_ripple_path_find(src_account, dst_account, dst_amount, src_currencies, [callback])

###request_unl_list([callback])

###request_unl_add(addr, comment, [callback])

###request_unl_delete(node, [callback])

###request_peers([callback])

###request_connect(ip, port, [callback])

###transaction()

+ returns a [Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) object
