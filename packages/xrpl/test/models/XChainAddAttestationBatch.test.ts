import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateXChainAddAttestationBatch } from 'xrpl-local/models/transactions/XChainAddAttestationBatch'

/**
 * XChainAddAttestationBatch Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainAddAttestationBatch', function () {
  let tx

  beforeEach(function () {
    tx = {
      Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 1,
      SigningPubKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      TransactionType: 'XChainAddAttestationBatch',
      TxnSignature:
        '304502210098F47661D8EF89CC2DFF3EAA92AF3843CEFD398EAD1E7496FAEAC269DE688FB80220143EBE519FC1936E884B1AFA047D4CB7CD2E2A28F0B27EC982D1BB3E63FC9535',
      XChainAttestationBatch: {
        XChainBridge: {
          IssuingChainDoor: 'rKeSSvHvaMZJp9ykaxutVwkhZgWuWMLnQt',
          IssuingChainIssue: { currency: 'XRP' },
          LockingChainDoor: 'rJvExveLEL4jNDEeLKCVdxaSCN9cEBnEQC',
          LockingChainIssue: { currency: 'XRP' },
        },
        XChainClaimAttestationBatch: [],
        XChainCreateAccountAttestationBatch: [
          {
            XChainCreateAccountAttestationBatchElement: {
              Account: 'rnJmYAiqEVngtnb5ckRroXLtCbWC7CRUBx',
              Amount: '1000000000',
              AttestationRewardAccount: 'rEziJZmeZzsJvGVUmpUTey7qxQLKYxaK9f',
              Destination: 'rKT9gDkaedAosiHyHZTjyZs2HvXpzuiGmC',
              PublicKey:
                '03ADB44CA8E56F78A0096825E5667C450ABD5C24C34E027BC1AAF7E5BD114CB5B5',
              Signature:
                '3044022036C8B90F85E8073C465F00625248A72D4714600F98EBBADBAD3B7ED226109A3A02204C5A0AE12D169CF790F66541F3DB59C289E0D99CA7511FDFE352BB601F667A26',
              SignatureReward: '1000000',
              WasLockingChainSend: 1,
              XChainAccountCreateCount: '0000000000000001',
            },
          },
        ],
      },
    }
  })

  it(`verifies valid XChainAddAttestationBatch`, function () {
    assert.doesNotThrow(() => validateXChainAddAttestationBatch(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainAttestationBatch`, function () {
    delete tx.XChainAttestationBatch

    assert.throws(
      () => validateXChainAddAttestationBatch(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch',
    )
  })

  it(`throws w/ missing XChainBridge`, function () {
    delete tx.XChainAttestationBatch.XChainBridge

    assert.throws(
      () => validateXChainAddAttestationBatch(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainBridge',
    )
  })

  it(`throws w/ missing XChainClaimAttestationBatch`, function () {
    delete tx.XChainAttestationBatch.XChainClaimAttestationBatch

    assert.throws(
      () => validateXChainAddAttestationBatch(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainClaimAttestationBatch',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainClaimAttestationBatch',
    )
  })

  it(`throws w/ missing XChainCreateAccountAttestationBatch`, function () {
    delete tx.XChainAttestationBatch.XChainCreateAccountAttestationBatch

    assert.throws(
      () => validateXChainAddAttestationBatch(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainCreateAccountAttestationBatch',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainCreateAccountAttestationBatch',
    )
  })
})
