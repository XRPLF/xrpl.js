import { FirewallSet } from '../../src/models/transactions'
import { validateFirewallSet } from '../../src/models/transactions/firewallSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateFirewallSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateFirewallSet, message)

const ACCOUNT = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
const COUNTERPARTY = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
const BACKUP = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
const FIREWALL_ID =
  'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321'
const SIGNING_PUB_KEY =
  'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A'

/**
 * FirewallSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('FirewallSet', function () {
  let createTx: FirewallSet
  let updateTx: FirewallSet

  beforeEach(function () {
    createTx = {
      TransactionType: 'FirewallSet',
      Account: ACCOUNT,
      Counterparty: COUNTERPARTY,
      Backup: BACKUP,
      DestinationTag: 7,
      MaxFee: '1000',
    }
    updateTx = {
      TransactionType: 'FirewallSet',
      Account: ACCOUNT,
      FirewallID: FIREWALL_ID,
      Counterparty: BACKUP,
      MaxFee: '0',
      CounterpartySignature: {
        SigningPubKey: SIGNING_PUB_KEY,
        TxnSignature: 'DEADBEEF',
      },
    }
  })

  it('verifies a valid FirewallSet that creates a firewall', function () {
    assertValid(createTx)
  })

  it('verifies a valid FirewallSet that updates a firewall', function () {
    assertValid(updateTx)
  })

  it('verifies an update signed by a multi-signing counterparty', function () {
    updateTx.CounterpartySignature = {
      Signers: [
        {
          Signer: {
            Account: COUNTERPARTY,
            SigningPubKey: SIGNING_PUB_KEY,
            TxnSignature: 'DEADBEEF',
          },
        },
      ],
    }
    assertValid(updateTx)
  })

  it('verifies an update with an empty counterparty SigningPubKey', function () {
    updateTx.CounterpartySignature = { SigningPubKey: '' }
    assertValid(updateTx)
  })

  it('verifies the universal flags', function () {
    createTx.Flags = 0x80000000
    assertValid(createTx)
  })

  it('throws w/ an unknown flag', function () {
    createTx.Flags = 0x00010000
    assertInvalid(createTx, 'FirewallSet: invalid Flags')
  })

  it('throws w/ invalid Counterparty', function () {
    // @ts-expect-error for test
    createTx.Counterparty = 123
    assertInvalid(createTx, 'FirewallSet: invalid field Counterparty')
  })

  it('throws w/ invalid Backup', function () {
    createTx.Backup = 'not-an-account'
    assertInvalid(createTx, 'FirewallSet: invalid field Backup')
  })

  it('throws w/ invalid DestinationTag', function () {
    // @ts-expect-error for test
    createTx.DestinationTag = '7'
    assertInvalid(createTx, 'FirewallSet: invalid field DestinationTag')
  })

  it('throws w/ invalid FirewallID', function () {
    updateTx.FirewallID = 'ABCD'
    assertInvalid(updateTx, 'FirewallSet: invalid field FirewallID')
  })

  it('throws w/ invalid CounterpartySignature', function () {
    // @ts-expect-error for test
    updateTx.CounterpartySignature = 'DEADBEEF'
    assertInvalid(updateTx, 'FirewallSet: invalid field CounterpartySignature')
  })

  it('throws w/ a non-XRP MaxFee', function () {
    // @ts-expect-error for test
    createTx.MaxFee = {
      currency: 'USD',
      issuer: COUNTERPARTY,
      value: '1',
    }
    assertInvalid(createTx, 'FirewallSet: invalid field MaxFee')
  })

  it('throws w/ a negative MaxFee', function () {
    createTx.MaxFee = '-1'
    assertInvalid(
      createTx,
      'FirewallSet: MaxFee must be a non-negative XRP amount in drops of at most 100000000000000000',
    )
  })

  it('throws w/ a MaxFee above the XRP supply', function () {
    createTx.MaxFee = '100000000000000001'
    assertInvalid(
      createTx,
      'FirewallSet: MaxFee must be a non-negative XRP amount in drops of at most 100000000000000000',
    )
  })

  describe('create and update rules', function () {
    it('throws w/ a create missing Counterparty', function () {
      delete createTx.Counterparty
      assertInvalid(
        createTx,
        'FirewallSet: Counterparty is required to create a firewall',
      )
    })

    it('throws w/ a create whose Counterparty is the Account', function () {
      createTx.Counterparty = ACCOUNT
      assertInvalid(
        createTx,
        'FirewallSet: Counterparty must not be the Account',
      )
    })

    it('throws w/ a create missing Backup', function () {
      delete createTx.Backup
      assertInvalid(
        createTx,
        'FirewallSet: Backup is required to create a firewall',
      )
    })

    it('throws w/ a create whose Backup is the Account', function () {
      createTx.Backup = ACCOUNT
      assertInvalid(createTx, 'FirewallSet: Backup must not be the Account')
    })

    it('throws w/ a create carrying CounterpartySignature', function () {
      createTx.CounterpartySignature = { SigningPubKey: SIGNING_PUB_KEY }
      assertInvalid(
        createTx,
        'FirewallSet: CounterpartySignature is not allowed to create a firewall',
      )
    })

    it('throws w/ an update carrying Backup', function () {
      updateTx.Backup = BACKUP
      assertInvalid(
        updateTx,
        'FirewallSet: Backup is not allowed to update a firewall',
      )
    })

    it('throws w/ an update whose Counterparty is the Account', function () {
      updateTx.Counterparty = ACCOUNT
      assertInvalid(
        updateTx,
        'FirewallSet: Counterparty must not be the Account',
      )
    })

    it('throws w/ an update missing CounterpartySignature', function () {
      delete updateTx.CounterpartySignature
      assertInvalid(
        updateTx,
        'FirewallSet: CounterpartySignature is required to update a firewall',
      )
    })

    it('throws w/ an update whose counterparty SigningPubKey is not a public key', function () {
      updateTx.CounterpartySignature = { SigningPubKey: `01${'00'.repeat(32)}` }
      assertInvalid(
        updateTx,
        'FirewallSet: CounterpartySignature.SigningPubKey is not a valid public key',
      )
    })
  })
})
