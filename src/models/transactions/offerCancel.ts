import { ValidationError } from "../../common/errors"
import { BaseTransaction, verifyBaseTransaction } from "./common"

export interface OfferCancel extends BaseTransaction {
    TransactionType: "OfferCancel"
    OfferSequence: number
}

/**
 * Verify the form and type of an OfferCancel at runtime.
 * 
 * @param tx - An OfferCancel Transaction
 * @returns - Void.
 * @throws - When the OfferCancel is Malformed.
 */
 export function verifyOfferCancel(tx: OfferCancel): void {
    verifyBaseTransaction(tx)

    if (tx.OfferSequence === undefined)
        throw new ValidationError("OfferCancel: missing field OfferSequence")

    if (typeof tx.OfferSequence !== 'number')
        throw new ValidationError("OfferCancel: invalid OfferSequence")
}