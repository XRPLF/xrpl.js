/* eslint-disable consistent-default-export-name/default-export-match-filename -- Wallet.test is correct in test folder. */
import { Wallet } from '../../src'

const walletSecret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'

const wallet = Wallet.fromSeed(walletSecret)

export default wallet
