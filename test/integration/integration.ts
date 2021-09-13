import assert from 'assert'

import _ from 'lodash'
import { decode } from 'ripple-binary-codec'

import { Client, Wallet } from 'xrpl-local'
import { AccountSet, SignerListSet } from 'xrpl-local/models/transactions'
import { convertStringToHex } from 'xrpl-local/utils'
import { sign, multisign } from 'xrpl-local/wallet/signer'
import { Transaction } from '../../src/models/transactions'

import serverUrl from './serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from './setup'
import {
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
  fundAccount,
} from './utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('integration tests', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('isConnected', function () {
    assert(this.client.isConnected())
  })

  it('submit multisigned transaction', async function () {
    const client: Client = this.client
    const multisignAccount = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs'
    const multisignSecret = 'ss6F8381Br6wwpy9p582H8sBt19J3'
    const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2'
    const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'
    const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud'
    const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF'
    await fundAccount(client, multisignAccount)

    const ledgerResponse = await client.request({
      command: 'ledger',
      ledger_index: 'validated',
    })
    const minLedgerVersion = ledgerResponse.result.ledger_index

    // set up the multisigners for the account
    const signerListSet: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: multisignAccount,
      SignerEntries: [
        {
          SignerEntry: {
            Account: signer1address,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signer2address,
            SignerWeight: 1,
          },
        },
      ],
      SignerQuorum: 2,
    }
    const tx = await client.autofill(signerListSet, 2)
    await testTransaction(
      this,
      minLedgerVersion,
      tx,
      multisignAccount,
      multisignSecret,
    )

    // try to multisign
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: multisignAccount,
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const signed1 = sign(Wallet.fromSeed(signer1secret), accountSetTx, true)
    const signed2 = sign(Wallet.fromSeed(signer2secret), accountSetTx, true)
    const combined = multisign([signed1, signed2])
    // TODO: replace with `client.submitSignedTransaction`
    const submitResponse = await client.request({
      command: 'submit',
      tx_blob: combined,
    })
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    const options = { minLedgerVersion }
    await verifySubmittedTransaction(
      this,
      decode(combined) as unknown as Transaction,
      options,
    )
  })
})
