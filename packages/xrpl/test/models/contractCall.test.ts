import {
  ContractCall,
  ContractParameterFlags,
} from '../../src/models/transactions'
import { validateContractCall } from '../../src/models/transactions/contractCall'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateContractCall)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractCall, message)

/**
 * ContractCall Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractCall', function () {
  let tx: ContractCall

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractCall',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      FunctionName: '6765745F76616C7565',
      Gas: 100000,
      Parameters: [
        {
          Parameter: {
            ParameterFlag: 0,
            ParameterType: { type: 'UINT32' },
            ParameterValue: { type: 'UINT32', value: 42 },
          },
        },
        { Parameter: { ParameterValue: { type: 'VL', value: 'ABCD' } } },
      ],
    }
  })

  it('verifies valid ContractCall', function () {
    assertValid(tx)
  })

  it('verifies ContractCall without Parameters', function () {
    delete tx.Parameters
    assertValid(tx)
  })

  it('verifies tfSendAmount and tfSendNFToken Parameters', function () {
    tx.Parameters = [
      {
        Parameter: {
          ParameterFlag: ContractParameterFlags.tfSendAmount,
          ParameterValue: { type: 'AMOUNT', value: '1000000' },
        },
      },
      {
        Parameter: {
          ParameterFlag: ContractParameterFlags.tfSendNFToken,
          ParameterValue: {
            type: 'UINT256',
            value:
              '000800006203F49C21D5D6E022CB16DE3538F248662FC73C00000099B0000000',
          },
        },
      },
    ]
    assertValid(tx)
  })

  it('verifies Gas at the bounds', function () {
    tx.Gas = 1
    assertValid(tx)
    tx.Gas = 2000000
    assertValid(tx)
  })

  it('throws w/ missing ContractAccount', function () {
    delete (tx as any).ContractAccount
    assertInvalid(tx, 'ContractCall: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 'not an account'
    assertInvalid(tx, 'ContractCall: invalid field ContractAccount')
  })

  it('throws w/ missing FunctionName', function () {
    delete (tx as any).FunctionName
    assertInvalid(tx, 'ContractCall: missing field FunctionName')
  })

  it('throws w/ invalid FunctionName', function () {
    tx.FunctionName = 'get_value'
    assertInvalid(tx, 'ContractCall: invalid field FunctionName')
  })

  it('throws w/ missing Gas', function () {
    delete (tx as any).Gas
    assertInvalid(tx, 'ContractCall: missing field Gas')
  })

  it('throws w/ invalid Gas', function () {
    tx.Gas = '100' as any
    assertInvalid(tx, 'ContractCall: invalid field Gas')
  })

  it('throws w/ Gas of zero', function () {
    tx.Gas = 0
    assertInvalid(tx, 'ContractCall: Gas must be an integer from 1 to 2000000')
  })

  it('throws w/ Gas over 2000000', function () {
    tx.Gas = 2000001
    assertInvalid(tx, 'ContractCall: Gas must be an integer from 1 to 2000000')
  })

  it('throws w/ fractional Gas', function () {
    tx.Gas = 1.5
    assertInvalid(tx, 'ContractCall: Gas must be an integer from 1 to 2000000')
  })

  it('throws w/ invalid Parameters', function () {
    tx.Parameters = [{ ParameterFlag: 0 }] as any
    assertInvalid(tx, 'ContractCall: invalid field Parameters')
    tx.Parameters = [{ Parameter: { ParameterType: { type: 'BOOL' } } }] as any
    assertInvalid(tx, 'ContractCall: invalid field Parameters')
    tx.Parameters = [{ Parameter: { ParameterFlag: -1 } }] as any
    assertInvalid(tx, 'ContractCall: invalid field Parameters')
  })

  it('throws w/ an invalid ParameterFlag', function () {
    tx.Parameters = [{ Parameter: { ParameterFlag: 0x00080000 } }]
    assertInvalid(tx, 'ContractCall: invalid ParameterFlag in Parameters')
  })

  it('throws w/ tfSendAmount without an AMOUNT value', function () {
    tx.Parameters = [
      { Parameter: { ParameterFlag: ContractParameterFlags.tfSendAmount } },
    ]
    assertInvalid(
      tx,
      'ContractCall: a tfSendAmount parameter must hold an AMOUNT ParameterValue',
    )
  })

  it('throws w/ tfSendAmount of a non-positive amount', function () {
    tx.Parameters = [
      {
        Parameter: {
          ParameterFlag: ContractParameterFlags.tfSendAmount,
          ParameterValue: {
            type: 'AMOUNT',
            value: {
              currency: 'USD',
              issuer: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
              value: '-1',
            },
          },
        },
      },
    ]
    assertInvalid(
      tx,
      'ContractCall: a tfSendAmount parameter must send a positive amount',
    )
  })

  it('throws w/ tfSendNFToken without a UINT256 value', function () {
    tx.Parameters = [
      {
        Parameter: {
          ParameterFlag: ContractParameterFlags.tfSendNFToken,
          ParameterValue: { type: 'UINT128', value: '00' },
        },
      },
    ]
    assertInvalid(
      tx,
      'ContractCall: a tfSendNFToken parameter must hold a UINT256 ParameterValue',
    )
  })

  it('throws w/ tfAuthorizeToken', function () {
    tx.Parameters = [
      { Parameter: { ParameterFlag: ContractParameterFlags.tfAuthorizeToken } },
    ]
    assertInvalid(tx, 'ContractCall: tfAuthorizeToken parameters are disabled')
  })
})
