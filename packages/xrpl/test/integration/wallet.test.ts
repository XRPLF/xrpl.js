/* eslint-disable consistent-default-export-name/default-export-match-filename -- This is a test file. */
import { Wallet } from 'xrpl-local'

const walletSecret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'

const wallet = Wallet.fromSeed(walletSecret)

export default wallet
