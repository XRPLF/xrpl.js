import fs from 'fs'
import path from 'path'

import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { OfferCreate, Transaction, ValidationError } from 'xrpl-local'
import {
  hashStateTree,
  hashTxTree,
  hashTrustline,
  hashEscrow,
  hashPaymentChannel,
  hashSignedTx,
  hashAccountRoot,
  hashOfferId,
  hashSignerListId,
} from 'xrpl-local/utils/hashes'

import fixtures from '../fixtures/rippled'
import { assertResultMatch } from '../testUtils'

/**
 * Expects a corresponding ledger dump in $repo/test/fixtures/rippled folder.
 *
 * @param ledgerIndex - The ledger index of the desired dump.
 */
function createLedgerTest(ledgerIndex: number): void {
  const ledgerIndexString = String(ledgerIndex)
  const fileLocation = path.join(
    __dirname,
    '..',
    `fixtures/rippled/ledgerFull${ledgerIndex}.json`,
  )

  // eslint-disable-next-line node/no-sync -- must be sync version when not in async method
  const ledgerRaw = fs.readFileSync(fileLocation, { encoding: 'utf8' })
  const ledgerJSON = JSON.parse(ledgerRaw)

  const hasAccounts =
    Array.isArray(ledgerJSON.accountState) && ledgerJSON.accountState.length > 0

  describe(`ledger hashes ${ledgerIndexString}`, function () {
    if (hasAccounts) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- known to be a string
      it(`has account_hash of ${ledgerJSON.account_hash}`, function () {
        assert.equal(
          ledgerJSON.account_hash,
          hashStateTree(ledgerJSON.accountState),
        )
      })
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- known to be a string
    it(`has transaction_hash of ${ledgerJSON.transaction_hash}`, function () {
      assert.equal(
        ledgerJSON.transaction_hash,
        hashTxTree(ledgerJSON.transactions),
      )
    })
  })
}

describe('Hashes', function () {
  // This is the first recorded ledger with a non empty transaction set
  // eslint-disable-next-line mocha/no-setup-in-describe -- runs tests
  createLedgerTest(38129)
  // Because, why not.
  // eslint-disable-next-line mocha/no-setup-in-describe -- runs tests
  createLedgerTest(40000)
  // 1311 AffectedNodes, no accounts
  // eslint-disable-next-line mocha/no-setup-in-describe -- runs tests
  createLedgerTest(7501326)

  it('calcAccountRootEntryHash', function () {
    const account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const expectedEntryHash =
      '2B6AC232AA4C4BE41BF49D2459FA4A0347E1B543A4C92FCEE0821C0201E2E9A8'
    const actualEntryHash = hashAccountRoot(account)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcRippleStateEntryHash', function () {
    const account1 = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const account2 = 'rB5TihdPbKgMrkFqrqUC3yLdE8hhv4BdeY'
    const currency = 'USD'

    const expectedEntryHash =
      'C683B5BB928F025F1E860D9D69D6C554C2202DE0D45877ADB3077DA4CB9E125C'
    const actualEntryHash1 = hashTrustline(account1, account2, currency)
    const actualEntryHash2 = hashTrustline(account2, account1, currency)

    assert.equal(actualEntryHash1, expectedEntryHash)
    assert.equal(actualEntryHash2, expectedEntryHash)
  })

  it('will calculate the RippleState entry hash for r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV and rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj in UAM', function () {
    const account1 = 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'
    const account2 = 'rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj'
    const currency = 'UAM'

    const expectedEntryHash =
      'AE9ADDC584358E5847ADFC971834E471436FC3E9DE6EA1773DF49F419DC0F65E'
    const actualEntryHash1 = hashTrustline(account1, account2, currency)
    const actualEntryHash2 = hashTrustline(account2, account1, currency)

    assert.equal(actualEntryHash1, expectedEntryHash)
    assert.equal(actualEntryHash2, expectedEntryHash)
  })

  it('calcOfferEntryHash', function () {
    const account = 'r32UufnaCGL82HubijgJGDmdE5hac7ZvLw'
    const sequence = 137
    const expectedEntryHash =
      '03F0AED09DEEE74CEF85CD57A0429D6113507CF759C597BABB4ADB752F734CE3'
    const actualEntryHash = hashOfferId(account, sequence)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('hashSignerListId', function () {
    const account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const expectedEntryHash =
      '778365D5180F5DF3016817D1F318527AD7410D83F8636CF48C43E8AF72AB49BF'
    const actualEntryHash = hashSignerListId(account)
    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcEscrowEntryHash', function () {
    const account = 'rDx69ebzbowuqztksVDmZXjizTd12BVr4x'
    const sequence = 84
    const expectedEntryHash =
      '61E8E8ED53FA2CEBE192B23897071E9A75217BF5A410E9CB5B45AAB7AECA567A'
    const actualEntryHash = hashEscrow(account, sequence)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcPaymentChannelEntryHash', function () {
    const account = 'rDx69ebzbowuqztksVDmZXjizTd12BVr4x'
    const dstAccount = 'rLFtVprxUEfsH54eCWKsZrEQzMDsx1wqso'
    const sequence = 82
    const expectedEntryHash =
      'E35708503B3C3143FB522D749AAFCC296E8060F0FB371A9A56FAE0B1ED127366'
    const actualEntryHash = hashPaymentChannel(account, dstAccount, sequence)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('Hash a signed transaction correctly', function () {
    const expected_hash =
      '458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2'

    assertResultMatch(
      hashSignedTx(fixtures.tx.OfferCreateSell.result as Transaction),
      expected_hash,
    )
  })

  it('Hash a signed transaction blob correctly', function () {
    const expected_hash =
      '458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2'

    assertResultMatch(
      hashSignedTx(encode(fixtures.tx.OfferCreateSell.result)),
      expected_hash,
    )
  })

  it('Throw an error when hashing an unsigned transaction', function () {
    const offerCreateWithNoSignature: OfferCreate = {
      ...(fixtures.tx.OfferCreateSell.result as OfferCreate),
      TxnSignature: undefined,
    }

    assert.throws(
      () => hashSignedTx(offerCreateWithNoSignature),
      ValidationError,
    )
  })

  it('Throw when hashing an unsigned transaction blob', function () {
    const encodedOfferCreateWithNoSignature: string = encode({
      ...fixtures.tx.OfferCreateSell.result,
      TxnSignature: undefined,
    })

    assert.throws(
      () => hashSignedTx(encodedOfferCreateWithNoSignature),
      ValidationError,
    )
  })
})
