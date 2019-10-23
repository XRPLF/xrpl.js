# XRP Ledger Hashes

Methods to hash XRP Ledger objects

## Methods

### computeBinaryTransactionHash = (txBlobHex: string): string

Compute the hash of a binary transaction blob.

### computeTransactionHash = (txJSON: any): string

Compute the hash of a transaction in txJSON format.

### computeBinaryTransactionSigningHash = (txBlobHex: string): string

### computeTransactionSigningHash = (txJSON: any): string

### computeAccountHash = (address: string): string

Compute the hash of an account, given the account's classic address (starting with `r`).

### computeSignerListHash = (address: string): string

Compute the hash of an account's SignerList.

### computeOrderHash = (address: string, sequence: number): string

Compute the hash of an order, given the owner's classic address (starting with `r`) and the account sequence number of the `OfferCreate` order transaction.

### computeTrustlineHash = (address1: string, address2: string, currency: string): string

Compute the hash of a trustline, given the two parties' classic addresses (starting with `r`) and the currency code.

### computeTransactionTreeHash = (transactions: any[]): string

### computeStateTreeHash = (entries: any[]): string

### computeLedgerHash = (ledgerHeader): string

Compute the hash of a ledger.

### computeEscrowHash = (address, sequence): string

Compute the hash of an escrow, given the owner's classic address (starting with `r`) and the account sequence number of the `EscrowCreate` escrow transaction.

### computePaymentChannelHash = (address, dstAddress, sequence): string

Compute the hash of a payment channel, given the owner's classic address (starting with `r`), the classic address of the destination, and the account sequence number of the `PaymentChannelCreate` payment channel transaction.
