import assert from 'assert'

import _ from 'lodash'

import { Client } from 'xrpl-local'
import { AccountSet, SignerListSet } from 'xrpl-local/models/transactions'
import { convertStringToHex } from 'xrpl-local/utils'
import { sign, multisign } from 'xrpl-local/wallet/signer'

import serverUrl from './serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from './setup'
import {
  generateFundedWallet,
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
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
    const signerWallet1 = await generateFundedWallet(client)
    const signerWallet2 = await generateFundedWallet(client)

    // set up the multisigners for the account
    const signerListSet: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: this.wallet.getClassicAddress(),
      SignerEntries: [
        {
          SignerEntry: {
            Account: signerWallet1.getClassicAddress(),
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signerWallet2.getClassicAddress(),
            SignerWeight: 1,
          },
        },
      ],
      SignerQuorum: 2,
    }
    await testTransaction(this.client, signerListSet, this.wallet)

    // try to multisign
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const signed1 = sign(signerWallet1, accountSetTx, true)
    const signed2 = sign(signerWallet2, accountSetTx, true)
    const combined = multisign([signed1, signed2])
    const submitResponse = await client.submitSignedTransaction(combined)
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    await verifySubmittedTransaction(this.client, combined)
  })
})
