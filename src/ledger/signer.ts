/* eslint-disable import/max-dependencies -- These imports are required for Signer */
import { BigNumber } from "bignumber.js";
import { flatMap } from "lodash";
import { decodeAccountID } from "ripple-address-codec";
import {
  encode,
  decode,
  encodeForSigning,
  encodeForSigningClaim,
} from "ripple-binary-codec";
import {
  sign as signWithKeypair,
  verify as verifySignature,
} from "ripple-keypairs";

import { ValidationError } from "../common/errors";
import { SignedTransaction } from "../common/types/objects";
import { Signer } from "../models/common";
import { Transaction } from "../models/transactions";
import { verifyBaseTransaction } from "../models/transactions/common";
import { computeBinaryTransactionHash } from "../utils";
import Wallet from "../Wallet";

/**
 * Sign uses your wallet to cryptographically sign your transaction which proves
 * that you are the one issuing this transaction.
 *
 * @param wallet - A Wallet that holds your cryptographic keys.
 * @param tx - The Transaction that is being signed.
 * @returns A signed Transaction and a Transaction id that corresponds to the pre-signed Transaction.
 */
function sign(wallet: Wallet, tx: Transaction): SignedTransaction {
  return wallet.signTransaction(tx, { signAs: "" });
}

/**
 * The transactions should all be equal except for the 'Signers' field.
 *
 * @param transactions - An array of Transactions which are expected to be equal other than 'Signers'.
 * @throws ValidationError if the transactions are not equal in any field other than 'Signers'.
 */
function validateTransactionEquivalence(transactions: Transaction[]): void {
  const exampleTransaction = JSON.stringify({
    ...transactions[0],
    Signers: null,
  });
  if (
    transactions
      .slice(1)
      .some(
        (tx) => JSON.stringify({ ...tx, Signers: null }) !== exampleTransaction
      )
  ) {
    throw new ValidationError(
      "txJSON is not the same for all signedTransactions"
    );
  }
}

function addressToBigNumber(address: string): BigNumber {
  const hex = Buffer.from(decodeAccountID(address)).toString("hex");
  const numberOfBitsInHex = 16;
  return new BigNumber(hex, numberOfBitsInHex);
}

/**
 * If presented in binary form, the Signers array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param left - A Signer to compare with.
 * @param right - A second Signer to compare with.
 * @returns 1 if left \> right, 0 if left = right, -1 if left \< right, and null if left or right are NaN.
 */
function compareSigners(left: Signer, right: Signer): number {
  return addressToBigNumber(left.Account).comparedTo(
    addressToBigNumber(right.Account)
  );
}

function getTransactionWithAllSigners(
  transactions: Transaction[]
): Transaction {
  // flatMap let's us go from Transaction[] with Signer[] to one Signer[]
  const sortedSigners: Array<{ Signer: Signer }> = flatMap(
    transactions,
    (tx) => tx.Signers?.map((signer) => signer.Signer) ?? []
  )
    // Signers must be sorted - see compareSigners for more details
    .sort(compareSigners)
    .map((signer) => {
      return {
        Signer: signer,
      };
    });

  return { ...transactions[0], Signers: sortedSigners };
}

/**
 * Combine takes a collection of signedTransactions with the same underlying transaction and produces a
 * Transaction with all Signers. It then signs that Transaction and gives an id based on the combined Transaction.
 *
 * @param signedTransactions - A collection of the same transaction signed by different signers. The only difference
 * between the elements of signedTransactions should be the Signers field.
 * @returns An object with the combined transaction (now having a sorted list of all signers) which is encoded, along
 * with a transaction id based on the combined transaction.
 */
function combine(signedTransactions: string[]): SignedTransaction {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Type assertions let us use well-typed transactions
  const transactions: Transaction[] = signedTransactions.map((tx: string) => {
    return decode(tx);
  }) as unknown as Transaction[];

  transactions.forEach((tx) => verifyBaseTransaction(tx));
  validateTransactionEquivalence(transactions);

  const signedTransaction = encode(getTransactionWithAllSigners(transactions));
  return {
    signedTransaction,
    id: computeBinaryTransactionHash(signedTransaction),
  };
}

function getDecodedTransaction(txOrBlob: Transaction | string): Transaction {
  if (typeof txOrBlob === "object") {
    return txOrBlob;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Type assertions let us use well-typed transactions
  return decode(txOrBlob) as unknown as Transaction;
}

function getEncodedTransaction(txOrBlob: Transaction | string): string {
  if (typeof txOrBlob === "object") {
    return encode(JSON.parse(JSON.stringify(txOrBlob)));
  }
  return txOrBlob;
}

/**
 * Multisign takes several transactions (in object or blob form) and creates a single transaction with all Signers
 * that then gets signed and returned.
 *
 * @param transactions - An array of Transactions (in object or blob form) to combine and sign.
 * @returns A single signed Transaction which has all Signers from transactions within it.
 * @throws ValidationError if:
 * - There were no transactions given to sign
 * - The SigningPubKey field is not the empty string in any given transaction
 * - Any transaction is missing a Signers field.
 */
function multisign(
  transactions: Array<Transaction | string>
): SignedTransaction {
  if (transactions.length === 0) {
    throw new ValidationError("There were 0 transactions given to multisign");
  }

  transactions.forEach((txOrBlob) => {
    const tx = getDecodedTransaction(txOrBlob);
    verifyBaseTransaction(tx);

    if (tx.SigningPubKey !== "") {
      throw new ValidationError(
        "For multisigning the transaction must include the SigningPubKey field as an empty string."
      );
    }

    if (tx.Signers === undefined) {
      throw new ValidationError(
        "For multisigning the transaction must include a Signers field containing an array of signatures."
      );
    }
  });

  const encodedTransactions: string[] = transactions.map((txOrBlob) =>
    getEncodedTransaction(txOrBlob)
  );

  return combine(encodedTransactions);
}

/**
 * AuthorizeChannel creates a signature that can be used to redeem a specific amount of XRP from a payment channel.
 *
 * @param wallet - The account that will sign for this payment channel.
 * @param channelId - An id for the payment channel to redeem XRP from.
 * @param amount - The amount in drops to redeem.
 * @returns A signature that can be used to redeem a specific amount of XRP from a payment channel.
 */
function authorizeChannel(
  wallet: Wallet,
  channelId: string,
  amount: string
): string {
  const signingData = encodeForSigningClaim({
    channel: channelId,
    amount,
  });

  return signWithKeypair(signingData, wallet.privateKey);
}

/**
 * Verifies that the given transaction has a valid signature based on public-key encryption.
 *
 * @param tx - A transaction to verify the signature of. (Can be in object or encoded string format).
 * @returns Returns true if tx has a valid signature, and returns false otherwise.
 */
function verify(tx: Transaction | string): boolean {
  const decodedTx: Transaction = getDecodedTransaction(tx);
  return verifySignature(
    encodeForSigning(decodedTx),
    decodedTx.TxnSignature,
    decodedTx.SigningPubKey
  );
}

// eslint-disable-next-line import/no-unused-modules -- It will be used by users of the library
export { sign, multisign, authorizeChannel, verify };
