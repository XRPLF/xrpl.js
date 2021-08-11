import { ValidationError } from "../../common/errors";
import { Amount, IssuedCurrencyAmount } from "../common";
import { CommonFields, verifyCommonFields } from "./common";

export interface CheckCash extends CommonFields {
    TransactionType: "CheckCash";
    CheckID: string;
    Amount?:	Amount;
    DeliverMin?: Amount;
}

/**
 * Verify the form and type of an CheckCash at runtime.
 * 
 * @param tx - An CheckCash Transaction
 * @returns - Void.
 * @throws - When the CheckCash is Malformed.
 */
 export function verifyCheckCash(tx: CheckCash): void {
    verifyCommonFields(tx)

    const isIssuedCurrency = (obj: IssuedCurrencyAmount): boolean => {
        return Object.keys(obj).length === 3 
            && typeof obj.value === 'string'
            && typeof obj.issuer === 'string'
            && typeof obj.currency === 'string'
    }

    if (tx.Amount !== undefined && typeof tx.Amount !== 'string' && !isIssuedCurrency(tx.Amount))
        throw new ValidationError("CheckCash: invalid Amount")

    if (tx.DeliverMin !== undefined && typeof tx.DeliverMin !== 'string' && !isIssuedCurrency(tx.DeliverMin))
        throw new ValidationError("CheckCash: invalid DeliverMin")

    if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string')
        throw new ValidationError("CheckCash: invalid CheckID")
} 