import { assert } from 'chai'

import type { BaseRequest } from '../../src/models'

// Helper type assertion function (only for TS, no runtime impact)
function assertType<T>(value: T): void {
  // No runtime implementation needed
}

/**
 * Type Utility Verification Testing.
 *
 * Providing ts verification testing for type utilities.
 * Chai is not capable of properly type checking non-runtime assertions but this is the closest to simulate behavior.
 * Intention is to prevent index signatures on any type models - breaks Omit<> utilty typing
 */
describe('BaseRequest', function () {
  it(`pick utility`, function () {
    // Define a value with the picked type
    const picked: Pick<BaseRequest, 'command'> = { command: 'test' }

    // Verify the property exists
    assert.property(picked, 'command')
    assert.typeOf(picked.command, 'string')

    // Verify TypeScript enforces the picked type
    assert.isUndefined((picked as any).id)
  })

  it(`omit utility`, function () {
    type RequestMinusCommand = Omit<BaseRequest, 'command'>
    const control: BaseRequest = { command: 'control' }
    // Define a value with the omitted type
    const omitted: RequestMinusCommand = {
      id: 1,
      api_version: 2,
    }

    // Verify command is not present
    assert.notProperty(omitted, 'command')
    assert(typeof control.command === 'string')

    // Verify id properties remain
    assert.property(omitted, 'id')
    assert.typeOf(omitted.id, 'number')

    // Verify api_version properties remain
    assert.property(omitted, 'api_version')
    assert.typeOf(omitted.api_version, 'number')

    type HasCommand = 'command' extends keyof BaseRequest ? true : false
    type HasNoCommand = 'command' extends keyof RequestMinusCommand
      ? false
      : true

    assertType<true>({} as HasCommand)
    assertType<true>({} as HasNoCommand)
  })

  it(`partial utility`, function () {
    type OptionalRequest = Partial<BaseRequest>

    // Verify Partial makes all properties optional
    const empty: OptionalRequest = {}
    assert.notProperty(empty, 'command')
    assert.notProperty(empty, 'id')
    assert.notProperty(empty, 'api_version')

    // Verify optional nature at compile-time
    // This should compile without error
    const minimal: OptionalRequest = {}
    assert.isUndefined(minimal.command)
  })
})
