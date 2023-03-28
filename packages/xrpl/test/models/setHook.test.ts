import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateSetHook } from '../../src/models/transactions/setHook'

/**
 * SetHook Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SetHook', function () {
  let setHookTx

  beforeEach(function () {
    setHookTx = {
      Flags: 0,
      TransactionType: 'SetHook',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Hooks: [
        {
          Hook: {
            CreateCode:
              '0061736D01000000011C0460057F7F7F7F7F017E60037F7F7E017E60027F7F017F60017F017E02230303656E76057472616365000003656E7606616363657074000103656E76025F670002030201030503010002062B077F0141B088040B7F004180080B7F0041A6080B7F004180080B7F0041B088040B7F0041000B7F0041010B07080104686F6F6B00030AC4800001C0800001017F230041106B220124002001200036020C41920841134180084112410010001A410022002000420010011A41012200200010021A200141106A240042000B0B2C01004180080B254163636570742E633A2043616C6C65642E00224163636570742E633A2043616C6C65642E22',
            HookOn:
              'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFF7',
            Flags: 1,
            HookApiVersion: 0,
            HookNamespace:
              '4FF9961269BF7630D32E15276569C94470174A5DA79FA567C0F62251AA9A36B9',
          },
        },
      ],
    } as any
  })

  it(`verifies valid SetHook`, function () {
    assert.doesNotThrow(() => validateSetHook(setHookTx))
    assert.doesNotThrow(() => validate(setHookTx))
  })

  // it(`throws w/ empty Hooks`, function () {
  //   setHookTx.Hooks = []

  //   assert.throws(
  //     () => validateSetHook(setHookTx),
  //     ValidationError,
  //     'SetHook: need at least 1 member in Hooks',
  //   )
  //   assert.throws(
  //     () => validate(setHookTx),
  //     ValidationError,
  //     'SetHook: need at least 1 member in Hooks',
  //   )
  // })

  it(`throws w/ invalid Hooks`, function () {
    setHookTx.Hooks = 'khgfgyhujk'

    assert.throws(
      () => validateSetHook(setHookTx),
      ValidationError,
      'SetHook: invalid Hooks',
    )
    assert.throws(
      () => validate(setHookTx),
      ValidationError,
      'SetHook: invalid Hooks',
    )
  })

  it(`throws w/ maximum of 4 members allowed in Hooks`, function () {
    setHookTx.Hooks = []
    const hook = {
      Hook: {
        CreateCode:
          '0061736D01000000011C0460057F7F7F7F7F017E60037F7F7E017E60027F7F017F60017F017E02230303656E76057472616365000003656E7606616363657074000103656E76025F670002030201030503010002062B077F0141B088040B7F004180080B7F0041A6080B7F004180080B7F0041B088040B7F0041000B7F0041010B07080104686F6F6B00030AC4800001C0800001017F230041106B220124002001200036020C41920841134180084112410010001A410022002000420010011A41012200200010021A200141106A240042000B0B2C01004180080B254163636570742E633A2043616C6C65642E00224163636570742E633A2043616C6C65642E22',
        HookOn:
          'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFF7',
        Flags: 1,
        HookApiVersion: 0,
        HookNamespace:
          '4FF9961269BF7630D32E15276569C94470174A5DA79FA567C0F62251AA9A36B9',
      },
    }
    setHookTx.Hooks.push(hook)
    setHookTx.Hooks.push(hook)
    setHookTx.Hooks.push(hook)
    setHookTx.Hooks.push(hook)
    setHookTx.Hooks.push(hook)

    const errorMessage = 'SetHook: maximum of 4 hooks allowed in Hooks'
    assert.throws(
      () => validateSetHook(setHookTx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(setHookTx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid HookOn in Hooks`, function () {
    setHookTx.SignerQuorum = 2
    setHookTx.Hooks = [
      {
        Hook: {
          CreateCode:
            '0061736D01000000011C0460057F7F7F7F7F017E60037F7F7E017E60027F7F017F60017F017E02230303656E76057472616365000003656E7606616363657074000103656E76025F670002030201030503010002062B077F0141B088040B7F004180080B7F0041A6080B7F004180080B7F0041B088040B7F0041000B7F0041010B07080104686F6F6B00030AC4800001C0800001017F230041106B220124002001200036020C41920841134180084112410010001A410022002000420010011A41012200200010021A200141106A240042000B0B2C01004180080B254163636570742E633A2043616C6C65642E00224163636570742E633A2043616C6C65642E22',
          HookOn: '',
          Flags: 1,
          HookApiVersion: 0,
          HookNamespace:
            '4FF9961269BF7630D32E15276569C94470174A5DA79FA567C0F62251AA9A36B9',
        },
      },
    ]
    const errorMessage =
      'SetHook: HookOn in Hook must be a 256-bit (32-byte) hexadecimal value'
    assert.throws(
      () => validateSetHook(setHookTx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(setHookTx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid HookNamespace in Hooks`, function () {
    setHookTx.SignerQuorum = 2
    setHookTx.Hooks = [
      {
        Hook: {
          CreateCode:
            '0061736D01000000011C0460057F7F7F7F7F017E60037F7F7E017E60027F7F017F60017F017E02230303656E76057472616365000003656E7606616363657074000103656E76025F670002030201030503010002062B077F0141B088040B7F004180080B7F0041A6080B7F004180080B7F0041B088040B7F0041000B7F0041010B07080104686F6F6B00030AC4800001C0800001017F230041106B220124002001200036020C41920841134180084112410010001A410022002000420010011A41012200200010021A200141106A240042000B0B2C01004180080B254163636570742E633A2043616C6C65642E00224163636570742E633A2043616C6C65642E22',
          HookOn:
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFF7',
          Flags: 1,
          HookApiVersion: 0,
          HookNamespace: '',
        },
      },
    ]
    const errorMessage =
      'SetHook: HookNamespace in Hook must be a 256-bit (32-byte) hexadecimal value'
    assert.throws(
      () => validateSetHook(setHookTx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(setHookTx), ValidationError, errorMessage)
  })
})
