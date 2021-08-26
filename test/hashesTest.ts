import {assert} from 'chai'
import fs from 'fs'
import {OfferCreate} from "../src/models/transactions"
import {assertResultMatch} from './testUtils'
import fixtures from './fixtures/rippled'
import {ValidationError} from 'xrpl-local/common/errors'
import {
  computeStateTreeHash,
  computeTransactionTreeHash,
  computeTrustlineHash,
  computeEscrowHash,
  computePaymentChannelHash,
  computeSignedTransactionHash,
  computeAccountRootIndex,
  computeOfferIndex,
  computeSignerListIndex
} from "../src/utils/hashes"
import { encode } from 'ripple-binary-codec'

/**
 * Expects a corresponding ledger dump in $repo/test/fixtures/rippled folder
 */
function createLedgerTest(ledgerIndex: number) {
  describe(String(ledgerIndex), function () {
    var path =
      __dirname + '/fixtures/rippled/ledgerFull' + ledgerIndex + '.json'

    var ledgerRaw = fs.readFileSync(path, {encoding: 'utf8'})
    var ledgerJSON = JSON.parse(ledgerRaw)

    var hasAccounts =
      Array.isArray(ledgerJSON.accountState) &&
      ledgerJSON.accountState.length > 0

    if (hasAccounts) {
      it('has account_hash of ' + ledgerJSON.account_hash, function () {
        assert.equal(
          ledgerJSON.account_hash,
          computeStateTreeHash(ledgerJSON.accountState)
        )
      })
    }
    it('has transaction_hash of ' + ledgerJSON.transaction_hash, function () {
      assert.equal(
        ledgerJSON.transaction_hash,
        computeTransactionTreeHash(ledgerJSON.transactions)
      )
    })
  })
}

describe('Ledger', function () {
  // This is the first recorded ledger with a non empty transaction set
  createLedgerTest(38129)
  // Because, why not.
  createLedgerTest(40000)
  // 1311 AffectedNodes, no accounts
  createLedgerTest(7501326)

  it('calcAccountRootEntryHash', function () {
    var account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    var expectedEntryHash =
      '2B6AC232AA4C4BE41BF49D2459FA4A0347E1B543A4C92FCEE0821C0201E2E9A8'
    var actualEntryHash = computeAccountRootIndex(account)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcRippleStateEntryHash', function () {
    var account1 = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    var account2 = 'rB5TihdPbKgMrkFqrqUC3yLdE8hhv4BdeY'
    var currency = 'USD'

    var expectedEntryHash =
      'C683B5BB928F025F1E860D9D69D6C554C2202DE0D45877ADB3077DA4CB9E125C'
    var actualEntryHash1 = computeTrustlineHash(
      account1,
      account2,
      currency
    )
    var actualEntryHash2 = computeTrustlineHash(
      account2,
      account1,
      currency
    )

    assert.equal(actualEntryHash1, expectedEntryHash)
    assert.equal(actualEntryHash2, expectedEntryHash)
  })

  it('will calculate the RippleState entry hash for r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV and rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj in UAM', function () {
    var account1 = 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'
    var account2 = 'rUAMuQTfVhbfqUDuro7zzy4jj4Wq57MPTj'
    var currency = 'UAM'

    var expectedEntryHash =
      'AE9ADDC584358E5847ADFC971834E471436FC3E9DE6EA1773DF49F419DC0F65E'
    var actualEntryHash1 = computeTrustlineHash(
      account1,
      account2,
      currency
    )
    var actualEntryHash2 = computeTrustlineHash(
      account2,
      account1,
      currency
    )

    assert.equal(actualEntryHash1, expectedEntryHash)
    assert.equal(actualEntryHash2, expectedEntryHash)
  })

  it('calcOfferEntryHash', function () {
    var account = 'r32UufnaCGL82HubijgJGDmdE5hac7ZvLw'
    var sequence = 137
    var expectedEntryHash =
      '03F0AED09DEEE74CEF85CD57A0429D6113507CF759C597BABB4ADB752F734CE3'
    var actualEntryHash = computeOfferIndex(account, sequence)

    assert.equal(actualEntryHash, expectedEntryHash)
  })
  

  it('computeSignerListIndex', function () {
    var account = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    var expectedEntryHash =
      '778365D5180F5DF3016817D1F318527AD7410D83F8636CF48C43E8AF72AB49BF'
    var actualEntryHash = computeSignerListIndex(account)
    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcEscrowEntryHash', function () {
    var account = 'rDx69ebzbowuqztksVDmZXjizTd12BVr4x'
    var sequence = 84
    var expectedEntryHash =
      '61E8E8ED53FA2CEBE192B23897071E9A75217BF5A410E9CB5B45AAB7AECA567A'
    var actualEntryHash = computeEscrowHash(account, sequence)

    assert.equal(actualEntryHash, expectedEntryHash)
  })

  it('calcPaymentChannelEntryHash', function () {
    var account = 'rDx69ebzbowuqztksVDmZXjizTd12BVr4x'
    var dstAccount = 'rLFtVprxUEfsH54eCWKsZrEQzMDsx1wqso'
    var sequence = 82
    var expectedEntryHash =
      'E35708503B3C3143FB522D749AAFCC296E8060F0FB371A9A56FAE0B1ED127366'
    var actualEntryHash = computePaymentChannelHash(
      account,
      dstAccount,
      sequence
    )

    assert.equal(actualEntryHash, expectedEntryHash)
  })
    
  it('Hash a signed transaction correctly', () => {
      const expected_hash = (
          "458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2"
      )

      assertResultMatch(computeSignedTransactionHash(fixtures.tx.OfferCreateSell.result), expected_hash)
  })

  it('Hash a signed transaction blob correctly', () => {
    const expected_hash = (
        "458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2"
    )

    assertResultMatch(computeSignedTransactionHash(
      encode(fixtures.tx.OfferCreateSell.result))
      , expected_hash
    )
  })

  it('Throw an error when hashing an unsigned transaction', () => {
      const offerCreateWithNoSignature: OfferCreate = {
        ...fixtures.tx.OfferCreateSell.result, 
        TxnSignature: undefined
      }
      
      assert.throws(() => computeSignedTransactionHash(offerCreateWithNoSignature), ValidationError)
  })

  it('Throw when hashing an unsigned transaction blob', () => {
    const encodedOfferCreateWithNoSignature: string = encode({
      ...fixtures.tx.OfferCreateSell.result, 
      TxnSignature: undefined
    })

    assert.throws(() => computeSignedTransactionHash(encodedOfferCreateWithNoSignature), ValidationError)
  })
})
