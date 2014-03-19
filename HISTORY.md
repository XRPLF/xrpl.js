
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

