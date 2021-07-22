import * as _ from 'lodash'
import binary from 'ripple-binary-codec'
import * as utils from './utils'
import BigNumber from 'bignumber.js'
import {decodeAccountID} from 'ripple-address-codec'
import {validate} from '../common'
import {computeBinaryTransactionHash} from '../common/hashes'

function addressToBigNumber(address) {
  const hex = Buffer.from(decodeAccountID(address)).toString('hex')
  return new BigNumber(hex, 16)
}

function compareSigners(a, b) {
  return addressToBigNumber(a.Signer.Account).comparedTo(
    addressToBigNumber(b.Signer.Account)
  )
}

function combine(signedTransactions: Array<string>): object {
  validate.combine({signedTransactions})

  // TODO: signedTransactions is an array of strings in the documentation, but
  // tests and this code handle it as an array of objects. Fix!
  const txs: any[] = signedTransactions.map(binary.decode)
  const tx = _.omit(txs[0], 'Signers')
  if (!txs.every((_tx) => _.isEqual(tx, _.omit(_tx, 'Signers')))) {
    throw new utils.common.errors.ValidationError(
      'txJSON is not the same for all signedTransactions'
    )
  }
  const unsortedSigners = txs.reduce(
    (accumulator, _tx) => accumulator.concat(_tx.Signers || []),
    []
  )
  const signers = unsortedSigners.sort(compareSigners)
  const signedTx = Object.assign({}, tx, {Signers: signers})
  const signedTransaction = binary.encode(signedTx)
  const id = computeBinaryTransactionHash(signedTransaction)
  return {signedTransaction, id}
}

export default combine
