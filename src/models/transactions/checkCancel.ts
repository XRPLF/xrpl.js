import { ValidationError } from "../../common/errors";
import { CommonFields, verifyCommonFields } from "./common";

export interface CheckCancel extends CommonFields {
    TransactionType: "CheckCancel";
    CheckID: string;
}

/**
 * Verify the form and type of an CheckCancel at runtime.
 * 
 * @param tx - An CheckCancel Transaction
 * @returns - Void.
 * @throws - When the CheckCancel is Malformed.
 */
 export function verifyCheckCancel(tx: CheckCancel): void {
    verifyCommonFields(tx)

    if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string')
        throw new ValidationError("CheckCancel: invalid CheckID")
}