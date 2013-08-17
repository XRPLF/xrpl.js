#Ripple JavaScript Library

This library can connect to the Ripple network via the WebSocket protocol and runs in Node.js as well as in the browser.

* https://ripple.com/wiki/Ripple_JavaScript_library
* https://ripple.com
* https://ripple.com/wiki

##Getting started

[ripple-lib.remote](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js) is responsible for managing connections to rippled servers.

```js
var Remote = require('ripple-lib').Remote;

var remote = new Remote({
  trusted: true,
  local_signing: true,
  servers: [ 
    { 
        host: 'my.hostname'
      , port: 1337,
      , secure: true
    } 
  ]
});

remote.connect(function() {
  /* remote connected */
});
```

Once a connection is formed to any of the supplied servers, a `connect` event is emitted, indicating that the remote is ready to begin fulfilling requests. When there are no more connected servers to fulfill requests, a `disconnect` event is emitted. If you send requests before ripple-lib is connected to any servers, requests are deferred until the `connect` event is emitted.

```js
var remote = new Remote({ /* options */ }).connect();

remote.request_server_info(function(err, info) {
 /* will defer until connected */
}); 
```

##Calling remote functions

Each remote function returns a `Request` object. This object is an `EventEmitter`. You may listen for success or failure events from each request, or provide a callback. Example:

```js
var request = remote.request_server_info();
request.on('success', function(res) { 
  //handle success
});
request.on('error', function(err) { 
  //handle error
});
request.request();
```

Or:

```js
remote.request_server_info(function(err, res) {
  if (err) {
    //handle error
  } else {
    //handle success
  }
});
```

##Functions available

**request_server_info([callback])**

**request_ledger(ledger, [opts], [callback])**

**request_ledger_hash([callback])**

**request_ledger_header([callback])**

**request_ledger_current([callback])**

**request_ledger_entry(type, [callback])**

**request_subscribe(streams, [callback])**

**request_unsubscribe(streams, [callback])**

**request_transaction_entry(tx_hash, [ledger_hash], [callback])**

**request_tx(hash, [callback])**

**request_account_info(accountID, [callback])**

**request_account_lines(accountID, account_index, current, [callback])**

**request_account_offers(accountID, account_index, current, [callback])**

**request_account_tx(opts, [callback])**

**request_book_offers(gets, pays, taker, [callback])**

**request_wallet_accounts(seed, [callback])**

+ requires trusted remote

**request_sign(secret, tx_json, [callback])**

+ requires trusted remote

**request_submit([callback])**

**request_account_balance(account, current, [callback])**

**request_account_flags(account, current, [callback])**

**request_owner_count(account, current, [callback])**

**request_ripple_balance(account, issuer, currency, current, [callback])**

**request_ripple_path_find(src_account, dst_account, dst_amount, src_currencies, [callback])**

**request_unl_list([callback])**

**request_unl_add(addr, comment, [callback])**

**request_unl_delete(node, [callback])**

**request_peers([callback])**

**request_connect(ip, port, [callback])**

**transaction([destination], [source], [amount], [callback])**

+ returns a [Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) object

##Example

Examples assume that a `remote` class has been initialized.

**Submitting a transaction to the Ripple network**

```js
var Amount = require('ripple-lib').Amount;

var MY_ADDRESS = 'rrrrrrrrrrrrrrrrr';
var MY_SECRET  = 'secret';
var RECIPIENT  = 'rrrrrrrrrrrrrrrr';
var AMOUNT     = Amount.from_human('1XRP');

remote.once('connect', function() {
  remote.set_secret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.transaction();

  transaction.payment(MY_ADDRESS, RECIPIENT, AMOUNT, function(err, res) {
    /* handle submission errors / success */
  });

  transaction.submit();
});
```

