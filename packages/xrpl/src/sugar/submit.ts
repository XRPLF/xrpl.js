import { decode, encode } from 'ripple-binary-codec'

import type {
  Client,
  SubmitRequest,
  SubmitResponse,
  SubmittableTransaction,
  Transaction,
  Wallet,
} from '..'
import { ValidationError, XrplError } from '../errors'
import { Signer } from '../models/common'
import { TxResponse } from '../models/methods'
import { BaseTransaction } from '../models/transactions/common'

/** Approximate time for a ledger to close, in milliseconds */
const LEDGER_CLOSE_TIME = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Helper functions

/**
 * Submits a request to the client with a signed transaction.
 *
 * @param client - The client to submit the request to.
 * @param signedTransaction - The signed transaction to submit. It can be either a Transaction object or a
 * string (encode from ripple-binary-codec) representation of the transaction.
 * @param [failHard=false] - Optional. Determines whether the submission should fail hard (true) or not (false). Default is false.
 * @returns A promise that resolves with the response from the client.
 * @throws {ValidationError} If the signed transaction is not valid (not signed).
 *
 * @example
 * import { Client } from "xrpl"
 * const client = new Client("wss://s.altnet.rippletest.net:51233");
 * await client.connect();
 * const signedTransaction = createSignedTransaction();
 * // Example 1: Submitting a Transaction object
 * const response1 = await submitRequest(client, signedTransaction);
 *
 * // Example 2: Submitting a string representation of the transaction
 * const signedTransactionString = encode(signedTransaction);
 * const response2 = await submitRequest(client, signedTransactionString, true);
 */
export async function submitRequest(
  client: Client,
  signedTransaction: SubmittableTransaction | string,
  failHard = false,
): Promise<SubmitResponse> {
  if (!isSigned(signedTransaction)) {
    throw new ValidationError('Transaction must be signed')
  }

  const signedTxEncoded =
    typeof signedTransaction === 'string'
      ? signedTransaction
      : encode(signedTransaction)
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: signedTxEncoded,
    fail_hard: isAccountDelete(signedTransaction) || failHard,
  }
  return client.request(request)
}

/**
 * Waits for the final outcome of a transaction by polling the ledger until the result can be considered final,
 * meaning it has either been included in a validated ledger, or the transaction's lastLedgerSequence has been
 * surpassed by the latest ledger sequence (meaning it will never be included in a validated ledger).
 *
 * @template T - The type of the transaction. Defaults to `Transaction`.
 * @param client - The client to use for requesting transaction information.
 * @param txHash - The hash of the transaction to wait for.
 * @param lastLedger - The last ledger sequence of the transaction.
 * @param submissionResult - The preliminary result of the transaction.
 * @returns A promise that resolves with the final transaction response.
 *
 * @throws {XrplError} If the latest ledger sequence surpasses the transaction's lastLedgerSequence.
 *
 * @example
 * import { hashes, Client } from "xrpl"
 * const client = new Client("wss://s.altnet.rippletest.net:51233")
 * await client.connect()
 *
 * const transaction = createTransaction() // your transaction function
 *
 * const signedTx = await getSignedTx(this, transaction)
 *
 * const lastLedger = getLastLedgerSequence(signedTx)
 *
 * if (lastLedger == null) {
 *   throw new ValidationError(
 *     'Transaction must contain a LastLedgerSequence value for reliable submission.',
 *   )
 * }
 *
 * const response = await submitRequest(this, signedTx, opts?.failHard)
 *
 * const txHash = hashes.hashSignedTx(signedTx)
 * return waitForFinalTransactionOutcome(
 *   this,
 *   txHash,
 *   lastLedger,
 *   response.result.engine_result,
 * )
 */
// eslint-disable-next-line max-params, max-lines-per-function -- this function needs to display and do with more information.
export async function waitForFinalTransactionOutcome<
  T extends BaseTransaction = SubmittableTransaction,
>(
  client: Client,
  txHash: string,
  lastLedger: number,
  submissionResult: string,
): Promise<TxResponse<T>> {
  await sleep(LEDGER_CLOSE_TIME)

  const latestLedger = await client.getLedgerIndex()

  if (lastLedger < latestLedger) {
    throw new XrplError(
      `The latest ledger sequence ${latestLedger} is greater than the transaction's LastLedgerSequence (${lastLedger}).\n` +
        `Preliminary result: ${submissionResult}`,
    )
  }

  const txResponse = await client
    .request({
      command: 'tx',
      transaction: txHash,
    })
    .catch(async (error) => {
      // error is of an unknown type and hence we assert type to extract the value we need.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-member-access -- ^
      const message = error?.data?.error as string
      if (message === 'txnNotFound') {
        return waitForFinalTransactionOutcome<T>(
          client,
          txHash,
          lastLedger,
          submissionResult,
        )
      }
      throw new Error(
        `${message} \n Preliminary result: ${submissionResult}.\nFull error details: ${String(
          error,
        )}`,
      )
    })

  if (txResponse.result.validated) {
    // TODO: resolve the type assertion below
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know that txResponse is of type TxResponse
    return txResponse as TxResponse<T>
  }

  return waitForFinalTransactionOutcome<T>(
    client,
    txHash,
    lastLedger,
    submissionResult,
  )
}

// checks if the transaction has been signed
function isSigned(transaction: SubmittableTransaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  if (typeof tx === 'string') {
    return false
  }
  if (tx.Signers != null) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know that tx.Signers is an array of Signers
    const signers = tx.Signers as Signer[]
    for (const signer of signers) {
      // eslint-disable-next-line max-depth -- necessary for checking if signer is signed
      if (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- necessary check
        signer.Signer.SigningPubKey == null ||
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- necessary check
        signer.Signer.TxnSignature == null
      ) {
        return false
      }
    }
    return true
  }
  return tx.SigningPubKey != null && tx.TxnSignature != null
}

/**
 * Updates a transaction with `autofill` then signs it if it is unsigned.
 *
 * @param client - The client from which to retrieve the signed transaction.
 * @param transaction - The transaction to retrieve. It can be either a Transaction object or
 * a string (encode from ripple-binary-codec) representation of the transaction.
 * @param [options={}] - Optional. Additional options for retrieving the signed transaction.
 * @param [options.autofill=true] - Optional. Determines whether the transaction should be autofilled (true)
 * or not (false). Default is true.
 * @param [options.wallet] - Optional. A wallet to sign the transaction. It must be provided when submitting
 * an unsigned transaction. Default is undefined.
 * @returns A promise that resolves with the signed transaction.
 *
 * @throws {ValidationError} If the transaction is not signed and no wallet is provided.
 *
 * @example
 * import { Client } from "xrpl"
 * import { encode } from "ripple-binary-codec"
 *
 * const client = new Client("wss://s.altnet.rippletest.net:51233");
 * await client.connect():
 * const transaction = createTransaction(); // createTransaction is your function to create a transaction
 * const options = {
 *   autofill: true,
 *   wallet: myWallet,
 * };
 *
 * // Example 1: Retrieving a signed Transaction object
 * const signedTx1 = await getSignedTx(client, transaction, options);
 *
 * // Example 2: Retrieving a string representation of the signed transaction
 * const signedTxString = await getSignedTx(client, encode(transaction), options);
 */
export async function getSignedTx(
  client: Client,
  transaction: SubmittableTransaction | string,
  {
    autofill = true,
    wallet,
  }: {
    // If true, autofill a transaction.
    autofill?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
  } = {},
): Promise<SubmittableTransaction | string> {
  if (isSigned(transaction)) {
    return transaction
  }

  if (!wallet) {
    throw new ValidationError(
      'Wallet must be provided when submitting an unsigned transaction',
    )
  }

  let tx =
    typeof transaction === 'string'
      ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts JsonObject to correct Transaction type
        (decode(transaction) as unknown as SubmittableTransaction)
      : transaction

  if (autofill) {
    tx = await client.autofill(tx)
  }

  return wallet.sign(tx).tx_blob
}

// checks if there is a LastLedgerSequence as a part of the transaction
/**
 * Retrieves the last ledger sequence from a transaction.
 *
 * @param transaction - The transaction to retrieve the last ledger sequence from. It can be either a Transaction object or
 * a string (encode from ripple-binary-codec) representation of the transaction.
 * @returns The last ledger sequence of the transaction, or null if not available.
 *
 * @example
 * const transaction = createTransaction(); // your function to create a transaction
 *
 * // Example 1: Retrieving the last ledger sequence from a Transaction object
 * const lastLedgerSequence1 = getLastLedgerSequence(transaction);
 * console.log(lastLedgerSequence1); // Output: 12345
 *
 * // Example 2: Retrieving the last ledger sequence from a string representation of the transaction
 * const transactionString = encode(transaction);
 * const lastLedgerSequence2 = getLastLedgerSequence(transactionString);
 * console.log(lastLedgerSequence2); // Output: 67890
 */
export function getLastLedgerSequence(
  transaction: Transaction | string,
): number | null {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts LastLedgSeq to number if present.
  return tx.LastLedgerSequence as number | null
}

// checks if the transaction is an AccountDelete transaction
function isAccountDelete(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return tx.TransactionType === 'AccountDelete'
}
