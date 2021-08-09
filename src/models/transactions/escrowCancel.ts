import { ValidationError } from "../../common/errors";
import { CommonFields, verifyCommonFields } from "./common";

export interface EscrowCancel extends CommonFields {
    TransactionType: "EscrowCancel"
    Owner: string;
    OfferSequence: number;
}

/**
 * Verify the form and type of an EscrowCancel at runtime.
 * 
 * @param tx - An EscrowCancel Transaction
 * @returns - Void.
 * @throws - When the EscrowCancel is Malformed.
 */
 export function verifyEscrowCancel(tx: EscrowCancel): void {
    verifyCommonFields(tx)

    if (tx.Owner === undefined)
        throw new ValidationError('EscrowCancel: missing Owner')

    if (typeof tx.Owner !== 'string')
        throw new ValidationError('EscrowCancel: invalid Owner')

    if (tx.OfferSequence === undefined)
        throw new ValidationError('EscrowCancel: missing OfferSequence')

    if (typeof tx.OfferSequence !== 'number')
        throw new ValidationError('EscrowCancel: invalid OfferSequence')
}