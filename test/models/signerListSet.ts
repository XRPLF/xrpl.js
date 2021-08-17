import { ValidationError } from 'ripple-api/common/errors'
import { verifySignerListSet } from './../../src/models/transactions/signerListSet'
import { assert } from 'chai'

/**
 * SignerListSet Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('SignerListSet Transaction Verification', function () {
    
    it (`verifies valid SignerListSet`, () => {
        const validSignerListSet = {
            Flags: 0,
            TransactionType: "SignerListSet",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            Fee: "12",
            SignerQuorum: 3,
            SignerEntries: [
                {
                    SignerEntry: {
                        Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
                        SignerWeight: 2
                    }
                },
                {
                    SignerEntry: {
                        Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
                        SignerWeight: 1
                    }
                },
                {
                    SignerEntry: {
                        Account: "raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n",
                        SignerWeight: 1
                    }
                }
            ]
        } as any
        
        assert.doesNotThrow(() => verifySignerListSet(validSignerListSet))
    })


    it (`throws w/ missing SignerQuorum`, () => {
        const invalidSignerQuorum = {
            Flags: 0,
            TransactionType: "SignerListSet",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            SignerEntries: [
                {
                    SignerEntry: {
                        Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
                        SignerWeight: 2
                    }
                },
                {
                    SignerEntry: {
                        Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
                        SignerWeight: 1
                    }
                },
                {
                    SignerEntry: {
                        Account: "raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n",
                        SignerWeight: 1
                    }
                }
            ]
        } as any

        assert.throws(
            () => verifySignerListSet(invalidSignerQuorum),
            ValidationError,
            "SignerListSet: missing field SignerQuorum"
        )
    })

    it (`throws w/ empty SignerEntries`, () => {
        const emptySignerEntries = {
            Flags: 0,
            TransactionType: "SignerListSet",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            SignerQuorum: 3,
            SignerEntries: []
        } as any

        assert.throws(
            () => verifySignerListSet(emptySignerEntries),
            ValidationError,
            "SignerListSet: need atleast 1 member in SignerEntries"
        )
    })

    it (`throws w/ invalid SignerEntries`, () => {
        const invalidSignerEntries = {
            Flags: 0,
            TransactionType: "SignerListSet",
            Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            SignerQuorum: 3,
            SignerEntries: "khgfgyhujk"
        } as any

        assert.throws(
            () => verifySignerListSet(invalidSignerEntries),
            ValidationError,
            "SignerListSet: invalid SignerEntries"
        )
    })
})