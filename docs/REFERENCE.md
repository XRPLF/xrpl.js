#API Reference

__(More examples coming soon!)__

###In this document:

1. [`Remote` options](REFERENCE.md#remote-options)
2. [`Request` constructors](REFERENCE.md#request-constructor-functions)
  + [Server requests](REFERENCE.md#server-requests)
  + [Ledger requests](REFERENCE.md#ledger-requests)
  + [Transaction requests](REFERENCE.md#transaction-requests)
  + [Account requests](REFERENCE.md#account-requests)
  + [Orderbook requests](REFERENCE.md#orderbook-requests)
  + [Transaction requests](REFERENCE.md#transaction-requests)
3. [`Transaction` constructors](REFERENCE.md#transaction-constructors)
  + [Transaction events](REFERENCE.md#transaction-events)

###Also see:

1. [The ripple-lib README](../README.md)
2. [The ripple-lib GUIDES](GUIDES.md)a

#Remote options

```js
/* Loading ripple-lib with Node.js */
var Remote = require('ripple-lib').Remote;

/* Loading ripple-lib in a webpage */
// var Remote = ripple.Remote;

var options = { };

var remote = new Remote(options);
```

A new `Remote` can be created with the following options:

+ `trace` *boolean default: false* Log all of the events emitted
+ `max_listeners` *number default: 0* Set maxListeners for servers
+ `trusted` *boolean default: false*, if remote is trusted (boolean)
+ `local_signing` *boolean default: true*
+ `local_fee` *boolean default: true* Set whether the transaction fee range will be set locally, see [A note on transaction fees](GUIDES.md#a-note-on-transaction-fees))
+ `fee_cushion` *number default: 1.2* Extra fee multiplier to account for async fee changes, see [A note on transaction fees](GUIDES.md#a-note-on-transaction-fees))
+ `max_fee` *number default: Infinity* Maximum acceptable transaction fee, see [A note on transaction fees](GUIDES.md#a-note-on-transaction-fees)
+ `servers` *array* Array of server objects of the following form:

```js
{
  host:    <string>,
  port:    <number>,
  secure:  <boolean>
}
```

or

```js
 'wss://host:port'
```

#Request constructor functions

Some requests have helper methods to construct the requests object and set properties on the message object. These will often be the more used requests and the helper methods is the preferred way of constructing these requests.
Other request can still be made, but the type will have to be passed in directly to request constructor. See examples below.

If the method is camelCased and starts with `request`, it's a helper method that wraps the request constructor.

##Server requests

**[requestServerInfo([callback])](https://ripple.com/wiki/JSON_Messages#server_info)**

Returns information about the state of the server. If you are connected to multiple servers and want to select by a particular host, use `request.setServer`. Example:

```js
var request = remote.requestServerInfo();

request.setServer('wss://s1.ripple.com');

request.request(function(err, res) {

});
```
**[requestPeers([callback])](https://ripple.com/wiki/JSON_Messages#peers)**

**[requestConnect(ip, port, [callback])](https://ripple.com/wiki/JSON_Messages#connect)**

**[unl_list([callback])](https://ripple.com/wiki/JSON_Messages#unl_list)**

```js
var request = remote.request('un_list');

request.setServer('wss://s1.ripple.com');

request.request(function(err, res) {

});
```

**[unl_add(addr, comment, [callback])](https://ripple.com/wiki/JSON_Messages#unl_add)**

**[unl_delete(node, [callback])](https://ripple.com/wiki/JSON_Messages#unl_delete)**



##Ledger requests

**[requestLedger([opts], [callback])](https://ripple.com/wiki/JSON_Messages#ledger)**

**[requestLedgerHeader([callback])](https://wiki.ripple.com/JSON_Messages#ledger_data)**

**[requestLedgerCurrent([callback])](https://ripple.com/wiki/JSON_Messages#ledger_current)**

**[requestLedgerEntry(type, [callback])](https://ripple.com/wiki/JSON_Messages#ledger_entry)**

**[requestSubscribe([streams], [callback])](https://ripple.com/wiki/JSON_Messages#subscribe)**

Start receiving selected streams from the server.

**[requestUnsubscribe([streams], [callback])](https://ripple.com/wiki/JSON_Messages#unsubscribe)**

Stop receiving selected streams from the server.

##Account requests

**[requestAccountInfo(options, [callback])](https://ripple.com/wiki/JSON_Messages#account_info)**

Return information about the specified account.

```
var options = {
  account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
  ledger: 'validated'
};

var request = remote.requestAccountInfo(options, function(err, info) {
  /* process info */
});


// response
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

**[requestAccountLines(options, [callback])](https://ripple.com/wiki/JSON_Messages#account_lines)**

**[requestAccountOffers(options, [callback])](https://ripple.com/wiki/JSON_Messages#account_offers)**

Return the specified account's outstanding offers.

Requests for both `account_lines` and `account_offers` support paging. The amount of results per response can be configured with the `limit`.
The responses can be paged through by using the `marker`.

```
// A valid `ledger_index` or `ledger_hash` is required to provide a reliable result.
// Results can change between ledger closes, so the provided ledger will be used as base.
var options = {
    account: < rippleAccount >,
    limit: < Number between 10 and 400 >,
    ledger: < valid ledger_index or ledger_hash >
}

// The `marker` comes back in an account request if there are more results than are returned 
// in the current response. The amount of results per response are determined by the `limit`.
if (marker) {
    options.marker = < marker >;
}

var request = remote.requestAccountOffers(options);
```


**[requestAccountTransactions(options, [callback])](https://ripple.com/wiki/JSON_Messages#account_tx)**

Fetch a list of transactions that applied to this account.

Options:

+ `account`
+ `ledger_index_min`
+ `ledger_index_max`
+  `binary` *false*
+ `count` *false*
+  `descending` *false*
+  `offset` *0*
+  `limit`
+ `forward` *false*
+ `fwd_marker`
+ `rev_marker`

**[requestWalletAccounts(seed, [callback])](https://ripple.com/wiki/JSON_Messages#wallet_accounts)**

Return a list of accounts for a wallet. *Requires trusted remote*

**requestAccountBalance(account, [ledger], [callback])**

Get the balance for an account. Returns an [Amount](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/amount.js) object.

**requestAccountFlags(account, [ledger], [callback])**

Return the flags for an account.

**requestOwnerCount(account, [ledger], [callback])**

Return the owner count for an account.

**requestRippleBalance(account, issuer, currency, [ledger], [callback])**

Return a request to get a ripple balance

##Orderbook requests

**[requestBookOffers(options, [callback])](https://ripple.com/wiki/JSON_Messages#book_offers)**

Return the offers for an order book, also called a *snapshot*

```js
var options = {
  gets: {
    issuer: < issuer >,
    currency: < currency >
  },
  pays: {
    issuer: < issuer >,
    currency: < currency >
  },
  limit: < limit >
};

var request = remote.requestBookOffers(options);

request.request(function(err, offers) {
  //handle offers
});
```

##Transaction requests

**[requestTransactionEntry(hash, [ledger_hash], [callback])](https://ripple.com/wiki/JSON_Messages#transaction_entry)**

Searches a particular ledger for a transaction hash. Default ledger is the open ledger.

**[requestTransaction(hash, [callback])](https://ripple.com/wiki/JSON_Messages#tx)**

Searches ledger history for validated transaction hashes.

**[requestSign(secret, tx_json, [callback])](https://ripple.com/wiki/JSON_Messages#sign)**

Sign a transaction. *Requires trusted remote*

**[requestSubmit([callback])](https://ripple.com/wiki/JSON_Messages#submit)**

Submit a transaction to the network. This command is used internally to submit transactions with a greater degree of reliability. See [Submitting a payment to the network](GUIDES.md#3-submitting-a-payment-to-the-network) for details.

**[pathFind(src_account, dst_account, dst_amount, src_currencies)](https://ripple.com/wiki/JSON_Messages#path_find)**

#Transaction constructors

Use `remote.createTransaction('TransactionType', [options])` to construct a transaction. To submit, use `transaction.submit([callback])`.

**Payment**

```js
var transaction = remote.createTransaction('Payment', {
  account: MY_ADDRESS,
  destination: DEST_ADDRESS,
  amount: AMOUNT
});
```

**AccountSet**

```js
var transaction = remote.createTransaction('AccountSet', {
  account: MY_ADDRESS,
  set: 'RequireDest',
  clear: 'RequireAuth'
});
```

**TrustSet**

```js
var transaction = remote.createTransaction('TrustSet', {
  account: MY_ADDRESS,
  limit: '1/USD/rrrrrrrrrrrrrrrrrrrrBZbvji'
});
```

**OfferCreate**

```js
var transaction = remote.createTransaction('OfferCreate', {
  account: MY_ADDRESS,
  taker_pays: '1',
  taker_gets: '1/USD/rrrrrrrrrrrrrrrrrrrrBZbvji'
});
```

##Transaction events

[Transaction](https://github.com/ripple/ripple-lib/blob/develop/src/js/ripple/transaction.js) objects are EventEmitters. They may emit the following events.

+ `final` Transaction has erred or succeeded. This event indicates that the transaction has finished processing.
+ `error` Transaction has erred. This event is a final state.
+ `success` Transaction succeeded. This event is a final state.
+ `presubmit` Immediately before transaction is submitted
+ `postsubmit` Immediately after transaction is submitted
+ `submitted` Transaction has been submitted to the network. The submission may result in a remote error or success.
+ `resubmitted` Transaction is beginning resubmission.
+ `proposed` Transaction has been submitted *successfully* to the network. The transaction at this point is awaiting validation in a ledger.
+ `timeout` Transaction submission timed out. The transaction will be resubmitted.
+ `fee_adjusted` Transaction fee has been adjusted during its pending state. The transaction fee will only be adjusted if the remote is configured for local fees, which it is by default.
+ `abort` Transaction has been aborted. Transactions are only aborted by manual calls to `#abort`.
+ `missing` Four ledgers have closed without detecting validated transaction
+ `lost` Eight ledgers have closed without detecting validated transaction. Consider the transaction lost and err/finalize.

##Complete payment example

```js
remote.setSecret(MY_ADDRESS, MY_SECRET);

var transaction = remote.createTransaction('Payment', {
  account: MY_ADDRESS,
  destination: DEST_ADDRESS,
  amount: AMOUNT
});

transaction.on('resubmitted', function() {
  // initial submission failed, resubmitting
});

transaction.submit(function(err, res) {
 // submission has finalized with either an error or success.
 // the transaction will not be retried after this point
});
```

#Amount objects

Coming Soon
