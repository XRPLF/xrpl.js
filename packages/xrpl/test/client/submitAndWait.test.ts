import { assert } from 'chai'

import { XrplError } from '../../src'
import { Transaction } from '../../src/models/transactions'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

describe('client.submitAndWait', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

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

  it('should exit early with a tem error', async function () {
    const signedTx = { ...signedTransaction }

    testContext.mockRippled!.addResponse('submit', rippled.submit.temError)

    await assertRejects(
      testContext.client.submitAndWait(signedTx),
      XrplError,
      'Transaction failed, temMALFORMED: Malformed transaction.',
    )
  })

  it('handles malformed UTF-8 text while polling tx', async function () {
    const signedTx = {
      ...signedTransaction,
      LastLedgerSequence: 9999999,
    }
    let txPollCount = 0

    testContext.mockRippled!.addResponse('submit', rippled.submit.success)
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
    testContext.mockRippled!.addResponse('tx', (request) => {
      txPollCount += 1

      if (txPollCount === 1) {
        return {
          type: 'response',
          status: 'error',
          error: 'txnNotFound',
          request,
        }
      }

      // Build a response with a malformed UTF-8 byte (0xff) embedded in a JSON key
      const prefix = `{"type":"response","status":"success","id":${JSON.stringify(request.id)},"result":{"validated":true,"tx_json":${JSON.stringify(signedTx)},"meta":{"AffectedNodes":[{"ModifiedNode":{"FinalFields":{"ContractJson":{"allowances":{"`
      const suffix = `":"500"}}},"LedgerEntryType":"ContractData"}}]}}}`

      return {
        payload: Buffer.concat([
          Buffer.from(prefix),
          Buffer.from([0xff]),
          Buffer.from(suffix),
        ]),
        binary: false,
      }
    })

    const response = await testContext.client.submitAndWait(signedTx)
    const meta = response.result.meta as unknown as Record<string, unknown>
    const node = (meta.AffectedNodes as Array<Record<string, unknown>>)[0]
    const modified = node.ModifiedNode as Record<string, unknown>
    const fields = modified.FinalFields as Record<string, unknown>
    const contract = fields.ContractJson as Record<string, unknown>
    const allowances = contract.allowances as Record<string, string>
    const [key] = Object.keys(allowances)

    assert.strictEqual(txPollCount, 2)
    assert.isTrue(response.result.validated)
    assert.strictEqual(allowances[key], '500')
    assert.include(key, '�')
  })
})
