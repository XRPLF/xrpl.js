import {
  Client,
  AccountInfoResponse,
  LedgerClosedEvent
} from '../../dist/npm'
import https = require('https')

/**
 * When implementing Reliable Transaction Submission, there are many potential solutions, each with different trade-offs. The main decision points are:
 * 1) Transaction preparation:
 *    - How do we decide which account sequence and LastLedgerSequence numbers to use?
 *      (To prevent unintentional duplicate transactions, an {account, account_sequence} pair can be used as a transaction's idempotency key)
 *    - How do we decide how much to pay for the transaction fee? (If our transactions have been failing due to low fee, we should consider increasing this value)
 * 2) Transaction status retrieval. Options include:
 *    - Poll for transaction status:
 *      - On a regular interval (e.g. every 3-5 seconds), or
 *      - When a new validated ledger is detected
 *      + (To accommodate an edge case in transaction retrieval, check the sending account's Sequence number to confirm that it has the expected value;
 *         alternatively, wait until a few additional ledgers have been validated before deciding that a transaction has definitively not been included in a validated ledger)
 *    - Listen for transaction status: scan all validated transactions to see if our transactions are among them
 * 3) What do we do when a transaction fails? It is possible to implement retry logic, but caution is advised. Note that there are a few ways for a transaction to fail:
 *    A) `tec`: The transaction was included in a ledger but only claimed the transaction fee
 *    B) `tesSUCCESS` but unexpected result: The transaction was successful but did not have the expected result. This generally does not occur for XRP-to-XRP payments
 *    C) The transaction was not, and never will be, included in a validated ledger [3C]
 *
 * References:
 * - https://xrpl.org/reliable-transaction-submission.html
 * - https://xrpl.org/send-xrp.html
 * - https://xrpl.org/look-up-transaction-results.html
 * - https://xrpl.org/get-started-with-rippleapi-for-javascript.html
 * - https://xrpl.org/monitor-incoming-payments-with-websocket.html
 *
 * For the implementation in this example, we have made the following decisions:
 * 1) The script will choose the account sequence and LastLedgerSequence numbers automatically. We allow ripple-lib to choose the fee.
 *    Payments are defined upfront, and idempotency is not needed. If the script is run a second time, duplicate payments will result.
 * 2) We will listen for notification that a new validated ledger has been found, and poll for transaction status at that time.
 *    Futhermore, as a precaution, we will wait until the server is 3 ledgers past the transaction's LastLedgerSequence
 *    (with the transaction nowhere to be seen) before deciding that it has definitively failed per [3C]
 * 3) Transactions will not be automatically retried. Transactions are limited to XRP-to-XRP payments and cannot "succeed" in an unexpected way.
 */
reliableTransactionSubmissionExample()

async function reliableTransactionSubmissionExample() {
  /**
   * Array of payments to execute.
   *
   * For brevity, these are XRP-to-XRP payments, taking a source, destination, and an amount in drops.
   *
   * The script will attempt to make all of these payments as quickly as possible, and report the final status of each. Transactions that fail are NOT retried.
   */
  const payments = []

  const sourceAccount = (await generateTestnetAccount()).account
  console.log(`Generated new Testnet account: ${sourceAccount.classicAddress}/${sourceAccount.secret}`)
  // Send amounts from 1 drop to 10 drops
  for (let i = 1; i <= 10; i++) {
    payments.push({
      source: sourceAccount,
      destination: 'rhsoCozhUxwcyQgzFi1FVRoMVQgk7cZd4L', // Random Testnet destination
      amount_drops: i.toString(),
    })
  }
  const results = await performPayments(payments)
  console.log(JSON.stringify(results, null, 2))
  process.exit(0)
}

async function performPayments(payments) {
  const finalResults = []
  const txFinalizedPromises = []
  const client = new Client({server: 'wss://s.altnet.rippletest.net:51233'})
  await client.connect()

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i]
    const account_info: AccountInfoResponse = await client.request('account_info', {
      account: payment.source.classicAddress,
      ledger_index: 'current'})
    const sequence = account_info.account_data.Sequence
    const preparedPayment = await client.preparePayment(payment.source.classicAddress, {
      source: {
        address: payment.source.classicAddress,
        amount: {
          value: payment.amount_drops,
          currency: 'drops'
        }
      },
      destination: {
        address: payment.destination,
        minAmount: {
          value: payment.amount_drops,
          currency: 'drops'
        }
      }
    }, {
      sequence
    })
    const signed = client.sign(preparedPayment.txJSON, payment.source.secret)
    finalResults.push({
      id: signed.id
    })
    const result = await client.submit(signed.signedTransaction)

    // Most of the time we'll get 'tesSUCCESS' or (after many submissions) 'terQUEUED'
    console.log(`tx ${i} - tentative: ${result.resultCode}`)

    const txFinalizedPromise = new Promise<void>((resolve) => {
      const ledgerClosedCallback = async (event: LedgerClosedEvent) => {
        let status
        try {
          status = await client.getTransaction(signed.id)
        } catch (e) {
          // Typical error when the tx hasn't been validated yet:
          if (e.name !== 'MissingLedgerHistoryError') {
            console.log(e)
          }

          if (event.ledger_index > preparedPayment.instructions.maxLedgerVersion + 3) {
            // Assumptions:
            // - We are still connected to the same rippled server
            // - No ledger gaps occurred
            // - All ledgers between the time we submitted the tx and now have been checked for the tx
            status = {
              finalResult: 'Transaction was not, and never will be, included in a validated ledger'
            }
          } else {
            // Check again later:
            client.connection.once('ledgerClosed', ledgerClosedCallback)
            return
          }
        }

        for (let j = 0; j < finalResults.length; j++) {
          if (finalResults[j].id === signed.id) {
            finalResults[j].result = status.address ? {
              source: status.address,
              destination: status.specification.destination.address,
              deliveredAmount: status.outcome.deliveredAmount,
              result: status.outcome.result,
              timestamp: status.outcome.timestamp,
              ledgerVersion: status.outcome.ledgerVersion
            } : status
            process.stdout.write('.')
            return resolve()
          }
        }
      }
      client.connection.once('ledgerClosed', ledgerClosedCallback)
    })
    txFinalizedPromises.push(txFinalizedPromise)
  }
  await Promise.all(txFinalizedPromises)
  return finalResults
}

/**
 * Generate a new Testnet account by requesting one from the faucet
 */
async function generateTestnetAccount(): Promise<{
  account: {
    xAddress: string,
    classicAddress, string,
    secret: string
  },
  balance: number
 }> {
  const options = {
    hostname: 'faucet.altnet.rippletest.net',
    port: 443,
    path: '/accounts',
    method: 'POST'
  }
  return new Promise((resolve, reject) => {
    const request = https.request(options, response => {
      const chunks = []
      response.on('data', d => {
        chunks.push(d)
      })
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString()

        // "application/json; charset=utf-8"
        if (response.headers['content-type'].startsWith('application/json')) {
          resolve(JSON.parse(body))
        } else {
          reject({
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            body
          })
        }
      })
    })
    request.on('error', error => {
      console.error(error)
      reject(error)
    })
    request.end()
  })
}
