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

  it(`throws w/ maximum of 32 members allowed in SignerEntries`, function () {
    signerListSetTx.SignerEntries = []
    const accounts = [
      'rBFBipte4nAQCTsRxd2czwvSurhCpAf4X6',
      'r3ijUH32iiy9tYNj3rD7hKWYjy1BFUxngm',
      'rpwq8vi4Mn3L5kDJmb8Mg59CanPFPzMCnj',
      'rB72Gzqfejai46nkA4HaKYBHwAnn2yUoT4',
      'rGqsJSAW71pCfUwDD5m52bLw69RzFg6kMW',
      'rs8smPRA31Ym4mGxb1wzgwxtU5eVK82Gyk',
      'rLrugpGxzezUQLDh7Jv1tZpouuV4MQLbU9',
      'rUQ6zLXQdh1jJLGwMXp9P8rgi42kwuafzs',
      'rMjY8sPdfxsyRrnVKQcutxr4mTHNXy9dEF',
      'rUaxYLeFGm6SmMoa2WCqLKSyHwJyvaQmeG',
      'r9wUfeVtqMfqrcDTfCpNYbNZvs5q9M9Rpo',
      'rQncVNak5kvJGPUFa6fuKH7t8Usjs7Np1c',
      'rnwbSSnPbVbUzuBa4etkeYrfy5v7SyhtPu',
      'rDXh5D3t48MdBJyXByXq47k5P8Kuf1758B',
      'rh1D4jd2mAiqUPHfAZ2cY9Nbfa3kAkaQXP',
      'r9T129tXgtnyfGoLeS35c2HctaZAZSQoCH',
      'rUd2uKsyCWfJP7Ve36mKoJbNCA7RYThnYk',
      'r326x8PaAFtnaH7uoxaKrcDWuwpeHn4wDa',
      'rpN3mkXkYhfNadcXPrY4LniM1KpM3egyQM',
      'rsPKbR155hz1zrA4pSJp5Y2fxasZAatcHb',
      'rsyWFLaEKTpaoSJusjpcDvGexuHCwMnqss',
      'rUbc5RXfyF81oLDMgd3d7jpY9YMNMZG4XN',
      'rGpYHM88BZe1iVKFHm5xiWYYxR74oxJEXf',
      'rPsetWAtR1KxDtxzgHjRMD7Rc87rvXk5nD',
      'rwSeNhL6Hi34igr12mCr61jY42psfTkWTq',
      'r46Mygy98qjkDhVB6qs4sBnqaf7FPiA2vU',
      'r4s8GmeYN4CiwVate1nMUvwMQbundqf5cW',
      'rKAr4dQWDYG8cG2hSwJUVp4ry4WNaWiNgp',
      'rPWXRLp1vqeUHEH3WiSKuyo9GM9XhaENQU',
      'rPgmdBdRKGmndxNEYxUrrsYCZaS6go9RvW',
      'rPDJZ9irzgwKRKScfEmuJMvUgrqZAJNCbL',
      'rDuU2uSXMfEaoxN1qW8sj7aUNFLGEn3Hr2',
      'rsbjSjA4TCB9gtm7x7SrWbZHB6g4tt9CGU',
    ]
    signerListSetTx.SignerQuorum = accounts.length
    for (const acc of accounts) {
      signerListSetTx.SignerEntries.push({
        SignerEntry: {
          Account: acc,
          SignerWeight: 1,
        },
      })
    }

    const errorMessage =
      'SignerListSet: maximum of 32 members allowed in SignerEntries'
    assert.throws(
      () => validateSignerListSet(signerListSetTx),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(signerListSetTx),
      ValidationError,
      errorMessage,
    )
  })

  it(`verifies valid WalletLocator in SignerEntries`, function () {
    signerListSetTx.SignerQuorum = 3
    signerListSetTx.SignerEntries = [
      {
        SignerEntry: {
          Account: 'rBFBipte4nAQCTsRxd2czwvSurhCpAf4X6',
          SignerWeight: 1,
          WalletLocator:
            'CAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE',
        },
      },
      {
        SignerEntry: {
          Account: 'r3ijUH32iiy9tYNj3rD7hKWYjy1BFUxngm',
          SignerWeight: 1,
        },
      },
      {
        SignerEntry: {
          Account: 'rpwq8vi4Mn3L5kDJmb8Mg59CanPFPzMCnj',
          SignerWeight: 1,
          WalletLocator:
            '00000000000000000000000000000000000000000000000000000000DEADBEEF',
        },
      },
    ]

    assert.doesNotThrow(() => validateSignerListSet(signerListSetTx))
    assert.doesNotThrow(() => validate(signerListSetTx))
  })

  it(`throws w/ invalid WalletLocator in SignerEntries`, function () {
    signerListSetTx.SignerQuorum = 2
    signerListSetTx.SignerEntries = [
      {
        SignerEntry: {
          Account: 'rBFBipte4nAQCTsRxd2czwvSurhCpAf4X6',
          SignerWeight: 1,
          WalletLocator: 'not_valid',
        },
      },
      {
        SignerEntry: {
          Account: 'r3ijUH32iiy9tYNj3rD7hKWYjy1BFUxngm',
          SignerWeight: 1,
        },
      },
    ]
    const errorMessage =
      'SignerListSet: WalletLocator in SignerEntry must be a 256-bit (32-byte) hexadecimal value'
    assert.throws(
      () => validateSignerListSet(signerListSetTx),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(signerListSetTx),
      ValidationError,
      errorMessage,
    )
  })
})
