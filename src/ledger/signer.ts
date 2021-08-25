import { BigNumber } from "bignumber.js";
import { decodeAccountID } from "ripple-address-codec";
import { ValidationError } from "../common/errors";
import { Amount } from "../models/common";
import {encode, decode} from 'ripple-binary-codec'
import {Transaction} from "../models/transactions";
import Wallet from "../Wallet";
import { computeBinaryTransactionHash } from "../offline/utils";
import { flatMap } from "lodash";
import { SignedTransaction } from "../common/types/objects";

export function sign(wallet: Wallet, tx: Transaction): SignedTransaction {
    return wallet.signTransaction(tx, { signAs: '' })
}

/**
 * The transactions should all be equal except for the 'Signers' field. 
 */
 function validateTransactionEquivalence(transactions: Transaction[]) {
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
 * If presented in binary form, the Signers array must be sorted based on 
 * the numeric value of the signer addresses, with the lowest value first. 
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html
 */
function compareSigners(a, b) {
  return addressToBigNumber(a.Signer.Account).comparedTo(
    addressToBigNumber(b.Signer.Account)
  )
}

function getTransactionWithAllSigners(transactions: Transaction[]): Transaction {
  // Signers must be sorted - see compareSigners for more details
  const sortedSigners = flatMap(transactions, tx => tx.Signers)
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
function combine(signedTransactions: string[]): SignedTransaction {
  const transactions: Transaction[] = signedTransactions.map(decode) as unknown as Transaction[];
  
  transactions.forEach(tx => verify(tx))
  validateTransactionEquivalence(transactions)

  const signedTransaction = encode(getTransactionWithAllSigners(transactions))
  return {
    signedTransaction: signedTransaction, 
    id: computeBinaryTransactionHash(signedTransaction)
  }
}

// TODO: Implement multi-sign
export function multisign(transactions: Transaction[] | string[]): SignedTransaction {

    // TODO: Check for errors 
    // - No trust line between them (Both sides)
    // - Account isn't set up for multi-signing
    // 
    
    if(transactions.length == 0) {
        throw new ValidationError("There were 0 transactions given to multisign")
    }

    let encodedTransactions: string[];
    if(typeof transactions[0] === "object") {
        encodedTransactions = transactions.map( tx => {
            return encode(JSON.parse(JSON.stringify(tx)))
        })
    } else {
        encodedTransactions = transactions as string[]
    }
    
    return combine(encodedTransactions)
}

// TODO: Implement authorize channel
export function authorizeChannel(wallet: Wallet, channelId: number, amount: Amount): SignedTransaction {
    return null
}

// TODO: Implement verify
export function verify(tx: Transaction): void {

}
