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