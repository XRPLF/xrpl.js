export function onlyHasFields(obj: object, fields: Array<string>): boolean {
    return Object.keys(obj).every((key:string) => fields.includes(key))
}