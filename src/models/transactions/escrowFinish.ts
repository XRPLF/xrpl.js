import { ValidationError } from "../../common/errors";
import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface EscrowFinish extends BaseTransaction {
    TransactionType: "EscrowFinish";
    Owner: string;
    OfferSequence: number;
    Condition?: string;
    Fulfillment?: string;
}

/**
 * Verify the form and type of an EscrowFinish at runtime.
 * 
 * @param tx - An EscrowFinish Transaction
 * @returns - Void.
 * @throws - When the EscrowFinish is Malformed.
 */
 export function verifyEscrowFinish(tx: EscrowFinish): void {
    verifyBaseTransaction(tx)

    if (tx.Owner === undefined)
        throw new ValidationError("EscrowFinish: missing field Owner")

    if (typeof tx.Owner !== 'string')
        throw new ValidationError("EscrowFinish: invalid Owner")

    if (tx.OfferSequence === undefined)
        throw new ValidationError("EscrowFinish: missing field OfferSequence")

    if (typeof tx.OfferSequence !== 'number')
        throw new ValidationError("EscrowFinish: invalid OfferSequence")

    if (tx.Condition !== undefined && typeof tx.Condition !== 'string')
        throw new ValidationError("EscrowFinish: invalid Condition")

    if (tx.Fulfillment !== undefined && typeof tx.Fulfillment !== 'string')
        throw new ValidationError("EscrowFinish: invalid Fulfillment")
}  