import * as _ from 'lodash'
import binary from 'ripple-binary-codec'
import BigNumber from 'bignumber.js'
import {ValidationError} from '../common/errors'
import {decodeAccountID} from 'ripple-address-codec'
import {validate} from '../common'
import {computeBinaryTransactionHash} from '../common/hashes'
import {JsonObject} from 'ripple-binary-codec/dist/types/serialized-type'

/**
 * The transactions should all be equal EXCEPT for the 'Signers' field. 
 */
 function validateTransactionEquality(transactions: Array<JsonObject>) {
  const exampleTransaction = JSON.stringify({...transactions[0], Signers: null})
  if (transactions.slice(1).some(tx => JSON.stringify({...tx, Signers: null}) !== exampleTransaction)) {
    throw new ValidationError('txJSON is not the same for all signedTransactions')
  }
}

function addressToBigNumber(address) {
  const hex = Buffer.from(decodeAccountID(address)).toString('hex')
  return new BigNumber(hex, 16)
}

/**
 * According to the documentation on multi-signatures:
 * If presented in binary form, the Signers array must be sorted based on 
 * the numeric value of the signer addresses, with the lowest value first. 
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 */
function compareSigners(a, b) {
  return addressToBigNumber(a.Signer.Account).comparedTo(
    addressToBigNumber(b.Signer.Account)
  )
}

function getATransactionWithAllSigners(transactions: Array<JsonObject>): JsonObject {
  // Signers must be sorted - see compareSigners for more details
  const sortedSigners = _.flatMap(transactions, tx => tx.Signers)
    .filter(signer => signer)
    .sort(compareSigners)

  return {...transactions[0], Signers: sortedSigners}
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
  validateTransactionEquality(transactions)

  const encodedTransaction = binary.encode(getATransactionWithAllSigners(transactions))
  return {
    encodedTransaction, 
    id: computeBinaryTransactionHash(encodedTransaction)
  }
}

export default combine
