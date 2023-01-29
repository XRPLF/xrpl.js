import * as definitions from './definitions.json'

let enums = definitions

/*
 * @brief: Set custom definitions (for e.g. custom tranasction types)
 */
function setDefinitions(customDefinitions: typeof definitions): void {
  enums = customDefinitions
}

/*
 * @brief: Get latest definitions the lib is wokring with
 */
function getDefinitions(): typeof definitions {
  return enums
}

export { getDefinitions, setDefinitions }
