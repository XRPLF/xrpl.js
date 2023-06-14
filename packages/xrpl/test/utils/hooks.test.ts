import { assert } from 'chai'

import { calculateHookOn, hexHookParameters, TTS } from '../../src'

describe('test hook on', function () {
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
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFFF',
    )
  })
  it('one', function () {
    const invokeOn: Array<keyof TTS> = ['AccountSet']
    const result = calculateHookOn(invokeOn)
    assert.equal(
      result,
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFF7',
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
