import assert from 'assert'

import _ from 'lodash'
import { encode } from 'ripple-binary-codec'

import { Client, Wallet } from 'xrpl-local'
import { AccountSet, SignerListSet } from 'xrpl-local/models/transactions'
import { xrpToDrops, convertStringToHex } from 'xrpl-local/utils'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'
import { sign, multisign } from 'xrpl-local/wallet/signer'

import serverUrl from './serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from './setup'
import {
  payTo,
  ledgerAccept,
  testTransaction,
  verifyTransaction,
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

  const multisignAccount = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs'
  const multisignSecret = 'ss6F8381Br6wwpy9p582H8sBt19J3'
  const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2'
  const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'
  const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud'
  const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF'

  it('submit multisigned transaction', async function () {
    const client: Client = this.client
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
    const serverInfoResponse = await client.request({
      command: 'server_info',
    })
    const fundAmount = xrpToDrops(
      Number(
        serverInfoResponse.result.info.validated_ledger?.reserve_base_xrp,
      ) * 2,
    )
    await payTo(client, multisignAccount, fundAmount)
    const minLedgerVersion = (
      await client.request({
        command: 'ledger',
        ledger_index: 'validated',
      })
    ).result.ledger_index
    const tx = await client.autofill(signerListSet, 2)
    await testTransaction(
      this,
      'SignerListSet',
      minLedgerVersion,
      tx,
      multisignAccount,
      multisignSecret,
    )
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: multisignAccount,
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const signed1 = sign(Wallet.fromSeed(signer1secret), accountSetTx, true)
    const signed2 = sign(Wallet.fromSeed(signer2secret), accountSetTx, true)
    const combined = multisign([signed1, signed2])
    const submitResponse = await client.request({
      command: 'submit',
      tx_blob: encode(combined),
    })
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    const options = { minLedgerVersion }
    return verifyTransaction(
      this,
      computeSignedTransactionHash(combined),
      'AccountSet',
      options,
      multisignAccount,
    ).catch((error) => {
      // eslint-disable-next-line no-console -- only if something goes wrong
      console.log(error.message)
      throw error
    })
  })
})
