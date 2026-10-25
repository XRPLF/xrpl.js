import {
  ContractCreate,
  ContractCreateFlags,
  ContractFunction,
  ContractInstanceParameter,
  ContractInstanceParameterValue,
  ContractParameterFlags,
  ParameterValue,
} from '../../src/models/transactions'
import { validateContractCreate } from '../../src/models/transactions/contractCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractCreate, message)

const CONTRACT_HASH =
  'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90'
const NFTOKEN_ID =
  '000800006203F49C21D5D6E022CB16DE3538F248662FC73C00000099B0000000'
const MPT_ISSUANCE_ID = '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47'
const ISSUER = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'

function makeFunction(name: string, parameterCount = 1): ContractFunction {
  return {
    Function: {
      FunctionName: name,
      Parameters: Array.from({ length: parameterCount }, () => ({
        Parameter: { ParameterFlag: 0, ParameterType: { type: 'UINT32' } },
      })),
    },
  }
}

function makeInstanceParameter(flag = 0): ContractInstanceParameter {
  return {
    InstanceParameter: {
      ParameterFlag: flag,
      ParameterType: { type: 'UINT8' },
    },
  }
}

function makeInstanceParameterValue(
  flag = 0,
  value: ParameterValue = { type: 'UINT8', value: 1 },
): ContractInstanceParameterValue {
  return {
    InstanceParameterValue: { ParameterFlag: flag, ParameterValue: value },
  }
}

/**
 * ContractCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractCreate', function () {
  let tx: ContractCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractCode: '0061736D01000000',
      Functions: [makeFunction('6765745F76616C7565')],
      InstanceParameters: [makeInstanceParameter()],
      InstanceParameterValues: [makeInstanceParameterValue()],
      URI: '68747470733A2F2F6578616D706C652E636F6D',
    }
  })

  describe('fields and flags', function () {
    it('verifies valid ContractCreate with ContractCode', function () {
      assertValid(tx)
    })

    it('verifies valid ContractCreate with ContractHash', function () {
      delete tx.ContractCode
      delete tx.Functions
      tx.ContractHash = CONTRACT_HASH
      assertValid(tx)
    })

    it('verifies each single immutability flag and tfUndeletable', function () {
      for (const flag of [
        ContractCreateFlags.tfImmutable,
        ContractCreateFlags.tfCodeImmutable,
        ContractCreateFlags.tfABIImmutable,
      ]) {
        tx.Flags = flag + ContractCreateFlags.tfUndeletable
        assertValid(tx)
      }
      tx.Flags = { tfCodeImmutable: true, tfUndeletable: true }
      assertValid(tx)
    })

    it('throws w/ more than one immutability flag', function () {
      const message =
        'ContractCreate: cannot set more than one of tfImmutable, tfCodeImmutable and tfABIImmutable'
      tx.Flags =
        ContractCreateFlags.tfImmutable + ContractCreateFlags.tfCodeImmutable
      assertInvalid(tx, message)
      tx.Flags = { tfCodeImmutable: true, tfABIImmutable: true }
      assertInvalid(tx, message)
    })

    it('throws w/ a flag outside the ContractCreate flags', function () {
      tx.Flags = 0x00100000
      assertInvalid(tx, 'ContractCreate: invalid Flags')
    })

    it('throws w/ neither ContractCode nor ContractHash', function () {
      delete tx.ContractCode
      assertInvalid(
        tx,
        'ContractCreate: must set either ContractCode or ContractHash',
      )
    })

    it('throws w/ both ContractCode and ContractHash', function () {
      tx.ContractHash = CONTRACT_HASH
      assertInvalid(
        tx,
        'ContractCreate: cannot set both ContractCode and ContractHash',
      )
    })

    it('throws w/ invalid ContractCode', function () {
      tx.ContractCode = 'not hex'
      assertInvalid(tx, 'ContractCreate: invalid field ContractCode')
    })

    it('verifies ContractCode of exactly 200000 bytes', function () {
      tx.ContractCode = '00'.repeat(200000)
      assertValid(tx)
    })

    it('throws w/ ContractCode over 200000 bytes', function () {
      tx.ContractCode = '00'.repeat(200001)
      assertInvalid(tx, 'ContractCreate: ContractCode exceeds 200000 bytes')
    })

    it('throws w/ invalid ContractHash', function () {
      delete tx.ContractCode
      tx.ContractHash = 'ABCD'
      assertInvalid(tx, 'ContractCreate: invalid field ContractHash')
    })

    it('throws w/ invalid URI', function () {
      tx.URI = 'not hex'
      assertInvalid(tx, 'ContractCreate: invalid field URI')
    })
  })

  describe('Functions', function () {
    it('verifies ContractHash with Functions that ContractCode would reject', function () {
      delete tx.ContractCode
      tx.ContractHash = CONTRACT_HASH
      tx.Functions = [makeFunction('AA'), makeFunction('AA')]
      assertValid(tx)
    })

    it('verifies a Function without Parameters', function () {
      tx.Functions = [{ Function: { FunctionName: 'AA' } }]
      assertValid(tx)
    })

    it('throws w/ invalid Functions', function () {
      tx.Functions = [{ Function: {} }] as any
      assertInvalid(tx, 'ContractCreate: invalid field Functions')
      tx.Functions = 'not an array' as any
      assertInvalid(tx, 'ContractCreate: invalid field Functions')
    })

    it('throws w/ ContractCode but no Functions', function () {
      delete tx.Functions
      assertInvalid(
        tx,
        'ContractCreate: Functions is required when ContractCode is set',
      )
    })

    it('throws w/ ContractCode and empty Functions', function () {
      tx.Functions = []
      assertInvalid(tx, 'ContractCreate: Functions must not be empty')
    })

    it('throws w/ more than 32 Functions', function () {
      tx.Functions = Array.from({ length: 33 }, (_, idx) =>
        makeFunction(idx.toString(16).padStart(2, '0')),
      )
      assertInvalid(
        tx,
        'ContractCreate: Functions must not have more than 32 entries',
      )
    })

    it('throws w/ duplicate FunctionName', function () {
      tx.Functions = [makeFunction('AA'), makeFunction('aa')]
      assertInvalid(tx, 'ContractCreate: duplicate FunctionName in Functions')
    })

    it('throws w/ a Function with more than 8 Parameters', function () {
      tx.Functions = [makeFunction('AA', 9)]
      assertInvalid(
        tx,
        'ContractCreate: a Function must not have more than 8 Parameters',
      )
    })

    it('throws w/ a Function Parameter missing ParameterFlag', function () {
      tx.Functions = [
        {
          Function: {
            FunctionName: 'AA',
            Parameters: [{ Parameter: { ParameterType: { type: 'UINT8' } } }],
          },
        },
      ]
      assertInvalid(
        tx,
        'ContractCreate: each Function Parameter requires ParameterFlag',
      )
    })

    it('throws w/ a Function Parameter missing ParameterType', function () {
      tx.Functions = [
        {
          Function: {
            FunctionName: 'AA',
            Parameters: [{ Parameter: { ParameterFlag: 0 } }],
          },
        },
      ]
      assertInvalid(
        tx,
        'ContractCreate: each Function Parameter requires ParameterType',
      )
    })

    it('throws w/ an invalid ParameterFlag in a Function Parameter', function () {
      tx.Functions = [
        {
          Function: {
            FunctionName: 'AA',
            Parameters: [
              {
                Parameter: {
                  ParameterFlag: 0x00080000,
                  ParameterType: { type: 'UINT8' },
                },
              },
            ],
          },
        },
      ]
      assertInvalid(tx, 'ContractCreate: invalid ParameterFlag in Functions')
    })
  })

  describe('InstanceParameters and InstanceParameterValues', function () {
    it('verifies every ParameterType and ParameterValue type name', function () {
      const typeNames = [
        'UINT8',
        'UINT16',
        'UINT32',
        'UINT64',
        'UINT128',
        'UINT160',
        'UINT192',
        'UINT256',
        'VL',
        'ACCOUNT',
        'AMOUNT',
        'ISSUE',
        'CURRENCY',
        'NUMBER',
      ]
      for (const type of typeNames) {
        tx.InstanceParameters = [
          {
            InstanceParameter: { ParameterFlag: 0, ParameterType: { type } },
          },
        ] as any
        tx.InstanceParameterValues = [
          makeInstanceParameterValue(0, { type, value: '00' } as any),
        ]
        assertValid(tx)
      }
    })

    it('throws w/ an unknown ParameterType type name', function () {
      tx.InstanceParameters = [
        {
          InstanceParameter: {
            ParameterFlag: 0,
            ParameterType: { type: 'UINT512' },
          },
        },
      ] as any
      assertInvalid(tx, 'ContractCreate: invalid field InstanceParameters')
    })

    it('throws w/ an InstanceParameter missing ParameterType', function () {
      tx.InstanceParameters = [
        { InstanceParameter: { ParameterFlag: 0 } },
      ] as any
      assertInvalid(tx, 'ContractCreate: invalid field InstanceParameters')
    })

    it('throws w/ empty InstanceParameters', function () {
      tx.InstanceParameters = []
      assertInvalid(tx, 'ContractCreate: InstanceParameters must not be empty')
    })

    it('throws w/ more than 8 InstanceParameters', function () {
      tx.InstanceParameters = Array.from({ length: 9 }, () =>
        makeInstanceParameter(),
      )
      assertInvalid(
        tx,
        'ContractCreate: InstanceParameters must not have more than 8 entries',
      )
    })

    it('throws w/ an invalid ParameterFlag in InstanceParameters', function () {
      tx.InstanceParameters = [makeInstanceParameter(1)]
      assertInvalid(
        tx,
        'ContractCreate: invalid ParameterFlag in InstanceParameters',
      )
    })

    it('throws w/ an unknown ParameterValue type name', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(0, { type: 'STRING', value: 'x' } as any),
      ]
      assertInvalid(tx, 'ContractCreate: invalid field InstanceParameterValues')
    })

    it('throws w/ a ParameterValue without value', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(0, { type: 'UINT8' } as any),
      ]
      assertInvalid(tx, 'ContractCreate: invalid field InstanceParameterValues')
    })

    it('throws w/ empty InstanceParameterValues', function () {
      tx.InstanceParameterValues = []
      assertInvalid(
        tx,
        'ContractCreate: InstanceParameterValues must not be empty',
      )
    })

    it('throws w/ more than 8 InstanceParameterValues', function () {
      delete tx.InstanceParameters
      tx.InstanceParameterValues = Array.from({ length: 9 }, () =>
        makeInstanceParameterValue(),
      )
      assertInvalid(
        tx,
        'ContractCreate: InstanceParameterValues must not have more than 8 entries',
      )
    })

    it('throws w/ an invalid ParameterFlag in InstanceParameterValues', function () {
      tx.InstanceParameterValues = [makeInstanceParameterValue(0x80000000)]
      assertInvalid(
        tx,
        'ContractCreate: invalid ParameterFlag in InstanceParameterValues',
      )
    })

    it('throws w/ InstanceParameterValues not matching InstanceParameters', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(),
        makeInstanceParameterValue(),
      ]
      assertInvalid(
        tx,
        'ContractCreate: InstanceParameterValues must have one entry per InstanceParameters entry',
      )
    })

    it('verifies InstanceParameterValues without InstanceParameters', function () {
      delete tx.InstanceParameters
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(),
        makeInstanceParameterValue(),
      ]
      assertValid(tx)
    })
  })

  describe('flagged InstanceParameterValues', function () {
    it('verifies a tfSendAmount value with XRP, IOU and MPT', function () {
      const amounts = [
        '1000',
        { currency: 'USD', issuer: ISSUER, value: '1.5' },
        { mpt_issuance_id: MPT_ISSUANCE_ID, value: '10' },
      ]
      for (const value of amounts) {
        tx.InstanceParameterValues = [
          makeInstanceParameterValue(ContractParameterFlags.tfSendAmount, {
            type: 'AMOUNT',
            value,
          }),
        ]
        assertValid(tx)
      }
    })

    it('verifies a tfSendNFToken value with a UINT256', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfSendNFToken, {
          type: 'UINT256',
          value: NFTOKEN_ID,
        }),
      ]
      assertValid(tx)
    })

    it('verifies a combined parameter flag that matches no single rule', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(
          ContractParameterFlags.tfSendAmount +
            ContractParameterFlags.tfSendNFToken,
        ),
      ]
      assertValid(tx)
    })

    it('throws w/ tfSendAmount holding a non-AMOUNT value', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfSendAmount),
      ]
      assertInvalid(
        tx,
        'ContractCreate: a tfSendAmount parameter must hold an AMOUNT ParameterValue',
      )
    })

    it('throws w/ tfSendAmount of a non-positive amount', function () {
      const amounts = [
        '0',
        '-5',
        { currency: 'USD', issuer: ISSUER, value: '0' },
        { mpt_issuance_id: MPT_ISSUANCE_ID, value: '0' },
      ]
      for (const value of amounts) {
        tx.InstanceParameterValues = [
          makeInstanceParameterValue(ContractParameterFlags.tfSendAmount, {
            type: 'AMOUNT',
            value,
          }),
        ]
        assertInvalid(
          tx,
          'ContractCreate: a tfSendAmount parameter must send a positive amount',
        )
      }
    })

    it('throws w/ tfSendAmount of an MPT amount over the maximum', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfSendAmount, {
          type: 'AMOUNT',
          value: {
            mpt_issuance_id: MPT_ISSUANCE_ID,
            value: '9223372036854775808',
          },
        }),
      ]
      assertInvalid(
        tx,
        'ContractCreate: a tfSendAmount parameter must not send more than 9223372036854775807 of an MPT',
      )
    })

    it('throws w/ tfSendAmount of a token with the XRP currency code', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfSendAmount, {
          type: 'AMOUNT',
          value: {
            currency: '0000000000000000000000005852500000000000',
            issuer: ISSUER,
            value: '1',
          },
        }),
      ]
      assertInvalid(
        tx,
        'ContractCreate: a tfSendAmount parameter must not send a token with the XRP currency code',
      )
    })

    it('throws w/ tfSendNFToken holding a non-UINT256 value', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfSendNFToken),
      ]
      assertInvalid(
        tx,
        'ContractCreate: a tfSendNFToken parameter must hold a UINT256 ParameterValue',
      )
    })

    it('throws w/ tfAuthorizeToken', function () {
      tx.InstanceParameterValues = [
        makeInstanceParameterValue(ContractParameterFlags.tfAuthorizeToken),
      ]
      assertInvalid(
        tx,
        'ContractCreate: tfAuthorizeToken parameters are disabled',
      )
    })
  })
})
