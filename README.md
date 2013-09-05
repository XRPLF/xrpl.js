#Ripple JavaScript Library

`npm install ripple-lib`

This library can connect to the Ripple network via the WebSocket protocol and runs in Node.js as well as in the browser.

* https://ripple.com/wiki/Ripple_JavaScript_library
* https://ripple.com
* https://ripple.com/wiki

##Getting started

[ripple-lib.remote](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/remote.js) is responsible for managing connections to rippled servers.

```js
var Remote = require('ripple-lib').Remote;

var remote = new Remote({
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
});
```

##Calling remote commands

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

*Or:*

```js
remote.request_server_info(function(err, res) {
  if (err) {
    //handle error
  } else {
    //handle success
  }
});
```

##Commands available

**[request_server_info([callback])](https://ripple.com/wiki/RPC_API#server_info)**

Returns information about the state of the server. If you are connected to multiple servers and want to select by a particular host, use `request.set_server`. Example:

```js
var request = remote.request_server_info();
request.set_server('my.hostname');
request.callback(function(err, res) {

});
request.request();
```

**[request_ledger(ledger, [opts], [callback])](https://ripple.com/wiki/RPC_API#ledger)**

**request_ledger_header([callback])**

**[request_ledger_current([callback])](https://ripple.com/wiki/RPC_API#ledger_current)**

**[request_ledger_entry(type, [callback])](https://ripple.com/wiki/RPC_API#ledger_entry)**

**[request_subscribe(streams, [callback])](https://ripple.com/wiki/RPC_API#subscribe)**

Start receiving selected streams from the server.

**[request_unsubscribe(streams, [callback])](https://ripple.com/wiki/RPC_API#unsubscribe)**

Stop receiving selected streams from the server.

**[request_transaction_entry(hash, [ledger_hash], [callback])](https://ripple.com/wiki/RPC_API#transaction_entry)**

Searches a particular ledger for a transaction hash. Default ledger is the open ledger.

**[request_tx(hash, [callback])](https://ripple.com/wiki/RPC_API#tx)**

Searches ledger history for validated transaction hashes.

**[request_account_info(account, [callback])](https://ripple.com/wiki/RPC_API#account_info)**

Return information about the specified account.

```
{
  ledger_current_index: <number>,
  account_data: {
    Account:            <string>,
    Balance:            <number>,
    Flags:              <number>,
    LedgerEntryType:    <string>,
    OwnerCount:         <number>,
    PreviousTxnID:      <string>,
    PreviousTxnLgrSeq:  <number>,
    Sequence:           <number> ,
    index:              <string>
  }
}
```

**[request_account_lines(accountID, account_index, current, [callback])](https://ripple.com/wiki/RPC_API#account_lines)**

**[request_account_offers(accountID, account_index, current, [callback])](https://ripple.com/wiki/RPC_API#account_offers)**

Return the specified account's outstanding offers.

**[request_account_tx(opts, [callback])](https://ripple.com/wiki/RPC_API#account_tx)**

Fetch a list of transactions that applied to this account.

Options:

+ `account`
+ `ledger_index_min` *deprecated, -1*
+ `ledger_index_max` *deprecated, -1*
+  `binary` *false*
+ `count` *false*
+  `descending` *false*
+  `offset` *0*
+  `limit`
+ `forward` *false*
+ `fwd_marker`
+ `rev_marker`

**[request_book_offers(gets, pays, taker, [callback])](https://ripple.com/wiki/RPC_API#book_offers)**

Return the offers for an order book as one or more pages.

**[request_wallet_accounts(seed, [callback])](https://ripple.com/wiki/RPC_API#wallet_accounts)**

Return a list of accounts for a wallet.

+ requires trusted remote

**[request_sign(secret, tx_json, [callback])](https://ripple.com/wiki/RPC_API#sign)**

Sign a transaction.

+ requires trusted remote

**[request_submit([callback])](https://ripple.com/wiki/RPC_API#submit)**

Submit a transaction to the network. This command is used internally to submit transactions with a greater degree of reliability. See [Submitting a transaction](https://github.com/ripple/ripple-lib#submitting-a-transaction) for details.

**request_account_balance(account, ledger, [callback])**

Get the balance for an account. Returns an [Amount](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/amount.js) object.

**request_account_flags(account, current, [callback])**

Return the flags for an account.

**request_owner_count(account, current, [callback])**

Return the owner count for an account.

**request_ripple_balance(account, issuer, currency, current, [callback])**

Return a request to get a ripple balance

**[request_ripple_path_find(src_account, dst_account, dst_amount, src_currencies, [callback])](https://ripple.com/wiki/RPC_API#path_find)**

**[request_unl_list([callback])](https://ripple.com/wiki/RPC_API#unl_list)**

**[request_unl_add(addr, comment, [callback])](https://ripple.com/wiki/RPC_API#unl_add)**

**[request_unl_delete(node, [callback])](https://ripple.com/wiki/RPC_API#unl_delete)**

**[request_peers([callback])](https://ripple.com/wiki/RPC_API#peers)**

**[request_connect(ip, port, [callback])](https://ripple.com/wiki/RPC_API#connect)**

**transaction([destination], [source], [amount], [callback])**

Returns a [Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) object

##Submitting a transaction

```js
var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;

var MY_ADDRESS = 'rrrMyAddress';
var MY_SECRET  = 'secret';
var RECIPIENT  = 'rrrRecipient';
var AMOUNT     = Amount.from_human('1XRP');

var remote = new Remote({ /* configuration */ });

remote.connect(function() {
  remote.set_secret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.transaction();

  transaction.payment(MY_ADDRESS, RECIPIENT, AMOUNT);

  transaction.submit(function(err, res) {
    /* handle submission errors / success */
  });
});
```

###Transaction events

[Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) objects are EventEmitters. They may emit the following events.

+ `final` Transaction has erred or succeeded. This event indicates that the transaction has finished processing.
+ `error` Transaction has erred. This event is a final state.
+ `success` Transaction succeeded. This event is a final state.
+ `submitted` Transaction has been submitted to the network. The submission may result in a remote error or success.
+ `proposed` Transaction has been submitted *successfully* to the network. The transaction at this point is awaiting validation in a ledger.
+ `timeout` Transaction submission timed out. The transaction will be resubmitted.
+ `resubmit` Transaction is beginning resubmission.
+ `fee_adjusted` Transaction fee has been adjusted during its pending state. The transaction fee will only be adjusted if the remote is configured for local fees, which it is by default.
+ `abort` Transaction has been aborted. Transactions are only aborted by manual calls to `#abort`.
+ `missing` Four ledgers have closed without detecting validated transaction
+ `lost` Eight ledgers have closed without detecting validated transaction. Consider the transaction lost and err/finalize.
