# XRP Ledger Hashes

Methods to hash XRP Ledger objects

## Computing a transaction hash (ID)

### computeBinaryTransactionHash = (txBlobHex: string): string

Compute the hash of a binary transaction blob.

### computeTransactionHash = (txJSON: any): string

Compute the hash of a transaction in txJSON format.

## [Hash Prefixes](https://xrpl.org/basic-data-types.html#hash-prefixes)

In many cases, the XRP Ledger prefixes an object's binary data with a 4-byte code before calculating its hash, so that objects of different types have different hashes even if the binary data is the same. The existing 4-byte codes are structured as 3 alphabetic characters, encoded as ASCII, followed by a zero byte.

Some types of hashes appear in API requests and responses. Others are only calculated as the first step of signing a certain type of data, or calculating a higher-level hash. Some of following methods internally use some of the 4-byte hash prefixes in order to calculate the appropriate hash.

### hashTx = (txBlobHex: string): string

In order to single-sign a transaction, you must perform these steps:

1. Assuming the transaction is in JSON format (txJSON), `encode` the transaction in the XRP Ledger's binary format.
2. Hash the data with the appropriate prefix (`0x53545800` if single-signing, or `0x534D5400` if multi-signing).
3. After signing, you must re-serialize the transaction with the `TxnSignature` field included.

The `hashTx` helps with step 2, automatically using the `0x53545800` prefix needed for single-signing a transaction.

For details, see [Serialization Format](https://xrpl.org/serialization.html).

_Removed:_ `computeTransactionSigningHash`, which took txJSON as a parameter. It was part of the deprecated ripple-hashes library. If you have txJSON, `encode` it with [ripple-binary-codec](https://github.com/ripple/ripple-binary-codec) first. Example: `return hashTx(encode(txJSON))`

### computeAccountLedgerObjectID = (address: string): string

Compute the hash of an account, given the account's classic address (starting with `r`).

### computeSignerListLedgerObjectID = (address: string): string

Compute the hash of an account's SignerList.

### computeOfferID = (address: string, sequence: number): string

Compute the hash of an order, given the owner's classic address (starting with `r`) and the account sequence number of the `OfferCreate` order transaction.

### hashTrustline = (address1: string, address2: string, currency: string): string

Compute the hash of a trustline, given the two parties' classic addresses (starting with `r`) and the currency code.

### hashTxTree = (transactions: any[]): string

### hashStateTree = (entries: any[]): string

### hashLedger = (ledgerHeader): string

Compute the hash of a ledger.

### hashEscrow = (address, sequence): string

Compute the hash of an escrow, given the owner's classic address (starting with `r`) and the account sequence number of the `EscrowCreate` escrow transaction.

### hashPaymentChannel = (address, dstAddress, sequence): string

Compute the hash of a payment channel, given the owner's classic address (starting with `r`), the classic address of the destination, and the account sequence number of the `PaymentChannelCreate` payment channel transaction.
