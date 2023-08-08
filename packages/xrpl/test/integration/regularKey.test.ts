import { assert } from 'chai'

import {
  AccountSet,
  Client,
  SignerListSet,
  SetRegularKey,
  Wallet,
  AccountSetAsfFlags,
  OfferCreate,
  ECDSA,
} from '../../src'
import { convertStringToHex } from '../../src/utils'
import { multisign } from '../../src/Wallet/signer'

import serverUrl from './serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from './setup'
import {
  generateFundedWallet,
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
} from './utils'

// how long before each test case times out
const TIMEOUT = 20000

async function generateFundedWalletWithRegularKey(
  client: Client,
  disableMasterKey = false,
): Promise<{ masterWallet: Wallet; regularKeyWallet: Wallet }> {
  const regularKeyInfo = {
    seed: 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
    accountId: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  }

  const masterWallet = await generateFundedWallet(client)

  const regularKeyWallet = Wallet.fromSeed(regularKeyInfo.seed, {
    masterAddress: masterWallet.address,
    algorithm: ECDSA.secp256k1,
  })

  const setRegularTx: SetRegularKey = {
    TransactionType: 'SetRegularKey',
    Account: masterWallet.address,
    RegularKey: regularKeyInfo.accountId,
  }

  // Add a regular key to the first account
  await client.submit(setRegularTx, { wallet: masterWallet })

  if (disableMasterKey) {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: masterWallet.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDisableMaster,
    }

    await testTransaction(client, accountSet, masterWallet)
  }

  return { masterWallet, regularKeyWallet }
}

describe('regular key', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'sign and submit with a regular key',
    async () => {
      const regularKeyWallet = (
        await generateFundedWalletWithRegularKey(testContext.client)
      ).regularKeyWallet

      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: regularKeyWallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }

      await testTransaction(testContext.client, accountSet, regularKeyWallet)
    },
    TIMEOUT,
  )

  it(
    'sign and submit using the master key of an account with a regular key',
    async () => {
      const masterWallet = (
        await generateFundedWalletWithRegularKey(testContext.client)
      ).masterWallet

      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: masterWallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }

      await testTransaction(testContext.client, accountSet, masterWallet)
    },
    TIMEOUT,
  )

  it(
    'try to sign with master key after disabling',
    async () => {
      const masterWallet = (
        await generateFundedWalletWithRegularKey(testContext.client, true)
      ).masterWallet

      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: masterWallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: masterWallet.classicAddress,
          value: '10',
        },
      }

      const client: Client = testContext.client
      const response = await client.submit(tx, { wallet: masterWallet })
      assert.equal(
        response.result.engine_result,
        'tefMASTER_DISABLED',
        'Master key was disabled, yet the master key still was able to sign and submit a transaction',
      )
    },
    TIMEOUT,
  )

  it(
    'sign with regular key after disabling the master key',
    async () => {
      const regularKeyWallet = (
        await generateFundedWalletWithRegularKey(testContext.client, true)
      ).regularKeyWallet

      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: regularKeyWallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: regularKeyWallet.classicAddress,
          value: '10',
        },
      }

      await testTransaction(testContext.client, tx, regularKeyWallet)
    },
    TIMEOUT,
  )

  it(
    'try to enable and disable a regular key',
    async () => {
      const wallets = await generateFundedWalletWithRegularKey(
        testContext.client,
        true,
      )
      const masterWallet = wallets.masterWallet
      const regularKeyWallet = wallets.regularKeyWallet

      const enableMasterKey: AccountSet = {
        TransactionType: 'AccountSet',
        Account: masterWallet.classicAddress,
        ClearFlag: AccountSetAsfFlags.asfDisableMaster,
      }

      const client: Client = testContext.client
      const response = await client.submit(enableMasterKey, {
        wallet: masterWallet,
      })
      assert.equal(
        response.result.engine_result,
        'tefMASTER_DISABLED',
        'Master key was disabled, yet the master key still was able to sign and submit a transaction',
      )

      await testTransaction(client, enableMasterKey, regularKeyWallet)

      const turnOffRegularKey: SetRegularKey = {
        TransactionType: 'SetRegularKey',
        Account: masterWallet.address,
      }

      await testTransaction(testContext.client, turnOffRegularKey, masterWallet)

      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: regularKeyWallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: regularKeyWallet.classicAddress,
          value: '10',
        },
      }

      const response2 = await client.submit(tx, { wallet: regularKeyWallet })
      assert.equal(
        response2.result.engine_result,
        'tefBAD_AUTH',
        'Regular key should have been disabled, but somehow was still able to sign and submit a transaction.',
      )
    },
    TIMEOUT,
  )

  it(
    'submit_multisigned transaction with regular keys set',
    async () => {
      const client: Client = testContext.client

      const regularKeyWallet = (
        await generateFundedWalletWithRegularKey(client)
      ).regularKeyWallet
      const signerWallet2 = await generateFundedWallet(testContext.client)

      // set up the multisigners for the account
      const signerListSet: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: regularKeyWallet.classicAddress,
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
      await testTransaction(
        testContext.client,
        signerListSet,
        testContext.wallet,
      )

      // try to multisign
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const accountSetTx = await client.autofill(accountSet, 2)
      const signed1 = regularKeyWallet.sign(accountSetTx, true)
      const signed2 = signerWallet2.sign(accountSetTx, true)
      const multisigned = multisign([signed1.tx_blob, signed2.tx_blob])
      const submitResponse = await client.submit(multisigned)
      await ledgerAccept(client)

      assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
      await verifySubmittedTransaction(testContext.client, multisigned)
    },
    TIMEOUT,
  )

  it(
    'try multisigning with the account address used to set up a regular key',
    async () => {
      const client: Client = testContext.client

      const regularKeyWallet = (
        await generateFundedWalletWithRegularKey(client)
      ).regularKeyWallet
      const signerWallet2 = await generateFundedWallet(testContext.client)

      const sameKeyDefaultAddressWallet = new Wallet(
        regularKeyWallet.publicKey,
        regularKeyWallet.privateKey,
      )

      // set up the multisigners for the account
      const signerListSet: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: regularKeyWallet.classicAddress,
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
      await testTransaction(
        testContext.client,
        signerListSet,
        testContext.wallet,
      )

      // try to multisign
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const accountSetTx = await client.autofill(accountSet, 2)
      const signed1 = sameKeyDefaultAddressWallet.sign(accountSetTx, true)
      const signed2 = signerWallet2.sign(accountSetTx, true)
      const multisigned = multisign([signed1.tx_blob, signed2.tx_blob])
      const submitResponse = await client.submit(multisigned)
      await ledgerAccept(client)
      assert.strictEqual(
        submitResponse.result.engine_result,
        'tefBAD_SIGNATURE',
      )
    },
    TIMEOUT,
  )
})
