import * as _ from 'lodash'
import binary from 'ripple-binary-codec'
import * as utils from './utils'
import BigNumber from 'bignumber.js'
import {decodeAccountID} from 'ripple-address-codec'
import {validate} from '../common'
import {computeBinaryTransactionHash} from '../common/hashes'
import { JsonObject } from 'ripple-binary-codec/dist/types/serialized-type'

//The transactions should all be equal EXCEPT for the Signers field
function validateAllSignedTransactionsAreEqual( transactions : Array<JsonObject> ) {
  const tx = transactions[0];
  const _txSignersTemp = tx.Signers;
  delete tx.Signers
  
  transactions.forEach( _tx => {
      const _txSignersTemp = _tx.Signers
      delete _tx.Signers;
      
      if ( JSON.stringify(tx) !== JSON.stringify(_tx)) {
          throw new utils.common.errors.ValidationError('txJSON is not the same for all signedTransactions')
      }

      _tx.Signers = _txSignersTemp
  })

  tx.Signers = _txSignersTemp
  return transactions
}

function addressToBigNumber(address) {
  const hex = Buffer.from(decodeAccountID(address)).toString('hex')
  return new BigNumber(hex, 16)
}

function compareSigners(a, b) {
  return addressToBigNumber(a.Signer.Account).comparedTo(
    addressToBigNumber(b.Signer.Account)
  )
}

function getATransactionWithAllSigners(transactions : Array<JsonObject>) : JsonObject {
  const unsortedSigners = _.reduce(
    transactions,
    (accumulator, _tx) => accumulator.concat(_tx.Signers || []),
    []
  )
  //The documentation requires signers to be sorted
  const sortedSigners = unsortedSigners.sort(compareSigners)
  const tx = transactions[0];
  tx.Signers = sortedSigners

  return tx
}

/**
 * 
 * @param signedTransactions A collection of the same transaction signed by different signers. The only difference
 * between the elements of signedTransactions should be the Signers field.
 * @returns An object with the combined transaction (now having a sorted list of all signers) which is encoded, along
 * with a transaction id based on the combined transaction.
 */
function combine(signedTransactions: Array<string>): object {
  validate.combine({signedTransactions})

  const transactions: JsonObject[] = signedTransactions.map(binary.decode);
  validateAllSignedTransactionsAreEqual(transactions)

  const oneTxWithAllSigners = getATransactionWithAllSigners(transactions)
  const signedTransaction = binary.encode(oneTxWithAllSigners)
  const id = computeBinaryTransactionHash(signedTransaction)
  return {signedTransaction, id}
}

export default combine
