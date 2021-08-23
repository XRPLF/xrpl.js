import {ValidationError} from "../src/common/errors"
import {OfferCreate} from "../src/models/transactions"
import {toHash} from "../src/models/utils"
import {assertResultMatch} from "./utils"
import {assert} from 'chai'
import fixtures from './fixtures/rippled'

describe('AccountDelete Transaction Verification', function () {
    it('hashes basic transaction correctly', () => {
        const expected_hash = (
            "458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2"
        )

        assertResultMatch(toHash(fixtures.tx.OfferCreateSell.result), expected_hash)
    })

    it('throws when hashing unsigned transaction', () => {
        const offerCreate: OfferCreate = fixtures.tx.OfferCreateSell.result
        delete offerCreate.TxnSignature
        assert.throws(() => toHash(offerCreate), ValidationError)
    })
})