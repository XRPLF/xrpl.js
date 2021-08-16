import { ValidationError } from "../../common/errors";
import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface PaymentChannelCreate extends BaseTransaction {
    TransactionType: "PaymentChannelCreate";
    Amount: string;
    Destination: string;
    SettleDelay: number;
    PublicKey: string;
    CancelAfter?: number;
    DestinationTag?: number;
}

/**
 * Verify the form and type of an PaymentChannelCreate at runtime.
 * 
 * @param tx - An PaymentChannelCreate Transaction
 * @returns - Void.
 * @throws - When the PaymentChannelCreate is Malformed.
 */
 export function verifyPaymentChannelCreate(tx: PaymentChannelCreate): void {
    verifyBaseTransaction(tx)

    if (tx.Amount === undefined)
        throw new ValidationError("PaymentChannelCreate: missing Amount")

    if (typeof tx.Amount !== 'string')
        throw new ValidationError("PaymentChannelCreate: invalid Amount")

    if (tx.Destination === undefined)
        throw new ValidationError("PaymentChannelCreate: missing Destination")

    if (typeof tx.Destination !== 'string')
        throw new ValidationError("PaymentChannelCreate: invalid Destination")

    if (tx.SettleDelay === undefined)
        throw new ValidationError("PaymentChannelCreate: missing SettleDelay")

    if (typeof tx.SettleDelay !== 'number')
        throw new ValidationError("PaymentChannelCreate: invalid SettleDelay")
    
    if (tx.PublicKey === undefined)
        throw new ValidationError("PaymentChannelCreate: missing PublicKey")

    if (typeof tx.PublicKey !== 'string')
        throw new ValidationError("PaymentChannelCreate: invalid PublicKey")

    if (tx.CancelAfter !== undefined && typeof tx.CancelAfter !== 'number')
        throw new ValidationError("PaymentChannelCreate: invalid CancelAfter")

    if (tx.DestinationTag !== undefined && typeof tx.DestinationTag !== 'number')
        throw new ValidationError("PaymentChannelCreate: invalid DestinationTag")
}