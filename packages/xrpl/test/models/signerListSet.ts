import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateSignerListSet } from 'xrpl-local/models/transactions/signerListSet'

/**
 * SignerListSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SignerListSet', function () {
  let signerListSetTx

  beforeEach(function () {
    signerListSetTx = {
      Flags: 0,
      TransactionType: 'SignerListSet',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      SignerQuorum: 3,
      SignerEntries: [
        {
          SignerEntry: {
            Account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
            SignerWeight: 2,
          },
        },
        {
          SignerEntry: {
            Account: 'rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v',
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n',
            SignerWeight: 1,
          },
        },
      ],
    } as any
  })

  it(`verifies valid SignerListSet`, function () {
    assert.doesNotThrow(() => validateSignerListSet(signerListSetTx))
    assert.doesNotThrow(() => validate(signerListSetTx))
  })

  it(`throws w/ missing SignerQuorum`, function () {
    signerListSetTx.SignerQuorum = undefined

    assert.throws(
      () => validateSignerListSet(signerListSetTx),
      ValidationError,
      'SignerListSet: missing field SignerQuorum',
    )
    assert.throws(
      () => validate(signerListSetTx),
      ValidationError,
      'SignerListSet: missing field SignerQuorum',
    )
  })

  it(`throws w/ empty SignerEntries`, function () {
    signerListSetTx.SignerEntries = []

    assert.throws(
      () => validateSignerListSet(signerListSetTx),
      ValidationError,
      'SignerListSet: need atleast 1 member in SignerEntries',
    )
    assert.throws(
      () => validate(signerListSetTx),
      ValidationError,
      'SignerListSet: need atleast 1 member in SignerEntries',
    )
  })

  it(`throws w/ invalid SignerEntries`, function () {
    signerListSetTx.SignerEntries = 'khgfgyhujk'

    assert.throws(
      () => validateSignerListSet(signerListSetTx),
      ValidationError,
      'SignerListSet: invalid SignerEntries',
    )
    assert.throws(
      () => validate(signerListSetTx),
      ValidationError,
      'SignerListSet: invalid SignerEntries',
    )
  })
})
