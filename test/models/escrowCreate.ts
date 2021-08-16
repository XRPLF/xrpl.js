import { ValidationError } from 'ripple-api/common/errors'
import { EscrowCreate, verifyEscrowCreate } from './../../src/models/transactions/escrowCreate'
import { assert } from 'chai'

/**
 * EscrowCreate Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('EscrowCreate Transaction Verification', function () {
    
    it (`verifies valid EscrowCreate`, () => {
        const validCheck: EscrowCreate = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: 533257958,
            FinishAfter: 533171558,
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            DestinationTag: 23480,
            SourceTag: 11747
        }
        
        assert.doesNotThrow(() => verifyEscrowCreate(validCheck))
    })

    it (`verifies valid EscrowCreate w/o optional`, () => {
        const validCheck: EscrowCreate = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
        }
        
        assert.doesNotThrow(() => verifyEscrowCreate(validCheck))
    })

    it (`Missing amount`, () => {
        const missingAmount = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(missingAmount),
            ValidationError,
            "EscrowCreate: missing field Amount"
        )
    })

    it (`Missing destination`, () => {
        const missingDest = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(missingDest),
            ValidationError,
            "EscrowCreate: missing field Destination"
        )
    })

    it (`throws w/ invalid Destination`, () => {
        const invalidDestination = {
            TransactionType : "EscrowCreate",
            Account : "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
            Amount: "10000",
            Destination : 7896214563214789632154,
          } as any

        assert.throws(
            () => verifyEscrowCreate(invalidDestination),
            ValidationError,
            "EscrowCreate: invalid Destination"
        )
    })

    it (`throws w/ invalid Amount`, () => {
        const invalidAmount = {
            TransactionType : "EscrowCreate",
            Account : "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
            Amount: 10000,
            Destination : "7896214563214789632154",
          } as any

        assert.throws(
            () => verifyEscrowCreate(invalidAmount),
            ValidationError,
            "EscrowCreate: invalid Amount"
        )
    })

    it (`invalid CancelAfter`, () => {
        const invalidCancelAfter = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: "533257958",
            FinishAfter: 533171558,
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            DestinationTag: 23480,
            SourceTag: 11747
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(invalidCancelAfter),
            ValidationError,
            "EscrowCreate: invalid CancelAfter"
        )    
    })

    it (`invalid FinishAfter`, () => {
        const invalidFinishAfter = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: 533257958,
            FinishAfter: "533171558",
            Condition: "A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100",
            DestinationTag: 23480,
            SourceTag: 11747
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(invalidFinishAfter),
            ValidationError,
            "EscrowCreate: invalid FinishAfter"
        )    
    })

    it (`invalid Condition`, () => {
        const invalidCondition = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: 533257958,
            FinishAfter: 533171558,
            Condition: 0x1411224324,
            DestinationTag: 23480,
            SourceTag: 11747
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(invalidCondition),
            ValidationError,
            "EscrowCreate: invalid Condition"
        )    
    })

    it (`invalid DestinationTag`, () => {
        const invalidDestTag = {
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            TransactionType: "EscrowCreate",
            Amount: "10000",
            Destination: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            CancelAfter: 533257958,
            FinishAfter: 533171558,
            Condition: "1411224324",
            DestinationTag: "23480",
            SourceTag: 11747
        } as any
        
        assert.throws(
            () => verifyEscrowCreate(invalidDestTag),
            ValidationError,
            "EscrowCreate: invalid DestinationTag"
        )    
    })

})