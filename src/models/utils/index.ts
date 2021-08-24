import { encode } from "ripple-binary-codec/dist"
import { ValidationError } from "../../common/errors"
import HashPrefix from "../../common/hashes/hash-prefix"
import sha512Half from "../../common/hashes/sha512Half"
import { Transaction } from "../transactions"

/**
 * Verify that all fields of an object are in fields
 * 
 * @param obj Object to verify fields
 * @param fields Fields to verify
 * @returns True if keys in object are all in fields
 */
export function onlyHasFields(obj: object, fields: Array<string>): boolean {
    return Object.keys(obj).every((key:string) => fields.includes(key))
}

/**
 * Perform bitwise AND (&) to check if a flag is enabled within Flags (as a number).
 * 
 * @param {number} Flags A number that represents flags enabled.
 * @param {number} checkFlag A specific flag to check if it's enabled within Flags.
 * @returns {boolean} True if checkFlag is enabled within Flags.
 */
export function isFlagEnabled(Flags: number, checkFlag: number): boolean {
    return (checkFlag & Flags) === checkFlag
}

/**
 * Hashes the Transaction object as the ledger does. Only valid for signed Transactions.
 * 
 * @param {Transaction} tx A transaction to hash. Tx must be signed.
 * @returns {string} A hash of tx
 * @throws {ValidationError} if the Transaction is unsigned
 */

export function toHash(tx: Transaction): string {
    if(tx.TxnSignature === undefined) {
        throw new ValidationError("The transaction must be signed to hash it.")
    }
    const prefix = HashPrefix.TRANSACTION_ID.toString(16)
    const encodedStr = prefix.concat(encode(tx))
    return sha512Half(encodedStr)
}