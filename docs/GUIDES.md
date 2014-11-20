#Guides

This file provides step-by-step walkthroughs for some of the most common usages of `ripple-lib`.

###In this document

1. [Connecting to the Ripple network with `Remote`](GUIDES.md#connecting-to-the-ripple-network)
2. [Using `Remote` functions and `Request` objects](GUIDES.md#sending-rippled-API-requests)
3. [Listening to the network](GUIDES.md#listening-to-the-network)
4. [Submitting a payment to the network](GUIDES.md#submitting-a-payment-to-the-network)
   * [A note on transaction fees](GUIDES.md#a-note-on-transaction-fees)
5. [Submitting a trade offer to the network](GUIDES.md#submitting-a-trade-offer-to-the-network)

###Also see

1. [The ripple-lib README](../README.md)
2. [The ripple-lib API Reference](REFERENCE.md)

##Generating a new Ripple Wallet

  ```js
    var Wallet = require('ripple-lib').Wallet;

    var wallet = Wallet.generate();
    console.log(wallet);
    // { address: 'rEf4sbVobiiDGExrNj2PkNHGMA8eS6jWh3',
    //   secret: 'shFh4a38EZpEdZxrLifEnVPAoBRce' }
  ```

##Connecting to the Ripple network

1. [Get ripple-lib](README.md#getting-ripple-lib)
2. Load the ripple-lib module into a Node.js file or webpage:
  ```js
  /* Loading ripple-lib with Node.js */
  var Remote = require('ripple-lib').Remote;

  /* Loading ripple-lib in a webpage */
  // var Remote = ripple.Remote;
  ```
3. Create a new `Remote` and connect to the network:
  ```js

  var options = {
    trace :         false,
    trusted:        true,
    local_signing:  true,
    servers: [
      { host: 's-west.ripple.com', port: 443, secure: true }
    ]
  }

  var remote = new Remote({options});

  remote.connect(function(err, res) {
    /* remote connected, use some remote functions here */
  });
  ```
  __NOTE:__ See the API Reference for available [`Remote` options](REFERENCE.md#1-remote-options)

4. You're connected! Read on to see what to do now.


##Sending rippled API requests

`Remote` contains functions for constructing a `Request` object.

A `Request` is an `EventEmitter` so you can listen for success or failure events -- or, instead, you can provide a callback.

Here is an example, using [requestServerInfo](https://ripple.com/wiki/JSON_Messages#server_info).

+ Constructing a `Request` with event listeners
```js
var request = remote.requestServerInfo();

request.on('success', function onSuccess(res) {
  //handle success
});

request.on('error', function onError(err) {
  //handle error
});

request.request();
```

+ Using a callback:
```js
remote.request('server_info', function(err, res) {
  if (err) {
    //handle error
  } else {
    //handle success
  }
});
```

__NOTE:__ See the API Reference for available [`Remote` functions](REFERENCE.md#2-remote-functions)


##Listening to the network

See the [wiki](https://ripple.com/wiki/JSON_Messages#subscribe) for details on subscription requests.

```js
 /* Loading ripple-lib with Node.js */
  var Remote = require('ripple-lib').Remote;

  /* Loading ripple-lib in a webpage */
  // var Remote = ripple.Remote;

  var remote = new Remote({options});

  remote.connect(function() {
    var remote = new Remote({
      // see the API Reference for available options
      servers: [ 'wss://s1.ripple.com:443' ]
    });

    remote.connect(function() {
      console.log('Remote connected');

      var streams = [
        'ledger',
        'transactions'
      ];

      var request = remote.requestSubscribe(streams);

      request.on('error', function(error) {
        console.log('request error: ', error);
      });


      // the `ledger_closed` and `transaction` will come in on the remote
      // since the request for subscribe is finalized after the success return
      // the streaming events will still come in, but not on the initial request
      remote.on('ledger_closed', function(ledger) {
        console.log('ledger_closed: ', JSON.stringify(ledger, null, 2));
      });

      remote.on('transaction', function(transaction) {
        console.log('transaction: ', JSON.stringify(transaction, null, 2));
      });

      remote.on('error', function(error) {
        console.log('remote error: ', error);
      });

      // fire the request
      request.request();
    });
  });
```
* https://ripple.com/wiki/RPC_API#transactions_stream_messages
* https://ripple.com/wiki/RPC_API#ledger_stream_messages

##Submitting a payment to the network

Submitting a payment transaction to the Ripple network involves connecting to a `Remote`, creating a transaction, signing it with the user's secret, and submitting it to the `rippled` server. Note that the `Amount` module is used to convert human-readable amounts like '1XRP' or '10.50USD' to the type of Amount object used by the Ripple network.

```js
/* Loading ripple-lib Remote and Amount modules in Node.js */
var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;

/* Loading ripple-lib Remote and Amount modules in a webpage */
// var Remote = ripple.Remote;
// var Amount = ripple.Amount;

var MY_ADDRESS = 'rrrMyAddress';
var MY_SECRET  = 'secret';
var RECIPIENT  = 'rrrRecipient';
var AMOUNT     = Amount.from_human('1XRP');

var remote = new Remote({ /* Remote options */ });

remote.connect(function() {
  remote.setSecret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.createTransaction('Payment', {
    account: MY_ADDRESS,
    destination: RECIPIENT,
    amount: AMOUNT
  });

  transaction.submit(function(err, res) {
    /* handle submission errors / success */
  });
});
```

###A note on transaction fees

A full description of network transaction fees can be found on the [Ripple Wiki](https://ripple.com/wiki/Transaction_Fee).

In short, transaction fees are very small amounts (on the order of ~10) of [XRP drops](https://ripple.com/wiki/Ripple_credits#Notes_on_drops) spent and destroyed with every transaction. They are largely used to account for network load and prevent spam. With `ripple-lib`, transaction fees are calculated locally by default and the fee you are willing to pay is submitted along with your transaction.

Since the fee required for a transaction may change between the time when the original fee was calculated and the time when the transaction is submitted, it is wise to use the [`fee_cushion`](REFERENCE.md#1-remote-options) to ensure that the transaction will go through. For example, suppose the original fee calculated for a transaction was 10 XRP drops but at the instant the transaction is submitted the server is experiencing a higher load and it has raised its minimum fee to 12 XRP drops. Without a `fee_cusion`, this transaction would not be processed by the server, but with a `fee_cusion` of, say, 1.5 it would be processed and you would just pay the 2 extra XRP drops.

The [`max_fee`](REFERENCE.md#1-remote-options) option can be used to avoid submitting a transaction to a server that is charging unreasonably high fees.


##Submitting a trade offer to the network

Submitting a trade offer to the network is similar to submitting a payment transaction. Here is an example offering to sell 1 USD in exchange for 100 XRP:

```js
/* Loading ripple-lib Remote and Amount modules in Node.js */
var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;

/* Loading ripple-lib Remote and Amount modules in a webpage */
// var Remote = ripple.Remote;
// var Amount = ripple.Amount;

var MY_ADDRESS = 'rrrMyAddress';
var MY_SECRET  = 'secret';
var GATEWAY = 'rrrGateWay';

var remote = new Remote({ /* Remote options */ });

remote.connect(function() {
  remote.setSecret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.createTransaction('OfferCreate', {
    account: MY_ADDRESS,
    taker_pays: '100',
    taker_gets: '1/USD/' + GATEWAY
  });

  transaction.submit(function(err, res) {
    /* handle submission errors / success */
  });
});
```
