import { BigNumber } from "bignumber.js";
import { decodeAccountID } from "ripple-address-codec";
import { ValidationError } from "../common/errors";
import { encode, decode } from 'ripple-binary-codec'
import { Transaction } from "../models/transactions";
import Wallet from "../Wallet";
import { computeBinaryTransactionHash, signPaymentChannelClaim } from "../utils";
import { flatMap } from "lodash";
import { SignedTransaction } from "../common/types/objects";
import { verifyBaseTransaction } from "../models/transactions/common";

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

function multisign(transactions: Transaction[] | string[]): SignedTransaction {
    
    if(transactions.length == 0) {
        throw new ValidationError("There were 0 transactions given to multisign")
    }

    transactions.forEach(tx => {
        verifyBaseTransaction(tx)

        if(tx.SigningPubKey !== "") {
            throw new ValidationError("For multisigning the transaction must include the SigningPubKey field as an empty string.")
        }
    
        if(tx.Signers === undefined) {
            throw new ValidationError("For multisigning the transaction must include a Signers field containing an array of signatures.")
        }
    })

    let encodedTransactions: string[];
    if(typeof (transactions[0]) === "object") {
        encodedTransactions = (transactions as Transaction[]).map( tx => {
            return encode(JSON.parse(JSON.stringify(tx)))
        })
    } else {
        encodedTransactions = transactions as string[]
    }
    
    return combine(encodedTransactions)
}

function authorizeChannel(wallet: Wallet, channelId: string, amount: string): string {

    //const amount64 = Number(amount).toString(16).padStart(16, '0')
    //const paymentChannelClaimPrefix = '434c4d00'
    //const encodedAuthorization = `${paymentChannelClaimPrefix}${channelId}${amount64}`
    //wallet.signTransaction
    //encodeAccountPublic(wallet.publicKey)
    //wallet.signTransaction

    return signPaymentChannelClaim(channelId, amount, wallet.privateKey)
}
/*
    //channelId concat with the xrp amount in drops

    let keyType;
    if(wallet.privateKey.startsWith(0xED.toString())){
        keyType = "ed25519"
    } else {
        keyType = "secp256k1"
    }

    const amount64 = Number(amount).toString(16).padStart(16, '0')
    const paymentChannelClaimPrefix = '434c4d00'
    const encodedAuthorization = `${paymentChannelClaimPrefix}${channelId}${amount64}`
    //wallet.signTransaction
    //encodeAccountPublic(wallet.publicKey)
    wallet.signTransaction
    

    return null */
//}

// TODO: Implement verify
function verify(tx: Transaction): void {
    return null
}

export { sign, multisign, authorizeChannel, verify }