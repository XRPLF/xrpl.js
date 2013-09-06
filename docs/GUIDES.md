#`ripple-lib` Guides

##In this document:

1. [Connecting to the Ripple network with the `Remote` module](GUIDES.md#connecting-to-the-ripple-network-with-the-remote-module)
2. [Using `Remote` functions and `Request` objects](GUIDES.md#using-remote-functions-and-request-objects)
3. [Submitting a transaction](GUIDES.md#submitting-a-transaction)
4. [Listening to the network](GUIDES.md#listening-to-the-network)

#Connecting to the Ripple network with the `Remote` module




#Using `Remote` functions and `Request` objects

Each remote function returns a `Request` object, which is an `EventEmitter`. You can listen for success or failure events from each request or, alternatively, you can provide a callback. 

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




#Submitting a transaction

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