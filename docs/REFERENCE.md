#`ripple-lib` API Reference

In this document:

1. [Remote options](REFERENCE.md#1-remote-options)
2. [Remote functions](REFERENCE.md#2-remote-functions)
  + [Server info functions](REFERENCE.md#server-info-functions)
  + [Ledger query functions](REFERENCE.md#ledger-query-functions)
  + [Transaction query functions](REFERENCE.md#transaction-query-functions)
  + [Account query functions](REFERENCE.md#account-query-functions)
  + [Order book query functions](REFERENCE.md#order-book-query-functions)
  + [Transaction submission functions](REFERENCE.md#transaction-submission-functions)
3. [Transaction events](REFERENCE.md#3-transaction-events)
4. [Amount objects](REFERENCE.md#4-amount-objects)


Also see:

1. [The `ripple-lib` README](../README.md)
2. [The `ripple-lib` GUIDES](GUIDES.md)


#1. `Remote` options

A new `Remote` can be created with the following options:

+ `trace` Log all of the events emitted (boolean)
+ `max_listeners` Set maxListeners for remote; prevents EventEmitter warnings (number)
+ `connection_offset` Connect to remote servers on supplied interval (number in seconds)
+ `trusted` truthy, if remote is trusted (boolean)
+ `max_fee` Maximum acceptable transaction fee (number in XRP or drops?)
+ `fee_cushion` Extra fee multiplier to account for async fee changes (?)
+ `servers` Array of server objects of the following form:

```js
{ 
  host:    <string>
  , port:    <number>
  , secure:  <boolean>
}
```


#2. `Remote` functions



##Server info functions

**[request_server_info([callback])](https://ripple.com/wiki/RPC_API#server_info)**

Returns information about the state of the server. If you are connected to multiple servers and want to select by a particular host, use `request.set_server`. Example:

```js
var request = remote.request_server_info();
request.set_server('my.hostname');
request.callback(function(err, res) {

});
request.request();
```

**[request_unl_list([callback])](https://ripple.com/wiki/RPC_API#unl_list)**

**[request_unl_add(addr, comment, [callback])](https://ripple.com/wiki/RPC_API#unl_add)**

**[request_unl_delete(node, [callback])](https://ripple.com/wiki/RPC_API#unl_delete)**

**[request_peers([callback])](https://ripple.com/wiki/RPC_API#peers)**


**[request_connect(ip, port, [callback])](https://ripple.com/wiki/RPC_API#connect)**



##Ledger query functions

**[request_ledger(ledger, [opts], [callback])](https://ripple.com/wiki/RPC_API#ledger)**

**request_ledger_header([callback])**

**[request_ledger_current([callback])](https://ripple.com/wiki/RPC_API#ledger_current)**

**[request_ledger_entry(type, [callback])](https://ripple.com/wiki/RPC_API#ledger_entry)**

**[request_subscribe(streams, [callback])](https://ripple.com/wiki/RPC_API#subscribe)**

Start receiving selected streams from the server.

**[request_unsubscribe(streams, [callback])](https://ripple.com/wiki/RPC_API#unsubscribe)**

Stop receiving selected streams from the server.




##Transaction query functions

**[request_transaction_entry(hash, [ledger_hash], [callback])](https://ripple.com/wiki/RPC_API#transaction_entry)**

Searches a particular ledger for a transaction hash. Default ledger is the open ledger.

**[request_tx(hash, [callback])](https://ripple.com/wiki/RPC_API#tx)**

Searches ledger history for validated transaction hashes.




##Account query functions

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

**[request_wallet_accounts(seed, [callback])](https://ripple.com/wiki/RPC_API#wallet_accounts)**

Return a list of accounts for a wallet.

+ requires trusted remote

**request_account_balance(account, ledger, [callback])**

Get the balance for an account. Returns an [Amount](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/amount.js) object.

**request_account_flags(account, current, [callback])**

Return the flags for an account.

**request_owner_count(account, current, [callback])**

Return the owner count for an account.

**request_ripple_balance(account, issuer, currency, current, [callback])**

Return a request to get a ripple balance




##Order book query functions

**[request_book_offers(gets, pays, taker, [callback])](https://ripple.com/wiki/RPC_API#book_offers)**

Return the offers for an order book as one or more pages.




##Transaction submission functions

**[request_sign(secret, tx_json, [callback])](https://ripple.com/wiki/RPC_API#sign)**

Sign a transaction.

+ requires trusted remote

**[request_submit([callback])](https://ripple.com/wiki/RPC_API#submit)**

Submit a transaction to the network. This command is used internally to submit transactions with a greater degree of reliability. See [Submitting a transaction](https://github.com/ripple/ripple-lib#submitting-a-transaction) for details.


**[request_ripple_path_find(src_account, dst_account, dst_amount, src_currencies, [callback])](https://ripple.com/wiki/RPC_API#path_find)**


**transaction([destination], [source], [amount], [callback])**

Returns a [Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) object


#3. Transaction events

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


#4. Amount objects

