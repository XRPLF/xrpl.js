import { ValidationError } from "../../common/errors";
import { Amount, IssuedCurrencyAmount } from "../common";
import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface CheckCash extends BaseTransaction {
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
    verifyBaseTransaction(tx)

    const isIssuedCurrency = (obj: IssuedCurrencyAmount): boolean => {
        return Object.keys(obj).length === 3 
            && typeof obj.value === 'string'
            && typeof obj.issuer === 'string'
            && typeof obj.currency === 'string'
    }

    if (tx.hasOwnProperty('Amount') && tx.hasOwnProperty('DeliverMin'))
        throw new ValidationError("CheckCash: cannot have both Amount and DeliverMin")
    
    if (!tx.hasOwnProperty('Amount') && !tx.hasOwnProperty('DeliverMin'))
        throw new ValidationError("CheckCash: must have either Amount or DeliverMin")

    if (tx.hasOwnProperty('Amount') && tx.Amount !== undefined && typeof tx.Amount !== 'string' && !isIssuedCurrency(tx.Amount))
        throw new ValidationError("CheckCash: invalid Amount")

    if (tx.hasOwnProperty('DeliverMin') && tx.DeliverMin !== undefined && typeof tx.DeliverMin !== 'string' && !isIssuedCurrency(tx.DeliverMin))
        throw new ValidationError("CheckCash: invalid DeliverMin")

    if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string')
        throw new ValidationError("CheckCash: invalid CheckID")
} 