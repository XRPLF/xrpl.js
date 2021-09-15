import { Wallet } from 'xrpl-local'

const walletSecret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'

export const wallet = Wallet.fromSeed(walletSecret)
