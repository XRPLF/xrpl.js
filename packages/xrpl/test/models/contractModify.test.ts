import { ContractModify } from '../../src/models/transactions'
import { validateContractModify } from '../../src/models/transactions/contractModify'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractModify)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractModify, message)

const CONTRACT_HASH =
  'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90'

/**
 * ContractModify Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractModify', function () {
  let tx: ContractModify

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractModify',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      ContractCode: '0061736D01000000',
      Functions: [{ Function: { FunctionName: '6765745F76616C7565' } }],
      InstanceParameters: [
        {
          InstanceParameter: {
            ParameterFlag: 0,
            ParameterType: { type: 'UINT8' },
          },
        },
      ],
      InstanceParameterValues: [
        {
          InstanceParameterValue: {
            ParameterFlag: 0,
            ParameterValue: { type: 'UINT8', value: 1 },
          },
        },
      ],
      URI: '68747470733A2F2F6578616D706C652E636F6D',
    }
  })

  it('verifies valid ContractModify', function () {
    assertValid(tx)
  })

  it('verifies ContractModify with only an Owner change', function () {
    tx = {
      TransactionType: 'ContractModify',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      Owner: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    }
    assertValid(tx)
  })

  it('verifies ContractModify with ContractHash', function () {
    delete tx.ContractCode
    delete tx.Functions
    tx.ContractHash = CONTRACT_HASH
    assertValid(tx)
  })

  it('verifies ContractModify without ContractAccount', function () {
    delete tx.ContractAccount
    assertValid(tx)
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 'not an account'
    assertInvalid(tx, 'ContractModify: invalid field ContractAccount')
  })

  it('throws w/ invalid Owner', function () {
    tx.Owner = 123 as any
    assertInvalid(tx, 'ContractModify: invalid field Owner')
  })

  it('throws w/ Owner equal to Account', function () {
    tx.Owner = tx.Account
    assertInvalid(tx, 'ContractModify: Owner must not be the Account')
  })

  it('throws w/ Owner equal to ContractAccount', function () {
    tx.Owner = tx.ContractAccount
    assertInvalid(tx, 'ContractModify: Owner must not be the ContractAccount')
  })

  it('throws w/ both ContractCode and ContractHash', function () {
    tx.ContractHash = CONTRACT_HASH
    assertInvalid(
      tx,
      'ContractModify: cannot set both ContractCode and ContractHash',
    )
  })

  it('throws w/ ContractCode over 200000 bytes', function () {
    tx.ContractCode = '00'.repeat(200001)
    assertInvalid(tx, 'ContractModify: ContractCode exceeds 200000 bytes')
  })

  it('throws w/ ContractCode but no Functions', function () {
    delete tx.Functions
    assertInvalid(
      tx,
      'ContractModify: Functions is required when ContractCode is set',
    )
  })

  it('throws w/ duplicate FunctionName', function () {
    tx.Functions = [
      { Function: { FunctionName: 'AA' } },
      { Function: { FunctionName: 'AA' } },
    ]
    assertInvalid(tx, 'ContractModify: duplicate FunctionName in Functions')
  })

  it('throws w/ empty InstanceParameters', function () {
    tx.InstanceParameters = []
    assertInvalid(tx, 'ContractModify: InstanceParameters must not be empty')
  })

  it('throws w/ InstanceParameterValues not matching InstanceParameters', function () {
    tx.InstanceParameters = [
      {
        InstanceParameter: {
          ParameterFlag: 0,
          ParameterType: { type: 'UINT8' },
        },
      },
      {
        InstanceParameter: {
          ParameterFlag: 0,
          ParameterType: { type: 'UINT16' },
        },
      },
    ]
    assertInvalid(
      tx,
      'ContractModify: InstanceParameterValues must have one entry per InstanceParameters entry',
    )
  })

  it('throws w/ tfAuthorizeToken in InstanceParameterValues', function () {
    tx.InstanceParameterValues = [
      {
        InstanceParameterValue: {
          ParameterFlag: 0x00040000,
          ParameterValue: { type: 'UINT8', value: 1 },
        },
      },
    ]
    assertInvalid(
      tx,
      'ContractModify: tfAuthorizeToken parameters are disabled',
    )
  })

  it('throws w/ invalid URI', function () {
    tx.URI = 'xyz'
    assertInvalid(tx, 'ContractModify: invalid field URI')
  })
})
