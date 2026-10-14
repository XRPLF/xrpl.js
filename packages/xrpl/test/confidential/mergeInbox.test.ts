import { assert } from 'chai'

import { prepareConfidentialMergeInbox } from '../../src/confidential'

import { ADDR_A, ISSUANCE_ID, mockClient } from './helpers'

describe('confidential/prepareConfidentialMergeInbox', function () {
  it('builds a MergeInbox with the pinned sequence and no crypto material', async function () {
    const tx = await prepareConfidentialMergeInbox(mockClient({}), {
      account: ADDR_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })
    assert.deepEqual(tx, {
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: ADDR_A,
      Sequence: 5,
      MPTokenIssuanceID: ISSUANCE_ID,
    })
  })

  it('resolves the sequence from the ledger when omitted', async function () {
    const tx = await prepareConfidentialMergeInbox(
      mockClient({ sequence: 9 }),
      {
        account: ADDR_A,
        mptIssuanceID: ISSUANCE_ID,
      },
    )
    assert.strictEqual(tx.Sequence, 9)
  })
})
