import { assert } from 'chai'

import type { BaseRequest, Stream, AccountInfoRequest } from '../../src/models'

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

describe('AccountInfoRequest', function () {
  it(`pick utility`, function () {
    // Define a value with the picked type
    const picked: Pick<AccountInfoRequest, 'command'> = {
      command: 'account_info',
    }

    // Verify the property exists
    assert.property(picked, 'command')
    assert.typeOf(picked.command, 'string')

    // Verify TypeScript enforces the picked type
    assert.isUndefined((picked as any).id)
  })

  it(`omit utility`, function () {
    type RequestMinusCommand = Omit<AccountInfoRequest, 'command'>

    const control: AccountInfoRequest = {
      command: 'account_info',
      account: 'account_address',
    }
    // Define a value with the omitted type
    const omitted: RequestMinusCommand = {
      account: 'account_address',
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

    type HasCommand = 'command' extends keyof AccountInfoRequest ? true : false
    type HasNoCommand = 'command' extends keyof RequestMinusCommand
      ? false
      : true

    assertType<true>({} as HasCommand)
    assertType<true>({} as HasNoCommand)
  })

  it(`partial utility`, function () {
    type OptionalRequest = Partial<AccountInfoRequest>

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

describe('Stream', function () {
  it(`pick utility`, function () {
    // Define a value with the picked type
    const picked: Pick<Stream, 'type'> = { type: 'manifestReceived' }

    // Verify the property exists
    assert.property(picked, 'type')
    assert.typeOf(picked.type, 'string')

    // Verify TypeScript enforces the picked type
    assert.isUndefined((picked as any).commnand)
  })

  it(`omit utility`, function () {
    type StreamMinusType = Omit<Stream, 'type'>

    const control: Stream = {
      type: 'manifestReceived',
      command: 'manifest',
      public_key: 'key',
    }
    // Define a value with the omitted type
    const omitted: StreamMinusType = {}

    // Verify command is not present
    assert.notProperty(omitted, 'type')
    assert(typeof control.type === 'string')

    type HasType = 'type' extends keyof Stream ? true : false
    type HasNoType = 'type' extends keyof StreamMinusType ? false : true

    assertType<true>({} as HasType)
    assertType<true>({} as HasNoType)
  })

  it(`partial utility`, function () {
    type OptionalStream = Partial<Stream>

    // Verify Partial makes all properties optional
    const empty: OptionalStream = {}
    assert.notProperty(empty, 'command')
    assert.notProperty(empty, 'id')
    assert.notProperty(empty, 'public_key')

    // Verify optional nature at compile-time
    // This should compile without error
    const minimal: OptionalStream = {}
    assert.isUndefined(minimal.type)
  })
})
