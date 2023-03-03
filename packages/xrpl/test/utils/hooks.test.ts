import { assert } from 'chai'

import {
  calculateHookOn,
  hexNamespace,
  hexHookParameters,
  TTS,
} from '../../src'

describe('test hook on', function () {
  it('invalid', function () {
    const invokeOn: Array<keyof TTS> = [1]
    expect(() => {
      calculateHookOn(invokeOn)
    }).toThrow('HookOn transaction type must be string')
  })
  it('invalid', function () {
    const invokeOn: Array<keyof TTS> = ['AccountSet1']
    expect(() => {
      calculateHookOn(invokeOn)
    }).toThrow("invalid transaction type 'AccountSet1' in HookOn array")
  })
  it('all', function () {
    const result = calculateHookOn([])
    assert.equal(
      result,
      '000000000000000000000000000000000000000000000000000000003E3FF5BF',
    )
  })
  it('one', function () {
    const invokeOn: Array<keyof TTS> = ['AccountSet']
    const result = calculateHookOn(invokeOn)
    assert.equal(
      result,
      '000000000000000000000000000000000000000000000000000000003E3FF5B7',
    )
  })
})

describe('test hook namespace', function () {
  it('basic', async function () {
    const result = await hexNamespace('starter')
    assert.equal(
      result,
      '4FF9961269BF7630D32E15276569C94470174A5DA79FA567C0F62251AA9A36B9',
    )
  })
})

describe('test hook parameters', function () {
  it('basic', async function () {
    const parameters = [
      {
        HookParameter: {
          HookParameterName: 'name1',
          HookParameterValue: 'value1',
        },
      },
    ]
    const result = hexHookParameters(parameters)
    assert.deepEqual(result, [
      {
        HookParameter: {
          HookParameterName: '6E616D6531',
          HookParameterValue: '76616C756531',
        },
      },
    ])
  })
})
