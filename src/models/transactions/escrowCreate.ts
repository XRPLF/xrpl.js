import { ValidationError } from "../../common/errors";
import { BaseTransaction, GlobalFlags, verifyBaseTransaction } from "./common";

export interface EscrowCreateFlags extends GlobalFlags {
    tfPassive?: boolean;
    tfImmediateOrCancel?: boolean;
    tfFillOrKill?: boolean;
    tfSell?: boolean;
}

export interface EscrowCreate extends BaseTransaction {
    TransactionType: "EscrowCreate";
    Amount: string
    Destination: string;
    CancelAfter?: number;
    FinishAfter?: number;
    Condition?: string;
    DestinationTag?: number;
}

/**
 * Verify the form and type of an EscrowCreate at runtime.
 * 
 * @param tx - An EscrowCreate Transaction
 * @returns - Void.
 * @throws - When the EscrowCreate is Malformed.
 */
 export function verifyEscrowCreate(tx: EscrowCreate): void {
    verifyBaseTransaction(tx)

    if (tx.Amount === undefined)
        throw new ValidationError("EscrowCreate: missing field Amount")

    if (typeof tx.Amount !== 'string')
        throw new ValidationError("EscrowCreate: invalid Amount")

    if (tx.Destination === undefined)
        throw new ValidationError("EscrowCreate: missing field Destination")

    if (typeof tx.Destination !== 'string')
        throw new ValidationError("EscrowCreate: invalid Destination")

    if (tx.CancelAfter !== undefined && typeof tx.CancelAfter !== 'number')
        throw new ValidationError("EscrowCreate: invalid CancelAfter")

    if (tx.FinishAfter !== undefined && typeof tx.FinishAfter !== 'number')
        throw new ValidationError("EscrowCreate: invalid FinishAfter")

    if (tx.Condition !== undefined && typeof tx.Condition !== 'string')
        throw new ValidationError("EscrowCreate: invalid Condition")

    if (tx.DestinationTag !== undefined && typeof tx.DestinationTag !== 'number')
        throw new ValidationError("EscrowCreate: invalid DestinationTag")
}