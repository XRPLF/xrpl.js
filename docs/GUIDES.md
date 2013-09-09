#`ripple-lib` Guides

This file provides step-by-step walkthroughs for some of the most common usages of `ripple-lib`.

###Guides in this document:

1. [Connecting to the Ripple network with `Remote`](GUIDES.md#1-connecting-to-the-ripple-network-with-remote)
2. [Using `Remote` functions and `Request` objects](GUIDES.md#2-using-remote-functions-and-request-objects)
3. [Submitting a payment to the network](GUIDES.md#3-submitting-a-payment-to-the-network)
   * [A note on transaction fees](GUIDES.md#a-note-on-transaction-fees)
4. [Submitting a trade offer to the network](GUIDES.md#3-submitting-a-trade-offer-to-the-network)
5. [Listening to the network](GUIDES.md#5-listening-to-the-network)


###Also see:

1. [The `ripple-lib` README](../README.md)
2. [The `ripple-lib` API Reference](REFERENCE.md)

##1. Connecting to the Ripple network with `Remote`

1. [Get `ripple-lib`](README.md#getting-ripple-lib)
2. Load the `ripple-lib` module into a Node.js file or webpage:
  ```js
  /* Loading ripple-lib with Node.js */
  var Remote = require('ripple-lib').Remote;

  /* Loading ripple-lib in a webpage */
  // var Remote = ripple.Remote;
  ```
3. Create a new `Remote` and connect to the network:
  ```js
  var remote = new Remote({options});

  remote.connect(function() {
    /* remote connected, use some remote functions here */
  });
  ```
  __NOTE:__ See the API Reference for available [`Remote` options](REFERENCE.md#1-remote-options)
4. You're connected! Read on to see what to do now.


##2. Using `Remote` functions and `Request` objects

All `Remote` functions return a `Request` object. 

A `Request` is an `EventEmitter` so you can listen for success or failure events -- or, instead, you can provide a callback to the `Remote` function.

Here is an example, using `request_server_info()`, of how `Remote` functions can be used with event listeners (the first code block) or with a callback (the second block):

+ Using a `Remote` function with `Request` event listeners:
```js
var request = remote.request_server_info();
request.on('success', function(res) {
  //handle success
});
request.on('error', function(err) {
  //handle error
});
request.request(); // this triggers the request if it has not already been sent to the server
```

+ Using a `Remote` function with a callback:
```js
remote.request_server_info(function(err, res) {
  if (err) {
    //handle error
  } else {
    //handle success
  }
});
```

__NOTE:__ See the API Reference for available [`Remote` functions](REFERENCE.md#2-remote-functions)




##3. Submitting a payment to the network

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
  remote.set_secret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.transaction();

  transaction.payment(MY_ADDRESS, RECIPIENT, AMOUNT);

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


##4. Submitting a trade offer to the network

Submitting a trade offer to the network is similar to submitting a payment transaction. Here is an example for a trade that expires in 24 hours where you are offering to sell 1 USD in exchange for 100 XRP:

```js
/* Loading ripple-lib Remote and Amount modules in Node.js */ 
var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;

/* Loading ripple-lib Remote and Amount modules in a webpage */
// var Remote = ripple.Remote;
// var Amount = ripple.Amount;

var MY_ADDRESS = 'rrrMyAddress';
var MY_SECRET  = 'secret';

// TAKER_PAYS is the amount that the other party will pay you
// TAKER_GETS is the amount you are offering to them
var TAKER_PAYS = Amount.from_human('100XRP');
var TAKER_GETS = Amount.from_human('1USD');

// EXPIRATION must be a Date object, leave undefined to submit offer that won't expire
var now = new Date();
var tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
var EXPIRATION = tomorrow;

var remote = new Remote({ /* Remote options */ });

remote.connect(function() {
  remote.set_secret(MY_ADDRESS, MY_SECRET);

  var transaction = remote.transaction();

  transaction.offer_create(MY_ADDRESS, TAKER_PAYS, TAKER_GETS, EXPIRATION);

  transaction.submit(function(err, res) {
    /* handle submission errors / success */
  });
});
```

##5. Listening to the network

