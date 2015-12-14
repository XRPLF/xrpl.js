<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# RippleAPI Reference

- [Introduction](#introduction)
  - [Boilerplate](#boilerplate)
  - [Offline functionality](#offline-functionality)
- [Basic Types](#basic-types)
  - [Ripple Address](#ripple-address)
  - [Account Sequence Number](#account-sequence-number)
  - [Currency](#currency)
  - [Value](#value)
  - [Amount](#amount)
- [Transaction Overview](#transaction-overview)
  - [Transaction Types](#transaction-types)
  - [Transaction Flow](#transaction-flow)
  - [Transaction Fees](#transaction-fees)
  - [Transaction Instructions](#transaction-instructions)
  - [Transaction ID](#transaction-id)
  - [Transaction Memos](#transaction-memos)
- [Transaction Specifications](#transaction-specifications)
  - [Payment](#payment)
  - [Trustline](#trustline)
  - [Order](#order)
  - [Order Cancellation](#order-cancellation)
  - [Settings](#settings)
  - [Suspended Payment Creation](#suspended-payment-creation)
  - [Suspended Payment Cancellation](#suspended-payment-cancellation)
  - [Suspended Payment Execution](#suspended-payment-execution)
- [API Methods](#api-methods)
  - [connect](#connect)
  - [disconnect](#disconnect)
  - [isConnected](#isconnected)
  - [getServerInfo](#getserverinfo)
  - [getFee](#getfee)
  - [getLedgerVersion](#getledgerversion)
  - [getTransaction](#gettransaction)
  - [getTransactions](#gettransactions)
  - [getTrustlines](#gettrustlines)
  - [getBalances](#getbalances)
  - [getBalanceSheet](#getbalancesheet)
  - [getPaths](#getpaths)
  - [getOrders](#getorders)
  - [getOrderbook](#getorderbook)
  - [getSettings](#getsettings)
  - [getAccountInfo](#getaccountinfo)
  - [getLedger](#getledger)
  - [preparePayment](#preparepayment)
  - [prepareTrustline](#preparetrustline)
  - [prepareOrder](#prepareorder)
  - [prepareOrderCancellation](#prepareordercancellation)
  - [prepareSettings](#preparesettings)
  - [prepareSuspendedPaymentCreation](#preparesuspendedpaymentcreation)
  - [prepareSuspendedPaymentCancellation](#preparesuspendedpaymentcancellation)
  - [prepareSuspendedPaymentExecution](#preparesuspendedpaymentexecution)
  - [sign](#sign)
  - [submit](#submit)
  - [generateAddress](#generateaddress)
  - [computeLedgerHash](#computeledgerhash)
- [API Events](#api-events)
  - [ledger](#ledger)
  - [error](#error)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Introduction

RippleAPI is the official client library to the Ripple Consensus Ledger. Currently, RippleAPI is only available in JavaScript. 
Using RippleAPI, you can:

* [Query transactions from the network](#gettransaction)
* [Sign](#sign) transactions securely without connecting to any server
* [Submit](#submit) transactions to the Ripple Consensus Ledger, including [Payments](#payment), [Orders](#order), [Settings changes](#settings), and [other types](#transaction-types)
* [Generate a new Ripple Address](#generateaddress)
* ... and [much more](#api-methods).

RippleAPI only provides access to *validated*, *immutable* transaction data.

## Boilerplate

Use the following [boilerplate code](https://en.wikipedia.org/wiki/Boilerplate_code) to wrap your custom code using RippleAPI.

```javascript
const {RippleAPI} = require('ripple-lib');

const api = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public rippled server hosted by Ripple, Inc.
});
api.on('error', (errorCode, errorMessage) => {
  console.log(errorCode + ': ' + errorMessage);
});
api.connect().then(() => {
  /* insert code here */
}).then(() => {
  return api.disconnect();
}).catch(console.error);
```

RippleAPI is designed to work in [NodeJS](https://nodejs.org) (version `0.12.0` or greater) using [Babel](https://babeljs.io/) for [ECMAScript 6](https://babeljs.io/docs/learn-es2015/) support.

The code samples in this documentation are written in ES6, but `RippleAPI` will work with ES5 also. Regardless of whether you use ES5 or ES6, the methods that return promises will return [ES6-style promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

<aside class="notice">
All the code snippets in this documentation assume that you have surrounded them with this boilerplate.
</aside>

<aside class="notice">
If you omit the "catch" section, errors may not be visible.
</aside>

<aside class="notice">
The "error" event is emitted whenever an error occurs that cannot be associated with a specific request. If the listener is not registered, an exception will be thrown whenever the event is emitted.
</aside>

### Parameters

The RippleAPI constructor optionally takes one argument, an object with the following options:

Name | Type | Description
---- | ---- | -----------
authorization | string | *Optional* Username and password for HTTP basic authentication to the rippled server in the format **username:password**.
certificate | string | *Optional* A string containing the certificate key of the client in PEM format. (Can be an array of certificates).
feeCushion | number | *Optional* Factor to multiply estimated fee by to provide a cushion in case the required fee rises during submission of a transaction. Defaults to `1.2`.
key | string | *Optional* A string containing the private key of the client in PEM format. (Can be an array of keys).
passphrase | string | *Optional* The passphrase for the private key of the client.
proxy | uri string | *Optional* URI for HTTP/HTTPS proxy to use to connect to the rippled server.
proxyAuthorization | string | *Optional* Username and password for HTTP basic authentication to the proxy in the format **username:password**.
server | uri string | *Optional* URI for rippled websocket port to connect to. Must start with `wss://` or `ws://`.
timeout | integer | *Optional* Timeout in milliseconds before considering a request to have failed.
trace | boolean | *Optional* If true, log rippled requests and responses to stdout.
trustedCertificates | array\<string\> | *Optional* Array of PEM-formatted SSL certificates to trust when connecting to a proxy. This is useful if you want to use a self-signed certificate on the proxy server. Note: Each element must contain a single certificate; concatenated certificates are not valid.

If you omit the `server` parameter, RippleAPI operates [offline](#offline-functionality).


### Installation ###

1. Install [NodeJS](https://nodejs.org) and the Node Package Manager (npm). Most Linux distros have a package for NodeJS, but make sure you have version `0.12.0` or higher.
2. Use npm to install [Babel](https://babeljs.io/) globally:
      `npm install -g babel`
3. Use npm to install RippleAPI:
      `npm install ripple-lib`

After you have installed ripple-lib, you can create scripts using the [boilerplate](#boilerplate) and run them using babel-node:
      `babel-node script.js`

<aside class="notice">
Instead of using babel-node in production, we recommend using Babel to transpile to ECMAScript 5 first.
</aside>


## Offline functionality

RippleAPI can also function without internet connectivity. This can be useful in order to generate secrets and sign transactions from a secure, isolated machine.

To instantiate RippleAPI in offline mode, use the following boilerplate code:

```javascript
const {RippleAPI} = require('ripple-lib');

const api = new RippleAPI();
/* insert code here */
```

Methods that depend on the state of the Ripple Consensus Ledger are unavailable in offline mode. To prepare transactions offline, you **must** specify  the `fee`, `sequence`, and `maxLedgerVersion` parameters in the [transaction instructions](#transaction-instructions). The following methods should work offline:

* [preparePayment](#preparepayment)
* [prepareTrustline](#preparetrustline)
* [prepareOrder](#prepareorder)
* [prepareOrderCancellation](#prepareordercancellation)
* [prepareSettings](#preparesettings)
* [prepareSuspendedPaymentCreation](#preparesuspendedpaymentcreation)
* [prepareSuspendedPaymentCancellation](#preparesuspendedpaymentcancellation)
* [prepareSuspendedPaymentExecution](#preparesuspendedpaymentexecution)
* [sign](#sign)
* [generateAddress](#generateaddress)
* [computeLedgerHash](#computeledgerhash)


# Basic Types

## Ripple Address

```json
"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59"
```

Every Ripple account has an *address*, which is a base58-encoding of a hash of the account's public key. Ripple addresses always start with the lowercase letter `r`.

## Account Sequence Number

Every Ripple account has a *sequence number* that is used to keep transactions in order. Every transaction must have a sequence number. A transaction can only be executed if it has the next sequence number in order, of the account sending it. This prevents one transaction from executing twice and transactions executing out of order. The sequence number starts at `1` and increments for each transaction that the account makes.

## Currency

Currencies are represented as either 3-character currency codes or 40-character uppercase hexadecimal strings. We recommend using uppercase [ISO 4217 Currency Codes](http://www.xe.com/iso4217.php) only. The string "XRP" is disallowed on trustlines because it is reserved for the Ripple native currency. The following characters are permitted: all uppercase and lowercase letters, digits, as well as the symbols `?`, `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `<`, `>`, `(`, `)`, `{`, `}`, `[`, `]`, and `|`.

## Value
A *value* is a quantity of a currency represented as a decimal string. Be careful: JavaScript's native number format does not have sufficient precision to represent all values. XRP has different precision from other currencies.

**XRP** has 6 significant digits past the decimal point. In other words, XRP cannot be divided into positive values smaller than `0.000001` (1e-6). XRP has a maximum value of `100000000000` (1e11).

**Non-XRP values** have 15 decimal digits of precision, with a maximum value of `9999999999999999e80`. The smallest positive non-XRP value is `1e-81`.


## Amount

Example amount:

```json
{
  "currency": "USD",
  "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
  "value": "100"
}
```

Example XRP amount:
```json
{
  "currency": "XRP",
  "value": "2000"
}
```

An *amount* is data structure representing a currency, a quantity of that currency, and the counterparty on the trustline that holds the value. For XRP, there is no counterparty.

A *lax amount* allows the counterparty to be omitted for all currencies. If the counterparty is not specified in an amount within a transaction specification, then any counterparty may be used for that amount.

A *lax lax amount* allows either or both the counterparty and value to be omitted.

A *balance* is an amount than can have a negative value.

Name | Type | Description
---- | ---- | -----------
currency | [currency](#currency) | The three-character code or hexadecimal string used to denote currencies
counterparty | [address](#ripple-address) | *Optional* The Ripple address of the account that owes or is owed the funds (omitted if `currency` is "XRP")
value | [value](#value) | *Optional* The quantity of the currency, denoted as a string to retain floating point precision

# Transaction Overview

## Transaction Types

A transaction type is specified by the strings in the first column in the table below.

Type | Description
---- | -----------
[payment](#payment) | A `payment` transaction represents a transfer of value from one account to another. Depending on the [path](https://ripple.com/build/paths/) taken, additional exchanges of value may occur atomically to facilitate the payment.
[order](#order) | An `order` transaction creates a limit order. It defines an intent to exchange currencies, and creates an order in the Ripple Consensus Ledger's order book if not completely fulfilled when placed. Orders can be partially fulfilled.
[orderCancellation](#order-cancellation) | An `orderCancellation` transaction cancels an order in the Ripple Consensus Ledger's order book.
[trustline](#trustline) | A `trustline` transactions creates or modifies a trust line between two accounts.
[settings](#settings) | A `settings` transaction modifies the settings of an account in the Ripple Consensus Ledger.
[suspendedPaymentCreation](#suspended-payment-creation) | A `suspendedPaymentCreation` transaction creates a suspended payment on the ledger, which locks XRP until a cryptographic condition is met or it expires. It is like an escrow service where the Ripple network acts as the escrow agent.
[suspendedPaymentCancellation](#suspended-payment-cancellation) | A `suspendedPaymentCancellation` transaction unlocks the funds in a suspended payment and sends them back to the creator of the suspended payment, but it will only work after the suspended payment expires.
[suspendedPaymentExecution](#suspended-payment-execution) | A `suspendedPaymentExecution` transaction unlocks the funds in a suspended payment and sends them to the destination of the suspended payment, but it will only work if the cryptographic condition is provided.

The three "suspended payment" transaction types are not supported by the production Ripple peer-to-peer network at this time. They are available for testing purposes if you [configure RippleAPI](#boilerplate) to connect to the [Ripple Test Net](https://ripple.com/build/ripple-test-net/) instead.

## Transaction Flow

Executing a transaction with `RippleAPI` requires the following four steps:

1. Prepare - Create an unsigned transaction based on a [specification](#transaction-specifications) and [instructions](#transaction-instructions). There is a method to prepare each type of transaction:
    * [preparePayment](#preparepayment)
    * [prepareTrustline](#preparetrustline)
    * [prepareOrder](#prepareorder)
    * [prepareOrderCancellation](#prepareordercancellation)
    * [prepareSettings](#preparesettings)
    * [prepareSuspendedPaymentCreation](#preparesuspendedpaymentcreation)
    * [prepareSuspendedPaymentCancellation](#preparesuspendedpaymentcancellation)
    * [prepareSuspendedPaymentExecution](#preparesuspendedpaymentexecution)
2. [Sign](#sign) - Cryptographically sign the transaction locally and save the [transaction ID](#transaction-id). Signing is how the owner of an account authorizes a transaction to take place.
3. [Submit](#submit) - Submit the transaction to the connected server.
4. Verify - Verify that the transaction got validated by querying with [getTransaction](#gettransaction). This is necessary because transactions may fail even if they were successfully submitted.

## Transaction Fees

Every transaction must destroy a small amount of XRP as a cost to send the transaction. This is also called a *transaction fee*. The transaction cost is designed to increase along with the load on the Ripple network, making it very expensive to deliberately or inadvertently overload the network.

You can choose the size of the fee you want to pay or let a default be used. You can get an estimate of the fee required to be included in the next ledger closing with the [getFee](#getfee) method.

## Transaction Instructions

Transaction instructions indicate how to execute a transaction, complementary with the [transaction specification](#transaction-specifications).

Name | Type | Description
---- | ---- | -----------
fee | [value](#value) | *Optional* An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
maxFee | [value](#value) | *Optional* The maximum fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
maxLedgerVersion | integer,null | *Optional* The highest ledger version that the transaction can be included in. If this option and `maxLedgerVersionOffset` are both omitted, the `maxLedgerVersion` option will default to 3 greater than the current validated ledger version (equivalent to `maxLedgerVersionOffset=3`). Use `null` to not set a maximum ledger version.
maxLedgerVersionOffset | integer | *Optional* Offset from current validated legder version to highest ledger version that the transaction can be included in.
sequence | [sequence](#account-sequence-number) | *Optional* The initiating account's sequence number for this transaction.

We recommended that you specify a `maxLedgerVersion` so that you can quickly determine that a failed transaction will never succeeed in the future. It is impossible for a transaction to succeed after the network ledger version exceeds the transaction's `maxLedgerVersion`. If you omit `maxLedgerVersion`, the "prepare*" method automatically supplies a `maxLedgerVersion` equal to the current ledger plus 3, which it includes in the return value from the "prepare*" method.

## Transaction ID

```json
"F4AB442A6D4CBB935D66E1DA7309A5FC71C7143ED4049053EC14E3875B0CF9BF"
```

A transaction ID is a 64-bit hexadecimal string that uniquely identifies the transaction. The transaction ID is derived from the transaction instruction and specifications, using a strong hash function.

You can look up a transaction by ID using the [getTransaction](#gettransaction) method.

## Transaction Memos

Every transaction can optionally have an array of memos for user applications. The `memos` field in each [transaction specification](#transaction-specifications) is an array of objects with the following structure:

Name | Type | Description
---- | ---- | -----------
data | string | *Optional* Arbitrary string, conventionally containing the content of the memo.
format | string | *Optional* Conventionally containing information on how the memo is encoded, for example as a [MIME type](http://www.iana.org/assignments/media-types/media-types.xhtml). Only characters allowed in URLs are permitted.
type | string | *Optional* Conventionally, a unique relation (according to [RFC 5988](http://tools.ietf.org/html/rfc5988#section-4)) that defines the format of this memo. Only characters allowed in URLs are permitted.

# Transaction Specifications

A *transaction specification* specifies what a transaction should do. Each [Transaction Type](#transaction-types) has its own type of specification.

## Payment

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
source | object | The source of the funds to be sent.
*source.* address | [address](#ripple-address) | The address to send from.
*source.* amount | [laxAmount](#amount) | An exact amount to send. If the counterparty is not specified, amounts with any counterparty may be used. (This field is exclusive with source.maxAmount)
*source.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
*source.* maxAmount | [laxAmount](#amount) | The maximum amount to send. (This field is exclusive with source.amount)
destination | object | The destination of the funds to be sent.
*destination.* address | [address](#ripple-address) | The address to receive at.
*destination.* amount | [laxAmount](#amount) | An exact amount to deliver to the recipient. If the counterparty is not specified, amounts with any counterparty may be used. (This field is exclusive with destination.minAmount).
*destination.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
*destination.* address | [address](#ripple-address) | The address to send to.
*destination.* minAmount | [laxAmount](#amount) | The minimum amount to be delivered. (This field is exclusive with destination.amount)
allowPartialPayment | boolean | *Optional* A boolean that, if set to true, indicates that this payment should go through even if the whole amount cannot be delivered because of a lack of liquidity or funds in the source account account
invoiceID | string | *Optional* A 256-bit hash that can be used to identify a particular payment.
limitQuality | boolean | *Optional* Only take paths where all the conversions have an input:output ratio that is equal or better than the ratio of destination.amount:source.maxAmount.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
noDirectRipple | boolean | *Optional* A boolean that can be set to true if paths are specified and the sender would like the Ripple Network to disregard any direct paths from the source account to the destination account. This may be used to take advantage of an arbitrage opportunity or by gateways wishing to issue balances from a hot wallet to a user who has mistakenly set a trustline directly to the hot wallet
paths | string | *Optional* The paths of trustlines and orders to use in executing the payment.

### Example


```json
{
  "source": {
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "maxAmount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "destination": {
    "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
    "amount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  }
}
```


## Trustline

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
currency | [currency](#currency) | The currency this trustline applies to.
counterparty | [address](#ripple-address) | The address of the account this trustline extends trust to.
limit | [value](#value) | The maximum amount that the owner of the trustline can be owed through the trustline.
authorized | boolean | *Optional* If true, authorize the counterparty to hold issuances from this account.
frozen | boolean | *Optional* If true, the trustline is frozen, which means that funds can only be sent to the owner.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
qualityIn | number | *Optional* Incoming balances on this trustline are valued at this ratio.
qualityOut | number | *Optional* Outgoing balances on this trustline are valued at this ratio.
ripplingDisabled | boolean | *Optional* If true, payments cannot ripple through this trustline.

### Example


```json
{
  "currency": "USD",
  "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
  "limit": "10000",
  "qualityIn": 0.91,
  "qualityOut": 0.87,
  "ripplingDisabled": true,
  "frozen": false,
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
}
```


## Order

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
direction | string | Equal to "buy" for buy orders and "sell" for sell orders.
quantity | [amount](#amount) | The amount of currency to buy or sell.
totalPrice | [amount](#amount) | The total price to be paid for the `quantity` to be bought or sold.
expirationTime | date-time string | *Optional* Time after which the offer is no longer active, as an [ISO 8601 date-time](https://en.wikipedia.org/wiki/ISO_8601).
fillOrKill | boolean | *Optional* Treat the offer as a [Fill or Kill order](http://en.wikipedia.org/wiki/Fill_or_kill). Only attempt to match existing offers in the ledger, and only do so if the entire quantity can be exchanged.
immediateOrCancel | boolean | *Optional* Treat the offer as an [Immediate or Cancel order](http://en.wikipedia.org/wiki/Immediate_or_cancel). If enabled, the offer will never become a ledger node: it only attempts to match existing offers in the ledger.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
passive | boolean | *Optional* If enabled, the offer will not consume offers that exactly match it, and instead becomes an Offer node in the ledger. It will still consume offers that cross it.

### Example


```json
{
  "direction": "buy",
  "quantity": {
    "currency": "USD",
    "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
    "value": "10.1"
  },
  "totalPrice": {
    "currency": "XRP",
    "value": "2"
  },
  "passive": true,
  "fillOrKill": true
}
```


## Order Cancellation

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
orderSequence | [sequence](#account-sequence-number) | The [account sequence number](#account-sequence-number) of the order to cancel.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.

### Example


```json
{
  "orderSequence": 23
}
```


## Settings

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
defaultRipple | boolean | *Optional* Enable [rippling](https://ripple.com/knowledge_center/understanding-the-noripple-flag/) on this account’s trust lines by default. (New in [rippled 0.27.3](https://github.com/ripple/rippled/releases/tag/0.27.3))
disableMasterKey | boolean | *Optional* Disallows use of the master key to sign transactions for this account.
disallowIncomingXRP | boolean | *Optional* Indicates that client applications should not send XRP to this account. Not enforced by rippled.
domain | string | *Optional*  The domain that owns this account, as a hexadecimal string representing the ASCII for the domain in lowercase.
emailHash | string,null | *Optional* Hash of an email address to be used for generating an avatar image. Conventionally, clients use Gravatar to display this image. Use `null` to clear.
enableTransactionIDTracking | boolean | *Optional* Track the ID of this account’s most recent transaction.
globalFreeze | boolean | *Optional* Freeze all assets issued by this account.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
messageKey | string | *Optional* Public key for sending encrypted messages to this account. Conventionally, it should be a secp256k1 key, the same encryption that is used by the rest of Ripple.
noFreeze | boolean | *Optional* Permanently give up the ability to freeze individual trust lines. This flag can never be disabled after being enabled.
passwordSpent | boolean | *Optional* Indicates that the account has used its free SetRegularKey transaction.
regularKey | [address](#ripple-address),null | *Optional* The public key of a new keypair, to use as the regular key to this account, as a base-58-encoded string in the same format as an account address. Use `null` to remove the regular key.
requireAuthorization | boolean | *Optional* If set, this account must individually approve other users in order for those users to hold this account’s issuances.
requireDestinationTag | boolean | *Optional* Requires incoming payments to specify a destination tag.
transferRate | number,null | *Optional*  The fee to charge when users transfer this account’s issuances, represented as billionths of a unit. Use `null` to set no fee.

### Example


```json
{
  "domain": "ripple.com",
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
}
```


## Suspended Payment Creation

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
source | object | Fields pertaining to the source of the payment.
*source.* address | [address](#ripple-address) | The address to send from.
*source.* maxAmount | [laxAmount](#amount) | The maximum amount to send. (This field is exclusive with source.amount)
*source.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
destination | object | Fields pertaining to the destination of the payment.
*destination.* address | [address](#ripple-address) | The address to receive at.
*destination.* amount | [laxAmount](#amount) | An exact amount to deliver to the recipient. If the counterparty is not specified, amounts with any counterparty may be used. (This field is exclusive with destination.minAmount).
*destination.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
allowCancelAfter | date-time string | *Optional* If present, the suspended payment may be cancelled after this time.
allowExecuteAfter | date-time string | *Optional* If present, the suspended payment can not be executed before this time.
digest | string | *Optional* If present, proof is required upon execution.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.

### Example


```json
{
  "source": {
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "maxAmount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "destination": {
    "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
    "amount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "allowCancelAfter": "2014-09-24T21:21:50.000Z"
}
```


## Suspended Payment Cancellation

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
owner | [address](#ripple-address) | The address of the owner of the suspended payment to cancel.
suspensionSequence | [sequence](#account-sequence-number) | The [account sequence number](#account-sequence-number) of the [Suspended Payment Creation](#suspended-payment-creation) transaction for the suspended payment to cancel.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.

### Example


```json
{
  "owner": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "suspensionSequence": 1234
}
```


## Suspended Payment Execution

See [Transaction Types](#transaction-types) for a description.

Name | Type | Description
---- | ---- | -----------
owner | [address](#ripple-address) | The address of the owner of the suspended payment to execute.
suspensionSequence | [sequence](#account-sequence-number) | The [account sequence number](#account-sequence-number) of the [Suspended Payment Creation](#suspended-payment-creation) transaction for the suspended payment to execute.
digest | string | *Optional* The original `digest` from the suspended payment creation transaction. This is sha256 hash of `proof` string. It is replicated here so that the relatively expensive hashing operation can be delegated to a server without ledger history and the server with ledger history only has to do a quick comparison of the old digest with the new digest.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
method | integer | *Optional* The method for verifying the proof; only method `1` is supported.
proof | string | *Optional* A value that produces the digest when hashed. It must be 32 charaters long and contain only 8-bit characters.

### Example


```json
{
  "owner": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "suspensionSequence": 1234,
  "method": 1,
  "digest": "712C36933822AD3A3D136C5DF97AA863B69F9CE88B2D6CE6BDD11BFDE290C19D",
  "proof": "this must have 32 characters...."
}
```


# API Methods

## connect

`connect(): Promise<void>`

Tells the RippleAPI instance to connect to its rippled server.

### Parameters

This method has no parameters.

### Return Value

This method returns a promise that resolves with a void value when a connection is established.

### Example

See [Boilerplate](#boilerplate) for code sample.

## disconnect

`disconnect(): Promise<void>`

Tells the RippleAPI instance to disconnect from its rippled server.

### Parameters

This method has no parameters.

### Return Value

This method returns a promise that resolves with a void value when a connection is destroyed.

### Example

See [Boilerplate](#boilerplate) for code sample

## isConnected

`isConnected(): boolean`

Checks if the RippleAPI instance is connected to its rippled server.

### Parameters

This method has no parameters.

### Return Value

This method returns `true` if connected and `false` if not connected.

### Example

```javascript
return api.isConnected();
```

```json
true
```

## getServerInfo

`getServerInfo(): Promise<object>`

Get status information about the server that the RippleAPI instance is connected to.

### Parameters

This method has no parameters.

### Return Value

This method returns a promise that resolves with an object with the following structure:

Name | Type | Description
---- | ---- | -----------
buildVersion | string | The version number of the running rippled version.
completeLedgers | string | Range expression indicating the sequence numbers of the ledger versions the local rippled has in its database. It is possible to be a disjoint sequence, e.g. “2500-5000,32570-7695432”.
hostID | string | On an admin request, returns the hostname of the server running the rippled instance; otherwise, returns a unique four letter word.
ioLatencyMs | number | Amount of time spent waiting for I/O operations to be performed, in milliseconds. If this number is not very, very low, then the rippled server is probably having serious load issues.
lastClose | object | Information about the last time the server closed a ledger.
*lastClose.* convergeTimeS | number | The time it took to reach a consensus for the last ledger closing, in seconds.
*lastClose.* proposers | integer | Number of trusted validators participating in the ledger closing.
loadFactor | number | The load factor the server is currently enforcing, as a multiplier on the base transaction fee. The load factor is determined by the highest of the individual server’s load factor, cluster’s load factor, and the overall network’s load factor.
peers | integer | How many other rippled servers the node is currently connected to.
pubkeyNode | string | Public key used to verify this node for internal communications; this key is automatically generated by the server the first time it starts up. (If deleted, the node can just create a new pair of keys.)
serverState | string | A string indicating to what extent the server is participating in the network. See [Possible Server States](https://ripple.com/build/rippled-apis/#possible-server-states) for more details.
validatedLedger | object | Information about the fully-validated ledger with the highest sequence number (the most recent).
*validatedLedger.* age | integer | The time since the ledger was closed, in seconds.
*validatedLedger.* baseFeeXRP | [value](#value) | Base fee, in XRP. This may be represented in scientific notation such as 1e-05 for 0.00005.
*validatedLedger.* hash | string | Unique hash for the ledger, as an uppercase hexadecimal string.
*validatedLedger.* reserveBaseXRP | [value](#value) | Minimum amount of XRP necessary for every account to keep in reserve.
*validatedLedger.* reserveIncrementXRP | [value](#value) | Amount of XRP added to the account reserve for each object an account is responsible for in the ledger.
*validatedLedger.* ledgerVersion | integer | Identifying sequence number of this ledger version.
validationQuorum | number | Minimum number of trusted validations required in order to validate a ledger version. Some circumstances may cause the server to require more validations.
load | object | *Optional* *(Admin only)* Detailed information about the current load state of the server.
*load.* jobTypes | array\<object\> | *(Admin only)* Information about the rate of different types of jobs being performed by the server and how much time it spends on each.
*load.* threads | number | *(Admin only)* The number of threads in the server’s main job pool, performing various Ripple Network operations.
pubkeyValidator | string | *Optional* *(Admin only)* Public key used by this node to sign ledger validations.

### Example

```javascript
return api.getServerInfo().then(info => {/* ... */});
```


```json
{
  "buildVersion": "0.24.0-rc1",
  "completeLedgers": "32570-6595042",
  "hostID": "ARTS",
  "ioLatencyMs": 1,
  "lastClose": {
    "convergeTimeS": 2.007,
    "proposers": 4
  },
  "loadFactor": 1,
  "peers": 53,
  "pubkeyNode": "n94wWvFUmaKGYrKUGgpv1DyYgDeXRGdACkNQaSe7zJiy5Znio7UC",
  "serverState": "full",
  "validatedLedger": {
    "age": 5,
    "baseFeeXRP": "0.00001",
    "hash": "4482DEE5362332F54A4036ED57EE1767C9F33CF7CE5A6670355C16CECE381D46",
    "reserveBaseXRP": "20",
    "reserveIncrementXRP": "5",
    "ledgerVersion": 6595042
  },
  "validationQuorum": 3
}
```


## getFee

`getFee(): Promise<number>`

Returns the estimated transaction fee for the rippled server the RippleAPI instance is connected to.

### Parameters

This method has no parameters.

### Return Value

This method returns a promise that resolves with a string encoded floating point value representing the estimated fee to submit a transaction, expressed in XRP.

### Example

```javascript
return api.getFee().then(fee => {/* ... */});
```

```json
"0.012"
```

## getLedgerVersion

`getLedgerVersion(): Promise<number>`

Returns the most recent validated ledger version number known to the connected server.

### Parameters

This method has no parameters.

### Return Value

This method returns a promise that resolves with a positive integer representing the most recent validated ledger version number known to the connected server.

### Example

```javascript
return api.getLedgerVersion().then(ledgerVersion => {
  /* ... */
});
```

```json
16869039
```


## getTransaction

`getTransaction(id: string, options: Object): Promise<Object>`

Retrieves a transaction by its [Transaction ID](#transaction-id).

### Parameters

Name | Type | Description
---- | ---- | -----------
id | [id](#transaction-id) | A hash of a transaction used to identify the transaction, represented in hexadecimal.
options | object | *Optional* Options to limit the ledger versions to search.
*options.* maxLedgerVersion | integer | *Optional* The highest ledger version to search
*options.* minLedgerVersion | integer | *Optional* The lowest ledger version to search.

### Return Value

This method returns a promise that resolves with a transaction object containing the following fields.

Name | Type | Description
---- | ---- | -----------
id | [id](#transaction-id) | A hash of the transaction that can be used to identify it.
address | [address](#ripple-address) | The address of the account that initiated the transaction.
sequence | [sequence](#account-sequence-number) | The account sequence number of the transaction for the account that initiated it.
type | [transactionType](#transaction-types) | The type of the tranasction.
specification | object | A specification that would produce the same outcome as this transaction. The structure of the specification depends on the value of the `type` field (see [Transaction Types](#transaction-types) for details). *Note:* This is **not** necessarily the same as the original specification.
outcome | object | The outcome of the transaction (what effects it had).
*outcome.* result | string | Result code returned by rippled. See [Transaction Results](https://ripple.com/build/transactions/#full-transaction-response-list) for a complete list.
*outcome.* fee | [value](#value) | The XRP fee that was charged for the transaction.
*outcome.balanceChanges.* \* | array\<[balance](#amount)\> | Key is the ripple address; value is an array of signed amounts representing changes of balances for that address.
*outcome.orderbookChanges.* \* | array | Key is the maker's ripple address; value is an array of changes
*outcome.orderbookChanges.* \*[] | object | A change to an order.
*outcome.orderbookChanges.\*[].* direction | string | Equal to "buy" for buy orders and "sell" for sell orders.
*outcome.orderbookChanges.\*[].* quantity | [amount](#amount) | The amount to be bought or sold by the maker.
*outcome.orderbookChanges.\*[].* totalPrice | [amount](#amount) | The total amount to be paid or received by the taker.
*outcome.orderbookChanges.\*[].* sequence | [sequence](#account-sequence-number) | The order sequence number, used to identify the order for cancellation
*outcome.orderbookChanges.\*[].* status | string | The status of the order. One of "created", "filled", "partially-filled", "cancelled".
*outcome.orderbookChanges.\*[].* expirationTime | date-time string | *Optional* The time after which the order expires, if any.
*outcome.orderbookChanges.\*[].* makerExchangeRate | [value](#value) | *Optional* The exchange rate between the `quantity` currency and the `totalPrice` currency from the point of view of the maker.
*outcome.* ledgerVersion | integer | The ledger version that the transaction was validated in.
*outcome.* indexInLedger | integer | The ordering index of the transaction in the ledger.
*outcome.* timestamp | date-time string | *Optional* The timestamp when the transaction was validated. (May be missing when requesting transactions in binary mode.)

### Example

```javascript
const id = '01CDEAA89BF99D97DFD47F79A0477E1DCC0989D39F70E8AACBFE68CC83BD1E94';
return api.getTransaction(id).then(transaction => {
  /* ... */
});
```


```json
{
  "type": "payment",
  "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "sequence": 4,
  "id": "F4AB442A6D4CBB935D66E1DA7309A5FC71C7143ED4049053EC14E3875B0CF9BF",
  "specification": {
    "source": {
      "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "maxAmount": {
        "currency": "XRP",
        "value": "1.112209"
      }
    },
    "destination": {
      "address": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
      "amount": {
        "currency": "USD",
        "value": "0.001"
      }
    },
    "paths": "[[{\"currency\":\"USD\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"type\":48,\"type_hex\":\"0000000000000030\"},{\"account\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"type\":49,\"type_hex\":\"0000000000000031\"}]]"
  },
  "outcome": {
    "result": "tesSUCCESS",
    "timestamp": "2013-03-12T23:56:50.000Z",
    "fee": "0.00001",
    "balanceChanges": {
      "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo": [
        {
          "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
          "currency": "USD",
          "value": "-0.001"
        },
        {
          "counterparty": "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr",
          "currency": "USD",
          "value": "0.001002"
        }
      ],
      "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM": [
        {
          "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
          "currency": "USD",
          "value": "0.001"
        }
      ],
      "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59": [
        {
          "currency": "XRP",
          "value": "-1.101208"
        }
      ],
      "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr": [
        {
          "currency": "XRP",
          "value": "1.101198"
        },
        {
          "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
          "currency": "USD",
          "value": "-0.001002"
        }
      ]
    },
    "orderbookChanges": {
      "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr": [
        {
          "direction": "buy",
          "quantity": {
            "currency": "XRP",
            "value": "1.101198"
          },
          "totalPrice": {
            "currency": "USD",
            "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
            "value": "0.001002"
          },
          "makerExchangeRate": "1099",
          "sequence": 58,
          "status": "partially-filled"
        }
      ]
    },
    "ledgerVersion": 348860,
    "indexInLedger": 0
  }
}
```


## getTransactions

`getTransactions(address: string, options: Object): Promise<Array<Object>>`

Retrieves historical transactions of an account.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account to get transactions for.
options | object | *Optional* Options to filter the resulting transactions.
*options.* binary | boolean | *Optional* If true, the transactions will be sent from the server in a condensed binary format rather than JSON.
*options.* counterparty | [address](#ripple-address) | *Optional* If provided, only return transactions with this account as a counterparty to the transaction.
*options.* earliestFirst | boolean | *Optional* If true, sort transactions so that the earliest ones come first. By default, the newest transactions will come first.
*options.* excludeFailures | boolean | *Optional* If true, the result will omit transactions that did not succeed.
*options.* initiated | boolean | *Optional* If true, return only transactions initiated by the account specified by `address`. If false, return only transactions not initiated by the account specified by `address`.
*options.* limit | integer | *Optional* If specified, return at most this many transactions.
*options.* maxLedgerVersion | integer | *Optional* Return only transactions in this ledger version or lower.
*options.* minLedgerVersion | integer | *Optional* Return only transactions in this ledger verion or higher.
*options.* start | string | *Optional* If specified, this transaction will be the first transaction in the result.
*options.* types | array\<[transactionType](#transaction-types)\> | *Optional* Only return transactions of the specified [Transaction Types](#transaction-types).

### Return Value

This method returns a promise that resolves with an array of transaction object in the same format as [getTransaction](#gettransaction).

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getTransactions(address).then(transaction => {
  /* ... */
});
```


```json
[
  {
    "type": "payment",
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "sequence": 4,
    "id": "99404A34E8170319521223A6C604AF48B9F1E3000C377E6141F9A1BF60B0B865",
    "specification": {
      "memos": [
        {
          "type": "client",
          "format": "rt1.5.2"
        }
      ],
      "source": {
        "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
        "maxAmount": {
          "currency": "XRP",
          "value": "1.112209"
        }
      },
      "destination": {
        "address": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
        "amount": {
          "currency": "USD",
          "value": "0.001"
        }
      },
      "paths": "[[{\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\"},{\"account\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\"}]]"
    },
    "outcome": {
      "result": "tesSUCCESS",
      "fee": "0.00001",
      "balanceChanges": {
        "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo": [
          {
            "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
            "currency": "USD",
            "value": "-0.001"
          },
          {
            "counterparty": "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr",
            "currency": "USD",
            "value": "0.001002"
          }
        ],
        "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM": [
          {
            "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
            "currency": "USD",
            "value": "0.001"
          }
        ],
        "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59": [
          {
            "currency": "XRP",
            "value": "-1.101208"
          }
        ],
        "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr": [
          {
            "currency": "XRP",
            "value": "1.101198"
          },
          {
            "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
            "currency": "USD",
            "value": "-0.001002"
          }
        ]
      },
      "orderbookChanges": {
        "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59": [
          {
            "direction": "buy",
            "quantity": {
              "currency": "XRP",
              "value": "1.101198"
            },
            "totalPrice": {
              "currency": "USD",
              "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
              "value": "0.001002"
            },
            "makerExchangeRate": "1099",
            "sequence": 58,
            "status": "partially-filled"
          }
        ]
      },
      "ledgerVersion": 348859,
      "indexInLedger": 0
    }
  },
  {
    "type": "payment",
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "id": "99404A34E8170319521223A6C604AF48B9F1E3000C377E6141F9A1BF60B0B865",
    "sequence": 4,
    "specification": {
      "memos": [
        {
          "type": "client",
          "format": "rt1.5.2"
        }
      ],
      "source": {
        "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
        "maxAmount": {
          "currency": "XRP",
          "value": "1.112209"
        }
      },
      "destination": {
        "address": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
        "amount": {
          "currency": "USD",
          "value": "0.001"
        }
      },
      "paths": "[[{\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\"},{\"account\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\"}]]"
    },
    "outcome": {
      "result": "tesSUCCESS",
      "fee": "0.00001",
      "balanceChanges": {
        "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo": [
          {
            "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
            "currency": "USD",
            "value": "-0.001"
          },
          {
            "counterparty": "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr",
            "currency": "USD",
            "value": "0.001002"
          }
        ],
        "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM": [
          {
            "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
            "currency": "USD",
            "value": "0.001"
          }
        ],
        "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59": [
          {
            "currency": "XRP",
            "value": "-1.101208"
          }
        ],
        "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr": [
          {
            "currency": "XRP",
            "value": "1.101198"
          },
          {
            "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
            "currency": "USD",
            "value": "-0.001002"
          }
        ]
      },
      "orderbookChanges": {
        "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59": [
          {
            "direction": "buy",
            "quantity": {
              "currency": "XRP",
              "value": "1.101198"
            },
            "totalPrice": {
              "currency": "USD",
              "counterparty": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
              "value": "0.001002"
            },
            "makerExchangeRate": "1099",
            "sequence": 58,
            "status": "partially-filled"
          }
        ]
      },
      "ledgerVersion": 348858,
      "indexInLedger": 0
    }
  }
]
```


## getTrustlines

`getTrustlines(address: string, options: Object): Promise<Array<Object>>`

Returns trustlines for a specified account.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account to get trustlines for.
options | object | *Optional* Options to filter and determine which trustlines to return.
*options.* counterparty | [address](#ripple-address) | *Optional* Only return trustlines with this counterparty.
*options.* currency | [currency](#currency) | *Optional* Only return trustlines for this currency.
*options.* ledgerVersion | integer | *Optional* Return trustlines as they were in this historical ledger version.
*options.* limit | integer | *Optional* Return at most this many trustlines.

### Return Value

This method returns a promise that resolves with an array of objects with the following structure.

Name | Type | Description
---- | ---- | -----------
specification | [trustline](#trustline) | A trustline specification that would produce this trustline in its current state.
counterparty | object | Properties of the trustline from the perspective of the counterparty.
*counterparty.* limit | [value](#value) | The maximum amount that the counterparty can be owed through the trustline.
*counterparty.* authorized | boolean | *Optional* If true, the counterparty authorizes this party to hold issuances from the counterparty.
*counterparty.* frozen | boolean | *Optional* If true, the trustline is frozen, which means that funds can only be sent to the counterparty.
*counterparty.* ripplingDisabled | boolean | *Optional* If true, payments cannot ripple through this trustline.
state | object | Properties of the trustline regarding it's current state that are not part of the specification.
*state.* balance | [signedValue](#value) | The balance on the trustline, representing which party owes the other and by how much.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getTrustlines(address).then(trustlines =>
  {/* ... */});
```


```json
[
  {
    "specification": {
      "limit": "5",
      "currency": "USD",
      "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
      "ripplingDisabled": true,
      "frozen": true
    },
    "counterparty": {
      "limit": "0"
    },
    "state": {
      "balance": "2.497605752725159"
    }
  },
  {
    "specification": {
      "limit": "5000",
      "currency": "USD",
      "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
    },
    "counterparty": {
      "limit": "0"
    },
    "state": {
      "balance": "0"
    }
  },
  {
    "specification": {
      "limit": "1",
      "currency": "USD",
      "counterparty": "rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun"
    },
    "counterparty": {
      "limit": "0"
    },
    "state": {
      "balance": "1"
    }
  },
  {
    "specification": {
      "limit": "1",
      "currency": "USD",
      "counterparty": "r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X",
      "ripplingDisabled": true
    },
    "counterparty": {
      "limit": "0"
    },
    "state": {
      "balance": "0"
    }
  },
  {
    "specification": {
      "limit": "500",
      "currency": "USD",
      "counterparty": "rfF3PNkwkq1DygW2wum2HK3RGfgkJjdPVD",
      "ripplingDisabled": true
    },
    "counterparty": {
      "limit": "0"
    },
    "state": {
      "balance": "35"
    }
  },
  {
    "specification": {
      "limit": "0",
      "currency": "USD",
      "counterparty": "rE6R3DWF9fBD7CyiQciePF9SqK58Ubp8o2"
    },
    "counterparty": {
      "limit": "100",
      "ripplingDisabled": true
    },
    "state": {
      "balance": "0"
    }
  },
  {
    "specification": {
      "limit": "0",
      "currency": "USD",
      "counterparty": "rEhDDUUNxpXgEHVJtC2cjXAgyx5VCFxdMF",
      "frozen": true
    },
    "counterparty": {
      "limit": "1"
    },
    "state": {
      "balance": "0"
    }
  }
]
```


## getBalances

`getBalances(address: string, options: Object): Promise<Array<Object>>`

Returns balances for a specified account.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account to get balances for.
options | object | *Optional* Options to filter and determine which balances to return.
*options.* counterparty | [address](#ripple-address) | *Optional* Only return balances with this counterparty.
*options.* currency | [currency](#currency) | *Optional* Only return balances for this currency.
*options.* ledgerVersion | integer | *Optional* Return balances as they were in this historical ledger version.
*options.* limit | integer | *Optional* Return at most this many balances.

### Return Value

This method returns a promise that resolves with an array of objects with the following structure:

Name | Type | Description
---- | ---- | -----------
currency | [currency](#currency) | The three-character code or hexadecimal string used to denote currencies
value | [signedValue](#value) | The balance on the trustline
counterparty | [address](#ripple-address) | *Optional* The Ripple address of the account that owes or is owed the funds.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getBalances(address).then(balances =>
  {/* ... */});
```


```json
[
  {
    "value": "922.913243",
    "currency": "XRP"
  },
  {
    "value": "0",
    "currency": "ASP",
    "counterparty": "r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z"
  },
  {
    "value": "0",
    "currency": "XAU",
    "counterparty": "r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z"
  },
  {
    "value": "2.497605752725159",
    "currency": "USD",
    "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
  },
  {
    "value": "481.992867407479",
    "currency": "MXN",
    "counterparty": "rHpXfibHgSb64n8kK9QWDpdbfqSpYbM9a4"
  },
  {
    "value": "0.793598266778297",
    "currency": "EUR",
    "counterparty": "rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun"
  },
  {
    "value": "0",
    "currency": "CNY",
    "counterparty": "rnuF96W4SZoCJmbHYBFoJZpR8eCaxNvekK"
  },
  {
    "value": "1.294889190631542",
    "currency": "DYM",
    "counterparty": "rGwUWgN5BEg3QGNY3RX2HfYowjUTZdid3E"
  },
  {
    "value": "0.3488146605801446",
    "currency": "CHF",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  {
    "value": "2.114103174931847",
    "currency": "BTC",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  {
    "value": "0",
    "currency": "USD",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  {
    "value": "-0.00111",
    "currency": "BTC",
    "counterparty": "rpgKWEmNqSDAGFhy5WDnsyPqfQxbWxKeVd"
  },
  {
    "value": "-0.1010780000080207",
    "currency": "BTC",
    "counterparty": "rBJ3YjwXi2MGbg7GVLuTXUWQ8DjL7tDXh4"
  },
  {
    "value": "1",
    "currency": "USD",
    "counterparty": "rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun"
  },
  {
    "value": "8.07619790068559",
    "currency": "CNY",
    "counterparty": "razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA"
  },
  {
    "value": "7.292695098901099",
    "currency": "JPY",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  {
    "value": "0",
    "currency": "AUX",
    "counterparty": "r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z"
  },
  {
    "value": "0",
    "currency": "USD",
    "counterparty": "r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X"
  },
  {
    "value": "12.41688780720394",
    "currency": "EUR",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  {
    "value": "35",
    "currency": "USD",
    "counterparty": "rfF3PNkwkq1DygW2wum2HK3RGfgkJjdPVD"
  },
  {
    "value": "-5",
    "currency": "JOE",
    "counterparty": "rwUVoVMSURqNyvocPCcvLu3ygJzZyw8qwp"
  },
  {
    "value": "0",
    "currency": "USD",
    "counterparty": "rE6R3DWF9fBD7CyiQciePF9SqK58Ubp8o2"
  },
  {
    "value": "0",
    "currency": "JOE",
    "counterparty": "rE6R3DWF9fBD7CyiQciePF9SqK58Ubp8o2"
  },
  {
    "value": "0",
    "currency": "015841551A748AD2C1F76FF6ECB0CCCD00000000",
    "counterparty": "rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx"
  },
  {
    "value": "0",
    "currency": "USD",
    "counterparty": "rEhDDUUNxpXgEHVJtC2cjXAgyx5VCFxdMF"
  }
]
```


## getBalanceSheet

`getBalanceSheet(address: string, options: Object): Promise<Object>`

Returns aggregate balances by currency plus a breakdown of assets and obligations for a specified account.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The Ripple address of the account to get the balance sheet of.
options | object | *Optional* Options to determine how the balances will be calculated.
*options.* excludeAddresses | array\<[address](#ripple-address)\> | *Optional* Addresses to exclude from the balance totals.
*options.* ledgerVersion | integer | *Optional* Get the balance sheet as of this historical ledger version.

### Return Value

This method returns a promise that resolves with an array of objects with the following structure:

Name | Type | Description
---- | ---- | -----------
assets | array\<[amount](#amount)\> | *Optional* Total amounts held that are issued by others. For the recommended gateway configuration, there should be none.
balances | array\<[amount](#amount)\> | *Optional* Amounts issued to the hotwallet accounts from the request. The keys are hot wallet addresses and the values are arrays of currency amounts they hold. The issuer (omitted from the currency amounts) is the account from the request.
obligations | array | *Optional* Total amounts issued to accounts that are not hot wallets, as a map of currencies to the total value issued.
obligations[] | object | An amount that is owed.
*obligations[].* currency | [currency](#currency) | The three-character code or hexadecimal string used to denote currencies
*obligations[].* value | [value](#value) | A string representation of a non-negative floating point number

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getBalanceSheet(address).then(balanceSheet =>
  {/* ... */});
```


```json
{
  "balances": [
    {
    "counterparty": "rKm4uWpg9tfwbVSeATv4KxDe6mpE9yPkgJ",
    "currency": "EUR",
    "value": "29826.1965999999"
  },
  {
    "counterparty": "rKm4uWpg9tfwbVSeATv4KxDe6mpE9yPkgJ",
    "currency": "USD",
    "value": "10.0"
  },
  {
    "counterparty": "ra7JkEzrgeKHdzKgo4EUUVBnxggY4z37kt",
    "currency": "USD",
    "value": "13857.70416"
  }
  ],
  "assets": [
    {
    "counterparty": "r9F6wk8HkXrgYWoJ7fsv4VrUBVoqDVtzkH",
    "currency": "BTC",
    "value": "5444166510000000e-26"
  },
  {
    "counterparty": "r9F6wk8HkXrgYWoJ7fsv4VrUBVoqDVtzkH",
    "currency": "USD",
    "value": "100.0"
  },
  {
    "counterparty": "rwmUaXsWtXU4Z843xSYwgt1is97bgY8yj6",
    "currency": "BTC",
    "value": "8700000000000000e-30"
  }
  ],
  "obligations": [
    {
      "currency": "BTC",
      "value": "5908.324927635318"
    },
    {
      "currency": "EUR",
      "value": "992471.7419793958"
    },
    {
      "currency": "GBP",
      "value": "4991.38706013193"
    },
    {
      "currency": "USD",
      "value": "1997134.20229482"
    }
  ]
}
```


## getPaths

`getPaths(pathfind: Object): Promise<Array<Object>>`

Finds paths to send a payment. Paths are options for how to route a payment.

### Parameters

Name | Type | Description
---- | ---- | -----------
pathfind | object | Specification of a pathfind request.
*pathfind.* source | object | Properties of the source of funds.
*pathfind.source.* address | [address](#ripple-address) | The Ripple address of the account where funds will come from.
*pathfind.source.* amount | [laxAmount](#amount) | *Optional* The amount of funds to send.
*pathfind.source.* currencies | array | *Optional* An array of currencies (with optional counterparty) that may be used in the payment paths.
*pathfind.source.* currencies[] | object | A currency with optional counterparty.
*pathfind.source.currencies[].* currency | [currency](#currency) | The three-character code or hexadecimal string used to denote currencies
*pathfind.source.currencies[].* counterparty | [address](#ripple-address) | *Optional* The counterparty for the currency; if omitted any counterparty may be used.
*pathfind.* destination | object | Properties of the destination of funds.
*pathfind.destination.* address | [address](#ripple-address) | The address to send to.
*pathfind.destination.* amount | [laxLaxAmount](#amount) | The amount to be received by the receiver (`value` may be ommitted if a source amount is specified).

### Return Value

This method returns a promise that resolves with an array of objects with the following structure:

Name | Type | Description
---- | ---- | -----------
source | object | Properties of the source of the payment.
*source.* address | [address](#ripple-address) | The address to send from.
*source.* amount | [laxAmount](#amount) | An exact amount to send. If the counterparty is not specified, amounts with any counterparty may be used. (This field is exclusive with source.maxAmount)
*source.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
*source.* maxAmount | [laxAmount](#amount) | The maximum amount to send. (This field is exclusive with source.amount)
destination | object | Properties of the destination of the payment.
*destination.* address | [address](#ripple-address) | The address to receive at.
*destination.* amount | [laxAmount](#amount) | An exact amount to deliver to the recipient. If the counterparty is not specified, amounts with any counterparty may be used. (This field is exclusive with destination.minAmount).
*destination.* tag | integer | *Optional* An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.
*destination.* address | [address](#ripple-address) | The address to send to.
*destination.* minAmount | [laxAmount](#amount) | The minimum amount to be delivered. (This field is exclusive with destination.amount)
paths | string | The paths of trustlines and orders to use in executing the payment.

### Example

```javascript
const pathfind = {
  "source": {
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59"
  },
  "destination": {
    "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
    "amount": {
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
      "value": "100"
    }
  }
};
return api.getPaths(pathfind)
  .then(paths => {/* ... */});
```


```json
[
  {
    "source": {
      "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "maxAmount": {
        "currency": "JPY",
        "value": "0.1117218827811721"
      }
    },
    "destination": {
      "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      "amount": {
        "currency": "USD",
        "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
        "value": "100"
      }
    },
    "paths": "[[{\"account\":\"rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6\"},{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6\"},{\"currency\":\"XRP\"},{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6\"},{\"currency\":\"XRP\"},{\"currency\":\"USD\",\"issuer\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6\"},{\"currency\":\"XRP\"},{\"currency\":\"USD\",\"issuer\":\"rHHa9t2kLQyXRbdLkSzEgkzwf9unmFgZs9\"},{\"account\":\"rHHa9t2kLQyXRbdLkSzEgkzwf9unmFgZs9\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}]]"
  },
  {
    "source": {
      "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "maxAmount": {
        "currency": "USD",
        "value": "0.001002"
      }
    },
    "destination": {
      "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      "amount": {
        "currency": "USD",
        "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
        "value": "100"
      }
    },
    "paths": "[[{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q\"},{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q\"},{\"currency\":\"XRP\"},{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"account\":\"rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q\"},{\"currency\":\"XRP\"},{\"currency\":\"USD\",\"issuer\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}]]"
  },
  {
    "source": {
      "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "maxAmount": {
        "currency": "XRP",
        "value": "0.207669"
      }
    },
    "destination": {
      "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
      "amount": {
        "currency": "USD",
        "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
        "value": "100"
      }
    },
    "paths": "[[{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"currency\":\"USD\",\"issuer\":\"rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc\"},{\"account\":\"rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc\"},{\"account\":\"rf9X8QoYnWLHMHuDfjkmRcD2UE5qX5aYV\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"currency\":\"USD\",\"issuer\":\"rDVdJ62foD1sn7ZpxtXyptdkBSyhsQGviT\"},{\"account\":\"rDVdJ62foD1sn7ZpxtXyptdkBSyhsQGviT\"},{\"account\":\"rfQPFZ3eLcaSUKjUy7A3LAmDNM4F9Hz9j1\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}],[{\"currency\":\"USD\",\"issuer\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rpHgehzdpfWRXKvSv6duKvVuo1aZVimdaT\"},{\"account\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"}]]"
  }
]
```


## getOrders

`getOrders(address: string, options: Object): Promise<Array<Object>>`

Returns open orders for the specified account. Open orders are orders that have not yet been fully executed and are still in the order book.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The Ripple address of the account to get open orders for.
options | object | *Optional* Options that determine what orders will be returned.
*options.* ledgerVersion | integer | *Optional* Return orders as of this historical ledger version.
*options.* limit | integer | *Optional* At most this many orders will be returned.

### Return Value

This method returns a promise that resolves with an array of objects with the following structure:

Name | Type | Description
---- | ---- | -----------
specification | [order](#order) | An order specification that would create an order equivalent to the current state of this order.
properties | object | Properties of the order not in the specification.
*properties.* maker | [address](#ripple-address) | The address of the account that submitted the order.
*properties.* sequence | [sequence](#account-sequence-number) | The account sequence number of the transaction that created this order.
*properties.* makerExchangeRate | [value](#value) | The exchange rate from the point of view of the account that submitted the order (also known as "quality").

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getOrders(address).then(orders =>
  {/* ... */});
```


```json
[
  {
    "specification": {
      "direction": "sell",
      "quantity": {
        "currency": "EUR",
        "value": "17.70155237781915",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "1122.990930900328",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 719930,
      "makerExchangeRate": "63.44025128030504"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "EUR",
        "value": "750",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "19.11697137482289",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 756999,
      "makerExchangeRate": "39.23215583132338"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "19.50899530491766",
        "counterparty": "rpDMez6pm6dBve2TJsmDpv7Yae6V5Pyvy2"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "18.46856867857617",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 757002,
      "makerExchangeRate": "1.056334989703257"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "1445.796633544794",
        "counterparty": "rpDMez6pm6dBve2TJsmDpv7Yae6V5Pyvy2"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "14.40727807030772",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 757003,
      "makerExchangeRate": "100.3518240218094"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "750",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      },
      "totalPrice": {
        "currency": "NZD",
        "value": "9.178557969538755",
        "counterparty": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 782148,
      "makerExchangeRate": "81.7121820757743"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "500",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "9.94768291869523",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 787368,
      "makerExchangeRate": "50.26296114247091"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "10000",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "9.994805759894176",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 787408,
      "makerExchangeRate": "1000.519693952099"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "MXN",
        "value": "15834.53653918684",
        "counterparty": "rG6FZ31hDHN1K5Dkbma3PSB5uVCuVVRzfn"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "11.67691646304319",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 803438,
      "makerExchangeRate": "1356.054621894598"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "3968.240250979598",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      },
      "totalPrice": {
        "currency": "XAU",
        "value": "0.03206299605333101",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 807858,
      "makerExchangeRate": "123763.8630020459"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "4139.022125516302",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      },
      "totalPrice": {
        "currency": "XAU",
        "value": "0.03347459066593226",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 807896,
      "makerExchangeRate": "123646.6837435794"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "XRP",
        "value": "115760.19"
      },
      "totalPrice": {
        "currency": "NZD",
        "value": "6.840555705",
        "counterparty": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 814018,
      "makerExchangeRate": "16922.62953364839"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "902.4050961259154",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      },
      "totalPrice": {
        "currency": "EUR",
        "value": "14.40843766044656",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 827522,
      "makerExchangeRate": "62.63032241192674"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "181.4887131319798",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      },
      "totalPrice": {
        "currency": "XAG",
        "value": "1.128432823485989",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 833591,
      "makerExchangeRate": "160.8325363767064"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "1814.887131319799",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      },
      "totalPrice": {
        "currency": "XAG",
        "value": "1.128432823485991",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 833592,
      "makerExchangeRate": "1608.325363767062"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "USD",
        "value": "118.6872603846736",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      },
      "totalPrice": {
        "currency": "XAG",
        "value": "0.7283371225235964",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 838954,
      "makerExchangeRate": "162.9564891233845"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "XAU",
        "value": "1",
        "counterparty": "r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH"
      },
      "totalPrice": {
        "currency": "XRP",
        "value": "2229.229447"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 843730,
      "makerExchangeRate": "0.0004485854972648762"
    }
  },
  {
    "specification": {
      "direction": "buy",
      "quantity": {
        "currency": "EUR",
        "value": "750",
        "counterparty": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"
      },
      "totalPrice": {
        "currency": "USD",
        "value": "17.77537376072202",
        "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      }
    },
    "properties": {
      "maker": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
      "sequence": 844068,
      "makerExchangeRate": "42.19320561670911"
    }
  }
]
```


## getOrderbook

`getOrderbook(address: string, orderbook: Object, options: Object): Promise<Object>`

Returns open orders for the specified account. Open orders are orders that have not yet been fully executed and are still in the order book.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | Address of an account to use as point-of-view. (This affects which unfunded offers are returned.)
orderbook | object | The order book to get.
*orderbook.* base | object | A currency-counterparty pair, or just currency if it's XRP
*orderbook.* counter | object | A currency-counterparty pair, or just currency if it's XRP
options | object | *Optional* Options to determine what to return.
*options.* ledgerVersion | integer | *Optional* Return the order book as of this historical ledger version.
*options.* limit | integer | *Optional* Return at most this many orders from the order book.

### Return Value

This method returns a promise that resolves with an object with the following structure (Note: the structures of `bids` and `asks` are identical):

Name | Type | Description
---- | ---- | -----------
bids | array | The buy orders in the order book.
bids[] | object | An order in the order book.
*bids[].* specification | [order](#order) | An order specification that would create an order equivalent to the current state of this order.
*bids[].* properties | object | Properties of the order not in the specification.
*bids[].properties.* maker | [address](#ripple-address) | The address of the account that submitted the order.
*bids[].properties.* sequence | [sequence](#account-sequence-number) | The account sequence number of the transaction that created this order.
*bids[].properties.* makerExchangeRate | [value](#value) | The exchange rate from the point of view of the account that submitted the order (also known as "quality").
*bids[].* state | object | *Optional* The state of the order.
*bids[].state.* fundedAmount | [amount](#amount) | How much of the amount the maker would have to pay that the maker currently holds.
*bids[].state.* priceOfFundedAmount | [amount](#amount) | How much the `fundedAmount` would convert to through the exchange rate of this order.
asks | array | The sell orders in the order book.
asks[] | object | An order in the order book.
*asks[].* specification | [order](#order) | An order specification that would create an order equivalent to the current state of this order.
*asks[].* properties | object | Properties of the order not in the specification.
*asks[].properties.* maker | [address](#ripple-address) | The address of the account that submitted the order.
*asks[].properties.* sequence | [sequence](#account-sequence-number) | The account sequence number of the transaction that created this order.
*asks[].properties.* makerExchangeRate | [value](#value) | The exchange rate from the point of view of the account that submitted the order (also known as "quality").
*asks[].* state | object | *Optional* The state of the order.
*asks[].state.* fundedAmount | [amount](#amount) | How much of the amount the maker would have to pay that the maker currently holds.
*asks[].state.* priceOfFundedAmount | [amount](#amount) | How much the `fundedAmount` would convert to through the exchange rate of this order.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const orderbook = {
  "base": {
    "currency": "USD",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  },
  "counter": {
    "currency": "BTC",
    "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  }
};
return api.getOrderbook(address, orderbook)
  .then(orderbook => {/* ... */});
```


```json
{
  "bids": [
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "93.030522464522",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.2849323720855092",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rwBYyfufTzk77zUSKEu4MvixfarC35av1J",
        "sequence": 386940,
        "makerExchangeRate": "326.5003614141928"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "1",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.00302447007930511",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rwjsRktX1eguUr1pHTffyHnC4uyrvX58V1",
        "sequence": 207855,
        "makerExchangeRate": "330.6364334177034"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "99.34014894048333",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.3",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-25T01:14:43.000Z"
      },
      "properties": {
        "maker": "raudnGKfTK23YKfnS7ixejHrqGERTYNFXk",
        "sequence": 110103,
        "makerExchangeRate": "331.1338298016111"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "268.754",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.8095",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rPyYxUGK8L4dgEvjPs3aRc1B1jEiLr3Hx5",
        "sequence": 392,
        "makerExchangeRate": "332"
      },
      "state": {
        "fundedAmount": {
          "currency": "BTC",
          "value": "0.8078974385735969",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "USD",
          "value": "268.2219496064341",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "152.0098333185607",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.4499999999999999",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-25T01:14:44.000Z"
      },
      "properties": {
        "maker": "raudnGKfTK23YKfnS7ixejHrqGERTYNFXk",
        "sequence": 110105,
        "makerExchangeRate": "337.7996295968016"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "1.308365894430151",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.003768001830745216",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rDbsCJr5m8gHDCNEHCZtFxcXHsD4S9jH83",
        "sequence": 110061,
        "makerExchangeRate": "347.2306949944844"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "176.3546101589987",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.5",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-25T00:41:38.000Z"
      },
      "properties": {
        "maker": "rDVBvAQScXrGRGnzrxRrcJPeNLeLeUTAqE",
        "sequence": 35788,
        "makerExchangeRate": "352.7092203179974"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "179.48",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.5",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rN6jbxx4H6NxcnmkzBxQnbCWLECNKrgSSf",
        "sequence": 491,
        "makerExchangeRate": "358.96"
      },
      "state": {
        "fundedAmount": {
          "currency": "BTC",
          "value": "0.499001996007984",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "USD",
          "value": "179.1217564870259",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "288.7710263794967",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.8",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-25T00:41:39.000Z"
      },
      "properties": {
        "maker": "rDVBvAQScXrGRGnzrxRrcJPeNLeLeUTAqE",
        "sequence": 35789,
        "makerExchangeRate": "360.9637829743709"
      }
    },
    {
      "specification": {
        "direction": "buy",
        "quantity": {
          "currency": "USD",
          "value": "182.9814890090516",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.5",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rUeCeioKJkbYhv4mRGuAbZpPcqkMCoYq6N",
        "sequence": 5255,
        "makerExchangeRate": "365.9629780181032"
      },
      "state": {
        "fundedAmount": {
          "currency": "BTC",
          "value": "0.2254411038203033",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "USD",
          "value": "82.50309772176658",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    }
  ],
  "asks": [
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "3205.1",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "10",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "r49y2xKuKVG2dPkNHgWQAV61cjxk8gryjQ",
        "sequence": 434,
        "makerExchangeRate": "0.003120027456241615"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "1599.063669386278",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "4.99707396683212",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rDYCRhpahKEhCFV25xScg67Bwf4W9sTYAm",
        "sequence": 233,
        "makerExchangeRate": "0.003125"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "143.1050962074379",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.4499999999999999",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-25T01:14:44.000Z"
      },
      "properties": {
        "maker": "raudnGKfTK23YKfnS7ixejHrqGERTYNFXk",
        "sequence": 110104,
        "makerExchangeRate": "0.003144542101755081"
      },
      "state": {
        "fundedAmount": {
          "currency": "USD",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "BTC",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "254.329207354604",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.8",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-24T21:44:11.000Z"
      },
      "properties": {
        "maker": "rDVBvAQScXrGRGnzrxRrcJPeNLeLeUTAqE",
        "sequence": 35625,
        "makerExchangeRate": "0.003145529403882357"
      },
      "state": {
        "fundedAmount": {
          "currency": "USD",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "BTC",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "390.4979",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "1.23231134568807",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rwBYyfufTzk77zUSKEu4MvixfarC35av1J",
        "sequence": 387756,
        "makerExchangeRate": "0.003155743848271834"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "1",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.003160328237957649",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rwjsRktX1eguUr1pHTffyHnC4uyrvX58V1",
        "sequence": 208927,
        "makerExchangeRate": "0.003160328237957649"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "4725",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "15",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "r49y2xKuKVG2dPkNHgWQAV61cjxk8gryjQ",
        "sequence": 429,
        "makerExchangeRate": "0.003174603174603175"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "1.24252537879871",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "0.003967400879423823",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "rDbsCJr5m8gHDCNEHCZtFxcXHsD4S9jH83",
        "sequence": 110099,
        "makerExchangeRate": "0.003193013959408667"
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "496.5429474010489",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "1.6",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "expirationTime": "2014-12-24T21:44:12.000Z"
      },
      "properties": {
        "maker": "rDVBvAQScXrGRGnzrxRrcJPeNLeLeUTAqE",
        "sequence": 35627,
        "makerExchangeRate": "0.003222279177208227"
      },
      "state": {
        "fundedAmount": {
          "currency": "USD",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "priceOfFundedAmount": {
          "currency": "BTC",
          "value": "0",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      }
    },
    {
      "specification": {
        "direction": "sell",
        "quantity": {
          "currency": "USD",
          "value": "3103",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "totalPrice": {
          "currency": "BTC",
          "value": "10",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      },
      "properties": {
        "maker": "r49y2xKuKVG2dPkNHgWQAV61cjxk8gryjQ",
        "sequence": 431,
        "makerExchangeRate": "0.003222687721559781"
      }
    }
  ]
}
```


## getSettings

`getSettings(address: string, options: Object): Promise<Object>`

Returns settings for the specified account. Note: For account data that is not modifiable by the user, see [getAccountInfo](#getaccountinfo).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account to get the settings of.
options | object | *Optional* Options that affect what to return.
*options.* ledgerVersion | integer | *Optional* Get the settings as of this historical ledger version.

### Return Value

This method returns a promise that resolves with an array of objects with the following structure (Note: all fields are optional as they will not be shown if they are set to their default value):

Name | Type | Description
---- | ---- | -----------
defaultRipple | boolean | *Optional* Enable [rippling](https://ripple.com/knowledge_center/understanding-the-noripple-flag/) on this account’s trust lines by default. (New in [rippled 0.27.3](https://github.com/ripple/rippled/releases/tag/0.27.3))
disableMasterKey | boolean | *Optional* Disallows use of the master key to sign transactions for this account.
disallowIncomingXRP | boolean | *Optional* Indicates that client applications should not send XRP to this account. Not enforced by rippled.
domain | string | *Optional*  The domain that owns this account, as a hexadecimal string representing the ASCII for the domain in lowercase.
emailHash | string,null | *Optional* Hash of an email address to be used for generating an avatar image. Conventionally, clients use Gravatar to display this image. Use `null` to clear.
enableTransactionIDTracking | boolean | *Optional* Track the ID of this account’s most recent transaction.
globalFreeze | boolean | *Optional* Freeze all assets issued by this account.
memos | [memos](#transaction-memos) | *Optional* Array of memos to attach to the transaction.
messageKey | string | *Optional* Public key for sending encrypted messages to this account. Conventionally, it should be a secp256k1 key, the same encryption that is used by the rest of Ripple.
noFreeze | boolean | *Optional* Permanently give up the ability to freeze individual trust lines. This flag can never be disabled after being enabled.
passwordSpent | boolean | *Optional* Indicates that the account has used its free SetRegularKey transaction.
regularKey | [address](#ripple-address),null | *Optional* The public key of a new keypair, to use as the regular key to this account, as a base-58-encoded string in the same format as an account address. Use `null` to remove the regular key.
requireAuthorization | boolean | *Optional* If set, this account must individually approve other users in order for those users to hold this account’s issuances.
requireDestinationTag | boolean | *Optional* Requires incoming payments to specify a destination tag.
transferRate | number,null | *Optional*  The fee to charge when users transfer this account’s issuances, represented as billionths of a unit. Use `null` to set no fee.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getSettings(address).then(settings =>
  {/* ... */});
```


```json
{
  "requireDestinationTag": true,
  "disallowIncomingXRP": true,
  "emailHash": "23463B99B62A72F26ED677CC556C44E8",
  "domain": "example.com",
  "transferRate": 1.002
}
```


## getAccountInfo

`getAccountInfo(address: string, options: Object): Promise<Object>`

Returns information for the specified account. Note: For account data that is modifiable by the user, see [getSettings](#getsettings).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account to get the account info of.
options | object | *Optional* Options that affect what to return.
*options.* ledgerVersion | integer | *Optional* Get the account info as of this historical ledger version.

### Return Value

This method returns a promise that resolves with an object with the following structure:

Name | Type | Description
---- | ---- | -----------
sequence | [sequence](#account-sequence-number) | The next (smallest unused) sequence number for this account.
xrpBalance | [value](#value) | The XRP balance owned by the account.
ownerCount | integer | Number of other ledger entries (specifically, trust lines and offers) attributed to this account. This is used to calculate the total reserve required to use the account.
previousAffectingTransactionID | string | Hash value representing the most recent transaction that affected this account node directly. **Note:** This does not include changes to the account’s trust lines and offers.
previousAffectingTransactionLedgerVersion | integer | The ledger version that the transaction identified by the `previousAffectingTransactionID` was validated in.
previousInitiatedTransactionID | string | *Optional* Hash value representing the most recent transaction that was initiated by this account.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
return api.getAccountInfo(address).then(info =>
  {/* ... */});
```


```json
{
  "sequence": 23,
  "xrpBalance": "922.913243",
  "ownerCount": 1,
  "previousAffectingTransactionID": "19899273706A9E040FDB5885EE991A1DC2BAD878A0D6E7DBCFB714E63BF737F7",
  "previousAffectingTransactionLedgerVersion": 6614625
}
```


## getLedger

`getLedger(options: Object): Promise<Object>`

Returns header information for the specified ledger (or the most recent validated ledger if no ledger is specified). Optionally, all the transactions that were validated in the ledger or the account state information can be returned with the ledger header.

### Parameters

Name | Type | Description
---- | ---- | -----------
options | object | *Optional* Options affecting what ledger and how much data to return.
*options.* includeAllData | boolean | *Optional* Include full transactions and/or state information if `includeTransactions` and/or `includeState` is set.
*options.* includeState | boolean | *Optional* Return an array of hashes for all state data or an array of all state data in this ledger version, depending on whether `includeAllData` is set.
*options.* includeTransactions | boolean | *Optional* Return an array of hashes for each transaction or an array of all transactions that were validated in this ledger version, depending on whether `includeAllData` is set.
*options.* ledgerVersion | integer | *Optional* Get ledger data for this historical ledger version.

### Return Value

This method returns a promise that resolves with an object with the following structure:

Name | Type | Description
---- | ---- | -----------
stateHash | string | Hash of all state information in this ledger.
closeTime | date-time string | The time at which this ledger was closed.
closeTimeResolution | integer | Approximate number of seconds between closing one ledger version and closing the next one.
closeFlags | integer | A bit-map of flags relating to the closing of this ledger. Currently, the ledger has only one flag defined for `closeFlags`: **sLCF_NoConsensusTime** (value 1). If this flag is enabled, it means that validators were in conflict regarding the correct close time for the ledger, but built otherwise the same ledger, so they declared consensus while "agreeing to disagree" on the close time. In this case, the consensus ledger contains a `closeTime` value that is 1 second after that of the previous ledger. (In this case, there is no official close time, but the actual real-world close time is probably 3-6 seconds later than the specified `closeTime`.)
ledgerHash | string | Unique identifying hash of the entire ledger.
ledgerVersion | integer | The ledger version of this ledger.
parentLedgerHash | string | Unique identifying hash of the ledger that came immediately before this one.
parentCloseTime | date-time string | The time at which the previous ledger was closed.
totalDrops | [value](#value) | Total number of drops (1/1,000,000th of an XRP) in the network, as a quoted integer. (This decreases as transaction fees cause XRP to be destroyed.)
transactionHash | string | Hash of the transaction information included in this ledger.
rawState | string | *Optional* A JSON string containing all state data for this ledger in rippled JSON format.
rawTransactions | string | *Optional* A JSON string containing rippled format transaction JSON for all transactions that were validated in this ledger.
stateHashes | array\<string\> | *Optional* An array of hashes of all state data in this ledger.
transactionHashes | array\<[id](#transaction-id)\> | *Optional* An array of hashes of all transactions that were validated in this ledger.
transactions | array\<[getTransaction](#gettransaction)\> | *Optional* Array of all transactions that were validated in this ledger. Transactions are represented in the same format as the return value of [getTransaction](#gettransaction).

### Example

```javascript
return api.getLedger()
  .then(ledger => {/* ... */});
```


```json
{
  "stateHash": "EC028EC32896D537ECCA18D18BEBE6AE99709FEFF9EF72DBD3A7819E918D8B96",
  "closeTime": "2014-09-24T21:21:50.000Z",
  "closeTimeResolution": 10,
  "closeFlags": 0,
  "ledgerHash": "0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F",
  "ledgerVersion": 9038214,
  "parentLedgerHash": "4BB9CBE44C39DC67A1BE849C7467FE1A6D1F73949EA163C38A0121A15E04FFDE",
  "parentCloseTime": "2014-09-24T21:21:40.000Z",
  "totalDrops": "99999973964317514",
  "transactionHash": "ECB730839EB55B1B114D5D1AD2CD9A932C35BA9AB6D3A8C2F08935EAC2BAC239"
}
```


## preparePayment

`preparePayment(address: string, payment: Object, instructions: Object): Promise<Object>`

Prepare a payment transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
payment | [payment](#payment) | The specification of the payment to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const payment = {
  "source": {
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "maxAmount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "destination": {
    "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
    "amount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  }
};
return api.preparePayment(address, payment).then(prepared =>
  {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147483648,\"TransactionType\":\"Payment\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"Destination\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"Amount\":{\"value\":\"0.01\",\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},\"SendMax\":{\"value\":\"0.01\",\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## prepareTrustline

`prepareTrustline(address: string, trustline: Object, instructions: Object): Promise<Object>`

Prepare a trustline transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
trustline | [trustline](#trustline) | The specification of the trustline to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const trustline = {
  "currency": "USD",
  "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
  "limit": "10000",
  "qualityIn": 0.91,
  "qualityOut": 0.87,
  "ripplingDisabled": true,
  "frozen": false,
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
};
return api.preparePayment(address, trustline).then(prepared =>
  {/* ... */});
```


```json
{
  "txJSON": "{\"TransactionType\":\"TrustSet\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"LimitAmount\":{\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\",\"value\":\"10000\"},\"Flags\":2149711872,\"QualityIn\":910000000,\"QualityOut\":870000000,\"Memos\":[{\"Memo\":{\"MemoData\":\"7465787465642064617461\",\"MemoType\":\"74657374\",\"MemoFormat\":\"706C61696E2F74657874\"}}],\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## prepareOrder

`prepareOrder(address: string, order: Object, instructions: Object): Promise<Object>`

Prepare an order transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
order | [order](#order) | The specification of the order to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const order = {
  "direction": "buy",
  "quantity": {
    "currency": "USD",
    "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
    "value": "10.1"
  },
  "totalPrice": {
    "currency": "XRP",
    "value": "2"
  },
  "passive": true,
  "fillOrKill": true
};
return api.prepareOrder(address, order)
  .then(prepared => {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147811328,\"TransactionType\":\"OfferCreate\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"TakerGets\":\"2000000\",\"TakerPays\":{\"value\":\"10.1\",\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},\"LastLedgerSequence\":8819954,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8819954
  }
}
```


## prepareOrderCancellation

`prepareOrderCancellation(address: string, orderCancellation: Object, instructions: Object): Promise<Object>`

Prepare an order cancellation transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
orderCancellation | [orderCancellation](#order-cancellation) | The specification of the order cancellation to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const orderCancellation = {orderSequence: 123};
return api.prepareOrderCancellation(address, sequence)
  .then(prepared => {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147483648,\"TransactionType\":\"OfferCancel\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"OfferSequence\":23,\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## prepareSettings

`prepareSettings(address: string, settings: Object, instructions: Object): Promise<Object>`

Prepare a settings transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
settings | [settings](#settings) | The specification of the settings to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const settings = {
  "domain": "ripple.com",
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
};
return api.prepareSettings(address, settings)
  .then(prepared => {/* ... */});
```


```json
{
  "domain": "ripple.com",
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
}
```


## prepareSuspendedPaymentCreation

`prepareSuspendedPaymentCreation(address: string, suspendedPaymentCreation: Object, instructions: Object): Promise<Object>`

Prepare a suspended payment creation transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

**Caution:** Suspended Payments are currently available on the [Ripple Test Net](https://ripple.com/build/ripple-test-net/) only.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
suspendedPaymentCreation | [suspendedPaymentCreation](#suspended-payment-creation) | The specification of the suspended payment creation to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const suspendedPaymentCreation = {
  "source": {
    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    "maxAmount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "destination": {
    "address": "rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo",
    "amount": {
      "value": "0.01",
      "currency": "USD",
      "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
    }
  },
  "allowCancelAfter": "2014-09-24T21:21:50.000Z"
};
return api.prepareSuspendedPaymentCreation(address, suspendedPaymentCreation).then(prepared =>
  {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147483648,\"TransactionType\":\"SuspendedPaymentCreate\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"Destination\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"Amount\":{\"value\":\"0.01\",\"currency\":\"USD\",\"issuer\":\"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM\"},\"CancelAfter\":464908910,\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## prepareSuspendedPaymentCancellation

`prepareSuspendedPaymentCancellation(address: string, suspendedPaymentCancellation: Object, instructions: Object): Promise<Object>`

Prepare a suspended payment cancellation transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

**Caution:** Suspended Payments are currently available on the [Ripple Test Net](https://ripple.com/build/ripple-test-net/) only.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
suspendedPaymentCancellation | [suspendedPaymentCancellation](#suspended-payment-cancellation) | The specification of the suspended payment cancellation to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const suspendedPaymentCancellation = {
  "owner": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "suspensionSequence": 1234
};
return api.prepareSuspendedPaymentCancellation(address, suspendedPaymentCancellation).then(prepared =>
  {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147483648,\"TransactionType\":\"SuspendedPaymentCancel\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"Owner\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"OfferSequence\":1234,\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## prepareSuspendedPaymentExecution

`prepareSuspendedPaymentExecution(address: string, suspendedPaymentExecution: Object, instructions: Object): Promise<Object>`

Prepare a suspended payment execution transaction. The prepared transaction must subsequently be [signed](#sign) and [submitted](#submit).

**Caution:** Suspended Payments are currently available on the [Ripple Test Net](https://ripple.com/build/ripple-test-net/) only.

### Parameters

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | The address of the account that is creating the transaction.
suspendedPaymentExecution | [suspendedPaymentExecution](#suspended-payment-execution) | The specification of the suspended payment execution to prepare.
instructions | [instructions](#transaction-instructions) | *Optional* Instructions for executing the transaction

### Return Value

This method returns a promise that resolves with an object with the following structure:

<aside class="notice">
All "prepare*" methods have the same return type.
</aside>

Name | Type | Description
---- | ---- | -----------
txJSON | string | The prepared transaction in rippled JSON format.
instructions | object | The instructions for how to execute the transaction after adding automatic defaults.
*instructions.* fee | [value](#value) | An exact fee to pay for the transaction. See [Transaction Fees](#transaction-fees) for more information.
*instructions.* sequence | [sequence](#account-sequence-number) | The initiating account's sequence number for this transaction.
*instructions.* maxLedgerVersion | integer,null | The highest ledger version that the transaction can be included in. Set to `null` if there is no maximum.

### Example

```javascript
const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';
const suspendedPaymentExecution = {
  "owner": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "suspensionSequence": 1234,
  "method": 1,
  "digest": "712C36933822AD3A3D136C5DF97AA863B69F9CE88B2D6CE6BDD11BFDE290C19D",
  "proof": "this must have 32 characters...."
};
return api.prepareSuspendedPaymentExecution(address, suspendedPaymentExecution).then(prepared =>
  {/* ... */});
```


```json
{
  "txJSON": "{\"Flags\":2147483648,\"TransactionType\":\"SuspendedPaymentFinish\",\"Account\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"Owner\":\"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59\",\"OfferSequence\":1234,\"Method\":1,\"Digest\":\"712C36933822AD3A3D136C5DF97AA863B69F9CE88B2D6CE6BDD11BFDE290C19D\",\"Proof\":\"74686973206D757374206861766520333220636861726163746572732E2E2E2E\",\"LastLedgerSequence\":8820051,\"Fee\":\"12\",\"Sequence\":23}",
  "instructions": {
    "fee": "0.000012",
    "sequence": 23,
    "maxLedgerVersion": 8820051
  }
}
```


## sign

`sign(txJSON: string, secret: string): {signedTransaction: string, id: string}`

Sign a prepared transaction. The signed transaction must subsequently be [submitted](#submit).

### Parameters

Name | Type | Description
---- | ---- | -----------
txJSON | string | Transaction represented as a JSON string in rippled format.
secret | secret string | The secret of the account that is initiating the transaction.

### Return Value

This method returns an object with the following structure:

Name | Type | Description
---- | ---- | -----------
signedTransaction | string | The signed transaction represented as an uppercase hexadecimal string.
id | [id](#transaction-id) | The [Transaction ID](#transaction-id) of the signed transaction.

### Example

```javascript
const txJSON = '{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Domain":"726970706C652E636F6D","LastLedgerSequence":8820051,"Fee":"12","Sequence":23}';
const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV';
return api.sign(txJSON, secret);
```


```json
{
  "signedTransaction": "12000322800000002400000017201B0086955368400000000000000C732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D874473045022100BDE09A1F6670403F341C21A77CF35BA47E45CDE974096E1AA5FC39811D8269E702203D60291B9A27F1DCABA9CF5DED307B4F23223E0B6F156991DB601DFB9C41CE1C770A726970706C652E636F6D81145E7B112523F68D2F5E879DB4EAC51C6698A69304",
  "id": "02ACE87F1996E3A23690A5BB7F1774BF71CCBA68F79805831B42ABAD5913D6F4"
}
```


## submit

`submit(signedTransaction: string): Promise<Object>`

Submits a signed transaction. The transaction is not guaranteed to succeed; it must be verified with [getTransaction](#gettransaction).

### Parameters

Name | Type | Description
---- | ---- | -----------
signedTransaction | string | A signed transaction as returned by [sign](#sign).

### Return Value

This method returns an object with the following structure:

Name | Type | Description
---- | ---- | -----------
resultCode | string | The result code returned by rippled. [List of tranasction responses](http://pages.lightthenight.org/gba/SanFran15/ripple)
resultMessage | string | Human-readable explanation of the status of the transaction.

### Example

```javascript
const signedTransaction = '12000322800000002400000017201B0086955368400000000000000C732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D874473045022100BDE09A1F6670403F341C21A77CF35BA47E45CDE974096E1AA5FC39811D8269E702203D60291B9A27F1DCABA9CF5DED307B4F23223E0B6F156991DB601DFB9C41CE1C770A726970706C652E636F6D81145E7B112523F68D2F5E879DB4EAC51C6698A69304';
return api.submit(signedTransaction)
  .then(result => {/* ... */});
```


```json
{
  "resultCode": "tesSUCCESS",
  "resultMessage": "The transaction was applied. Only final in a validated ledger."
}
```


## generateAddress

`generateAddress(): {address: string, secret: string}`

Generate a new Ripple address and corresponding secret.

### Parameters

Name | Type | Description
---- | ---- | -----------
options | object | *Optional* Options to control how the address and secret are generated.
*options.* algorithm | string | *Optional* The digital signature algorithm to generate an address for. Can be `ecdsa-secp256k1` (default) or `ed25519`.
*options.* entropy | array\<integer\> | *Optional* The entropy to use to generate the seed.

### Return Value

This method returns an object with the following structure:

Name | Type | Description
---- | ---- | -----------
address | [address](#ripple-address) | A randomly generated Ripple account address.
secret | secret string | The secret corresponding to the `address`.

### Example

```javascript
return api.generateAddress();
```


```json
{
  "address": "rGCkuB7PBr5tNy68tPEABEtcdno4hE6Y7f",
  "secret": "sp6JS7f14BuwFY8Mw6bTtLKWauoUs"
}
```


## computeLedgerHash

`computeLedgerHash(ledger: Object): string`

Compute the hash of a ledger.

### Parameters

<aside class="notice">
The parameter to this method has the same structure as the return value of getLedger.
</aside>

Name | Type | Description
---- | ---- | -----------
ledger | object | The ledger header to hash.
*ledger.* stateHash | string | Hash of all state information in this ledger.
*ledger.* closeTime | date-time string | The time at which this ledger was closed.
*ledger.* closeTimeResolution | integer | Approximate number of seconds between closing one ledger version and closing the next one.
*ledger.* closeFlags | integer | A bit-map of flags relating to the closing of this ledger. Currently, the ledger has only one flag defined for `closeFlags`: **sLCF_NoConsensusTime** (value 1). If this flag is enabled, it means that validators were in conflict regarding the correct close time for the ledger, but built otherwise the same ledger, so they declared consensus while "agreeing to disagree" on the close time. In this case, the consensus ledger contains a `closeTime` value that is 1 second after that of the previous ledger. (In this case, there is no official close time, but the actual real-world close time is probably 3-6 seconds later than the specified `closeTime`.)
*ledger.* ledgerHash | string | Unique identifying hash of the entire ledger.
*ledger.* ledgerVersion | integer | The ledger version of this ledger.
*ledger.* parentLedgerHash | string | Unique identifying hash of the ledger that came immediately before this one.
*ledger.* parentCloseTime | date-time string | The time at which the previous ledger was closed.
*ledger.* totalDrops | [value](#value) | Total number of drops (1/1,000,000th of an XRP) in the network, as a quoted integer. (This decreases as transaction fees cause XRP to be destroyed.)
*ledger.* transactionHash | string | Hash of the transaction information included in this ledger.
*ledger.* rawState | string | *Optional* A JSON string containing all state data for this ledger in rippled JSON format.
*ledger.* rawTransactions | string | *Optional* A JSON string containing rippled format transaction JSON for all transactions that were validated in this ledger.
*ledger.* stateHashes | array\<string\> | *Optional* An array of hashes of all state data in this ledger.
*ledger.* transactionHashes | array\<[id](#transaction-id)\> | *Optional* An array of hashes of all transactions that were validated in this ledger.
*ledger.* transactions | array\<[getTransaction](#gettransaction)\> | *Optional* Array of all transactions that were validated in this ledger. Transactions are represented in the same format as the return value of [getTransaction](#gettransaction).

### Return Value

This method returns an uppercase hexadecimal string representing the hash of the ledger.

### Example

```javascript
const ledger = {
  "stateHash": "D9ABF622DA26EEEE48203085D4BC23B0F77DC6F8724AC33D975DA3CA492D2E44",
  "closeTime": "2015-08-12T01:01:10.000Z",
  "parentCloseTime": "2015-08-12T01:01:00.000Z",
  "closeFlags": 0,
  "closeTimeResolution": 10,
  "ledgerVersion": 15202439,
  "parentLedgerHash": "12724A65B030C15A1573AA28B1BBB5DF3DA4589AA3623675A31CAE69B23B1C4E",
  "totalDrops": "99998831688050493",
  "transactionHash": "325EACC5271322539EEEC2D6A5292471EF1B3E72AE7180533EFC3B8F0AD435C8"
};
return api.computeLedgerHash(ledger);
```

```json
"F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349"
```

# API Events

## ledger

This event is emitted whenever a new ledger version is validated on the connected server.

### Return Value

Name | Type | Description
---- | ---- | -----------
baseFeeXRP | [value](#value) | Base fee, in XRP.
ledgerHash | string | Unique hash of the ledger that was closed, as hex.
ledgerTimestamp | date-time string | The time at which this ledger closed.
reserveBaseXRP | [value](#value) | The minimum reserve, in XRP, that is required for an account.
reserveIncrementXRP | [value](#value) | The increase in account reserve that is added for each item the account owns, such as offers or trust lines.
transactionCount | integer | Number of new transactions included in this ledger.
ledgerVersion | integer | Ledger version of the ledger that closed.
validatedLedgerVersions | string | Range of ledgers that the server has available. This may be discontiguous.

### Example

```javascript
api.on('ledger', ledger => {
  console.log(JSON.stringify(ledger, null, 2));
});
```


```json
{
  "baseFeeXRP": "0.00001",
  "ledgerVersion": 14804627,
  "ledgerHash": "9141FA171F2C0CE63E609466AF728FF66C12F7ACD4B4B50B0947A7F3409D593A",
  "ledgerTimestamp": "2015-07-23T05:50:40.000Z",
  "reserveBaseXRP": "20",
  "reserveIncrementXRP": "5",
  "transactionCount": 19,
  "validatedLedgerVersions": "13983423-14804627"
}
```


## error

This event is emitted when there is an error on the connection to the server that cannot be associated to a specific request.

### Return Value

The first parameter is a string indicating the error type:
* `badMessage` - rippled returned a malformed message
* `websocket` - the websocket library emitted an error
* one of the error codes found in the [rippled Universal Errors](https://ripple.com/build/rippled-apis/#universal-errors).

The second parameter is a message explaining the error.

The third parameter is:
* the message that caused the error for `badMessage`
* the error object emitted for `websocket`
* the parsed response for rippled errors

### Example

```javascript
api.on('error', (errorCode, errorMessage, data) => {
  console.log(errorCode + ': ' + errorMessage);
});
```

```
tooBusy: The server is too busy to help you now.
```

