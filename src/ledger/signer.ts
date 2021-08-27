import { BigNumber } from "bignumber.js";
import { decodeAccountID } from "ripple-address-codec";
import { ValidationError } from "../common/errors";
import { encode, decode, encodeForSigningClaim } from 'ripple-binary-codec'
import { Transaction } from "../models/transactions";
import Wallet from "../Wallet";
import { computeBinaryTransactionHash } from "../utils";
import { flatMap } from "lodash";
import { SignedTransaction } from "../common/types/objects";
import { verifyBaseTransaction } from "../models/transactions/common";
import { sign as signWithKeypair, verify as verifySignature } from 'ripple-keypairs'

function sign(wallet: Wallet, tx: Transaction): SignedTransaction {
    verifyBaseTransaction(tx)
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

function getDecodedTransaction(txOrBlob: (Transaction | string)): Transaction {
  if(typeof (txOrBlob) === "object") {
      return txOrBlob as Transaction
  } else {
      return decode(txOrBlob) as unknown as Transaction
  }
}

function getEncodedTransaction(txOrBlob: (Transaction | string)): string {
  if(typeof txOrBlob === "object") {
      return encode(JSON.parse(JSON.stringify(txOrBlob)))
  } else {
      return txOrBlob as string
  }
}

function multisign(transactions: Transaction[] | string[]): SignedTransaction {
    
    if(transactions.length == 0) {
        throw new ValidationError("There were 0 transactions given to multisign")
    }

    transactions.forEach(txOrBlob => {
        const tx = getDecodedTransaction(txOrBlob)
        verifyBaseTransaction(tx)

        if(tx.SigningPubKey !== "") {
            throw new ValidationError("For multisigning the transaction must include the SigningPubKey field as an empty string.")
        }
    
        if(tx.Signers === undefined) {
            throw new ValidationError("For multisigning the transaction must include a Signers field containing an array of signatures.")
        }
    })

    const encodedTransactions: string[] = transactions.map(txOrBlob => getEncodedTransaction(txOrBlob))
    
    return combine(encodedTransactions)
}

function authorizeChannel(wallet: Wallet, channelId: string, amount: string): string {
    const signingData = encodeForSigningClaim({
      channel: channelId,
      amount: amount
    })
    console.log("Signing Data:")
    console.log(signingData)
    return signWithKeypair(signingData, wallet.privateKey)
}

function verify(tx: Transaction): void {
  //Verify tx.TxnSignature by using tx.SigningPubKey
  //TODO: Check whether we need to remove the TxnSignature and SigningPubKey fields before encoding
  verifySignature(encode(tx), tx.TxnSignature, tx.SigningPubKey)
}

export { sign, multisign, authorizeChannel, verify }