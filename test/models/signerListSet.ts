import { ValidationError } from 'xrpl-local/common/errors'
import { verifySignerListSet } from './../../src/models/transactions/signerListSet'
import { assert } from 'chai'

/**
 * SignerListSet Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('SignerListSet Transaction Verification', function () {
    let SignerListSetTx

    beforeEach(() => {
        SignerListSetTx = {
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
    })
    
    it (`verifies valid SignerListSet`, () => {
        assert.doesNotThrow(() => verifySignerListSet(SignerListSetTx))
    })


    it (`throws w/ missing SignerQuorum`, () => {
        SignerListSetTx.SignerQuorum = undefined

        assert.throws(
            () => verifySignerListSet(SignerListSetTx),
            ValidationError,
            "SignerListSet: missing field SignerQuorum"
        )
    })

    it (`throws w/ empty SignerEntries`, () => {
        SignerListSetTx.SignerEntries = []

        assert.throws(
            () => verifySignerListSet(SignerListSetTx),
            ValidationError,
            "SignerListSet: need atleast 1 member in SignerEntries"
        )
    })

    it (`throws w/ invalid SignerEntries`, () => {
        SignerListSetTx.SignerEntries = "khgfgyhujk"
        
        assert.throws(
            () => verifySignerListSet(SignerListSetTx),
            ValidationError,
            "SignerListSet: invalid SignerEntries"
        )
    })
})