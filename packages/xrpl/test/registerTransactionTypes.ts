import { TRANSACTION_TYPES } from 'ripple-binary-codec'

/**
 * Adds each name ripple-binary-codec's definitions.json lacks to its
 * TRANSACTION_TYPES for the enclosing describe block, and removes it after.
 * `validateBaseTransaction` refuses a TransactionType the codec does not know,
 * so a model's own checks are tested whichever definitions.json the tree has.
 *
 * @param names - TransactionType names the tests in the block validate.
 */
export function registerTransactionTypes(names: string[]): void {
  const added: string[] = []

  beforeAll(function () {
    names
      .filter((name) => !TRANSACTION_TYPES.includes(name))
      .forEach((name) => {
        TRANSACTION_TYPES.push(name)
        added.push(name)
      })
  })

  afterAll(function () {
    added.forEach((name) => {
      TRANSACTION_TYPES.splice(TRANSACTION_TYPES.indexOf(name), 1)
    })
    added.length = 0
  })
}
