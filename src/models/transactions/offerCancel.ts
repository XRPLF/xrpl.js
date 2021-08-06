import { ValidationError } from "../../common/errors";
import { CommonFields, verifyCommonFields } from "./common";

export interface OfferCancel extends CommonFields {
    TransactionType: "OfferCancel";
    OfferSequence: number;
}

/**
 * Verify the form and type of an OfferCancel at runtime.
 * 
 * @param tx - An OfferCancel Transaction
 * @returns - Void.
 * @throws - When the OfferCancel is Malformed.
 */
 export function verifyOfferCancel(tx: OfferCancel): void {
    verifyCommonFields(tx)

    if (tx.OfferSequence !== undefined && typeof tx.OfferSequence !== 'number')
        throw new ValidationError("OfferCancel: invalid OfferSequence")
}