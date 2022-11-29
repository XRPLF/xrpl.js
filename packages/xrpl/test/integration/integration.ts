import assert from 'assert'

import _ from 'lodash'
import { XrplDefinitions } from 'ripple-binary-codec/dist/enums'
import { coreTypes } from 'ripple-binary-codec/dist/types'
import { Client, RippledError } from 'xrpl-local'
import {
  AccountSet,
  Payment,
  SignerListSet,
} from 'xrpl-local/models/transactions'
import { convertStringToHex } from 'xrpl-local/utils'
import { multisign } from 'xrpl-local/Wallet/signer'

import * as newPaymentDefinitions from '../fixtures/rippled/definitions-with-massively-diff-payment.json'
import * as newTxDefinitions from '../fixtures/rippled/definitions-with-new-tx-type.json'
import { assertRejects } from '../testUtils'
import { NewTx } from './newTx'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
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
      Account: this.wallet.classicAddress,
      SignerEntries: [
        {
          SignerEntry: {
            Account: signerWallet1.classicAddress,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signerWallet2.classicAddress,
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
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const { tx_blob: tx_blob1 } = signerWallet1.sign(accountSetTx, true)
    const { tx_blob: tx_blob2 } = signerWallet2.sign(accountSetTx, true)
    const multisignedTx = multisign([tx_blob1, tx_blob2])
    const submitResponse = await client.submit(multisignedTx)
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    await verifySubmittedTransaction(this.client, multisignedTx)
  })

  it('submitting an invalid transaction with proper custom types should send, but be rejected by rippled', async function () {
    const client: Client = this.client
    const wallet1 = await generateFundedWallet(client)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: wallet1.address,
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Amount: '20000000',
      Sequence: 1,
      Fee: '12',
    }

    const newDefs = new XrplDefinitions(newPaymentDefinitions, coreTypes)

    // It should successfully submit, but fail once rippled sees it since the new type definition is not on-ledger.
    await assertRejects(
      client.submit(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )

    // Same for submitAndWait
    await assertRejects(
      client.submitAndWait(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )
  })

  it('Defining a new TransactionType should compile and run', async function () {
    const newDefs = new XrplDefinitions(newTxDefinitions, coreTypes)

    const tx: NewTx = {
      TransactionType: 'NewTx',
      Account: 'Test',
      Amount: '100',
    }

    const client: Client = this.client
    const wallet1 = await generateFundedWallet(client)

    await assertRejects(
      client.submitAndWait(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )
  })
})
