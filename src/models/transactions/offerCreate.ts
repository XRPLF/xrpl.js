import { ValidationError } from "../../common/errors";
import { Amount, IssuedCurrencyAmount } from "../common";
import { BaseTransaction, GlobalFlags, verifyBaseTransaction } from "./common";

export interface OfferCreateFlags extends GlobalFlags {
    tfPassive?: boolean;
    tfImmediateOrCancel?: boolean;
    tfFillOrKill?: boolean;
    tfSell?: boolean;
}

export interface OfferCreate extends BaseTransaction {
    TransactionType: "OfferCreate";
    Flags?: number | OfferCreateFlags
    Expiration?: number;
    OfferSequence?: number;
    TakerGets: Amount;
    TakerPays: Amount;
}

/**
 * Verify the form and type of an OfferCreate at runtime.
 * 
 * @param tx - An OfferCreate Transaction
 * @returns - Void.
 * @throws - When the OfferCreate is Malformed.
 */
 export function verifyOfferCreate(tx: OfferCreate): void {
    verifyBaseTransaction(tx)

    if (tx.TakerGets === undefined)
        throw new ValidationError("OfferCreate: missing field TakerGets")

    if (tx.TakerPays === undefined)
        throw new ValidationError("OfferCreate: missing field TakerPays")

    const isIssuedCurrency = (obj: IssuedCurrencyAmount): boolean => {
        return Object.keys(obj).length === 3 
            && typeof obj.value === 'string'
            && typeof obj.issuer === 'string'
            && typeof obj.currency === 'string'
    }

    if (typeof tx.TakerGets !== 'string' && !isIssuedCurrency(tx.TakerGets))
        throw new ValidationError("OfferCreate: invalid TakerGets")

    if (typeof tx.TakerPays !== 'string' && !isIssuedCurrency(tx.TakerPays))
        throw new ValidationError("OfferCreate: invalid TakerPays")

    if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number')
        throw new ValidationError("OfferCreate: invalid Expiration")

    if (tx.OfferSequence !== undefined && typeof tx.OfferSequence !== 'number')
        throw new ValidationError("OfferCreate: invalid OfferSequence")
}