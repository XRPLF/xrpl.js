import {ValidationError} from "../src/common/errors"
import {OfferCreate} from "../src/models/transactions"
import {assertResultMatch} from "./utils"
import {assert} from 'chai'
import fixtures from './fixtures/rippled'
import { computeSignedTransactionHash } from "../src/common/hashes"

describe('Transaction Hash Verification', function () {
    
    it('hashes signed transaction correctly', () => {
        const expected_hash = (
            "458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2"
        )

        assertResultMatch(computeSignedTransactionHash(fixtures.tx.OfferCreateSell.result), expected_hash)
    })

    it('throws when hashing unsigned transaction', () => {
        const offerCreate: OfferCreate = fixtures.tx.OfferCreateSell.result
        delete offerCreate.TxnSignature
        assert.throws(() => computeSignedTransactionHash(offerCreate), ValidationError)
    })
})