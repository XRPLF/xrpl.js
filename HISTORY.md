##0.7.39

+ Improvements to multi-server support. Fixed an issue where a server's score was not reset and connections would keep dropping after being connected for a significant amount of time.

+ Improvements in order book support. Added support for currency pairs with interest bearing currencies. You can request an order book with hex, ISO code or full name for the currency.

+ Fix value parsing for amount/currency order pairs, e.g. `Amount.from_human("XAU 12345.6789")`

+ Improved Amount parsing from human readable string given a hex currency, e.g. `Amount.from_human("10 015841551A748AD2C1F76FF6ECB0CCCD00000000")`

+ Improvements to username normalization in the vault client

+ Add 2-factor authentication support for vault client

+ Removed vestiges of Grunt, switched to Gulp


##0.7.37

+ **Deprecations**

    1. Removed humanistic amount detection in `transaction.payment`. Passing `1XRP` as the payment amount no longer works.
    2. `remote.setServer` uses full server URL rather than hostname. Example: `remote.setServer('wss://s`.ripple.com:443')`
    3. Removed constructors for deprecated transaction types from `transaction.js`.
    4. Removed `invoiceID` option from `transaction.payment`. Instead, use the `transaction.invoiceID` method.
    5. Removed `transaction.transactionManager` getter.

+ Improved multi-server support. Servers are now ranked dynamically, and transactions are broadcasted to all connected servers.

+ Automatically ping connected servers. Client configuration now should contain `ping: <seconds>` to specify the ping interval.

+ Added `transaction.lastLedger` to specify `LastLedgerSequence`. Setting it this way also ensures that the sequence is not bumped on subsequent requests.

+ Added optional `remote.accountTx` binary parsing.
    ```js
      {
        binary: true,
        parseBinary: false
      }
    ```
+ Added full currency name support, e.g. `Currency.from_json('XRP').to_human({full_name:'Ripples'})` will return `XRP - Ripples`

+ Improved interest bearing currency support, e.g. `Currency.from_human('USD - US Dollar (2.5%pa)')`

+ Improve test coverage

+ Added blob vault client.  The vault client facilitates interaction with ripple's namespace and blob vault or 3rd party blob vaults using ripple's blob vault software (https://github.com/ripple/ripple-blobvault). A list of the available functions can be found at [docs/VAULTCLIENT.md](docs/VAULTCLIENT.md)


##0.7.35

+ `LastLedgerSequence` is set by default on outgoing transactions. This refers to the last valid ledger index (AKA sequence) for a transaction. By default, this index is set to the current index (at submission time) plus 8. In theory, this allows ripple-lib to deterministically fail a transaction whose submission request timed out, but whose associated server continues to emit ledger_closed events.

+ Transactions that err with `telINSUF_FEE_P` will be automatically resubmitted. This error indicates that the `Fee` supplied in the transaction submission request was inadquate. Ideally, the `Fee` is tracked by ripple-lib in real-time, and the resubmitted transaction will most likely succeed.

+ Added Transaction.iff(function(callback) { }). Callback expects first argument to be an Error or null, second argument is a boolean which indicates whether or not to proceed with the transaction submission. If an `iff` function is specified, it will be executed prior to every submission of the transaction (including resubmissions).

+ Transactions will now emit `presubmit` and `postsubmit` events. They will be emitted before and after a transaction is submitted, respectively.

+ Added Transaction.summary(). Returns a summary of a transaction in semi-human-readable form. JSON-stringifiable.

+ Remote.requestAccountTx() with `binary: true` will automatically parse transactions.

+ Added Remote.requestAccountTx filter, map, and reduce.

```js
  remote.requestAccountTx({
    account: 'retc',
    ledger_index_min: -1,
    ledger_index_max: -1,
    limit: 100,
    binary: true,

    filter: function(transaction) {
      return transaction.tx.TransactionType === 'Payment';
    },

    map: function(transaction) {
      return Number(transaction.tx.Amount);
    },

    reduce: function(a, b) {
      return a + b;
    },

    pluck: 'transactions'
  }, console.log)
```

+ Added persistence hooks.

+ General performance improvements, especially for long-running processes.

