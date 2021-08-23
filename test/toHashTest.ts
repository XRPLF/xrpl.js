import { OfferCreate } from "../src/models/transactions"
import {toHash} from "../src/models/utils"
import {assertResultMatch} from "./utils"

describe('AccountDelete Transaction Verification', function () {
    it('hashes basic transaction correctly', () => {
        const offerCreateData: OfferCreate = {
            "Account": "rLyttXLh7Ttca9CMUaD3exVoXY2fn2zwj3",
            "Fee": "10",
            "Flags": 0,
            "LastLedgerSequence": 16409087,
            "Sequence": 16409064,
            "SigningPubKey": (
                "ED93BFA583E83331E9DC498DE4558CE4861ACFAB9385EBBC43BC56A0D9845A1DF2"
            ),
            "TakerGets": "13100000",
            "TakerPays": {
                "currency": "USD",
                "issuer": "rLyttXLh7Ttca9CMUaD3exVoXY2fn2zwj3",
                "value": "10",
            },
            "TransactionType": "OfferCreate",
            /*"TxnSignature": [
                "71135999783658A0CB4EBCF02E59ACD94C4D06D5BF909E05E6B97588155482BBA5985",
                "35AD4728ACA1F90C4DE73FFC741B0A6AB87141BDA8BCC2F2DF9CD8C3703"
            ]*/
        }



        const expected_hash = (
            "66F3D6158CAB6E53405F8C264DB39F07D8D0454433A63DDFB98218ED1BC99B60"
        )



        assertResultMatch(toHash(offerCreateData), expected_hash)
    })


/*def test_get_hash(self):
        offer_create_dict = {
            "Account": "rLyttXLh7Ttca9CMUaD3exVoXY2fn2zwj3",
            "Fee": "10",
            "Flags": 0,
            "LastLedgerSequence": 16409087,
            "Sequence": 16409064,
            "SigningPubKey": (
                "ED93BFA583E83331E9DC498DE4558CE4861ACFAB9385EBBC43BC56A0D9845A1DF2"
            ),
            "TakerGets": "13100000",
            "TakerPays": {
                "currency": "USD",
                "issuer": "rLyttXLh7Ttca9CMUaD3exVoXY2fn2zwj3",
                "value": "10",
            },
            "TransactionType": "OfferCreate",
            "TxnSignature": (
                "71135999783658A0CB4EBCF02E59ACD94C4D06D5BF909E05E6B97588155482BBA5985"
                "35AD4728ACA1F90C4DE73FFC741B0A6AB87141BDA8BCC2F2DF9CD8C3703"
            ),
        }

        offer_create = OfferCreate.from_xrpl(offer_create_dict)
        expected_hash = (
            "66F3D6158CAB6E53405F8C264DB39F07D8D0454433A63DDFB98218ED1BC99B60"
        )
        self.assertEqual(offer_create.get_hash(), expected_hash)
        */
})