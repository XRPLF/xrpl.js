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
