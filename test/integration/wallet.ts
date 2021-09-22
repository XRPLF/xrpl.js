import { Wallet } from 'xrpl-local'

const walletSecret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'

const wallet = Wallet.fromSeed(walletSecret)

export default wallet
