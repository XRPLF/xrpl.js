export { Client, ClientOptions } from './client'

export * from './models'

export * from './utils'

export { default as ECDSA } from './ECDSA'

export * from './errors'

export { FundingOptions } from './Wallet/fundWallet'
export * from './Wallet'

export { walletFromSecretNumbers } from './Wallet/walletFromSecretNumbers'

export { keyToRFC1751Mnemonic, rfc1751MnemonicToKey } from './Wallet/rfc1751'

// Confidential MPT (XLS-0096) builders. `@xrplf/mpt-crypto`'s ~2 MB WASM is a separate
// asset the loader reaches only through a dynamic import, so it loads lazily — only when
// a confidential builder first runs, not on `import 'xrpl'`. (The small builder glue does
// ship with the main entry now that it's re-exported here rather than behind a subpath.)
export * from './confidential'
