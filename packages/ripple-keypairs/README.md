# ripple-keypairs [![NPM](https://img.shields.io/npm/v/ripple-keypairs.svg)](https://npmjs.org/package/ripple-keypairs) [![Build Status](https://img.shields.io/travis/ripple/ripple-keypairs/master.svg)](https://travis-ci.org/ripple/ripple-keypairs) [![Coverage Status](https://coveralls.io/repos/ripple/ripple-keypairs/badge.svg?branch=master&service=github)](https://coveralls.io/github/ripple/ripple-keypairs?branch=master)

An implementation of ripple keypairs & wallet generation using
[elliptic](https://github.com/indutny/elliptic) which supports rfc6979 and
eddsa deterministic signatures.

## API Methods

```
generateSeed({entropy?: Array<integer>, algorithm?: string}) -> string
```
Generate a seed that can be used to generate keypairs. Entropy can be provided as an array of 32-bit integers. If provided, it must be at least 16 words long. If not provided, entropy will be automatically generated. The "algorithm" defaults to "secp256k1", but can also be set to "ed25519". The result is a seed encoded in base58, starting with "s".

```
deriveKeypair(seed: string) -> {privateKey: string, publicKey: string}
```
Derive a public and private key from a seed. The keys are represented as hexadecimal strings. A single metadata byte is prepended so the keys are 33 bytes long.

```
sign(message: string, privateKey: string) -> string
```
Sign an arbitrary message with a private key. Returns the signature as a hexadecimal string.

```
verify(message: string, signature: string, publicKey: string) -> boolean
```
Verify a signature for a given message and public key. Returns true if the signature is valid, false otherwise.

```
deriveAddress(publicKey: string) -> string
```
Derive a Ripple address from a public key.

```
deriveNodeAddress(publicKey: string) -> string
```
Derive a node address from a public key.


## Generate a random Ripple address

```
const seed = generateSeed();
const keypair = deriveKeypair(seed);
const address = deriveAddress(keypair.publicKey);
```
