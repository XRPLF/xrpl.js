# ripple-keypairs

## Generate a random wallet
```js
> var generateWallet = require('ripple-keypairs').generateWallet;
> generateWallet({type: 'ed25519'});
{ seed: 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6',
  accountID: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  publicKey: 'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A' }
```

## Derive a wallet from a seed
```js
> var walletFromSeed = require('ripple-keypairs').walletFromSeed;
> walletFromSeed('sEd7t79mzn2dwy3vvpvRmaaLbLhvme6');
{ seed: 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6',
  accountID: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  publicKey: 'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A' }')
```
