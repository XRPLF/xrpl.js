#`ripple-lib` Guides

###In this document:

1. [Connecting to the Ripple network with `Remote`](GUIDES.md#1-connecting-to-the-ripple-network-with-remote)
2. [Using `Remote` functions and `Request` objects](GUIDES.md#2-using-remote-functions-and-request-objects)
3. [Submitting a transaction](GUIDES.md#3-submitting-a-transaction)
4. [Listening to the network](GUIDES.md#4-listening-to-the-network)


###Also see:

1. [The `ripple-lib` README](../README.md)
2. [The `ripple-lib` API Reference](REFERENCE.md)

##1. Connecting to the Ripple network with `Remote`

1. [Get `ripple-lib`](README.md#getting-ripple-lib)
2. Load the `ripple-lib` module:
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
    /* remote connected */
  });
  ```
  See the API Reference for available [`Remote` options](REFERENCE.md#1-remote-options)
4. You're connected! Read on to see what to do now.


##2. Using `Remote` functions and `Request` objects

Each remote function returns a `Request` object. A `Request` is an `EventEmitter`, meaning that you can listen for success or failure events or you can instead provide a callback to the `Remote` function. 

Here is an example, using `request_server_info()`, of how `Remote` functions can be used with event listeners (the first code block) or with a callback (the second block):

`Remote` function with `Request` event listeners:
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

`Remote` function with a callback:
```js
remote.request_server_info(function(err, res) {
  if (err) {
    //handle error
  } else {
    //handle success
  }
});
```

NOTE: See the [`Remote` functions reference]() section below for documentation on all of the available functions.




##3. Submitting a transaction

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

###A note on transaction fees

A full description of network transaction fees can be found on the [Ripple Wiki](https://ripple.com/wiki/Transaction_Fee).

In short, transaction fees are very small amounts (on the order of ~10) of [XRP drops](https://ripple.com/wiki/Ripple_credits#Notes_on_drops) spent and destroyed with every transaction. They are largely used to account for network load and prevent spam. With `ripple-lib`, transaction fees are calculated locally by default and the fee you are willing to pay is submitted along with your transaction.

Since the fee required for a transaction may change between the time when the original fee was calculated and the time when the transaction is submitted, it is wise to use the [`fee_cushion`](REFERENCE.md#1-remote-options) to ensure that the transaction will go through. For example, suppose the original fee calculated for a transaction was 10 XRP drops but at the instant the transaction is submitted the server is experiencing a higher load and it has raised its minimum fee to 12 XRP drops. Without a `fee_cusion`, this transaction would not be processed by the server, but with a `fee_cusion` of, say, 1.5 it would be processed and you would just pay the 2 extra XRP drops.

The [`max_fee`](REFERENCE.md#1-remote-options) option can be used to avoid submitting a transaction to a server that is charging unreasonably high fees.



##4. Listening to the network

Coming Soon