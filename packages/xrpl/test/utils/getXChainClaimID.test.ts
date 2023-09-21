import { assert } from 'chai'

import { getXChainClaimID } from '../../src'
import fixtures from '../fixtures/rippled'

describe('getXChainClaimID', function () {
  it('decode a valid NFTokenID', function () {
    const result = getXChainClaimID(fixtures.tx.XChainCreateClaimID.meta)
    const expectedXChainClaimID = 'b0'
    assert.equal(result, expectedXChainClaimID)
  })

  it('decode a different valid NFTokenID', function () {
    const result = getXChainClaimID(fixtures.tx.XChainCreateClaimID2.meta)
    const expectedXChainClaimID =
      '0008125CBE4B401B2F62ED35CC67362165AA813CCA06316FFA766254000003EE'
    assert.equal(result, expectedXChainClaimID)
  })

  it('fails with nice error when given raw response instead of meta', function () {
    assert.throws(() => {
      // @ts-expect-error -- on purpose, to check the error
      const _ = getXChainClaimID(fixtures.tx.XChainCreateClaimID)
    }, /^Unable to parse the parameter given to getXChainClaimID.*/u)
  })
})
