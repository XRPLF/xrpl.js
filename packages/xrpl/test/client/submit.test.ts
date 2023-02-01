import { assert } from 'chai'
import cloneDeep from 'lodash/cloneDeep'

import { ValidationError } from '../../src'
import { Transaction } from '../../src/models/transactions'
import Wallet from '../../src/Wallet'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

describe('client.submit', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  describe('submit unsigned transactions', function () {
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
    const address = 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc'
    const transaction: Transaction = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Amount: '20000000',
      Sequence: 1,
      Fee: '12',
      LastLedgerSequence: 12312,
    }

    it('should submit an unsigned transaction', async function () {
      const tx = cloneDeep(transaction)

      const wallet = new Wallet(publicKey, privateKey)

      testContext.mockRippled!.addResponse(
        'account_info',
        rippled.account_info.normal,
      )
      testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
      testContext.mockRippled!.addResponse(
        'server_info',
        rippled.server_info.normal,
      )
      testContext.mockRippled!.addResponse('submit', rippled.submit.success)

      try {
        const response = await testContext.client.submit(tx, { wallet })
        assert(response.result.engine_result, 'tesSUCCESS')
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- error type thrown can be any
        assert(false, `Did not expect an error to be thrown: ${error}`)
      }
    })

    it('should throw a ValidationError when submitting an unsigned transaction without a wallet', async function () {
      const tx: Transaction = cloneDeep(transaction)
      delete tx.SigningPubKey
      delete tx.TxnSignature

      testContext.mockRippled!.addResponse('submit', rippled.submit.success)

      await assertRejects(
        testContext.client.submit(tx),
        ValidationError,
        'Wallet must be provided when submitting an unsigned transaction',
      )
    })
  })

  describe('submit signed transactions', function () {
    const signedTransaction: Transaction = {
      TransactionType: 'Payment',
      Sequence: 1,
      LastLedgerSequence: 12312,
      Amount: '20000000',
      Fee: '12',
      SigningPubKey:
        '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D',
      TxnSignature:
        '3045022100B3D311371EDAB371CD8F2B661A04B800B61D4B132E09B7B0712D3B2F11B1758302203906B44C4A150311D74FF6A35B146763C0B5B40AC30BD815113F058AA17B3E63',
      Account: 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc',
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
    }

    it('should submit a signed transaction', async function () {
      const signedTx = { ...signedTransaction }

      testContext.mockRippled!.addResponse('submit', rippled.submit.success)

      try {
        const response = await testContext.client.submit(signedTx)
        assert(response.result.engine_result, 'tesSUCCESS')
      } catch (_error) {
        assert(false, 'Did not expect an error to be thrown')
      }
    })

    it("should submit a signed transaction that's already encoded", async function () {
      const signedTxEncoded =
        '1200002400000001201B00003018614000000001312D0068400000000000000C7321030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D74473045022100B3D311371EDAB371CD8F2B661A04B800B61D4B132E09B7B0712D3B2F11B1758302203906B44C4A150311D74FF6A35B146763C0B5B40AC30BD815113F058AA17B3E6381142AF1861DEC1316AEEC995C94FF9E2165B1B784608314FDB08D07AAA0EB711793A3027304D688E10C3648'

      testContext.mockRippled!.addResponse('submit', rippled.submit.success)

      try {
        const response = await testContext.client.submit(signedTxEncoded)
        assert(response.result.engine_result, 'tesSUCCESS')
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- error type thrown can be any
        assert(false, `Did not expect an error to be thrown: ${error}`)
      }
    })
  })
})
